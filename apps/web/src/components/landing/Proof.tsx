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

function Reveal({ children, className = '', delay = 0, tag = 'div', role }: { children: React.ReactNode; className?: string; delay?: number; tag?: 'div' | 'header' | 'article'; role?: React.AriaRole }) {
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
      role={role}
    >
      {children}
    </Tag>
  )
}

const partners = [
  { name: 'CinetPay', type: 'Paiement Mobile Money', color: '#1a1a2e', textColor: '#c9a45a' },
  { name: 'Stripe', type: 'Cartes & Virements', color: '#635bff', textColor: '#ffffff' },
  { name: 'MSC', type: 'Fret Maritime', color: '#003366', textColor: '#ffffff' },
  { name: 'DHL', type: 'Express International', color: '#d40511', textColor: '#ffffff' },
  { name: 'Orange Money', type: 'Mobile Money CI', color: '#ff7900', textColor: '#ffffff' },
  { name: 'Wave', type: 'Mobile Money SN', color: '#00d4aa', textColor: '#000000' },
]

function PartnerLogo({ name, color, textColor }: { name: string; color: string; textColor: string }) {
  return (
    <svg viewBox="0 0 120 40" fill="none" className="w-full h-full" style={{ background: color }} role="img" aria-label={name}>
      <text x="60" y="28" textAnchor="middle" fontFamily="system-ui" fontSize="16" fontWeight="700" fill={textColor} letterSpacing="-0.5px">{name}</text>
    </svg>
  )
}

export function Proof() {
  return (
    <>
      <style jsx>{`
        .proof-section {
          padding: var(--section-gap) var(--page-margin);
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

        /* Board of filled tiles - 4 across, 2 rows, 8px gaps */
        .proof-board {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          max-width: var(--content-max);
          margin: 0 auto;
        }
        @media (min-width: 640px) {
          .proof-board {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (min-width: 1024px) {
          .proof-board {
            grid-template-columns: repeat(6, 1fr);
          }
        }

        .proof-tile {
          aspect-ratio: 3 / 2;
          background: var(--surface);
          border-radius: var(--radius-card);
          padding: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          transition: none;
        }
        .proof-tile.heading-tile {
          grid-column: span 2;
          background: var(--accent);
          color: var(--accent-ink);
        }
        @media (min-width: 640px) {
          .proof-tile.heading-tile {
            grid-column: span 3;
          }
        }
        @media (min-width: 1024px) {
          .proof-tile.heading-tile {
            grid-column: span 2;
          }
        }

        .proof-tile-content {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .proof-logo-wrapper {
          width: 100px;
          height: 40px;
          border-radius: var(--radius-control);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
        }
        @media (max-width: 639px) {
          .proof-logo-wrapper {
            width: 80px;
            height: 32px;
          }
        }
        .proof-name {
          font-size: clamp(14px, 2vw, 18px);
          font-weight: 600;
          margin: 0;
        }
        .proof-type {
          font-size: clamp(11px, 1.5vw, 13px);
          opacity: 0.8;
          margin: 0;
        }
        .heading-text {
          font-family: var(--font-display);
          font-weight: 300;
          font-size: clamp(20px, 3vw, 32px);
          line-height: 1.1;
          letter-spacing: var(--display-tracking);
          margin: 0;
          max-width: 80%;
        }

        /* Reveal Animation */
        .reveal { opacity: 1; transform: none; }
        .js .reveal { opacity: 0; transform: translateY(24px); transition: opacity 700ms var(--motion-ease), transform 900ms var(--motion-ease); transition-delay: var(--delay, 0ms); }
        .js .reveal.is-in { opacity: 1; transform: none; }

        @media (prefers-reduced-motion: reduce) {
          .js .reveal { animation: none !important; opacity: 1 !important; transform: none !important; transition: none !important; }
        }
      `}</style>

      <section className="proof-section" aria-labelledby="proof-heading">
        <div className="page-frame">
          <Reveal tag="header" className="section-header" delay={0}>
            <h2 id="proof-heading" className="section-heading">Preuve</h2>
            <p className="section-lead">Intégré aux réseaux qui comptent pour le commerce Afrique-Europe.</p>
          </Reveal>

          <div className="proof-board" role="list">
            <Reveal className="proof-tile heading-tile" delay={100} tag="article" role="listitem">
              <div className="proof-tile-content">
                <h3 className="heading-text">Intégré aux réseaux qui comptent</h3>
              </div>
            </Reveal>

            {partners.map((partner, i) => (
              <Reveal key={partner.name} className="proof-tile" delay={180 + i * 60} tag="article" role="listitem">
                <div className="proof-tile-content">
                  <div className="proof-logo-wrapper">
                    <PartnerLogo name={partner.name} color={partner.color} textColor={partner.textColor} />
                  </div>
                  <p className="proof-name">{partner.name}</p>
                  <p className="proof-type">{partner.type}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}