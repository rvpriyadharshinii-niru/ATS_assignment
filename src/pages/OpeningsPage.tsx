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
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">My Openings</h1>
        <p className="mt-1 text-neutral-500">Roles you own and their current hiring status.</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {openings.map((opening) => (
          <OpeningCard key={opening.id} opening={opening} />
        ))}
      </div>
    </div>
  )
}
