import type { LocationFilter } from './types'

interface Props {
  category: string
  onCategoryChange: (val: string) => void
  workerCategories: string[]
  searchQuery: string
  onSearchChange: (val: string) => void
  sortBy: 'reciente' | 'antiguo'
  onSortChange: (val: 'reciente' | 'antiguo') => void
  locationFilter: LocationFilter | null
  onOpenLocationModal: () => void
}

export default function FilterBar({
  category,
  onCategoryChange,
  workerCategories,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  locationFilter,
  onOpenLocationModal,
}: Props) {
  return (
    <div className="trabajos-filters-row">
      <div className="filter-group filter-category">
        <label htmlFor="cat-select">Rubro</label>
        <select
          id="cat-select"
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
        >
          <option value="">Todos los rubros</option>
          {workerCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group filter-search">
        <label htmlFor="search-input">Buscar</label>
        <input
          id="search-input"
          type="search"
          placeholder="Palabra clave..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="filter-group filter-sort">
        <label htmlFor="sort-select">Orden</label>
        <select
          id="sort-select"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as 'reciente' | 'antiguo')}
        >
          <option value="reciente">Mas recientes</option>
          <option value="antiguo">Mas antiguos</option>
        </select>
      </div>

      <div className="filter-group filter-location">
        <label>&nbsp;</label>
        <button
          type="button"
          className={`btn-filter-location ${locationFilter ? 'active' : ''}`}
          onClick={onOpenLocationModal}
        >
          {locationFilter ? `Ubicación (${locationFilter.radius} km)` : 'Filtrar por ubicación'}
        </button>
      </div>
    </div>
  )
}
