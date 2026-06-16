export function formatWhatsAppNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('549')) return digits
  if (digits.startsWith('54')) return '549' + digits.slice(2)
  return '549' + digits
}
