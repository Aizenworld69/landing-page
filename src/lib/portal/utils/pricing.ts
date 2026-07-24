/**
 * Course pricing calculation utilities
 * Dùng để tính giá các gói đăng ký khóa học dựa trên price, priceGroup, và plansConfig tùy chỉnh của admin.
 */

export interface PlanConfig {
  early_bird?: { price?: number; original_price?: number; label?: string; sublabel?: string };
  individual?: { price?: number; original_price?: number; label?: string; sublabel?: string };
  group_2?: { price?: number; original_price?: number; label?: string; sublabel?: string };
  group_4?: { price?: number; original_price?: number; label?: string; sublabel?: string };
}

export interface CoursePlanPrices {
  earlyBirdPrice: number;
  individualPrice: number;
  individualOriginalPrice?: number;
  group2PricePerPerson: number;
  group2OriginalPerPerson?: number;
  group2Total: number;
  group4PricePerPerson: number;
  group4OriginalPerPerson?: number;
  group4Total: number;
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
  const individualOriginalPrice = plansConfig?.individual?.original_price;

  const group2PricePerPerson = plansConfig?.group_2?.price ?? priceGroup;
  const group2OriginalPerPerson = plansConfig?.group_2?.original_price ?? price;
  const group2Total = group2PricePerPerson * 2;

  const group4PricePerPerson = plansConfig?.group_4?.price ?? Math.round((priceGroup * 1.8) / 4);
  const group4OriginalPerPerson = plansConfig?.group_4?.original_price ?? price;
  const group4Total = group4PricePerPerson * 4;

  return {
    earlyBirdPrice,
    individualPrice,
    individualOriginalPrice,
    group2PricePerPerson,
    group2OriginalPerPerson,
    group2Total,
    group4PricePerPerson,
    group4OriginalPerPerson,
    group4Total,
  };
}
