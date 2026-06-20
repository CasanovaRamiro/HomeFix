import type { LocationFilter } from './types'
import CustomSelect from '../ui/CustomSelect'

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
        <CustomSelect
          id="cat-select"
          label="Rubro"
          options={[
            { value: '', label: 'Todos los rubros' },
            ...workerCategories.map(cat => ({ value: cat, label: cat }))
          ]}
          value={category}
          onChange={onCategoryChange}
        />
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
        <CustomSelect
          id="sort-select"
          label="Orden"
          options={[
            { value: 'reciente', label: 'Mas recientes' },
            { value: 'antiguo', label: 'Mas antiguos' }
          ]}
          value={sortBy}
          onChange={(val) => onSortChange(val as 'reciente' | 'antiguo')}
        />
      </div>

      <div className="filter-group filter-location">
        <label>&nbsp;</label>
        <button
          type="button"
          className={`btn-filter-location ${locationFilter ? 'active' : ''}`}
          onClick={onOpenLocationModal}
        >
          {locationFilter ? `${locationFilter.radius} km` : 'Filtrar por ubicación'}
        </button>
      </div>
    </div>
  )
}
