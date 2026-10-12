export function escapeCsvCell(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);

  let text = value === null || value === undefined ? '' : String(value);
  if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
  text = text.replace(/\0/g, '').replace(/"/g, '""');
  return `"${text}"`;
}
