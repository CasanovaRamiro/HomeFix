// src/data/workerLandingData.ts
// Static content for the HomeFix *worker* (professional) landing page.
// Mirrors landingData.ts but targets tradespeople who want to find work.

export interface WorkerStat { value: string; label: string }
export interface WorkerBenefit { tag: string; title: string; desc: string }
export interface WorkerStep { n: number; title: string; desc: string; accent?: boolean }
export interface WorkerFeature { title: string; desc: string }
export interface WorkerTestimonial { author: string; trade: string; date: string; rating: number; text: string }

// Headline numbers shown in the hero strip — kept worker-relevant.
export const workerStats: WorkerStat[] = [
  { value: '0%', label: 'Comisión por registrarte' },
  { value: '100%', label: 'Perfiles verificados' },
  { value: '100%', label: 'Autonomía para elegir profesionales' },
  { value: '24/7', label: 'Disponibilidad para solicitudes' },
]

export const benefits: WorkerBenefit[] = [
  { tag: 'Más demanda', title: 'Clientes cerca tuyo', desc: 'Recibí solicitudes de hogares de tu zona sin gastar un peso en publicidad. La demanda llega a vos.' },
  { tag: 'Vos decidís', title: 'Tu agenda, tus reglas', desc: 'Aceptás los trabajos que querés, en los horarios que te convienen. Sin obligaciones ni cuotas.' },
  { tag: 'Confianza', title: 'Reputación que crece', desc: 'Cada trabajo bien hecho suma reseñas verificadas que te traen los próximos clientes.' },
]

export const workerSteps: WorkerStep[] = [
  { n: 1, title: 'Creá tu perfil', desc: 'Cargá tus datos, tus rubros y la zona donde trabajás. Toma menos de 5 minutos.' },
  { n: 2, title: 'Verificá tu identidad', desc: 'Validamos tu DNI. Sumá tu matrícula y antecedentes para destacar entre los demás.' },
  { n: 3, title: 'Recibí solicitudes', desc: 'Te llegan pedidos de clientes de tu zona. Mirás el detalle y elegís cuáles aceptar.' },
  { n: 4, title: 'Trabajá y cobrá', desc: 'Coordinás por chat, hacés el trabajo y sumás una reseña que te abre más puertas.', accent: true },
]

export const workerFeatures: WorkerFeature[] = [
  { title: 'Solicitudes geolocalizadas', desc: 'Solo recibís pedidos dentro del radio que definas.' },
  { title: 'Agenda y disponibilidad', desc: 'Marcás cuándo estás libre y evitás superposiciones.' },
  { title: 'Chat directo con el cliente', desc: 'Acordás detalles y presupuesto sin intermediarios.' },
  { title: 'Reseñas verificadas', desc: 'Tu calificación se construye con trabajos reales.' },
  { title: 'Perfil destacado', desc: 'Identidad, matrícula y antecedentes te dan más visibilidad.' },
]

// Checklist shown in the "qué necesitás" section.
export const requirements: { text: string; optional?: boolean }[] = [
  { text: 'DNI vigente para validar tu identidad' },
  { text: 'Una foto de perfil clara' },
  { text: 'Tus rubros y la zona donde trabajás' },
  { text: 'Matrícula profesional habilitante', optional: true },
  { text: 'Certificado de antecedentes', optional: true },
]

export const workerTestimonials: WorkerTestimonial[] = [
  { author: 'Carlos Medina', trade: 'Electricista matriculado', date: 'hace 3 semanas', rating: 5, text: 'En el primer mes ya tenía la agenda completa. Las reseñas me trajeron clientes nuevos sin parar.' },
  { author: 'Paula Ríos', trade: 'Carpintera', date: 'hace 1 mes', rating: 5, text: 'Me gusta que elijo qué trabajos tomar. Organizo mi semana como quiero y no dependo de nadie.' },
  { author: 'Gustavo Sosa', trade: 'Plomero', date: 'hace 2 meses', rating: 5, text: 'Tener el DNI y la matrícula verificados hace que los clientes me elijan a mí. Se nota la diferencia.' },
]
