'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { WorkerCard } from '@/components/WorkerCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { workers, type Worker } from '@/lib/data/workers'
import { categories } from '@/lib/data/categories'
import { Search, Filter, MapPin, X, ChevronDown, SlidersHorizontal, Users, Shield, Star } from 'lucide-react'

export default function SearchPage() {
  const router = useRouter()
  const [filteredWorkers, setFilteredWorkers] = useState<Worker[]>(workers)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedRating, setSelectedRating] = useState('')
  const [location, setLocation] = useState('')
  const [sortBy, setSortBy] = useState('distance')
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    let result = [...workers]
    if (selectedCategory) {
      const selectedCat = categories.find(c => c.id === selectedCategory)
      if (selectedCat) result = result.filter(w => w.category === selectedCat.name)
    }
    if (location) {
      result = result.filter(w => w.location.toLowerCase().includes(location.toLowerCase()))
    }
    if (selectedRating) {
      const minRating = parseFloat(selectedRating)
      result = result.filter(w => w.rating >= minRating)
    }
    switch (sortBy) {
      case 'distance': result.sort((a, b) => a.distance - b.distance); break
      case 'rating': result.sort((a, b) => b.rating - a.rating); break
      case 'price-low': result.sort((a, b) => a.hourlyRate - b.hourlyRate); break
      case 'price-high': result.sort((a, b) => b.hourlyRate - a.hourlyRate); break
    }
    setFilteredWorkers(result)
  }, [selectedCategory, location, selectedRating, sortBy])

  const clearFilters = () => {
    setSelectedCategory('')
    setLocation('')
    setSelectedRating('')
    setSortBy('distance')
  }

  const activeFiltersCount = [selectedCategory, selectedRating, location].filter(Boolean).length

  const FiltersContent = () => (
    <div className="space-y-6">
      {/* Location */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-foreground">Ubicacion</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Zona, ciudad..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="bg-background pl-10 h-11"
          />
        </div>
      </div>

      {/* Category */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-foreground">Categoria</label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
        >
          <option value="">Todas las categorias</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Rating */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-foreground">Calificacion minima</label>
        <div className="space-y-2">
          {[
            { value: '4.9', label: '4.9+ Excelente' },
            { value: '4.7', label: '4.7+ Muy bueno' },
            { value: '4.5', label: '4.5+ Bueno' },
            { value: '4', label: '4.0+ Aceptable' },
          ].map((rating) => (
            <label key={rating.value} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="rating"
                value={rating.value}
                checked={selectedRating === rating.value}
                onChange={(e) => setSelectedRating(e.target.value)}
                className="w-4 h-4 accent-accent"
              />
              <span className="text-sm text-foreground group-hover:text-accent transition-colors">{rating.label}</span>
            </label>
          ))}
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="radio"
              name="rating"
              value=""
              checked={selectedRating === ''}
              onChange={() => setSelectedRating('')}
              className="w-4 h-4 accent-accent"
            />
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Mostrar todos</span>
          </label>
        </div>
      </div>

      {/* Clear Button */}
      {activeFiltersCount > 0 && (
        <Button variant="outline" className="w-full" onClick={clearFilters}>
          <X className="w-4 h-4 mr-2" />
          Limpiar filtros ({activeFiltersCount})
        </Button>
      )}
    </div>
  )

  return (
    <main className="min-h-screen bg-secondary/30">
      <Navbar />

      {/* Hero Header */}
      <div className="bg-primary py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-accent text-sm font-medium mb-4">
              <Search className="w-4 h-4" />
              <span>Busqueda de profesionales</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              Profesionales verificados cerca de ti
            </h1>
            <p className="text-white/70 text-lg">
              Todos nuestros profesionales pasan por un proceso de verificacion riguroso
            </p>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-6 mt-8">
            {[
              { icon: Users, label: 'profesionales disponibles', value: filteredWorkers.length },
              { icon: Shield, label: 'verificados', value: '100%' },
              { icon: Star, label: 'calificacion promedio', value: '4.8' },
            ].map((stat, idx) => (
              <div key={idx} className="flex items-center gap-3 text-white/80">
                <stat.icon className="w-5 h-5 text-accent" />
                <span className="text-sm"><strong className="text-white">{stat.value}</strong> {stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden mb-6">
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="flex items-center gap-3 px-5 py-3 rounded-xl border border-border bg-background text-sm font-semibold text-foreground w-full justify-between shadow-sm"
          >
            <div className="flex items-center gap-3">
              <SlidersHorizontal className="w-5 h-5 text-primary" />
              <span>Filtros y ordenamiento</span>
              {activeFiltersCount > 0 && (
                <span className="w-6 h-6 rounded-full bg-accent text-white text-xs flex items-center justify-center font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </div>
            <ChevronDown className={`w-5 h-5 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Mobile Filters Panel */}
          {filtersOpen && (
            <Card className="mt-3 p-5 border-border shadow-lg">
              <FiltersContent />
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Desktop Filters Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24">
              <Card className="p-6 border-border shadow-sm">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                  <Filter className="w-5 h-5 text-primary" />
                  <h2 className="font-bold text-foreground">Filtros</h2>
                </div>
                <FiltersContent />
              </Card>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3 space-y-6">
            {/* Sort Options */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-background p-4 rounded-xl border border-border">
              <div className="text-sm text-muted-foreground">
                Mostrando <span className="font-bold text-foreground">{filteredWorkers.length}</span> profesionales
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Ordenar por:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-input rounded-lg bg-background text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                >
                  <option value="distance">Mas cercanos</option>
                  <option value="rating">Mejor calificados</option>
                  <option value="price-low">Precio: menor a mayor</option>
                  <option value="price-high">Precio: mayor a menor</option>
                </select>
              </div>
            </div>

            {/* Workers Grid */}
            {filteredWorkers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredWorkers.map((worker) => (
                  <WorkerCard
                    key={worker.id}
                    worker={worker}
                    onSelect={(id) => router.push(`/worker/${id}`)}
                  />
                ))}
              </div>
            ) : (
              <Card className="text-center py-16 px-8 border-border">
                <div className="w-16 h-16 mx-auto bg-secondary rounded-full flex items-center justify-center mb-6">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Sin resultados</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  No encontramos profesionales con estos criterios. Intenta ajustar los filtros.
                </p>
                <Button className="bg-accent hover:bg-accent/90 text-white" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
