'use client'

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { isAxiosError } from 'axios'
import { DoorOpen, Link2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { roomsService } from '@/services/rooms.service'
import { roomText, type RoomTranslationKey } from '@/lib/room-translations'
import { useAuthStore } from '@/stores/authStore'

function getErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message
    if (typeof message === 'string') return message
    if (Array.isArray(message) && message.every((item) => typeof item === 'string')) return message.join(' ')
  }
  return fallback
}

export default function JoinRoomPage() {
  const router = useRouter()
  const locale = useAuthStore((state) => state.preferredLanguage)
  const t = (key: RoomTranslationKey) => roomText(locale, key)
  const attemptedInvite = useRef(false)
  const [code, setCode] = useState('')
  const joinRoom = roomsService.join

  const join = useCallback(async (input: { roomCode?: string; inviteToken?: string }) => {
    try {
      const result = await joinRoom(input)
      router.replace(`/dashboard/rooms/${result.roomId}`)
    } catch (error) {
      toast.error(getErrorMessage(error, roomText(locale, 'joinError')))
    }
  }, [joinRoom, locale, router])

  useEffect(() => {
    if (attemptedInvite.current) return
    attemptedInvite.current = true
    const params = new URLSearchParams(window.location.search)
    const inviteToken = params.get('invite')
    const roomCode = params.get('code')
    if (inviteToken && !roomCode && inviteToken.length <= 128) {
      void join({ inviteToken })
    } else if (roomCode && !inviteToken && roomCode.length <= 20) {
      void join({ roomCode })
    }
  }, [join])

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedCode = code.trim().toUpperCase()
    if (normalizedCode.length < 8) {
      toast.error(t('validCode'))
      return
    }
    void join({ roomCode: normalizedCode })
  }

  return (
    <div dir={locale === 'ar' ? 'rtl' : 'ltr'} className="mx-auto max-w-xl">
      <Card className="p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-[var(--accent-soft)] p-3 text-[var(--accent)]">
            <DoorOpen className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[var(--ink)]">{t('joinPageTitle')}</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {t('joinPageHelp')}
            </p>
          </div>
        </div>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-3 sm:flex-row">
          <label htmlFor="join-room-code" className="sr-only">{t('codeLabel')}</label>
          <Input
            id="join-room-code"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder={t('codePlaceholder')}
            maxLength={20}
            minLength={8}
            required
            className="min-w-0 flex-1 font-mono"
          />
          <Button type="submit" variant="primary">
            <Link2 className="h-4 w-4" aria-hidden="true" />
            {t('joinButton')}
          </Button>
        </form>
        <p className="mt-4 text-xs text-[var(--muted)]">
          {t('waitingHelp')}
        </p>
        <Button type="button" variant="ghost" size="sm" className="mt-4" onClick={() => router.push('/dashboard/rooms')}>
          {t('backToRooms')}
        </Button>
      </Card>
    </div>
  )
}
