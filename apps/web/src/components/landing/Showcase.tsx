'use client'

import { useState, useRef, useEffect } from 'react'
import { ArrowRight } from 'lucide-react'

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
      style={{ '--delay': `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </Tag>
  )
}

// ===== LIVE CALCULATION ENGINE FRAGMENT =====
function CalculationEngineFragment({ inputValue, onInputChange }: { inputValue: string; onInputChange: (value: string) => void }) {
  // Parse input: format "amount currency fromCountry toCountry"
  // Example: "10000 EUR FR MA"
  const parseInput = (input: string) => {
    const parts = input.trim().split(/\s+/)
    if (parts.length < 4) return null
    const amount = parseFloat(parts[0])
    const fromCurrency = parts[1].toUpperCase()
    const fromCountry = parts[2].toUpperCase()
    const toCountry = parts[3].toUpperCase()
    if (isNaN(amount)) return null
    return { amount, fromCurrency, fromCountry, toCountry }
  }

  const parsed = parseInput(inputValue)

  // Mock exchange rates (in reality from calculation engine)
  const rates: Record<string, Record<string, number>> = {
    EUR: { TND: 3.35, XOF: 655.96, USD: 1.08, MAD: 10.8 },
    USD: { TND: 3.10, XOF: 607.50, EUR: 0.93, MAD: 10.0 },
    TND: { EUR: 0.30, USD: 0.32, XOF: 195.8, MAD: 3.22 },
  }

  let result = null
  if (parsed) {
    const targetCurrency =
      { MA: 'MAD', TN: 'TND', SN: 'XOF' }[parsed.toCountry] ?? parsed.toCountry
    const rate = rates[parsed.fromCurrency]?.[targetCurrency]
    if (rate) {
      result = {
        converted: (parsed.amount * rate).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        rate: rate.toFixed(4),
        fee: (parsed.amount * 0.015).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        total: (parsed.amount * rate + parsed.amount * 0.015).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        fromCurrency: parsed.fromCurrency,
        toCurrency: targetCurrency,
      }
    }
  }

  return (
    <div className="live-fragment" data-ui style={{ width: '100%', maxWidth: '520px' }}>
      <div className="fragment-header" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', borderBottom: '1px solid var(--rule)',
        background: 'var(--surface)'
      }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent)' }}>
            <span className="text-[var(--accent-ink)] font-bold text-xs">CE</span>
          </div>
          <span className="text-sm font-medium" style={{ color: 'var(--ink)' }}>Moteur de Calcul</span>
        </div>
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs" style={{ background: 'var(--surface)', color: 'var(--muted)' }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} /> En direct
        </span>
      </div>

      <div className="fragment-content" style={{ padding: '24px' }}>
        {result ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingBottom: '16px', borderBottom: '1px solid var(--rule)' }}>
              <span style={{ fontSize: '14px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Montant converti</span>
              <span style={{ fontSize: '32px', fontWeight: '700', fontFamily: 'var(--font-mono)', color: 'var(--ink)' }}>
                {result.converted} {result.toCurrency}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              <div style={{ padding: '12px', background: 'var(--surface)', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Taux de change</div>
                <div style={{ fontSize: '18px', fontWeight: '600', fontFamily: 'var(--font-mono)', color: 'var(--ink)' }}>1 {result.fromCurrency} = {result.rate} {result.toCurrency}</div>
              </div>
              <div style={{ padding: '12px', background: 'var(--surface)', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Frais (1.5%)</div>
                <div style={{ fontSize: '18px', fontWeight: '600', fontFamily: 'var(--font-mono)', color: 'var(--ink)' }}>
                  {result.fee} {result.fromCurrency}
                </div>
              </div>
              <div style={{ padding: '12px', background: 'var(--surface)', borderRadius: '8px', gridColumn: 'span 2' }}>
                <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Total débité</div>
                <div style={{ fontSize: '22px', fontWeight: '700', fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
                  {result.total} {result.fromCurrency}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '8px', padding: '12px', background: 'rgba(12, 120, 102, 0.1)', borderRadius: '8px', border: '1px solid var(--accent)', fontSize: '12px', color: 'var(--accent)' }}>
              Taux indicatifs · Mise à jour temps réel · Sources: BCE, BEAC, Banques centrales
            </div>
          </div>
        ) : (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            minHeight: '200px', color: 'var(--muted)', textAlign: 'center', gap: '12px'
          }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'var(--surface)', border: '1px solid var(--rule)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--muted)' }}>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <p style={{ fontSize: '16px', fontWeight: '500' }}>Entrez une conversion</p>
            <p style={{ fontSize: '13px', maxWidth: '300px' }}>Format: <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--surface)', padding: '2px 6px', borderRadius: '4px' }}>10000 EUR FR MA</code></p>
          </div>
        )}
      </div>
    </div>
  )
}

// ===== SHOWCASE COMPONENT =====
// Blueprint: Input half, output half (split)
// Two flat fields meet on a vertical edge at 50vw, each 90svh tall, no gap
// Left field (darkest palette tone): editable input region at 20-24px, 34ch wide
// Right field (lightest tone): true-size fragment marked data-ui, 440-520px wide
// Heading split across edge: first words bottom-left on dark, last words bottom-right on light
// clamp(40px, 5vw, 80px) on one baseline 32px from bottom
// Mobile: fields stack, dark above light, each 62svh

export function Showcase() {
  const [inputValue, setInputValue] = useState('10000 EUR FR MA')
  const leftRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)

  // Section entrance animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('section-enter')
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    const leftEl = leftRef.current
    const rightEl = rightRef.current
    if (leftEl) observer.observe(leftEl)
    if (rightEl) observer.observe(rightEl)
    return () => observer.disconnect()
  }, [])

  // Field colours from palette
  const leftFieldBg = 'var(--field-1)'  // Red - darkest
  const leftFieldInk = 'var(--field-1-ink)'  // White
  const rightFieldBg = 'var(--field-4)'  // Yellow - lightest
  const rightFieldInk = 'var(--field-4-ink)'  // Dark

  return (
    <section
      className="relative"
      aria-labelledby="showcase-heading"
      style={{ minHeight: '90svh' }}
    >
      {/* Desktop: side by side split */}
      <div className="hidden lg:flex" style={{ height: '90svh' }}>
        {/* Left field - Input (darkest) */}
        <div
          ref={leftRef}
          className="relative flex-1 flex flex-col"
          style={{
            backgroundColor: leftFieldBg,
            color: leftFieldInk,
            minWidth: 0,
          }}
        >
          <div className="flex-1 flex flex-col justify-center px-[3%] pb-8">
            <label htmlFor="conversion-input" className="sr-only">Conversion à calculer</label>
            <input
              id="conversion-input"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="10000 EUR FR MA"
              className="w-[34ch] max-w-full placeholder:text-white/40"
              style={{
                fontSize: '22px',
                fontFamily: 'var(--font-text)',
                fontWeight: '400',
                lineHeight: '1.5',
                letterSpacing: '0',
                color: leftFieldInk,
                background: 'transparent',
                border: 'none',
                borderBottom: '2px solid currentColor',
                padding: '12px 0',
                outline: 'none',
              }}
              aria-label="Montant, devise origine, pays origine, pays destination"
            />
            <p style={{ marginTop: '16px', fontSize: '13px', opacity: 0.6, maxWidth: '34ch' }}>
              Format: montant devise_origine pays_origine pays_destination · Exemple: 10000 EUR FR MA
            </p>
          </div>

          {/* Heading part 1 - bottom left, 32px from bottom */}
          <h2
            id="showcase-heading"
            className="absolute bottom-[32px] left-[3%] max-w-[40%]"
            style={{
              fontSize: 'clamp(40px, 5vw, 80px)',
              lineHeight: '0.9',
              letterSpacing: '-0.03em',
              fontWeight: '700',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-display)',
              color: leftFieldInk,
              margin: 0,
            }}
          >
            CALCULER
          </h2>
        </div>

        {/* Right field - Output fragment (lightest) */}
        <div
          ref={rightRef}
          className="relative flex-1 flex flex-col"
          style={{
            backgroundColor: rightFieldBg,
            color: rightFieldInk,
            minWidth: '520px',
          }}
        >
          <div className="flex-1 flex items-center justify-center px-8">
            <CalculationEngineFragment inputValue={inputValue} onInputChange={setInputValue} />
          </div>

          {/* Heading part 2 - bottom right, 32px from bottom */}
          <h2
            className="absolute bottom-[32px] right-[3%] max-w-[40%] text-right"
            style={{
              fontSize: 'clamp(40px, 5vw, 80px)',
              lineHeight: '0.9',
              letterSpacing: '-0.03em',
              fontWeight: '700',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-display)',
              color: rightFieldInk,
              margin: 0,
            }}
          >
            LE RÉSULTAT
          </h2>
        </div>
      </div>

      {/* Mobile: stacked */}
      <div className="lg:hidden">
        {/* Dark field - Input */}
        <div
          ref={leftRef}
          className="relative flex flex-col"
          style={{
            backgroundColor: leftFieldBg,
            color: leftFieldInk,
            minHeight: '62svh',
          }}
        >
          <div className="flex-1 flex flex-col justify-center px-5 pb-8">
            <label htmlFor="conversion-input-mobile" className="sr-only">Conversion à calculer</label>
            <input
              id="conversion-input-mobile"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="10000 EUR FR MA"
              className="w-full max-w-[34ch]"
              style={{
                fontSize: '18px',
                fontFamily: 'var(--font-text)',
                fontWeight: '400',
                lineHeight: '1.5',
                letterSpacing: '0',
                color: leftFieldInk,
                background: 'transparent',
                border: 'none',
                borderBottom: '2px solid currentColor',
                padding: '12px 0',
                outline: 'none',
              }}
            />
            <p style={{ marginTop: '12px', fontSize: '12px', opacity: 0.6, maxWidth: '34ch' }}>
              Format: montant devise_origine pays_origine pays_destination
            </p>
          </div>
          <h2
            className="absolute bottom-[24px] left-5 max-w-[80%]"
            style={{
              fontSize: '11vw',
              lineHeight: '0.9',
              letterSpacing: '-0.03em',
              fontWeight: '700',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-display)',
              color: leftFieldInk,
              margin: 0,
            }}
          >
            CALCULER
          </h2>
        </div>

        {/* Light field - Output */}
        <div
          ref={rightRef}
          className="relative flex flex-col"
          style={{
            backgroundColor: rightFieldBg,
            color: rightFieldInk,
            minHeight: '62svh',
          }}
        >
          <div className="flex-1 flex items-center justify-center px-5">
            <CalculationEngineFragment inputValue={inputValue} onInputChange={setInputValue} />
          </div>
          <h2
            className="absolute top-[24px] right-5 max-w-[80%] text-right"
            style={{
              fontSize: '11vw',
              lineHeight: '0.9',
              letterSpacing: '-0.03em',
              fontWeight: '700',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-display)',
              color: rightFieldInk,
              margin: 0,
            }}
          >
            LE RÉSULTAT
          </h2>
        </div>
      </div>
    </section>
  )
}