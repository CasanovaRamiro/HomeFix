export interface Worker {
  id: string
  name: string
  category: string
  rating: number
  reviews: number
  location: string
  distance: number
  bio: string
  image: string
  verified: boolean
  responseTime: string
  availability: string[]
  disponibleUrgencia: boolean
}

export const workers: Worker[] = [
  {
    id: '1',
    name: 'Carlos Méndez',
    category: 'Electricista',
    rating: 4.9,
    reviews: 247,
    location: 'Palermo, Buenos Aires',
    distance: 2.3,
    bio: 'Electricista matriculado con 15 años de experiencia en instalaciones residenciales y comerciales. Especialista en tableros eléctricos, cableado estructurado y domótica.',
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=500&h=500&fit=crop&crop=face',
    verified: true,
    responseTime: '< 1 hora',
    availability: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    disponibleUrgencia: true
  },
  {
    id: '2',
    name: 'Valentina Ríos',
    category: 'Plomería',
    rating: 4.8,
    reviews: 189,
    location: 'Villa Crespo, Buenos Aires',
    distance: 1.5,
    bio: 'Gasista matriculada y plomera con certificación. Atiendo desde pérdidas de agua hasta instalaciones completas de gas. Trabajo en Capital y GBA.',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&h=500&fit=crop&crop=face',
    verified: true,
    responseTime: '< 2 horas',
    availability: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
    disponibleUrgencia: true
  },
  {
    id: '3',
    name: 'Rodrigo Acosta',
    category: 'Aire Acondicionado',
    rating: 4.7,
    reviews: 156,
    location: 'Caballito, Buenos Aires',
    distance: 3.8,
    bio: 'Técnico en refrigeración con habilitación municipal. Instalación, mantenimiento y reparación de equipos de todas las marcas. Más de 10 años en el rubro.',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&h=500&fit=crop&crop=face',
    verified: true,
    responseTime: '< 3 horas',
    availability: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
    disponibleUrgencia: false
  },
  {
    id: '4',
    name: 'Florencia Paredes',
    category: 'Carpintería',
    rating: 4.9,
    reviews: 213,
    location: 'San Telmo, Buenos Aires',
    distance: 2.1,
    bio: 'Carpintera especializada en diseño de interiores y muebles a medida. Trabajo con madera maciza y placas. Presupuesto sin cargo.',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=500&h=500&fit=crop&crop=face',
    verified: true,
    responseTime: '< 4 horas',
    availability: ['Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    disponibleUrgencia: false
  },
  {
    id: '5',
    name: 'Ignacio Ferreyra',
    category: 'Electrónica',
    rating: 4.6,
    reviews: 124,
    location: 'Belgrano, Buenos Aires',
    distance: 5.2,
    bio: 'Técnico electrónico con 8 años de experiencia. Reparo electrodomésticos, TV, lavarropas y heladeras de todas las marcas. Garantía en cada trabajo.',
    image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=500&h=500&fit=crop&crop=face',
    verified: false,
    responseTime: '< 2 horas',
    availability: ['Lunes', 'Miércoles', 'Viernes', 'Sábado'],
    disponibleUrgencia: true
  },
  {
    id: '6',
    name: 'Camila Suárez',
    category: 'Pintura',
    rating: 4.8,
    reviews: 178,
    location: 'Almagro, Buenos Aires',
    distance: 1.8,
    bio: 'Pintora profesional con 12 años de trayectoria. Trabajo en interior y exterior, pintura decorativa, texturados y empastes. Materiales de primera calidad.',
    image: 'https://images.unsplash.com/photo-1598550874175-4d0ef436c909?w=500&h=500&fit=crop&crop=face',
    verified: true,
    responseTime: '< 2 horas',
    availability: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    disponibleUrgencia: false
  }
]
