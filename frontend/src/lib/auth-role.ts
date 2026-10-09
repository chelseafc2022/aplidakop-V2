export function isAdministratorRole(roleName: unknown): boolean {
  return /^(?:super[\s_-]*)?admin(?:istrator)?(?:\s|$)/i.test(String(roleName || '').trim());
}
