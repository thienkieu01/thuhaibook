const HCMC_DISTRICTS = [
  'Quận 1', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6', 'Quận 7', 'Quận 8',
  'Quận 10', 'Quận 11', 'Quận 12', 'Bình Thạnh', 'Thủ Đức', 'Gò Vấp',
  'Phú Nhuận', 'Tân Bình', 'Tân Phú', 'Bình Tân', 'Hóc Môn', 'Củ Chi',
  'Nhà Bè', 'Bình Chánh', 'Cần Giờ'
];

export function validateHCMCAddress(district: string): boolean {
  return HCMC_DISTRICTS.some(
    (d) => d.toLowerCase() === district.trim().toLowerCase(),
  );
}