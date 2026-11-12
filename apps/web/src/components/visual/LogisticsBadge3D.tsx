import React from 'react'
import { cn } from '@/lib/utils'

export type LogisticsBadgeType =
  | 'truck'
  | 'fleet'
  | 'container'
  | 'parcel'
  | 'delivery'
  | 'warehouse'
  | 'tracking'
  | 'customs'

interface LogisticsBadge3DProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  type?: LogisticsBadgeType
  label?: string
  sublabel?: string
  interactive?: boolean
}

/**
 * LogisticsBadge3D
 * Inspired by Reference Image 1:
 * Tactile 3D supply-chain and freight elements in vibrant emerald green (#10b981),
 * warm cardboard/amber (#d97706), glossy specular highlights, and isometric depth.
 */
export function LogisticsBadge3D({
  className,
  size = 'md',
  type = 'truck',
  label,
  sublabel,
  interactive = false,
}: LogisticsBadge3DProps) {
  const sizeMap = {
    sm: { box: 'w-10 h-10', svg: 40 },
    md: { box: 'w-14 h-14', svg: 56 },
    lg: { box: 'w-20 h-20', svg: 80 },
    xl: { box: 'w-28 h-28', svg: 112 },
  }

  const { box, svg } = sizeMap[size]

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
          'relative flex items-center justify-center rounded-2xl p-1',
          'bg-gradient-to-b from-white/90 via-emerald-50/50 to-emerald-100/40',
          'border border-emerald-300/40 shadow-[0_8px_20px_-6px_rgba(16,185,129,0.3)]',
          'backdrop-blur-md',
          box
        )}
      >
        <svg
          width={svg}
          height={svg}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_4px_6px_rgba(5,150,105,0.25)]"
        >
          <defs>
            <linearGradient id="emeraldBody" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="60%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>

            <linearGradient id="craftBox" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="50%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#92400e" />
            </linearGradient>

            <linearGradient id="glassRoof" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#a7f3d0" stopOpacity="0.3" />
            </linearGradient>

            <filter id="badgeShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="3" stdDeviation="2" floodColor="#047857" floodOpacity="0.3" />
            </filter>
          </defs>

          {(type === 'truck' || type === 'fleet') && (
            <g filter="url(#badgeShadow)">
              {/* Truck Cargo Body (Isometric Emerald Box) */}
              <path
                d="M12 28L32 17L52 28L32 39L12 28Z"
                fill="url(#glassRoof)"
                stroke="#6ee7b7"
                strokeWidth="1.2"
              />
              <path
                d="M12 28L32 39V52L12 41V28Z"
                fill="url(#emeraldBody)"
              />
              <path
                d="M52 28L32 39V52L52 41V28Z"
                fill="#059669"
              />
              {/* Highlight Ridge */}
              <path
                d="M32 17V39"
                stroke="rgba(255,255,255,0.7)"
                strokeWidth="1.2"
              />
              {/* Front Cabin Accent (Warm Cardboard / Craft Accent) */}
              <path
                d="M32 42L46 34.5V41L32 48.5V42Z"
                fill="url(#craftBox)"
              />
              {/* Mini Wheels / Status Disc */}
              <circle cx="22" cy="46" r="3.5" fill="#064e3b" stroke="#34d399" strokeWidth="1" />
              <circle cx="42" cy="46" r="3.5" fill="#064e3b" stroke="#34d399" strokeWidth="1" />
            </g>
          )}

          {type === 'container' && (
            <g filter="url(#badgeShadow)">
              {/* Shipping Container Top */}
              <path
                d="M14 24L32 14L50 24L32 34L14 24Z"
                fill="url(#glassRoof)"
                stroke="#a7f3d0"
                strokeWidth="1.2"
              />
              {/* Shipping Container Left Face with corrugated lines */}
              <path
                d="M14 24L32 34V49L14 39V24Z"
                fill="url(#emeraldBody)"
              />
              <path d="M19 28V41.5M24 31V44.5M28 33V47" stroke="#047857" strokeWidth="1.2" strokeLinecap="round" />
              {/* Shipping Container Right Face */}
              <path
                d="M50 24L32 34V49L50 39V24Z"
                fill="#047857"
              />
              <path d="M37 34V47M41 32V45M45 29V42" stroke="#064e3b" strokeWidth="1.2" strokeLinecap="round" />
            </g>
          )}

          {(type === 'parcel' || type === 'delivery') && (
            <g filter="url(#badgeShadow)">
              {/* Warm 3D Craft Parcel */}
              <path
                d="M16 26L32 17L48 26L32 35L16 26Z"
                fill="#fde68a"
                stroke="#f59e0b"
                strokeWidth="1"
              />
              <path
                d="M16 26L32 35V49L16 40V26Z"
                fill="url(#craftBox)"
              />
              <path
                d="M48 26L32 35V49L48 40V26Z"
                fill="#b45309"
              />
              {/* Emerald Security Seal Tape across package */}
              <path
                d="M28 19L36 24V47L28 42V19Z"
                fill="#10b981"
                opacity="0.85"
              />
              <circle cx="32" cy="35" r="2.5" fill="#ffffff" />
            </g>
          )}

          {type === 'warehouse' && (
            <g filter="url(#badgeShadow)">
              <path
                d="M12 28L32 16L52 28L32 40L12 28Z"
                fill="url(#glassRoof)"
                stroke="#34d399"
                strokeWidth="1"
              />
              <path
                d="M12 28L32 40V52L12 40V28Z"
                fill="url(#emeraldBody)"
              />
              <path
                d="M52 28L32 40V52L52 40V28Z"
                fill="#065f46"
              />
              {/* Gantry / Shelving door */}
              <path
                d="M26 38L38 31V45L26 52V38Z"
                fill="#064e3b"
                stroke="#a7f3d0"
                strokeWidth="1"
              />
            </g>
          )}
        </svg>
      </div>

      {(label || sublabel) && (
        <div className="flex flex-col">
          {label && (
            <span className="text-sm font-semibold text-slate-900 leading-tight">
              {label}
            </span>
          )}
          {sublabel && (
            <span className="text-xs text-emerald-700 font-medium">
              {sublabel}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
