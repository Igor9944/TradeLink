import Image from 'next/image'
import Link from 'next/link'

interface LogoProps {
  variant?: 'full' | 'icon'
  className?: string
  href?: string
  width?: number
  height?: number
}

export function Logo({ 
  variant = 'full', 
  className = '', 
  href = '/',
  width = 180,
  height = 60
}: LogoProps) {
  const content = variant === 'full' ? (
    <Image
      src="/logo-wordmark.png"
      alt="TradeLink"
      width={width}
      height={height}
      sizes={`${width}px`}
      className={`object-contain ${className}`}
      priority
    />
  ) : (
    <Image
      src="/logo.png"
      alt="TradeLink"
      width={40}
      height={40}
      className={className}
      priority
    />
  )

  return href ? (
    <Link href={href} className="inline-block">
      {content}
    </Link>
  ) : (
    content
  )
}
