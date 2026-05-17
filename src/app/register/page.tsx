'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MOROCCAN_CITIES } from '@/types'

type Role = 'client' | 'pro'

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'
  const defaultRole = (searchParams.get('role') as Role) || 'client'

  const [role, setRole] = useState<Role>(defaultRole)
  const [form, setForm] = useState({ full_name: '', email: '', password: '', city: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function update(k: string, v: string) { setForm(p => ({ ...p, [k]: v })) }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (form.password.length < 6) { setError('Mot de passe trop court (6 caractères minimum)'); return }
    setLoading(true)
    setError('')
    const supabase = createClient()

    const { data, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.full_name, role } },
    })
    if (authError) { setError(authError.message); setLoading(false); return }

    // Update extra fields
    if (data.user) {
      await supabase.from('users').update({ phone: form.phone, city: form.city })
        .eq('auth_id', data.user.id)

      // Create pro profile if needed
      if (role === 'pro') {
        const { data: u } = await supabase.from('users').select('id').eq('auth_id', data.user.id).single()
        if (u) await supabase.from('pros').insert({ user_id: u.id, categories: [], cities: form.city ? [form.city] : [] })
      }
    }

    if (role === 'pro') router.push('/dashboard-pro')
    else router.push(redirect)
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: '10%', left: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,82,122,0.09) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '5%', right: '5%', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,150,60,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 460, position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <Link href="/" style={{
            fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontStyle: 'italic', fontWeight: 700,
            background: 'linear-gradient(135deg, var(--faby-rose), var(--faby-gold))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>Faby</Link>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8 }}>Créez votre compte</p>
        </div>

        {/* Role switcher */}
        <div style={{
          display: 'flex', background: 'var(--surface-2)',
          borderRadius: 'var(--r-pill)', padding: 4, marginBottom: 24,
          border: '1px solid var(--border)',
        }}>
          {(['client', 'pro'] as Role[]).map(r => (
            <button key={r} onClick={() => setRole(r)} style={{
              flex: 1, padding: '10px', borderRadius: 'var(--r-pill)',
              background: role === r ? 'var(--faby-rose)' : 'transparent',
              color: role === r ? '#fff' : 'var(--text-muted)',
              fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer',
              transition: 'all var(--t-fast)',
              fontFamily: 'var(--font-body)',
            }}>
              {r === 'client' ? '🌸 Je cherche une pro' : '✦ Je suis prestataire'}
            </button>
          ))}
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--r-xl)', padding: '32px',
          boxShadow: 'var(--shadow-md)',
        }}>
          {role === 'pro' && (
            <div style={{
              background: 'var(--faby-rose-light)', border: '1px solid var(--faby-rose-border)',
              borderRadius: 'var(--r-md)', padding: '12px 16px', marginBottom: 24,
              fontSize: 13, color: 'var(--faby-rose)',
            }}>
              ✦ Inscription gratuite — 8% de commission sur chaque réservation uniquement
            </div>
          )}

          <form onSubmit={handleRegister}>
            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 'var(--r-md)', padding: '10px 14px',
                fontSize: 13, color: 'var(--error)', marginBottom: 20,
              }}>{error}</div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Nom complet</label>
                <input value={form.full_name} onChange={e => update('full_name', e.target.value)}
                  className="input" placeholder="Fatima Zahra Benali" required />
              </div>

              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Email</label>
                <input type="email" value={form.email} onChange={e => update('email', e.target.value)}
                  className="input" placeholder="vous@exemple.com" required />
              </div>

              <div>
                <label style={labelStyle}>Téléphone</label>
                <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)}
                  className="input" placeholder="+212 6XX XXX XXX" />
              </div>

              <div>
                <label style={labelStyle}>Ville</label>
                <select value={form.city} onChange={e => update('city', e.target.value)}
                  className="input">
                  <option value="">Choisir...</option>
                  {MOROCCAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Mot de passe</label>
                <input type="password" value={form.password} onChange={e => update('password', e.target.value)}
                  className="input" placeholder="6 caractères minimum" required />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
              {loading ? 'Création...' : role === 'pro' ? 'Créer mon profil pro' : 'Créer mon compte'}
            </button>

            <p style={{ fontSize: 11, color: 'var(--text-faint)', textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
              En vous inscrivant, vous acceptez nos{' '}
              <a href="#" style={{ color: 'var(--faby-rose)' }}>CGU</a>{' '}
              et notre{' '}
              <a href="#" style={{ color: 'var(--faby-rose)' }}>politique de confidentialité</a>.
            </p>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: 20 }}>
            Déjà un compte ?{' '}
            <Link href={`/login?redirect=${redirect}`} style={{ color: 'var(--faby-rose)', fontWeight: 600 }}>
              Se connecter
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