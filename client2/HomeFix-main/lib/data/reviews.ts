export interface Review {
  id: string
  workerId: string
  author: string
  rating: number
  text: string
  date: string
  verified: boolean
}

export const reviews: Review[] = [
  {
    id: '1',
    workerId: '1',
    author: 'Juan García',
    rating: 5,
    text: 'Excelente trabajo. Carlos llegó a tiempo, fue muy profesional y resolvió el problema rápidamente.',
    date: '2024-03-15',
    verified: true
  },
  {
    id: '2',
    workerId: '1',
    author: 'Ana López',
    rating: 4,
    text: 'Muy bueno. Un poco caro pero la calidad del trabajo es indiscutible.',
    date: '2024-02-28',
    verified: true
  },
  {
    id: '3',
    workerId: '2',
    author: 'Miguel Rodríguez',
    rating: 5,
    text: 'María es muy eficiente. Llegó el mismo día que llamé y arregló la fuga en menos de una hora.',
    date: '2024-03-10',
    verified: true
  },
  {
    id: '4',
    workerId: '3',
    author: 'Elena Torres',
    rating: 4,
    text: 'Buen servicio. El técnico fue educado y explicó bien todo lo que hizo.',
    date: '2024-03-05',
    verified: true
  },
  {
    id: '5',
    workerId: '4',
    author: 'Francisco Díaz',
    rating: 5,
    text: 'Muebles hermosos. Patricia fue muy creativa con el diseño. Muy recomendado!',
    date: '2024-02-20',
    verified: true
  },
  {
    id: '6',
    workerId: '5',
    author: 'Laura Gómez',
    rating: 4,
    text: 'Reparó mi refrigerador. Profesional aunque tardó un poco en conseguir la pieza.',
    date: '2024-02-15',
    verified: true
  }
]
