import SalesHistory from "../../sales/components/SalesHistory";

import type { Sale } from "../../sales/types/sales";

type RecentSalesSectionProps = {
  sales: Sale[];
};

function RecentSalesSection({
  sales,
}: RecentSalesSectionProps) {
  return (
    <SalesHistory
      sales={sales}
      title="Recent Sales"
      description="View the latest sales and who processed them."
    />
  );
}

export default RecentSalesSection;