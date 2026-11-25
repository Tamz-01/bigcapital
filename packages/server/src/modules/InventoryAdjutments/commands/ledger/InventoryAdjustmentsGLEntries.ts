import { Knex } from 'knex';
import { groupBy } from 'lodash';
import { Inject, Injectable } from '@nestjs/common';
import { LedgerStorageService } from '../../../Ledger/LedgerStorage.service';
import { InventoryAdjustment } from '../../models/InventoryAdjustment';
import { TenancyContext } from '../../../Tenancy/TenancyContext.service';
import { InventoryAdjustmentsGL } from './InventoryAdjustmentGL';
import { InventoryCostLotTracker } from '@/modules/InventoryCost/models/InventoryCostLotTracker';
import { Ledger } from '@/modules/Ledger/Ledger';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';

@Injectable()
export class InventoryAdjustmentsGLEntries {
  constructor(
    private readonly ledgerStorage: LedgerStorageService,
    private readonly tenancyContext: TenancyContext,

    @Inject(InventoryAdjustment.name)
    private readonly inventoryAdjustment: TenantModelProxy<
      typeof InventoryAdjustment
    >,

    @Inject(InventoryCostLotTracker.name)
    private readonly inventoryCostLotTracker: TenantModelProxy<
      typeof InventoryCostLotTracker
    >,
  ) {}

  /**
   * Writes inventory increment adjustment GL entries.
   * @param {number} inventoryAdjustmentId - Inventory adjustment ID.
   * @param {Knex.Transaction} trx - Knex transaction.
   */
  public writeAdjustmentGLEntries = async (
    inventoryAdjustmentId: number,
    trx?: Knex.Transaction,
  ): Promise<void> => {
    // Retrieves the inventory adjustment with associated entries.
    const adjustment = await this.inventoryAdjustment()
      .query(trx)
      .findById(inventoryAdjustmentId)
      .withGraphFetched('entries.item.inventoryAccount');

    const tenantMeta = await this.tenancyContext.getTenantMetadata();

    // Retrieves the inventory adjustment GL entries.
    const ledger = new InventoryAdjustmentsGL(adjustment)
      .setBaseCurrency(tenantMeta.baseCurrency)
      .getAdjustmentGL();

    // Commits the ledger entries to the storage.
    await this.ledgerStorage.commit(ledger, trx);
  };

  /** Write stock-reduction ledger entries after costs are recomputed. */
  public async writeDecrementCostEntries(
    startingDate: Date,
    trx: Knex.Transaction,
  ): Promise<void> {
    const lots = await this.inventoryCostLotTracker()
      .query(trx)
      .where('direction', 'OUT')
      .where('transactionType', 'InventoryAdjustment')
      .where('cost', '>', 0)
      .modify('filterDateRange', startingDate)
      .orderBy('id', 'asc')
      .withGraphFetched('item');

    if (!lots.length) return;

    const lotsByAdjustment = groupBy(lots, 'transactionId');
    const adjustments = await this.inventoryAdjustment()
      .query(trx)
      .whereIn(
        'id',
        lots.map((lot) => lot.transactionId),
      )
      .where('type', 'decrement')
      .whereNotNull('publishedAt');
    const { baseCurrency } = await this.tenancyContext.getTenantMetadata();
    const entries = adjustments.flatMap((adjustment) =>
      new InventoryAdjustmentsGL(adjustment)
        .setBaseCurrency(baseCurrency)
        .getDecrementAdjustmentGL(lotsByAdjustment[adjustment.id])
        .getEntries(),
    );

    await this.ledgerStorage.commit(new Ledger(entries), trx);
  }

  /**
   * Reverts the adjustment transactions GL entries.
   * @param {number} inventoryAdjustmentId
   * @returns {Promise<void>}
   */
  public revertAdjustmentGLEntries = (
    inventoryAdjustmentId: number,
    trx?: Knex.Transaction,
  ): Promise<void> => {
    return this.ledgerStorage.deleteByReference(
      inventoryAdjustmentId,
      'InventoryAdjustment',
      trx,
    );
  };

  /**
   * Rewrite inventory adjustment GL entries.
   * @param {number} inventoryAdjustmentId
   * @param {Knex.Transaction} trx
   */
  public rewriteAdjustmentGLEntries = async (
    inventoryAdjustmentId: number,
    trx?: Knex.Transaction,
  ) => {
    // Reverts GL entries of the given inventory adjustment.
    await this.revertAdjustmentGLEntries(inventoryAdjustmentId, trx);

    // Writes GL entries of th egiven inventory adjustment.
    await this.writeAdjustmentGLEntries(inventoryAdjustmentId, trx);
  };
}
