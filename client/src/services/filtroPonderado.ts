import type { ApplicationDTO } from './posts'

// ─── Factores de ponderación según posición de prioridad ───
// El cliente define un orden de prioridad (weight) para 4 criterios.
// Cada posición en ese orden tiene un multiplicador que define su
// importancia relativa en el puntaje final.
//   1° prioridad × 2.5   (el criterio más importante)
//   2° prioridad × 1.8
//   3° prioridad × 1.5
//   4° prioridad × 1.0   (el menos importante)
const MULTIPLIERS: Record<number, number> = { 0: 2.5, 1: 1.8, 2: 1.5, 3: 1.0 }

// ─── buildRank: ranking posicional con competencia ───
// Toma un array de valores (precio, duración, etc.) y devuelve un array
// del mismo tamaño con el ranking de cada elemento.
//
// Reglas:
//   - Se ignoran valores null (rank 0).
//   - Se ordenan los valores de menor a mayor (ascendente).
//   - Valores iguales comparten el mismo rank ("competition ranking" 1224).
//   - Cuando cambia el valor, el rank salta a la posición real + 1.
//
// Ejemplo:
//   Valores: [400, 400, 500]
//   Ranks:   [ 1,   1,   3 ]   ← empatan en 1°, el 500 salta a 3°
//
// Para calificación (rating) este ranking se invierte después porque
// allí mayor valor = mejor rank (ver computeScores).
function buildRank(values: (number | null)[]): number[] {
  // (v, i): preservamos el índice original para ubicar cada rank
  const withIdx = values.map((v, i) => ({ v, i })).filter(x => x.v !== null)
  // Orden ascendente: el valor más chico recibe el mejor rank
  withIdx.sort((a, b) => (a.v as number) - (b.v as number))
  const rank = new Array(values.length).fill(0)
  let pos = 1
  for (let i = 0; i < withIdx.length; i++) {
    // Si el valor cambió, el rank salta a la posición real (i + 1)
    if (i > 0 && withIdx[i].v !== withIdx[i - 1].v) {
      pos = i + 1
    }
    // Asignamos el rank en el índice original del elemento
    rank[withIdx[i].i] = pos
  }
  return rank
}

// ─── ScoredApplication ───
// Resultado del scoring para una oferta:
//   app:    datos de la aplicación original
//   score:  puntaje total ponderado (menor = mejor oferta)
//   ranks:  ranking individual de cada criterio
export interface ScoredApplication {
  app: ApplicationDTO
  score: number
  ranks: Record<string, number>
}

// ─── computeScores ───
// Calcula el puntaje ponderado de todas las ofertas recibidas para una
// licitación, usando el sistema de "sobre cerrado" con scoring posicional.
//
// Parámetros:
//   applications  - lista de ofertas recibidas
//   weights       - orden de prioridad definido por el cliente
//                    ej: ['offeredCost', 'duration', 'startDate', 'minRating']
//
// Flujo:
//   1. Extraer arrays de valores por criterio (costo, duración, inicio, rating)
//   2. Calcular ranking posicional de cada criterio con buildRank
//   3. Invertir el ranking de rating (para rating: mayor valor = mejor rank)
//   4. Para cada oferta, multiplicar su rank en cada criterio por el factor
//      de ponderación de la posición correspondiente
//   5. Sumar los puntajes ponderados → score total
//   6. Ordenar ascendente por score (menor score = mejor oferta global)
export function computeScores(
  applications: ApplicationDTO[],
  weights: string[],
): ScoredApplication[] {
  if (applications.length === 0 || weights.length === 0) return []

  // ── Paso 1: Extraer valores por criterio ──
  // Convertimos fechas a timestamp numérico para poder rankearlas
  const costs = applications.map(a => a.offeredCost)
  const durations = applications.map(a => a.offeredDuration)
  const startDates = applications.map(a => a.offeredStartDate ? new Date(a.offeredStartDate).getTime() : null)
  const ratings = applications.map(a => a.workerRating)

  // ── Paso 2: Ranking posicional de cada criterio ──
  const costRank = buildRank(costs)
  const durRank = buildRank(durations)
  const startRank = buildRank(startDates)
  const ratingRank = buildRank(ratings)

  // ── Paso 3: Invertir ranking de calificación ──
  // buildRank ordena ascendente (menor → mejor rank).
  // Para precio, duración y fecha eso es correcto (menor precio = mejor).
  // Para calificación es al revés: mayor rating = mejor.
  // Por eso invertimos: el rating más alto recibe rank 1.
  const maxRank = Math.max(...ratingRank)
  const invertedRatingRank = maxRank > 0
    ? ratingRank.map(r => (r > 0 ? maxRank - r + 1 : 0))
    : ratingRank

  // ── Paso 4-5: Calcular score ponderado ──
  // Mapa que asocia cada criterio con su array de ranks
  const varRankMap: Record<string, number[]> = {
    offeredCost: costRank,
    duration: durRank,
    startDate: startRank,
    minRating: invertedRatingRank,
  }

  return applications.map((app, i) => {
    const ranks: Record<string, number> = {}
    let score = 0
    // Iteramos sobre los weights en el orden de prioridad definido
    weights.forEach((key, pos) => {
      const rank = varRankMap[key]?.[i] || 0  // rank de esta oferta en este criterio
      ranks[key] = rank                         // guardamos para depuración
      // rank × factor según posición en la prioridad
      score += rank * (MULTIPLIERS[pos] || 1.0)
    })
    return { app, score, ranks }
    // ── Paso 6: Ordenar ascendente (menor score = mejor) ──
  }).sort((a, b) => a.score - b.score)
}
