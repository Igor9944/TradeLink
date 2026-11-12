import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <div className="fixed end-4 top-4 z-50">
        <LanguageSwitcher />
      </div>
      {children}
    </>
  )
}
