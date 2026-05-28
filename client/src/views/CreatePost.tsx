import { useNavigate } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { useCategories } from '../hooks/useCategories'
import { useCreatePost } from '../hooks/useCreatePost'
import SuccessScreen from '../components/post/SuccessScreen'
import SubmitButton from '../components/ui/SubmitButton'

export default function CreatePost() {
  const navigate = useNavigate()
  const { categories, loading: loadingCategories } = useCategories()
  const { form, setForm, formError, formSubmitting, formSuccess, handleFocus, handleBlur, handleSubmit } = useCreatePost()

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-[720px] mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="mb-6 flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border text-sm">
              <FileText className="w-4 h-4 text-secondary" />
              <span className="text-muted">Nueva Publicación</span>
            </div>
          </div>
          <h1 className="text-[36px] font-bold text-primary-dark text-balance mb-4">Crear Publicación</h1>
          <p className="text-lg text-muted max-w-[560px] mx-auto text-balance">
            Completá los datos para publicar tu problema y recibir respuestas de profesionales cercanos.
          </p>
        </div>

        <div className="rounded-2xl p-10 bg-card border border-border">
          {formSuccess ? (
            <SuccessScreen onGoHome={() => navigate('/')} />
          ) : (
            <form onSubmit={handleSubmit}>
              {formError && <div className="p-4 rounded-lg text-sm bg-[#FEF2F2] text-danger border border-[#FECACA] mb-4">{formError}</div>}

              <div className="mb-6">
                <label className="text-sm font-medium text-primary-dark block mb-2">Título del problema</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Ej: Se rompió la canilla de la cocina"
                  required
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none border border-border bg-background text-primary-dark transition-all duration-300 box-border"
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>

              <div className="mb-6">
                <label className="text-sm font-medium text-primary-dark block mb-2">Categoría</label>
                <select
                  value={form.categoryId}
                  onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))}
                  required
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none border border-border bg-background text-primary-dark transition-all duration-300 box-border cursor-pointer"
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  disabled={loadingCategories}
                >
                  <option value="">
                    {loadingCategories ? 'Cargando categorías...' : 'Seleccioná una categoría'}
                  </option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="text-sm font-medium text-primary-dark block mb-2">Descripción del problema</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Describí tu problema en detalle..."
                  required
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none border border-border bg-background text-primary-dark transition-all duration-300 box-border resize-none"
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>

              <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-6 mb-6">
                <div>
                  <label className="text-sm font-medium text-primary-dark block mb-2">Fecha de inicio</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                    required
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none border border-border bg-background text-primary-dark transition-all duration-300 box-border"
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-primary-dark block mb-2">Fecha de finalización</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))}
                    required
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none border border-border bg-background text-primary-dark transition-all duration-300 box-border"
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>
              </div>

              <div className="mb-8">
                <label className="text-sm font-medium text-primary-dark block mb-2">Dirección</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                  placeholder="Ingresá tu dirección"
                  required
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none border border-border bg-background text-primary-dark transition-all duration-300 box-border"
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>

              <SubmitButton loading={formSubmitting} loadingText="Publicando...">
                Publicar solicitud
              </SubmitButton>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
