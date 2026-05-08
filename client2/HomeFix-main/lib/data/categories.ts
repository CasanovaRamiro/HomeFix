export interface Category {
  id: string
  name: string
  icon: string
  image: string
  description: string
  count: number
}

export const categories: Category[] = [
  {
    id: '1',
    name: 'Electricidad',
    icon: '⚡',
    image: '/categories/electricidad.jpg',
    description: 'Instalaciones y reparaciones electricas',
    count: 342
  },
  {
    id: '2',
    name: 'Plomeria',
    icon: '🔧',
    image: '/categories/plomeria.jpg',
    description: 'Tuberias y sistemas de agua',
    count: 289
  },
  {
    id: '3',
    name: 'HVAC',
    icon: '❄️',
    image: '/categories/hvac.jpg',
    description: 'Aire acondicionado y calefaccion',
    count: 156
  },
  {
    id: '4',
    name: 'Carpinteria',
    icon: '🪵',
    image: '/categories/carpinteria.jpg',
    description: 'Muebles y trabajos en madera',
    count: 218
  },
  {
    id: '5',
    name: 'Electronica',
    icon: '📱',
    image: '/categories/electronica.jpg',
    description: 'Reparacion de electrodomesticos',
    count: 147
  },
  {
    id: '6',
    name: 'Pintura',
    icon: '🎨',
    image: '/categories/pintura.jpg',
    description: 'Interior y exterior',
    count: 267
  },
  {
    id: '7',
    name: 'Albanileria',
    icon: '🧱',
    image: '/categories/albanileria.jpg',
    description: 'Construccion y reparaciones',
    count: 198
  },
  {
    id: '8',
    name: 'Cerrajeria',
    icon: '🔐',
    image: '/categories/cerrajeria.jpg',
    description: 'Cerraduras y seguridad',
    count: 134
  }
]
