import { DRAWERS } from '@/constants/drawers';
import { index as EstimateDetailDrawer } from '@/containers/Drawers/EstimateDetailDrawer';

export function EstimatesListDrawers() {
  return <EstimateDetailDrawer name={DRAWERS.ESTIMATE_DETAILS} />;
}
