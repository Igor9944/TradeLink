import React from 'react'
import { cn } from '@/lib/utils'

interface OrganicWaveBackgroundProps {
  className?: string
  variant?: 'cobalt' | 'monochrome' | 'subtle' | 'glow' | 'ambient'
  animated?: boolean
}

export function OrganicWaveBackground({
  className,
  variant = 'subtle',
  animated = false,
}: OrganicWaveBackgroundProps) {
  const palette =
    variant === 'monochrome'
      ? {
          stroke: 'rgba(15, 23, 42, 0.08)',
          fill1: 'rgba(15, 23, 42, 0.02)',
          fill2: 'rgba(15, 23, 42, 0.03)',
          glow: 'rgba(148, 163, 184, 0.12)',
        }
      : {
          stroke: 'rgba(37, 99, 235, 0.12)',
          fill1: 'rgba(191, 219, 254, 0.18)',
          fill2: 'rgba(219, 234, 254, 0.22)',
          glow: 'rgba(147, 197, 253, 0.14)',
        }

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden select-none',
        className
      )}
      aria-hidden="true"
    >
      <svg
        className={cn(
          'absolute h-full w-full object-cover',
          animated && 'animate-pulse [animation-duration:8s]'
        )}
        viewBox="0 0 1440 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="softGlow" cx="50%" cy="30%" r="60%">
            <stop offset="0%" stopColor={palette.glow} />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          <filter id="softBlur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="28" result="blur" />
          </filter>
        </defs>

        <ellipse cx="1120" cy="260" rx="480" ry="340" fill="url(#softGlow)" filter="url(#softBlur)" />

        <path
          d="M-120 180C140 110 320 340 580 280C840 220 980 60 1240 120C1380 152 1500 240 1620 290V650C1480 580 1320 690 1060 620C800 550 710 400 450 480C230 548 80 690 -120 620V180Z"
          fill={palette.fill1}
        />

        <path
          d="M-80 520C180 430 380 640 680 580C980 520 1120 330 1360 410C1480 450 1580 530 1680 560V950C1520 900 1340 980 1120 920C860 850 780 720 520 780C280 836 120 950 -80 910V520Z"
          fill={palette.fill2}
        />

        <path
          d="M-60 210C210 140 390 370 650 310C910 250 1050 90 1310 150C1450 182 1550 260 1660 300"
          stroke={palette.stroke}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="8 10"
        />

        <path
          d="M-40 280C230 210 410 440 670 380C930 320 1070 160 1330 220C1460 250 1570 330 1680 370"
          stroke={palette.stroke}
          strokeWidth="1.5"
          strokeOpacity="0.7"
        />
      </svg>
    </div>
  )
}
