'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/types'

export default function Navbar() {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user: authUser } }) => {
      if (!authUser) return
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authUser.id)
        .single()
      if (data) setUser(data)
    })
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    window.location.href = '/'
  }

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      height: 'var(--nav-h)', zIndex: 100,
      background: scrolled ? 'rgba(12,10,15,0.92)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
      transition: 'all 0.3s ease',
    }}>
      <div className="container" style={{
        height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.7rem',
            fontStyle: 'italic',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #E8527A 0%, #C9963C 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.02em',
          }}>
            Faby
          </div>
          <span style={{
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--text-faint)',
            marginTop: 4,
          }}>Maroc</span>
        </Link>

        {/* Nav links - desktop */}
        <div style={{
          display: 'flex', gap: 32, alignItems: 'center',
        }} className="nav-links-desktop">
          {[
            { href: '/pros', label: 'Nos pros' },
            { href: '/pros?category=coiffure', label: 'Coiffure' },
            { href: '/pros?category=esthetique', label: 'Esthétique' },
            { href: '/pros?category=massage', label: 'Massage' },
          ].map(({ href, label }) => (
            <Link key={href} href={href} style={{
              fontSize: '14px',
              fontWeight: 500,
              color: pathname === href ? 'var(--faby-rose)' : 'var(--text-muted)',
              transition: 'color var(--t-fast)',
            }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
              onMouseLeave={e => (e.currentTarget.style.color = pathname === href ? 'var(--faby-rose)' : 'var(--text-muted)')}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user ? (
            <>
              <Link
                href={user.role === 'pro' ? '/dashboard-pro' : '/dashboard-client'}
                className="btn btn-ghost btn-sm"
              >
                {user.full_name.split(' ')[0]}
              </Link>
              <button onClick={handleLogout} className="btn btn-ghost btn-sm">
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost btn-sm">
                Connexion
              </Link>
              <Link href="/register" className="btn btn-primary btn-sm">
                Rejoindre
              </Link>
            </>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .nav-links-desktop { display: none !important; }
        }
      `}</style>
    </nav>
  )
}
