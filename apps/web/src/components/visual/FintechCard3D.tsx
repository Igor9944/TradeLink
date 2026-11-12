import React from 'react'
import { cn } from '@/lib/utils'

interface FintechCard3DProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'blue-glass' | 'glass-blue' | 'dark-metallic' | 'metallic-dark' | 'neon-lime' | 'neon-pulse'
  type?: 'card' | 'invoice' | 'shield' | 'mobile-money'
  interactive?: boolean
  label?: string
  sublabel?: string
}

/**
 * FintechCard3D
 * Inspired by Reference Images 2 & 3:
 * Layered translucent sapphire blue glass (Image 2) and obsidian dark metallic plate
 * with electric neon lime (#a3e635) accents, NFC pulses, and microchips (Image 3).
 */
export function FintechCard3D({
  className,
  size = 'md',
  variant = 'blue-glass',
  type = 'card',
  interactive = false,
  label,
  sublabel,
}: FintechCard3DProps) {
  const sizeMap = {
    sm: { box: 'w-10 h-10', svg: 40 },
    md: { box: 'w-14 h-14', svg: 56 },
    lg: { box: 'w-20 h-20', svg: 80 },
  }

  const { box, svg } = sizeMap[size]

  const isDark =
    variant === 'dark-metallic' ||
    variant === 'metallic-dark' ||
    variant === 'neon-lime' ||
    variant === 'neon-pulse'
  const isNeon = variant === 'neon-lime' || variant === 'neon-pulse'

  return (
    <div
      className={cn(
        'inline-flex items-center gap-3',
        interactive && 'transition-transform duration-300 hover:scale-105 cursor-pointer',
        className
      )}
    >
      <div
        className={cn(
          'relative flex items-center justify-center rounded-2xl p-1 overflow-hidden',
          isDark
            ? 'bg-gradient-to-b from-[#0e1e38] to-[#050d1a] border border-cyan-500/20 shadow-[0_10px_25px_-5px_rgba(5,13,26,0.6)]'
            : 'bg-gradient-to-b from-white/95 via-sky-50/70 to-blue-100/50 border border-blue-200/80 shadow-[0_10px_25px_-5px_rgba(37,99,235,0.22)]',
          'backdrop-blur-md',
          isNeon && 'neon-border-lime shadow-[0_0_20px_rgba(163,230,53,0.3)]',
          box
        )}
      >
        <svg
          width={svg}
          height={svg}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Sapphire Blue Glass Gradient (Image 2) */}
            <linearGradient id="sapphireGlass" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#2563eb" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.95" />
            </linearGradient>

            {/* Dark Titanium Metallic Gradient (Image 3) */}
            <linearGradient id="metallicSlate" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="50%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            {/* Neon Lime Electric Highlight (Image 3) */}
            <linearGradient id="neonLime" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#bef264" />
              <stop offset="100%" stopColor="#84cc16" />
            </linearGradient>

            <filter id="fintechGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow
                dx="0"
                dy="4"
                stdDeviation="3"
                floodColor={isDark ? '#0038ff' : '#2563eb'}
                floodOpacity="0.25"
              />
            </filter>
          </defs>

          {type === 'card' && (
            <g filter="url(#fintechGlow)">
              {/* Isometric Angled Payment Card Plate */}
              <rect
                x="8"
                y="14"
                width="48"
                height="36"
                rx="6"
                fill={isDark ? 'url(#metallicSlate)' : 'url(#sapphireGlass)'}
                stroke={isDark ? '#38bdf8' : 'rgba(255,255,255,0.85)'}
                strokeWidth="1.2"
              />

              {/* Holographic Chip with Neon Lime Accent */}
              <rect
                x="14"
                y="22"
                width="11"
                height="8.5"
                rx="2"
                fill={variant === 'neon-lime' ? 'url(#neonLime)' : '#fde047'}
                stroke="#ffffff"
                strokeWidth="0.8"
              />
              <path d="M14 26.5H25M19.5 22V30.5" stroke="#713f12" strokeWidth="0.6" />

              {/* NFC Contactless Wave Rings */}
              <path
                d="M44 23C45.5 24.5 45.5 27.5 44 29"
                stroke={isDark ? '#a3e635' : '#ffffff'}
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              <path
                d="M48 20C50.5 23 50.5 29 48 32"
                stroke={isDark ? '#a3e635' : '#ffffff'}
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeOpacity="0.75"
              />

              {/* Card Number Line Indicators */}
              <rect x="14" y="38" width="16" height="2.5" rx="1" fill="#ffffff" fillOpacity="0.8" />
              <rect x="33" y="38" width="8" height="2.5" rx="1" fill="#ffffff" fillOpacity="0.5" />
            </g>
          )}

          {type === 'invoice' && (
            <g filter="url(#fintechGlow)">
              {/* 3D Glass Layered Invoice Document (Image 2) */}
              <path
                d="M14 10H42L52 20V52C52 54.2 50.2 56 48 56H14C11.8 56 10 54.2 10 52V14C10 11.8 11.8 10 14 10Z"
                fill="url(#sapphireGlass)"
                stroke="rgba(255,255,255,0.9)"
                strokeWidth="1.2"
              />
              <path d="M42 10V20H52" fill="#93c5fd" opacity="0.6" />
              {/* Document Text Lines */}
              <rect x="16" y="24" width="22" height="2.5" rx="1" fill="#ffffff" />
              <rect x="16" y="31" width="16" height="2" rx="1" fill="#ffffff" opacity="0.7" />
              <rect x="16" y="37" width="24" height="2" rx="1" fill="#ffffff" opacity="0.7" />
              {/* Paid / Verified Badge Stamp */}
              <circle cx="38" cy="45" r="7" fill={isDark ? '#a3e635' : '#10b981'} />
              <path d="M35 45L37.5 47.5L41.5 42.5" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
            </g>
          )}

          {type === 'mobile-money' && (
            <g filter="url(#fintechGlow)">
              {/* Smartphone Frame (Image 3 Mobile Money Transfer) */}
              <rect
                x="16"
                y="10"
                width="32"
                height="46"
                rx="6"
                fill="url(#metallicSlate)"
                stroke="#38bdf8"
                strokeWidth="1.2"
              />
              {/* Screen Area */}
              <rect x="19" y="15" width="26" height="34" rx="2" fill="#0284c7" fillOpacity="0.25" />
              {/* Transfer Beam Arrow with Neon Lime Accent */}
              <circle cx="32" cy="30" r="8" fill="url(#neonLime)" />
              <path
                d="M29 30H35M35 30L32 27M35 30L32 33"
                stroke="#064e3b"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="32" cy="51" r="1.5" fill="#94a3b8" />
            </g>
          )}

          {type === 'shield' && (
            <g filter="url(#fintechGlow)">
              <path
                d="M32 10L48 16V29C48 40.5 41.2 50 32 54C22.8 50 16 40.5 16 29V16L32 10Z"
                fill={isDark ? 'url(#metallicSlate)' : 'url(#sapphireGlass)'}
                stroke={variant === 'neon-lime' ? '#a3e635' : 'rgba(255,255,255,0.8)'}
                strokeWidth="1.5"
              />
              <path
                d="M32 23V35M28 27L32 23L36 27"
                stroke={variant === 'neon-lime' ? '#a3e635' : '#ffffff'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="32" cy="41" r="2" fill={variant === 'neon-lime' ? '#a3e635' : '#ffffff'} />
            </g>
          )}
        </svg>
      </div>

      {(label || sublabel) && (
        <div className="flex flex-col">
          {label && (
            <span
              className={cn(
                'text-sm font-semibold leading-tight',
                isDark ? 'text-white' : 'text-slate-900'
              )}
            >
              {label}
            </span>
          )}
          {sublabel && (
            <span
              className={cn(
                'text-xs font-medium',
                variant === 'neon-lime'
                  ? 'text-lime-400'
                  : isDark
                  ? 'text-sky-300'
                  : 'text-blue-700'
              )}
            >
              {sublabel}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
