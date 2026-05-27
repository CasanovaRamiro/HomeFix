import { createPost, findAllActivePosts, findPostById } from "../data/post.data.js";
import { postServiceValidator } from "../middleware/postServiceValidator.js";
import { PostInput } from "../types/postInput.js";

export const post = async (input: PostInput) => {
  postServiceValidator(input);

  const createdPost = await createPost({
    ...input,
    startDate: new Date(input.startDate),
    endDate: new Date(input.endDate),
  });

  return createdPost;
};

export const getActivePosts = async () => {
  const posts = await findAllActivePosts();
  return posts.map((p) => ({
    id: p.id,
    titulo: p.title,
    descripcion: p.description,
    cliente: p.user.name,
    ubicacion: p.address,
    fecha_servicio: p.startDate.toISOString().split("T")[0],
    fecha_fin: p.endDate.toISOString().split("T")[0],
    categorias: p.categories.map((pc) => pc.category.name),
  }));
};

export const getPostById = async (id: number) => {
  const post = await findPostById(id);
  if (!post) return null;
  if (post.status !== "Active") return null;

  return {
    id: post.id,
    titulo: post.title,
    descripcion: post.description,
    cliente: post.user.name,
    telefono: post.user.phone ?? "",
    ubicacion: post.address,
    fecha_servicio: post.startDate.toISOString().split("T")[0],
    fecha_fin: post.endDate.toISOString().split("T")[0],
    categorias: post.categories.map((pc) => pc.category.name),
    imagenes: post.images.map((img) => img.url),
  };
};
