'use client'

import { RatingStars } from './RatingStars'
import type { Worker } from '@/lib/data/workers'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Clock, BadgeCheck } from 'lucide-react'

interface WorkerCardProps {
  worker: Worker
  onSelect?: (workerId: string) => void
}

export function WorkerCard({ worker, onSelect }: WorkerCardProps) {
  return (
    <Card className="group overflow-hidden bg-card border-border hover:border-primary/30 transition-all duration-300">
      <div className="aspect-[4/3] overflow-hidden bg-secondary relative">
        <img
          src={worker.image}
          alt={worker.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {worker.verified && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/90 text-primary-foreground text-xs font-medium">
            <BadgeCheck className="w-3.5 h-3.5" />
            Verificado
          </div>
        )}
      </div>

      <div className="p-5 space-y-4">
        <div className="space-y-1">
          <h3 className="font-semibold text-lg text-foreground leading-tight">
            {worker.name}
          </h3>
          <p className="text-sm text-primary font-medium">{worker.category}</p>
        </div>

        <RatingStars rating={worker.rating} reviews={worker.reviews} size="sm" />

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{worker.location} - {worker.distance} km</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{worker.responseTime}</span>
          </div>
        </div>

        <div className="flex items-center justify-end pt-2 border-t border-border">
          <Button
            size="sm"
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => onSelect?.(worker.id)}
          >
            Ver Perfil
          </Button>
        </div>
      </div>
    </Card>
  )
}
