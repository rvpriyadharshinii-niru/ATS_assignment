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
      <PageHeader title="Jobs" description="Roles you own, with their candidates, pipeline, interviews and hiring criteria." />
      <div className="grid grid-cols-1 gap-5 p-5 sm:p-8 md:grid-cols-2 xl:grid-cols-3">
        {openings.map((opening) => (
          <OpeningCard key={opening.id} opening={opening} />
        ))}
      </div>
    </div>
  )
}
