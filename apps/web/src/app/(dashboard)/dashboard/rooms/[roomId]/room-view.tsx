'use client'

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import {
  Camera,
  CameraOff,
  Check,
  Mic,
  MicOff,
  NotebookPen,
  PhoneOff,
  ScreenShare,
  Send,
  ShieldCheck,
  UserRound,
  Users,
  Video,
  X,
} from 'lucide-react'
import {
  ConnectionState,
  Room as LiveKitRoom,
  RoomEvent,
  Track,
  type Participant as LiveKitParticipant,
} from 'livekit-client'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/authStore'
import {
  roomsService,
  type RoomMessage,
  type RoomParticipant,
} from '@/services/rooms.service'
import { roomText } from '@/lib/room-translations'

function getErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message
    if (typeof message === 'string') return message
    if (Array.isArray(message) && message.every((item) => typeof item === 'string')) return message.join(' ')
  }
  return fallback
}

function personName(value: string | Record<string, string> | null, fallback: string) {
  if (typeof value === 'string' && value.trim()) return value
  if (value && typeof value === 'object') {
    const localized = value.fr || value.en || value.ar
    if (localized?.trim()) return localized
  }
  return fallback
}

function ParticipantTile({
  participant,
  local = false,
  locale,
}: {
  participant: LiveKitParticipant
  local?: boolean
  locale: 'fr' | 'en' | 'ar'
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const camera = (
    participant.getTrackPublication(Track.Source.ScreenShare) ??
    participant.getTrackPublication(Track.Source.Camera)
  )?.videoTrack
  const microphone = participant.getTrackPublication(Track.Source.Microphone)?.audioTrack

  useEffect(() => {
    const element = videoRef.current
    if (!camera || !element) return
    camera.attach(element)
    return () => {
      camera.detach(element)
    }
  }, [camera])

  useEffect(() => {
    const element = audioRef.current
    if (!microphone || !element) return
    microphone.attach(element)
    return () => {
      microphone.detach(element)
    }
  }, [microphone])

  return (
    <div className="relative aspect-video overflow-hidden rounded-[var(--radius-lg)] border border-white/10 bg-slate-950">
      <video ref={videoRef} autoPlay playsInline muted={local} className="h-full w-full object-cover" />
      <audio ref={audioRef} autoPlay />
      {!camera && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/70">
          <div className="rounded-full bg-white/10 p-4"><UserRound className="h-8 w-8" aria-hidden="true" /></div>
          <span className="text-sm">{participant.name || participant.identity}</span>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-3 pb-3 pt-8 text-sm text-white">
        <span className="truncate">{participant.name || participant.identity}{local ? ` · ${roomText(locale, 'me')}` : ''}</span>
        {!participant.isMicrophoneEnabled && <MicOff className="h-4 w-4" aria-label={roomText(locale, 'muted')} />}
      </div>
    </div>
  )
}

function displaySender(message: RoomMessage, locale: 'fr' | 'en' | 'ar') {
  return personName(message.sender.displayName, `${roomText(locale, 'participant')} ${message.senderId.slice(0, 8)}`)
}

export default function RoomView({ roomId }: { roomId: string }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const userId = useAuthStore((state) => state.user?.id)
  const locale = useAuthStore((state) => state.preferredLanguage)
  const t = (key: Parameters<typeof roomText>[1]) => roomText(locale, key)
  const [liveRoom, setLiveRoom] = useState<LiveKitRoom | null>(null)
  const liveRoomRef = useRef<LiveKitRoom | null>(null)
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Disconnected)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [connectionAttempt, setConnectionAttempt] = useState(0)
  const [trackRevision, setTrackRevision] = useState(0)
  const [micEnabled, setMicEnabled] = useState(false)
  const [cameraEnabled, setCameraEnabled] = useState(false)
  const [screenSharing, setScreenSharing] = useState(false)
  const [draftMessage, setDraftMessage] = useState('')
  const [notesDraft, setNotesDraft] = useState('')

  const roomQuery = useQuery({
    queryKey: ['room', roomId],
    queryFn: () => roomsService.getById(roomId),
    refetchInterval: 4000,
    staleTime: 0,
  })
  const messagesQuery = useQuery({
    queryKey: ['room-messages', roomId],
    queryFn: () => roomsService.getMessages(roomId),
    enabled: roomQuery.data?.currentParticipantStatus === 'ADMITTED',
    refetchInterval: 3000,
  })
  const mediaQuery = useQuery({
    queryKey: ['room-media-token', roomId],
    queryFn: () => roomsService.getMediaToken(roomId),
    enabled:
      roomQuery.data?.currentParticipantStatus === 'ADMITTED' &&
      roomQuery.data.status === 'LIVE',
    retry: false,
  })

  const refreshRoom = () => queryClient.invalidateQueries({ queryKey: ['room', roomId] })
  const startRoom = useMutation({
    mutationFn: () => roomsService.start(roomId),
    onSuccess: refreshRoom,
    onError: (error) => toast.error(getErrorMessage(error, t('startError'))),
  })
  const endRoom = useMutation({
    mutationFn: () => roomsService.end(roomId),
    onSuccess: async () => {
      await liveRoom?.disconnect()
      liveRoomRef.current = null
      setLiveRoom(null)
      await refreshRoom()
    },
    onError: (error) => toast.error(getErrorMessage(error, t('endError'))),
  })
  const leaveRoom = useMutation({
    mutationFn: () => roomsService.leave(roomId),
    onSuccess: async () => {
      await liveRoom?.disconnect()
      liveRoomRef.current = null
      router.replace('/dashboard/rooms')
    },
    onError: (error) => toast.error(getErrorMessage(error, t('leaveError'))),
  })
  const participantAction = useMutation({
    mutationFn: ({
      participantId,
      action,
      participantRole,
    }: {
      participantId: string
      action: 'ADMIT' | 'REJECT' | 'REMOVE' | 'CHANGE_ROLE'
      participantRole?: 'MODERATOR' | 'PARTICIPANT'
    }) => roomsService.updateParticipant(roomId, participantId, { action, participantRole }),
    onSuccess: refreshRoom,
    onError: (error) => toast.error(getErrorMessage(error, t('participantError'))),
  })
  const sendMessage = useMutation({
    mutationFn: (message: string) => roomsService.sendMessage(roomId, message),
    onSuccess: async () => {
      setDraftMessage('')
      await queryClient.invalidateQueries({ queryKey: ['room-messages', roomId] })
    },
    onError: (error) => toast.error(getErrorMessage(error, t('messageError'))),
  })
  const saveNotes = useMutation({
    mutationFn: () => roomsService.updateNotes(roomId, notesDraft),
    onSuccess: () => toast.success('Notes enregistrées.'),
    onError: (error) => toast.error(getErrorMessage(error, t('notesError'))),
  })

  useEffect(() => {
    setNotesDraft(roomQuery.data?.notes ?? '')
  }, [roomQuery.data?.notes])

  useEffect(() => {
    const credentials = mediaQuery.data
    if (!credentials || liveRoomRef.current) return
    let active = true
    const room = new LiveKitRoom({ adaptiveStream: true, dynacast: true })
    const refresh = () => setTrackRevision((revision) => revision + 1)
    const updateConnection = () => setConnectionState(room.state)
    room
      .on(RoomEvent.TrackSubscribed, refresh)
      .on(RoomEvent.TrackUnsubscribed, refresh)
      .on(RoomEvent.TrackPublished, refresh)
      .on(RoomEvent.TrackUnpublished, refresh)
      .on(RoomEvent.ParticipantConnected, refresh)
      .on(RoomEvent.ParticipantDisconnected, refresh)
      .on(RoomEvent.ConnectionStateChanged, updateConnection)

    void room.connect(credentials.url, credentials.token)
      .then(() => {
        if (!active) {
          void room.disconnect()
          return
        }
        liveRoomRef.current = room
        setConnectionError(null)
        setLiveRoom(room)
        setConnectionState(room.state)
        refresh()
      })
      .catch((error: unknown) => {
        if (!active) return
        setConnectionError(error instanceof Error ? error.message : 'La connexion média a échoué.')
      })

    return () => {
      active = false
      void room.disconnect()
      if (liveRoomRef.current === room) liveRoomRef.current = null
      setLiveRoom((current) => current === room ? null : current)
      setConnectionState(ConnectionState.Disconnected)
    }
  }, [connectionAttempt, mediaQuery.data])

  const roomStatus = roomQuery.data?.status
  useEffect(() => {
    if (roomStatus === 'ENDED' || roomStatus === 'CANCELLED') {
      void liveRoom?.disconnect()
      liveRoomRef.current = null
      setLiveRoom(null)
    }
  }, [liveRoom, roomStatus])

  const participants = useMemo(() => {
    void trackRevision
    if (!liveRoom) return []
    return [liveRoom.localParticipant, ...liveRoom.remoteParticipants.values()]
  }, [liveRoom, trackRevision])

  if (roomQuery.isLoading) {
    return <div dir={locale === 'ar' ? 'rtl' : 'ltr'} role="status" className="py-16 text-center text-sm text-[var(--muted)]">{t('loading')}</div>
  }
  if (roomQuery.isError || !roomQuery.data) {
    return (
      <Card dir={locale === 'ar' ? 'rtl' : 'ltr'} role="alert" className="mx-auto max-w-xl p-8 text-center">
        <h1 className="text-lg font-semibold text-[var(--ink)]">{t('inaccessible')}</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {getErrorMessage(roomQuery.error, t('invalidRoomHelp'))}
        </p>
        <Button type="button" className="mt-5" onClick={() => router.replace('/dashboard/rooms')}>{t('backToRooms')}</Button>
      </Card>
    )
  }

  const room = roomQuery.data
  const currentParticipant = room.participants.find((participant) => participant.userId === userId)
  const canManageParticipants = room.isHost || currentParticipant?.participantRole === 'MODERATOR'
  const waitingParticipants = canManageParticipants
    ? room.participants.filter((participant) => participant.status === 'WAITING')
    : []
  const canModerateNotes = room.isHost || currentParticipant?.participantRole === 'MODERATOR'

  if (room.currentParticipantStatus === 'WAITING') {
    return (
      <div dir={locale === 'ar' ? 'rtl' : 'ltr'} className="mx-auto max-w-xl py-8">
        <Card className="p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
            <Users className="h-7 w-7" aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-xl font-semibold text-[var(--ink)]">{t('sent')}</h1>
          <p className="mt-2 text-[var(--muted)]">
            {t('waitingDescription')} « {room.title} ». {t('waitingUpdate')}
          </p>
          <p className="mt-4 text-xs text-[var(--muted)]">{t('keepPage')}</p>
          <Button type="button" variant="secondary" className="mt-6" onClick={() => router.replace('/dashboard/rooms')}>
            {t('leaveWaiting')}
          </Button>
        </Card>
      </div>
    )
  }

  const submitMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const message = draftMessage.trim()
    if (message) sendMessage.mutate(message)
  }

  const toggleMic = async () => {
    if (!liveRoom) return
    try {
      await liveRoom.localParticipant.setMicrophoneEnabled(!micEnabled)
      setMicEnabled(!micEnabled)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('microphoneError'))
    }
  }

  const toggleCamera = async () => {
    if (!liveRoom) return
    try {
      await liveRoom.localParticipant.setCameraEnabled(!cameraEnabled)
      setCameraEnabled(!cameraEnabled)
      setTrackRevision((revision) => revision + 1)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('cameraError'))
    }
  }

  const toggleScreenShare = async () => {
    if (!liveRoom) return
    try {
      await liveRoom.localParticipant.setScreenShareEnabled(!screenSharing)
      setScreenSharing(!screenSharing)
      setTrackRevision((revision) => revision + 1)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('screenError'))
    }
  }

  return (
    <div dir={locale === 'ar' ? 'rtl' : 'ltr'} className="mx-auto max-w-[1500px] space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[var(--ink)]">{room.title}</h1>
            <Badge variant={room.status === 'LIVE' ? 'success' : 'neutral'}>
              {t(room.status === 'LIVE' ? 'live' : 'ready')}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {connectionState === ConnectionState.Connected ? t('mediaConnected') : t('mediaConnecting')}
            {' · '}{room._count.participants} {t('admittedCount')}
          </p>
        </div>
        {room.isHost && room.status !== 'LIVE' && (
          <Button type="button" loading={startRoom.isPending} onClick={() => startRoom.mutate()}>
            <Video className="h-4 w-4" aria-hidden="true" />
            {t('startMeeting')}
          </Button>
        )}
      </header>

      {room.isHost && waitingParticipants.length > 0 && (
        <Card aria-label={t('waitingGuests')} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-[var(--ink)]">{waitingParticipants.length} {t('peopleWaiting')}</h2>
            <p className="text-sm text-[var(--muted)]">{t('verifyNames')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {waitingParticipants.map((participant: RoomParticipant) => (
              <div key={participant.id} className="flex items-center gap-2 rounded-full bg-[var(--raised)] px-3 py-2 text-sm">
                <span>{personName(participant.user.displayName, participant.userId.slice(0, 8))}</span>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  loading={participantAction.isPending}
                  aria-label={`${t('admitNamed')} ${personName(participant.user.displayName, participant.userId.slice(0, 8))}`}
                  onClick={() => participantAction.mutate({ participantId: participant.id, action: 'ADMIT' })}
                >
                  <Check className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  loading={participantAction.isPending}
                  aria-label={`${t('rejectNamed')} ${personName(participant.user.displayName, participant.userId.slice(0, 8))}`}
                  onClick={() => participantAction.mutate({ participantId: participant.id, action: 'REJECT' })}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {mediaQuery.isError && room.status === 'LIVE' && (
        <Card role="alert" className="flex flex-wrap items-center justify-between gap-3 border-[var(--warning)]/40 p-4 text-sm text-[var(--ink)]">
          <span>{getErrorMessage(mediaQuery.error, t('mediaNotConfigured'))}</span>
          <Button type="button" size="sm" variant="secondary" loading={mediaQuery.isFetching} onClick={() => void mediaQuery.refetch()}>
            {t('retry')}
          </Button>
        </Card>
      )}
      {connectionError && (
        <Card role="alert" className="flex flex-wrap items-center justify-between gap-3 border-[var(--danger)]/40 p-4 text-sm text-[var(--danger)]">
          <span>{t('connectionFailed')}: {connectionError}</span>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => {
              void liveRoomRef.current?.disconnect()
              liveRoomRef.current = null
              setLiveRoom(null)
              setConnectionError(null)
              setConnectionAttempt((attempt) => attempt + 1)
              void mediaQuery.refetch()
            }}
          >
            {t('retry')}
          </Button>
        </Card>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section aria-label={t('videoParticipants')} className="space-y-4">
          <div className={`grid gap-3 ${participants.length > 1 ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
            {participants.map((participant) => (
              <ParticipantTile
                key={participant.identity}
                participant={participant}
                local={participant.identity === userId}
                locale={locale}
              />
            ))}
            {!participants.length && (
              <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-slate-950 text-center text-white">
                <Video className="h-9 w-9 text-white/60" aria-hidden="true" />
                <p className="text-sm text-white/70">
                  {room.status === 'LIVE' ? t('connectingMedia') : t('noVideoStart')}
                </p>
              </div>
            )}
          </div>
          <Card className="flex flex-wrap items-center justify-center gap-2 p-3">
            <Button type="button" variant={micEnabled ? 'primary' : 'secondary'} disabled={!liveRoom} aria-label={micEnabled ? t('disableMicrophone') : t('enableMicrophone')} onClick={() => void toggleMic()}>
              {micEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              {t('microphone')}
            </Button>
            <Button type="button" variant={cameraEnabled ? 'primary' : 'secondary'} disabled={!liveRoom} aria-label={cameraEnabled ? t('disableCamera') : t('enableCamera')} onClick={() => void toggleCamera()}>
              {cameraEnabled ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
              {t('camera')}
            </Button>
            <Button type="button" variant={screenSharing ? 'primary' : 'secondary'} disabled={!liveRoom} aria-label={t('screen')} onClick={() => void toggleScreenShare()}>
              <ScreenShare className="h-4 w-4" />
              {t('screen')}
            </Button>
            {room.isHost ? (
              <Button type="button" variant="secondary" loading={endRoom.isPending} onClick={() => endRoom.mutate()}>
                <PhoneOff className="h-4 w-4" aria-hidden="true" />
                {t('endForAll')}
              </Button>
            ) : (
              <Button type="button" variant="secondary" loading={leaveRoom.isPending} onClick={() => leaveRoom.mutate()}>
                <PhoneOff className="h-4 w-4" aria-hidden="true" />
                {t('leaveMeeting')}
              </Button>
            )}
          </Card>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-4">
              <h2 className="flex items-center gap-2 font-semibold text-[var(--ink)]">
                <Users className="h-4 w-4" aria-hidden="true" /> {t('attendees')}
              </h2>
              <ul className="mt-3 space-y-2 text-sm">
                {room.participants.filter((participant) => participant.status === 'ADMITTED').map((participant) => (
                  <li key={participant.id} className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate">{personName(participant.user.displayName, participant.userId.slice(0, 8))}</span>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs text-[var(--muted)]">
                        {participant.participantRole === 'HOST'
                          ? t('organizer')
                          : participant.participantRole === 'MODERATOR'
                            ? t('moderators')
                            : t('participant')}
                      </span>
                      {canManageParticipants && participant.participantRole !== 'HOST' && (
                        <>
                          {room.isHost && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              loading={participantAction.isPending}
                              aria-label={participant.participantRole === 'MODERATOR' ? t('makeParticipant') : t('makeModerator')}
                              onClick={() =>
                                participantAction.mutate({
                                  participantId: participant.id,
                                  action: 'CHANGE_ROLE',
                                  participantRole: participant.participantRole === 'MODERATOR' ? 'PARTICIPANT' : 'MODERATOR',
                                })
                              }
                            >
                              {participant.participantRole === 'MODERATOR' ? t('makeParticipant') : t('makeModerator')}
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            loading={participantAction.isPending}
                            aria-label={`${t('removeNamed')} ${personName(participant.user.displayName, participant.userId.slice(0, 8))}`}
                            onClick={() => participantAction.mutate({ participantId: participant.id, action: 'REMOVE' })}
                          >
                            {t('removeParticipant')}
                          </Button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="p-4">
              <h2 className="flex items-center gap-2 font-semibold text-[var(--ink)]">
                <NotebookPen className="h-4 w-4" aria-hidden="true" /> {t('notes')}
              </h2>
              <textarea
                value={notesDraft}
                onChange={(event) => setNotesDraft(event.target.value)}
                maxLength={20000}
                readOnly={!canModerateNotes}
                aria-label={t('notes')}
                placeholder={canModerateNotes ? t('notesPlaceholder') : t('noNotes')}
                className="mt-3 min-h-28 w-full resize-y rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] p-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)]"
              />
              {canModerateNotes && (
                <Button type="button" variant="secondary" size="sm" className="mt-2" loading={saveNotes.isPending} onClick={() => saveNotes.mutate()}>
                  {t('saveNotes')}
                </Button>
              )}
            </Card>
          </div>
        </section>

        <aside aria-label={t('chat')} className="flex min-h-[420px] flex-col rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] p-4">
            <div>
              <h2 className="font-semibold text-[var(--ink)]">{t('chat')}</h2>
              <p className="text-xs text-[var(--muted)]">{t('admittedOnly')}</p>
            </div>
            <Badge variant={connectionState === ConnectionState.Connected ? 'success' : 'neutral'}>
              {connectionState === ConnectionState.Connected ? t('connected') : t('offline')}
            </Badge>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messagesQuery.data?.data.map((message) => (
              <div key={message.id} className="rounded-[var(--radius-control)] bg-[var(--raised)] p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-semibold text-[var(--ink)]">{displaySender(message, locale)}</span>
                  <time className="shrink-0 text-[10px] text-[var(--muted)]" dateTime={message.sentAt}>
                    {new Date(message.sentAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                  </time>
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm text-[var(--ink)]">{message.message}</p>
              </div>
            ))}
            {!messagesQuery.isLoading && !messagesQuery.data?.data.length && (
              <p className="py-8 text-center text-sm text-[var(--muted)]">{t('noMessages')}</p>
            )}
          </div>
          <form onSubmit={submitMessage} className="flex gap-2 border-t border-[var(--border)] p-3">
            <label htmlFor="room-message" className="sr-only">{t('writeMessage')}</label>
            <Input id="room-message" value={draftMessage} onChange={(event) => setDraftMessage(event.target.value)} maxLength={4000} placeholder={t('writeMessage')} />
            <Button type="submit" size="sm" aria-label={t('sendMessage')} disabled={!draftMessage.trim()} loading={sendMessage.isPending}>
              <Send className="h-4 w-4" aria-hidden="true" />
            </Button>
          </form>
        </aside>
      </div>

      <p className="flex items-center gap-2 text-xs text-[var(--muted)]">
        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
        {t('privacy')}
      </p>
    </div>
  )
}
