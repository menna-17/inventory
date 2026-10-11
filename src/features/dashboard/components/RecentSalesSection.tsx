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
      titleClassName="text-xl font-bold  text-mauve-600"
      descriptionClassName="mt-1 text-sm text-mauve-600"
    />
  );
}

export default RecentSalesSection;