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
  // Carlos Méndez - Electricista (worker 1)
  {
    id: '1',
    workerId: '1',
    author: 'Juan Bautista García',
    rating: 5,
    text: 'Carlos llegó puntual y resolvió el problema del tablero en tiempo récord. Muy prolijo y explicó cada paso. Sin dudas lo vuelvo a contratar.',
    date: '2026-04-18',
    verified: true
  },
  {
    id: '2',
    workerId: '1',
    author: 'Analía Pereyra',
    rating: 5,
    text: 'Excelente profesional. Me instaló el circuito para el aire acondicionado correctamente y dejó todo impecable. Muy recomendado.',
    date: '2026-03-07',
    verified: true
  },
  {
    id: '3',
    workerId: '1',
    author: 'Sebastián Molina',
    rating: 4,
    text: 'Muy buen trabajo. Tardó un poco más de lo estimado pero el resultado fue perfecto. Muy buen trato y honesto con los precios.',
    date: '2026-02-14',
    verified: true
  },
  // Valentina Ríos - Plomería (worker 2)
  {
    id: '4',
    workerId: '2',
    author: 'Miguel Ángel Rodríguez',
    rating: 5,
    text: 'Valentina es una genia. Llegó el mismo día que llamé y arregló la pérdida en menos de una hora. Increíble la dedicación.',
    date: '2026-04-22',
    verified: true
  },
  {
    id: '5',
    workerId: '2',
    author: 'Romina Castillo',
    rating: 5,
    text: 'Me instaló el calefón nuevo sin problemas. Muy eficiente, limpia y con todos los materiales necesarios. La recomiendo al 100%.',
    date: '2026-03-29',
    verified: true
  },
  {
    id: '6',
    workerId: '2',
    author: 'Tomás Villanueva',
    rating: 4,
    text: 'Muy profesional. Detectó el problema de presión de agua rápido y lo solucionó ese mismo día. Buen precio también.',
    date: '2026-01-15',
    verified: true
  },
  // Rodrigo Acosta - Aire Acondicionado (worker 3)
  {
    id: '7',
    workerId: '3',
    author: 'Elena Torres',
    rating: 5,
    text: 'Rodrigo instaló el split en tiempo récord y sin hacer desastres en la pared. Muy ordenado y el equipo quedó impecable.',
    date: '2026-04-10',
    verified: true
  },
  {
    id: '8',
    workerId: '3',
    author: 'Gustavo Benitez',
    rating: 4,
    text: 'Buen servicio. Hizo el mantenimiento de los tres equipos de casa. Puntual y con garantía escrita. Lo recomiendo.',
    date: '2026-02-28',
    verified: true
  },
  {
    id: '9',
    workerId: '3',
    author: 'Luciana Herrera',
    rating: 5,
    text: 'Excelente. Diagnosticó el problema del equipo que no enfriaba, consiguió el repuesto en 24hs y quedó como nuevo. Muy profesional.',
    date: '2026-01-30',
    verified: true
  },
  // Florencia Paredes - Carpintería (worker 4)
  {
    id: '10',
    workerId: '4',
    author: 'Francisco Díaz',
    rating: 5,
    text: 'Flo nos hizo los placares del dormitorio a medida. El resultado es hermoso, calidad impresionante y entregó en el tiempo prometido.',
    date: '2026-04-05',
    verified: true
  },
  {
    id: '11',
    workerId: '4',
    author: 'Marina Lozano',
    rating: 5,
    text: 'Increíble trabajo. Transformó un espacio complicado en un placard funcional y muy estético. Creativa y muy prolija.',
    date: '2026-03-12',
    verified: true
  },
  {
    id: '12',
    workerId: '4',
    author: 'Pablo Moreno',
    rating: 5,
    text: 'Reparó la escalera de madera de mi casa antigua con mucho cuidado. Respetó los detalles originales. Muy recomendada.',
    date: '2026-02-03',
    verified: true
  },
  // Ignacio Ferreyra - Electrónica (worker 5)
  {
    id: '13',
    workerId: '5',
    author: 'Laura Gómez',
    rating: 4,
    text: 'Reparó mi lavarropas que no centrifugaba. Fue a buscar la pieza y al día siguiente vino a instalarlo. Muy buena atención.',
    date: '2026-04-01',
    verified: true
  },
  {
    id: '14',
    workerId: '5',
    author: 'Diego Sánchez',
    rating: 5,
    text: 'Me reparó la TV y la heladera en la misma visita. Muy conocedor de los equipos y con precios razonables.',
    date: '2026-03-18',
    verified: true
  },
  {
    id: '15',
    workerId: '5',
    author: 'Natalia Ruiz',
    rating: 4,
    text: 'Buen técnico. Revisó el microondas, dio el diagnóstico honesto y lo reparó sin cobrar de más. Volvería a contratarlo.',
    date: '2026-02-20',
    verified: false
  },
  // Camila Suárez - Pintura (worker 6)
  {
    id: '16',
    workerId: '6',
    author: 'Roberto Fernández',
    rating: 5,
    text: 'Pintó todo el departamento en dos días. Impecable el trabajo, no manchó nada y el color quedó perfecto. Muy recomendada.',
    date: '2026-04-14',
    verified: true
  },
  {
    id: '17',
    workerId: '6',
    author: 'Vanesa Quiroga',
    rating: 5,
    text: 'Hizo un texturado en el living increíble. Muy creativa y profesional. El resultado superó todas mis expectativas.',
    date: '2026-03-25',
    verified: true
  },
  {
    id: '18',
    workerId: '6',
    author: 'Hernán Castro',
    rating: 4,
    text: 'Muy buen trabajo en el exterior de la casa. Respetó los tiempos y usó materiales de calidad. Limpia y ordenada.',
    date: '2026-01-08',
    verified: true
  }
]
