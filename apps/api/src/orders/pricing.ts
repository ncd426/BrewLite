export const SIZE_SURCHARGE = {
  S: 0,
  M: 5000,
  L: 10000,
} as const;

export const TOPPING_PRICE = {
  // Key tiếng Việt
  'Trân châu': 6000,
  'Thạch': 6000,
  'Kem Macchiato': 8000,
  'Thêm Shot Espresso': 10000,

  // Key rút gọn từ Frontend
  'shot': 10000,
  'pearl': 6000,
  'jelly': 6000,
  'cheese': 8000,
} as const;