'use client'

import type { Category } from '@/lib/data/categories'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface CategoryCardProps {
  category: Category
  onSelect?: (categoryId: string) => void
}

export function CategoryCard({ category, onSelect }: CategoryCardProps) {
  return (
    <Card className="p-6 space-y-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onSelect?.(category.id)}>
      <div className="text-5xl">{category.icon}</div>
      <div className="space-y-2">
        <h3 className="font-semibold text-lg text-foreground">{category.name}</h3>
        <p className="text-sm text-muted-foreground">{category.description}</p>
        <p className="text-xs text-muted-foreground">{category.count} profesionales</p>
      </div>
      <Button variant="outline" className="w-full">
        Explorar
      </Button>
    </Card>
  )
}
