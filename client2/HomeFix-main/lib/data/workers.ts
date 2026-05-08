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
  hourlyRate: number
  availability: string[]
}

export const workers: Worker[] = [
  {
    id: '1',
    name: 'Carlos Mejía',
    category: 'Electricista',
    rating: 4.9,
    reviews: 247,
    location: 'Zona 10, Guatemala',
    distance: 2.3,
    bio: 'Electricista profesional con 15 años de experiencia. Especialista en instalaciones residenciales.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=500&fit=crop',
    verified: true,
    responseTime: '< 1 hora',
    hourlyRate: 150,
    availability: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  },
  {
    id: '2',
    name: 'María González',
    category: 'Plomería',
    rating: 4.8,
    reviews: 189,
    location: 'Zona 9, Guatemala',
    distance: 1.5,
    bio: 'Plomera con certificación. Atiendo desde fugas pequeñas hasta proyectos grandes.',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&h=500&fit=crop',
    verified: true,
    responseTime: '< 2 horas',
    hourlyRate: 120,
    availability: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']
  },
  {
    id: '3',
    name: 'Roberto Pérez',
    category: 'HVAC',
    rating: 4.7,
    reviews: 156,
    location: 'Zona 12, Guatemala',
    distance: 3.8,
    bio: 'Técnico HVAC certificado. Instalación y mantenimiento de sistemas de aire acondicionado.',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&h=500&fit=crop',
    verified: true,
    responseTime: '< 3 horas',
    hourlyRate: 180,
    availability: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
  },
  {
    id: '4',
    name: 'Patricia López',
    category: 'Carpintería',
    rating: 4.9,
    reviews: 213,
    location: 'Zona 11, Guatemala',
    distance: 2.1,
    bio: 'Carpintera especializada en diseño y fabricación. Muebles a medida y reparaciones.',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&h=500&fit=crop',
    verified: true,
    responseTime: '< 4 horas',
    hourlyRate: 140,
    availability: ['Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  },
  {
    id: '5',
    name: 'Diego Hernández',
    category: 'Electrónica',
    rating: 4.6,
    reviews: 124,
    location: 'Zona 14, Guatemala',
    distance: 5.2,
    bio: 'Técnico en electrónica. Reparación de electrodomésticos y equipos electrónicos.',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&h=500&fit=crop',
    verified: false,
    responseTime: '< 2 horas',
    hourlyRate: 100,
    availability: ['Lunes', 'Miércoles', 'Viernes', 'Sábado']
  },
  {
    id: '6',
    name: 'Sofía Martínez',
    category: 'Pintura',
    rating: 4.8,
    reviews: 178,
    location: 'Zona 8, Guatemala',
    distance: 1.8,
    bio: 'Pintora profesional. Interior, exterior y acabados especiales.',
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&h=500&fit=crop',
    verified: true,
    responseTime: '< 2 horas',
    hourlyRate: 110,
    availability: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  }
]
