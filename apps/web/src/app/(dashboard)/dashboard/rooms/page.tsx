'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { CalendarClock, Clipboard, Link2, Plus, Video } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { QueryFeedback } from '@/components/ui/query-feedback'
import { useAuthStore } from '@/stores/authStore'
import { roomsService, type LiveRoom, type RoomInvite } from '@/services/rooms.service'
import { roomText, type RoomTranslationKey } from '@/lib/room-translations'

const statusKey: Record<LiveRoom['status'], RoomTranslationKey> = {
  SCHEDULED: 'scheduled',
  WAITING: 'ready',
  LIVE: 'live',
  ENDED: 'ended',
  CANCELLED: 'cancelled',
}

function formatRoomDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function getErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message
    if (typeof message === 'string') return message
    if (Array.isArray(message) && message.every((item) => typeof item === 'string')) return message.join(' ')
  }
  return fallback
}

async function copyText(value: string, label: string, locale: 'fr' | 'en' | 'ar') {
  try {
    await navigator.clipboard.writeText(value)
    toast.success(`${label} ${roomText(locale, 'copied')}`)
  } catch {
    toast.error(roomText(locale, 'copyFailed'))
  }
}

function RoomCard({
  room,
  userId,
  locale,
  onRotate,
  rotating,
  onOpen,
}: {
  room: LiveRoom
  userId: string | undefined
  locale: 'fr' | 'en' | 'ar'
  onRotate: (roomId: string) => void
  rotating: boolean
  onOpen: (room: LiveRoom) => void
}) {
  const isHost = room.hostId === userId

  return (
    <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <Video className="mt-1 h-5 w-5 shrink-0 text-[var(--accent)]" aria-hidden="true" />
        <div className="min-w-0">
          <h3 className="truncate font-medium text-[var(--ink)]">{room.title}</h3>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {isHost ? roomText(locale, 'organizer') : roomText(locale, 'participant')} · {room._count.participants}
            {room.scheduledAt
              ? ` · ${formatRoomDate(room.scheduledAt, locale)}`
              : ` · ${formatRoomDate(room.createdAt, locale)}`}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={room.status === 'LIVE' ? 'success' : room.status === 'CANCELLED' ? 'danger' : 'neutral'}>
          {roomText(locale, statusKey[room.status])}
        </Badge>
        {isHost && room.status !== 'ENDED' && room.status !== 'CANCELLED' && (
          <Button type="button" variant="secondary" size="sm" loading={rotating} onClick={() => onRotate(room.id)}>
            <Link2 className="h-4 w-4" aria-hidden="true" />
            {roomText(locale, 'newLink')}
          </Button>
        )}
        {room.status !== 'ENDED' && room.status !== 'CANCELLED' && (
          <Button type="button" variant="primary" size="sm" onClick={() => onOpen(room)}>
            {roomText(locale, room.status === 'LIVE' ? 'enter' : 'open')}
          </Button>
        )}
      </div>
    </Card>
  )
}

