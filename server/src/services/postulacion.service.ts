import { findPostulacionesByTrabajador, findPostulacion, createPostulacion } from "../data/postulacion.data.js"
import { findPostById } from "../data/post.data.js"

export const getMisPostulaciones = async (trabajadorId: string) => {
  const postulaciones = await findPostulacionesByTrabajador(trabajadorId)

  return postulaciones.map((p) => ({
    id: p.id,
    postId: p.postId,
    titulo: p.post.title,
    cliente: p.post.user.name,
    ubicacion: p.post.address,
    fecha_postulacion: p.createdAt.toISOString().split('T')[0],
    fecha_servicio: p.post.startDate.toISOString().split('T')[0],
    estado: p.estado,
  }))
}

export const aplicarPostulacion = async (trabajadorId: string, postId: string) => {
  const post = await findPostById(postId)
  if (!post) throw Object.assign(new Error("Publicación no encontrada"), { status: 404 })
  if (post.status !== "Active") throw Object.assign(new Error("Esta publicación ya no está disponible"), { status: 400 })

  const existente = await findPostulacion(trabajadorId, postId)
  if (existente) throw Object.assign(new Error("Ya te postulaste a esta publicación"), { status: 409 })

  const created = await createPostulacion(trabajadorId, postId)
  return { id: created.id, estado: created.estado, mensaje: "Postulación exitosa" }
}
