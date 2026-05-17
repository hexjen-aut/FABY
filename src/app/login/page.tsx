'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) { setError('Email ou mot de passe incorrect'); setLoading(false); return }

    // Check role for redirect
    const { data: user } = await supabase.from('users').select('role').eq('auth_id', data.user.id).single()
    if (user?.role === 'pro') router.push('/dashboard-pro')
    else if (user?.role === 'admin') router.push('/admin')
    else router.push(redirect)
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, position: 'relative', overflow: 'hidden',
    }}>
      {/* Orbs */}
      <div style={{ position: 'absolute', top: '10%', right: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,82,122,0.10) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', left: '5%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,150,60,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Link href="/" style={{
            fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontStyle: 'italic', fontWeight: 700,
            background: 'linear-gradient(135deg, var(--faby-rose), var(--faby-gold))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>Faby</Link>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8 }}>Bon retour parmi nous</p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--r-xl)', padding: '36px 32px',
          boxShadow: 'var(--shadow-md)',
        }}>
          <form onSubmit={handleLogin}>
            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 'var(--r-md)', padding: '10px 14px',
                fontSize: 13, color: 'var(--error)', marginBottom: 20,
              }}>{error}</div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="input" placeholder="vous@exemple.com" required />
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={labelStyle}>Mot de passe</label>
                <a href="#" style={{ fontSize: 12, color: 'var(--faby-rose)' }}>Oublié ?</a>
              </div>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="input" placeholder="••••••••" required />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}
              style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-muted)' }}>
            Pas encore de compte ?{' '}
            <Link href={`/register?redirect=${redirect}`} style={{ color: 'var(--faby-rose)', fontWeight: 600 }}>
              S&apos;inscrire
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600,
  color: 'var(--text-muted)', marginBottom: 6,
  letterSpacing: '0.05em', textTransform: 'uppercase',
}