export default function RoomsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const userId = useAuthStore((state) => state.user?.id)
  const locale = useAuthStore((state) => state.preferredLanguage)
  const t = (key: RoomTranslationKey) => roomText(locale, key)
  const [title, setTitle] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [currentInvite, setCurrentInvite] = useState<RoomInvite | null>(null)

  const roomsQuery = useQuery({
    queryKey: ['my-rooms'],
    queryFn: roomsService.getAll,
    staleTime: 15000,
    refetchInterval: 15000,
  })

  const createRoom = useMutation({
    mutationFn: (roomTitle: string) => roomsService.create({ title: roomTitle }),
    onSuccess: async (room) => {
      setTitle('')
      setCurrentInvite(room)
      toast.success(t('roomCreated'))
      await queryClient.invalidateQueries({ queryKey: ['my-rooms'] })
    },
    onError: (error) => toast.error(getErrorMessage(error, t('createError'))),
  })

  const joinRoom = useMutation({
    mutationFn: (code: string) => roomsService.join({ roomCode: code }),
    onSuccess: (room) => router.push(`/dashboard/rooms/${room.roomId}`),
    onError: (error) => toast.error(getErrorMessage(error, t('joinError'))),
  })

  const rotateInvite = useMutation({
    mutationFn: roomsService.rotateInvite,
    onSuccess: async (invite) => {
      setCurrentInvite(invite)
      toast.success(t('linkRevoked'))
      await queryClient.invalidateQueries({ queryKey: ['my-rooms'] })
    },
    onError: (error) => toast.error(getErrorMessage(error, t('rotateError'))),
  })

  const submitCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedTitle = title.trim()
    if (normalizedTitle.length < 3) {
      toast.error(t('roomNameInvalid'))
      return
    }
    createRoom.mutate(normalizedTitle)
  }

  const submitJoin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedCode = roomCode.trim().toUpperCase()
    if (normalizedCode.length < 8) {
      toast.error(t('validCode'))
      return
    }
    joinRoom.mutate(normalizedCode)
  }

  const openRoom = (room: LiveRoom) => {
    router.push(`/dashboard/rooms/${room.id}`)
  }

  return (
    <div dir={locale === 'ar' ? 'rtl' : 'ltr'} className="mx-auto max-w-[1200px] space-y-6">
      <header>
        <h1 className="text-[var(--step-h2)] font-bold text-[var(--accent)]">{t('pageTitle')}</h1>
        <p className="mt-1 text-[var(--step-body)] text-[var(--muted)]">
          {t('pageSubtitle')}
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <h2 className="text-base font-semibold text-[var(--ink)]">{t('createTitle')}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">{t('createHelp')}</p>
          <form onSubmit={submitCreate} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <label htmlFor="room-title" className="sr-only">{t('roomNameLabel')}</label>
            <Input
              id="room-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t('roomTitlePlaceholder')}
              maxLength={120}
              minLength={3}
              required
              className="min-w-0 flex-1"
            />
            <Button type="submit" variant="primary" loading={createRoom.isPending}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              {createRoom.isPending ? t('creating') : t('createButton')}
            </Button>
          </form>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="text-base font-semibold text-[var(--ink)]">{t('joinTitle')}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">{t('joinHelp')}</p>
          <form onSubmit={submitJoin} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <label htmlFor="room-code" className="sr-only">{t('codeLabel')}</label>
            <Input
              id="room-code"
              value={roomCode}
              onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
              placeholder={t('codePlaceholder')}
              maxLength={20}
              minLength={8}
              autoCapitalize="characters"
              required
              className="min-w-0 flex-1 font-mono"
            />
            <Button type="submit" variant="secondary" loading={joinRoom.isPending}>
              {t('joinButton')}
            </Button>
          </form>
        </Card>
      </div>

      {currentInvite && (
        <Card className="border-[var(--accent)]/30 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-semibold text-[var(--ink)]">{t('invitationTitle')} · {currentInvite.roomCode}</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {t('invitationHelp')} {t('expires')} {formatRoomDate(currentInvite.inviteExpiresAt, locale)}.
              </p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setCurrentInvite(null)}>
              {t('hide')}
            </Button>
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Input aria-label="Lien d’invitation" readOnly value={currentInvite.inviteLink} className="min-w-0 flex-1" />
            <Button type="button" variant="secondary" onClick={() => void copyText(currentInvite.inviteLink, 'Link', locale)}>
              <Clipboard className="h-4 w-4" aria-hidden="true" />
              {t('copyLink')}
            </Button>
            <Button type="button" variant="secondary" onClick={() => void copyText(currentInvite.roomCode, 'Code', locale)}>
              <Clipboard className="h-4 w-4" aria-hidden="true" />
              {t('copyCode')}
            </Button>
          </div>
        </Card>
      )}

      <section aria-labelledby="rooms-list-title" className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="rooms-list-title" className="text-lg font-semibold text-[var(--ink)]">{t('yourRooms')}</h2>
            <p className="text-sm text-[var(--muted)]">{t('yourRoomsHelp')}</p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => void roomsQuery.refetch()}>
            <CalendarClock className="h-4 w-4" aria-hidden="true" />
            {t('refresh')}
          </Button>
        </div>
        <QueryFeedback
          isLoading={roomsQuery.isLoading}
          isError={roomsQuery.isError}
          onRetry={() => void roomsQuery.refetch()}
        />
        {!roomsQuery.isLoading && !roomsQuery.isError && !roomsQuery.data?.length && (
          <Card className="p-8 text-center text-sm text-[var(--muted)]">
            {t('noRooms')}
          </Card>
        )}
        {roomsQuery.data?.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            userId={userId}
            locale={locale}
            onRotate={(roomId) => rotateInvite.mutate(roomId)}
            rotating={rotateInvite.isPending}
            onOpen={openRoom}
          />
        ))}
      </section>
    </div>
  )
}
