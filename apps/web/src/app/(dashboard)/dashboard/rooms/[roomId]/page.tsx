'use client'

import dynamic from 'next/dynamic'
import { useParams } from 'next/navigation'

const RoomView = dynamic(() => import('./room-view'), {
  ssr: false,
  loading: () => (
    <div role="status" className="py-16 text-center text-sm text-[var(--muted)]">
      Chargement de la salle…
    </div>
  ),
})

export default function RoomMeetingPage() {
  const params = useParams<{ roomId: string }>()
  return <RoomView roomId={params.roomId} />
}
