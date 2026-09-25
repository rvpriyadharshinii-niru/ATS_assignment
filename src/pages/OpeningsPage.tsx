import { useEffect } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { OpeningCard } from '../components/openings/OpeningCard'
import { openings } from '../data/openings'
import { useAppStore } from '../store/useAppStore'

export function OpeningsPage() {
  const setSelectedOpening = useAppStore((state) => state.setSelectedOpening)

  useEffect(() => {
    setSelectedOpening(null)
  }, [setSelectedOpening])

  return (
    <div>
      <PageHeader title="My Openings" description="Roles you own and their current hiring status." backTo="/" />
      <div className="grid grid-cols-3 gap-5 p-8">
        {openings.map((opening) => (
          <OpeningCard key={opening.id} opening={opening} />
        ))}
      </div>
    </div>
  )
}
