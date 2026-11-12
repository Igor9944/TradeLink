'use client'

import { useState, useRef, useEffect } from 'react'

// ===== MOTION HELPERS =====
function useInView(threshold = 0.1, rootMargin = '0px 0px -50px 0px') {
  const ref = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    if (!ref.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold, rootMargin }
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [threshold, rootMargin])

  return { ref, inView }
}

function Reveal({ children, className = '', delay = 0, tag = 'div' }: { children: React.ReactNode; className?: string; delay?: number; tag?: 'div' | 'header' | 'article' }) {
  const { ref, inView } = useInView(0.05)
  const Tag = tag
  return (
    <Tag
      ref={(element: HTMLElement | null) => {
        ref.current = element
      }}
      className={`reveal ${inView ? 'is-in' : ''} ${className}`}
      style={{ '--delay': `${delay}ms`, '--i': 0 } as React.CSSProperties}
      data-reveal
    >
      {children}
    </Tag>
  )
}

const years = [2023, 2024, 2025, 2026]
const statsData: Record<number, { revenue: string; orders: string; countries: string; ontime: string }> = {
  2023: { revenue: '12.4M', orders: '1,240', countries: '8', ontime: '98.2%' },
  2024: { revenue: '28.7M', orders: '2,890', countries: '10', ontime: '99.1%' },
  2025: { revenue: '52.3M', orders: '4,560', countries: '11', ontime: '99.5%' },
  2026: { revenue: '89.6M', orders: '7,240', countries: '12', ontime: '99.8%' },
}

const statConfigs = [
  { key: 'revenue', label: 'Revenus TND', detail: 'Volume facturé cumulé', accent: 'var(--accent)' },
  { key: 'orders', label: 'Commandes', detail: 'Traitées sans erreur', accent: 'var(--success)' },
  { key: 'countries', label: 'Pays couverts', detail: 'Tunisie, CI, France, Sénégal…', accent: 'var(--warning)' },
  { key: 'ontime', label: 'Livraisons à l\'heure', detail: 'Jalon GPS + preuve signée', accent: 'var(--success)' },
]

