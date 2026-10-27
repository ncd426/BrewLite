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

  // Key tiếng Anh / rút gọn từ Frontend
  'pearl': 6000,
  'jelly': 6000,
  'macchiato': 8000,
  'shot': 10000,
  'cheese': 8000, // Dự phòng topping mới
} as const;