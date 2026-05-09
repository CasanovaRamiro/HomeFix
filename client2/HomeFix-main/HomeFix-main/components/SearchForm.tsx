'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, MapPin, ArrowRight } from 'lucide-react'

interface SearchFormProps {
  onSearch?: (query: string, category: string, location: string) => void
  categories?: { id: string; name: string }[]
}

export function SearchForm({ onSearch, categories = [] }: SearchFormProps) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [location, setLocation] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch?.(query, category, location)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Que necesitas?
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Electricista, Plomero..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-secondary border-border pl-10 h-12"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Categoria
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full h-12 px-3 border border-border rounded-md bg-secondary text-foreground"
          >
            <option value="">Todas las categorias</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Ubicacion
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tu zona..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="bg-secondary border-border pl-10 h-12"
            />
          </div>
        </div>
      </div>

      <Button type="submit" size="lg" className="w-full h-14 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold">
        Buscar Profesionales
        <ArrowRight className="ml-2 w-4 h-4" />
      </Button>
    </form>
  )
}