export function Stats() {
  const [year, setYear] = useState(2026)
  const current = statsData[year]

  return (
    <>
      <style jsx>{`
        .stats-section {
          padding: var(--section-gap) var(--page-margin);
          background: var(--bg);
        }
        .section-header {
          max-width: 640px;
          margin-bottom: 48px;
        }
        .section-heading {
          font-family: var(--font-display);
          font-weight: 300;
          font-size: clamp(24px, 2.8vw, 36px);
          line-height: 1.05;
          letter-spacing: var(--display-tracking);
          color: var(--ink);
          margin: 0 0 16px;
        }
        .section-lead {
          font-family: var(--font-text);
          font-size: var(--step-body);
          line-height: var(--text-leading);
          color: var(--muted);
          max-width: 46ch;
        }

        /* Slider for year selection */
        .stats-slider {
          max-width: 600px;
          margin: 0 auto 64px;
        }
        .slider-track {
          position: relative;
          height: 8px;
          background: var(--rule);
          border-radius: 4px;
          margin: 24px 0;
        }
        .slider-fill {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: var(--accent);
          border-radius: 4px;
          transition: width var(--motion-duration-base) var(--motion-ease);
        }
        .slider-thumbs {
          display: flex;
          justify-content: space-between;
          position: relative;
          height: 44px;
          margin-top: -22px;
        }
        .slider-thumb {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: var(--surface);
          border: 2px solid var(--rule);
          font-family: var(--font-mono);
          font-size: 13px;
          font-weight: 600;
          color: var(--muted);
          cursor: pointer;
          transition: all var(--motion-duration-base) var(--motion-ease);
          z-index: 1;
        }
        .slider-thumb:hover { border-color: var(--accent); color: var(--accent); }
        .slider-thumb.active { background: var(--accent); border-color: var(--accent); color: var(--accent-ink); box-shadow: 0 0 0 4px var(--accent-bg); }
        .slider-thumb:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

        /* Stats grid - full width bars on desktop, horizontal bars on mobile */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          max-width: var(--content-max);
          margin: 0 auto;
        }
        @media (min-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        /* Desktop: vertical bars standing on bottom edge */
        @media (min-width: 1024px) {
          .stats-grid {
            height: 90svh;
            align-items: end;
          }
          .stat-tile {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-end;
            padding: 0 16px 32px;
            background: transparent;
            border: none;
          }
          .stat-bar {
            width: 100%;
            background: var(--muted);
            border-radius: 4px 4px 0 0;
            transition: height var(--motion-duration-slow) var(--motion-ease);
            min-height: 4px;
          }
          .stat-bar.accent { background: var(--accent); }
          .stat-figure {
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            margin-bottom: 12px;
            font-family: var(--font-display);
            font-weight: 300;
            font-size: clamp(28px, 3vw, 44px);
            line-height: 1.1;
            letter-spacing: var(--display-tracking);
            color: var(--ink);
            white-space: nowrap;
          }
          .stat-label {
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            margin-bottom: 8px;
            font-family: var(--font-text);
            font-size: 14px;
            font-weight: 500;
            color: var(--muted);
            white-space: nowrap;
          }
          .stat-detail {
            display: none;
          }
          /* Accent bar gets the figure on top */
          .stat-tile.accent-tile .stat-figure { color: var(--accent); }
        }

        /* Mobile/Tablet: horizontal bars growing from left */
        @media (max-width: 1023px) {
          .stats-grid {
            height: auto;
            align-items: stretch;
          }
          .stat-tile {
            background: var(--surface);
            border: 1px solid var(--rule);
            border-radius: var(--radius-card);
            padding: 20px;
            display: flex;
            flex-direction: column;
            position: relative;
            overflow: hidden;
            animation: stat-in 600ms var(--motion-ease) forwards;
            animation-delay: var(--delay);
            opacity: 0;
          }
          @keyframes stat-in {
            to { opacity: 1; transform: none; }
          }
          .stat-tile::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: var(--accent-color);
            transform: scaleX(0);
            transform-origin: left;
            animation: bar-in 800ms var(--motion-ease) forwards;
            animation-delay: calc(var(--delay) + 200ms);
          }
          @keyframes bar-in {
            to { transform: scaleX(1); }
          }
          .stat-bar {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: var(--accent-color);
          }
          .stat-figure {
            font-family: var(--font-display);
            font-weight: 300;
            font-size: clamp(32px, 4vw, 48px);
            line-height: 1.1;
            letter-spacing: var(--display-tracking);
            color: var(--ink);
            margin-bottom: 4px;
          }
          .stat-label {
            font-family: var(--font-text);
            font-size: 14px;
            font-weight: 500;
            color: var(--ink);
            margin-bottom: 4px;
          }
          .stat-detail {
            font-size: 12px;
            line-height: 1.4;
            color: var(--muted);
          }
        }

        /* Reveal Animation */
        .reveal { opacity: 1; transform: none; }
        .js .reveal { opacity: 0; transform: translateY(24px); transition: opacity 700ms var(--motion-ease), transform 900ms var(--motion-ease); transition-delay: var(--delay, 0ms); }
        .js .reveal.is-in { opacity: 1; transform: none; }

        @media (prefers-reduced-motion: reduce) {
          .js .reveal { animation: none !important; opacity: 1 !important; transform: none !important; transition: none !important; }
          .stat-tile { animation: none !important; opacity: 1 !important; }
          .stat-tile::before { animation: none !important; transform: scaleX(1) !important; }
          .stat-bar { transition: none !important; }
        }
      `}</style>

      <section className="stats-section" aria-labelledby="stats-heading">
        <div className="page-frame">
          <Reveal tag="header" className="section-header" delay={0}>
            <h2 id="stats-heading" className="section-heading">Résultats</h2>
            <p className="section-lead">Chiffres qui grandissent chaque année, mesurés sur la plateforme.</p>
          </Reveal>

          {/* Year slider */}
          <Reveal className="stats-slider" delay={100}>
            <div className="slider-track" role="slider" aria-label="Année" aria-valuemin={2023} aria-valuemax={2026} aria-valuenow={year} tabIndex={0}
              onKeyDown={(e) => {
                const idx = years.indexOf(year)
                if (e.key === 'ArrowRight' && idx < years.length - 1) setYear(years[idx + 1])
                if (e.key === 'ArrowLeft' && idx > 0) setYear(years[idx - 1])
              }}
            >
              <div className="slider-fill" style={{ width: `${((years.indexOf(year)) / (years.length - 1)) * 100}%` }} />
              {years.map((y, i) => (
                <button
                  key={y}
                  className={`slider-thumb ${y === year ? 'active' : ''}`}
                  onClick={() => setYear(y)}
                  aria-label={y.toString()}
                  aria-pressed={y === year}
                >
                  {y}
                </button>
              ))}
            </div>
          </Reveal>

          {/* Stats grid */}
          <Reveal className="stats-grid" delay={200}>
            {statConfigs.map((config, i) => {
              const value = current[config.key as keyof typeof current]
              const isAccent = config.key === 'revenue'
              return (
                <article
                  key={config.key}
                  className={`stat-tile ${isAccent ? 'accent-tile' : ''}`}
                  style={{ '--accent-color': config.accent, '--delay': `${i * 80}ms` } as React.CSSProperties}
                >
                  <div className="stat-bar" style={{ backgroundColor: isAccent ? 'var(--accent)' : config.accent }} />
                  <div className="stat-figure text-tabular" style={{ color: isAccent ? 'var(--accent)' : config.accent }}>{value}</div>
                  <div className="stat-label">{config.label}</div>
                  <div className="stat-detail">{config.detail}</div>
                </article>
              )
            })}
          </Reveal>
        </div>
      </section>
    </>
  )
}