import { useEffect } from 'react'
import { OpeningCard } from '../components/openings/OpeningCard'
import { openings } from '../data/openings'
import { useAppStore } from '../store/useAppStore'

export function OpeningsPage() {
  const setSelectedOpening = useAppStore((state) => state.setSelectedOpening)

  useEffect(() => {
    setSelectedOpening(null)
  }, [setSelectedOpening])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-heading text-palette-neutral-900">My Openings</h1>
        <p className="font-sans mt-1 text-muted-foreground">Roles you own and their current hiring status.</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {openings.map((opening) => (
          <OpeningCard key={opening.id} opening={opening} />
        ))}
      </div>
    </div>
  )
}
