const PROVINCIAS = new Set([
  'CABA', 'Buenos Aires', 'Córdoba', 'Santa Fe', 'Mendoza', 'Tucumán', 'Entre Ríos',
  'Salta', 'Corrientes', 'Santiago del Estero', 'Chaco', 'Río Negro', 'Formosa',
  'Neuquén', 'Chubut', 'San Juan', 'Misiones', 'La Rioja', 'Catamarca', 'La Pampa',
  'San Luis', 'Santa Cruz', 'Tierra del Fuego', 'Jujuy',
])

export function formatAddress(addr: string): string {
  if (!addr) return ''
  const parts = addr.split(',').map((s) => s.trim()).filter(Boolean)
  if (parts.length <= 2) return parts.join(', ')
  const filtered = parts.filter((p) => !/^\d+$/.test(p) && p !== 'Argentina')
  let provIdx = -1
  for (let i = filtered.length - 1; i >= 0; i--) {
    if (PROVINCIAS.has(filtered[i])) { provIdx = i; break }
  }
  if (provIdx >= 1) {
    let city = filtered[provIdx - 1]
    if (city.startsWith('Partido de ') && provIdx >= 2) city = filtered[provIdx - 2]
    return `${city}, ${filtered[provIdx]}`
  }
  return filtered.slice(-2).join(', ')
}
