/**
 * Course pricing calculation utilities
 * Dùng để tính giá các gói đăng ký khóa học dựa trên price, priceGroup, và plansConfig tùy chỉnh của admin.
 */

export interface PlanConfig {
  early_bird?: { price?: number; label?: string; sublabel?: string };
  individual?: { price?: number; label?: string; sublabel?: string };
  group_2?: { price?: number; label?: string; sublabel?: string };
  group_4?: { price?: number; label?: string; sublabel?: string };
}

export interface CoursePlanPrices {
  earlyBirdPrice: number;
  individualPrice: number;
  group2PricePerPerson: number;
  group2Total: number;
  group4Total: number;
  group4PricePerPerson: number;
}

/**
 * Tính giá tất cả các gói đăng ký của một khóa học.
 * Ưu tiên giá tùy chỉnh từ admin (plansConfig) nếu có, fallback về price/priceGroup mặc định.
 */
export function computeCoursePlanPrices(params: {
  price: number;
  priceGroup: number;
  plansConfig?: PlanConfig;
}): CoursePlanPrices {
  const { price, priceGroup, plansConfig } = params;

  const earlyBirdPrice = plansConfig?.early_bird?.price ?? price;
  const individualPrice = plansConfig?.individual?.price ?? price;
  const group2PricePerPerson = plansConfig?.group_2?.price ?? priceGroup;
  const group2Total = group2PricePerPerson * 2;
  const group4Total = plansConfig?.group_4?.price ?? priceGroup * 4;
  const group4PricePerPerson = Math.round(group4Total / 4);

  return {
    earlyBirdPrice,
    individualPrice,
    group2PricePerPerson,
    group2Total,
    group4Total,
    group4PricePerPerson,
  };
}
