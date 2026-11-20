import { DiscountType } from '@/common/types/Discount';
import { ItemEntry } from './ItemEntry';

describe('ItemEntry.calcAmount', () => {
  it('returns the gross amount when no discount is set', () => {
    expect(ItemEntry.calcAmount({ quantity: 2, rate: 1000 })).toBe(2000);
    expect(ItemEntry.calcAmount({ quantity: 2, rate: 1000, discount: 0 })).toBe(
      2000,
    );
  });

  it('applies a percentage discount', () => {
    expect(
      ItemEntry.calcAmount({
        quantity: 2,
        rate: 1000,
        discount: 10,
        discountType: DiscountType.Percentage,
      }),
    ).toBe(1800);
  });

  it('treats a missing discount type as percentage', () => {
    expect(
      ItemEntry.calcAmount({ quantity: 2, rate: 1000, discount: 10 }),
    ).toBe(1800);
  });

  it('applies an amount discount', () => {
    expect(
      ItemEntry.calcAmount({
        quantity: 2,
        rate: 1000,
        discount: 100,
        discountType: DiscountType.Amount,
      }),
    ).toBe(1900);
  });
});

describe('ItemEntry tax basis', () => {
  const entry = {
    quantity: 2,
    rate: 100,
    discount: 10,
    discountType: DiscountType.Percentage,
    taxRate: 10,
  };

  it('calculates exclusive tax on the discounted amount for new invoice lines', () => {
    const line = ItemEntry.fromJson({ ...entry, taxOnDiscountedAmount: true });
    expect(line.taxAmount).toBe(18);
    expect(line.total).toBe(198);
  });

  it('calculates inclusive tax on the discounted amount', () => {
    const line = ItemEntry.fromJson({
      ...entry,
      rate: 110,
      isInclusiveTax: true,
      taxOnDiscountedAmount: true,
    });
    expect(line.taxAmount).toBe(18);
    expect(line.totalExcludingTax).toBe(180);
  });

  it('keeps the original tax basis for existing lines', () => {
    const line = ItemEntry.fromJson({ ...entry, taxOnDiscountedAmount: false });
    expect(line.taxAmount).toBe(20);
  });
});
