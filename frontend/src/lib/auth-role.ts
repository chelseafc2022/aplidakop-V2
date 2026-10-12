export function isAdministratorRole(roleName: unknown): boolean {
  return /^(?:super[\s_-]*)?admin(?:istrator)?(?:\s|$)/i.test(String(roleName || '').trim());
}

/**
 * Masking NIK / KK Sesuai Standar UU PDP (Mengikuti format Web & App Konsel Setara)
 * Jika bukan administrator, 8 digit tengah disamarkan: 7405********0002
 */
export function maskNik(nik: unknown, isAdministrator = false): string {
  if (!nik) return '-';
  const str = String(nik).trim();
  if (!str || str === '-') return '-';
  if (isAdministrator) return str;
  if (str.length < 8) return str;
  return str.substring(0, 4) + '********' + str.substring(str.length - 4);
}
