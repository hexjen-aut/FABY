'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Tab = 'overview' | 'bookings' | 'favoris' | 'profil'

export default function DashboardClient() {
  const [tab, setTab] = useState<Tab>('overview')
  const [user, setUser] = useState<any>(null)
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [profileForm, setProfileForm] = useState({ full_name: '', phone: '', city: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const supabase = createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) { window.location.href = '/login'; return }

    const { data: userData } = await supabase.from('users').select('*').eq('auth_id', authUser.id).single()
    setUser(userData)
    setProfileForm({ full_name: userData?.full_name || '', phone: userData?.phone || '', city: userData?.city || '' })

    const { data: bkgs } = await supabase
      .from('bookings')
      .select('*, pro:pros(id, user:users(full_name, avatar_url)), service:services(name, category, price, duration_min)')
      .eq('client_id', userData?.id)
      .order('booked_at', { ascending: false })
    setBookings(bkgs || [])
    setLoading(false)
  }

  async function saveProfile() {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('users').update(profileForm).eq('id', user.id)
    setUser({ ...user, ...profileForm })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const upcoming = bookings.filter(b => ['pending', 'confirmed'].includes(b.status))
  const past = bookings.filter(b => ['completed', 'cancelled'].includes(b.status))
  const totalSpent = bookings.filter(b => b.payment_status === 'paid').reduce((s, b) => s + b.total_price, 0)

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontStyle: 'italic', color: 'var(--faby-rose)' }}>Faby</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex' }}>

      {/* SIDEBAR */}
      <aside style={{
        width: 240, flexShrink: 0,
        background: 'var(--surface)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
      }}>
        <div style={{ padding: '28px 20px 16px' }}>
          <Link href="/" style={{
            fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontStyle: 'italic', fontWeight: 700,
            background: 'linear-gradient(135deg, var(--faby-rose), var(--faby-gold))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>Faby</Link>
          <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Mon espace</div>
        </div>

        {/* Avatar */}
        {user && (
          <div style={{ padding: '0 20px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, var(--faby-rose), var(--faby-gold))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 700, color: '#fff',
              }}>
                {user.full_name?.[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{user.full_name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{user.city || 'Maroc'}</div>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px' }}>
          {([
            { id: 'overview',  label: 'Vue d\'ensemble', icon: '◈' },
            { id: 'bookings',  label: 'Mes réservations', icon: '◉' },
            { id: 'favoris',   label: 'Mes favoris',      icon: '♡' },
            { id: 'profil',    label: 'Mon profil',       icon: '◎' },
          ] as { id: Tab; label: string; icon: string }[]).map(({ id, label, icon }) => (
            <button key={id} onClick={() => setTab(id)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 'var(--r-md)', marginBottom: 2,
              background: tab === id ? 'var(--faby-rose-light)' : 'transparent',
              color: tab === id ? 'var(--faby-rose)' : 'var(--text-muted)',
              fontWeight: tab === id ? 600 : 400, fontSize: 13,
              border: 'none', cursor: 'pointer', textAlign: 'left',
              transition: 'all var(--t-fast)', fontFamily: 'var(--font-body)',
            }}>
              <span style={{ fontSize: 14, width: 18, textAlign: 'center' }}>{icon}</span>
              {label}
              {id === 'bookings' && upcoming.length > 0 && (
                <span style={{ marginLeft: 'auto', background: 'var(--faby-rose)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 99 }}>{upcoming.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ padding: '12px 20px 24px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Link href="/pros" style={{ fontSize: 12, color: 'var(--faby-rose)', fontWeight: 600 }}>+ Nouvelle réservation</Link>
          <button onClick={handleLogout} style={{ fontSize: 12, color: 'var(--text-faint)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)', padding: 0 }}>
            Déconnexion
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div>
            <div style={{ marginBottom: 32 }}>
              <p className="section-label">Tableau de bord</p>
              <h2>Bonjour, {user?.full_name?.split(' ')[0]} 🌸</h2>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
              {[
                { label: 'Réservations', value: bookings.length, color: 'var(--faby-rose)' },
                { label: 'À venir', value: upcoming.length, color: 'var(--warning)' },
                { label: 'Terminées', value: past.filter(b => b.status === 'completed').length, color: 'var(--success)' },
                { label: 'Total dépensé', value: `${totalSpent} MAD`, color: 'var(--faby-gold)' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 24 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Upcoming */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 24, marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: '1rem' }}>Prochaines réservations</h3>
                <button onClick={() => setTab('bookings')} style={{ fontSize: 12, color: 'var(--faby-rose)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Voir tout →</button>
              </div>
              {upcoming.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <p style={{ color: 'var(--text-faint)', marginBottom: 16 }}>Aucune réservation à venir</p>
                  <Link href="/pros" className="btn btn-primary btn-sm">Trouver une pro</Link>
                </div>
              ) : upcoming.slice(0, 3).map(b => <BookingRow key={b.id} b={b} />)}
            </div>

            {/* CTA */}
            <div style={{
              background: 'linear-gradient(135deg, var(--faby-rose-light), var(--faby-gold-light))',
              border: '1px solid var(--faby-rose-border)', borderRadius: 'var(--r-lg)',
              padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16,
            }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, marginBottom: 4 }}>Réservez dès maintenant</div>
                <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>500+ professionnelles disponibles au Maroc</p>
              </div>
              <Link href="/pros" className="btn btn-primary">Parcourir les pros</Link>
            </div>
          </div>
        )}

        {/* BOOKINGS */}
        {tab === 'bookings' && (
          <div>
            <div style={{ marginBottom: 32 }}>
              <p className="section-label">Historique</p>
              <h2>Mes réservations</h2>
            </div>

            {upcoming.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-faint)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>À venir</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {upcoming.map(b => <BookingCard key={b.id} b={b} />)}
                </div>
              </div>
            )}

            {past.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-faint)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Passées</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {past.map(b => <BookingCard key={b.id} b={b} />)}
                </div>
              </div>
            )}

            {bookings.length === 0 && (
              <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>◉</div>
                <h3 style={{ marginBottom: 8 }}>Aucune réservation</h3>
                <p style={{ marginBottom: 24 }}>Explorez nos prestataires et réservez votre première séance</p>
                <Link href="/pros" className="btn btn-primary">Trouver une pro</Link>
              </div>
            )}
          </div>
        )}

        {/* FAVORIS */}
        {tab === 'favoris' && (
          <div>
            <div style={{ marginBottom: 32 }}>
              <p className="section-label">Sauvegardées</p>
              <h2>Mes favoris</h2>
            </div>
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>♡</div>
              <h3 style={{ marginBottom: 8 }}>Bientôt disponible</h3>
              <p style={{ marginBottom: 24 }}>Sauvegardez vos prestataires préférées</p>
              <Link href="/pros" className="btn btn-primary">Explorer les pros</Link>
            </div>
          </div>
        )}

        {/* PROFIL */}
        {tab === 'profil' && (
          <div style={{ maxWidth: 520 }}>
            <div style={{ marginBottom: 32 }}>
              <p className="section-label">Paramètres</p>
              <h2>Mon profil</h2>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 28 }}>
              {/* Avatar display */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--faby-rose), var(--faby-gold))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, fontWeight: 700, color: '#fff',
                }}>
                  {user?.full_name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{user?.full_name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{user?.email}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Nom complet</label>
                  <input value={profileForm.full_name} onChange={e => setProfileForm(p => ({ ...p, full_name: e.target.value }))} className="input" />
                </div>
                <div>
                  <label style={labelStyle}>Téléphone</label>
                  <input value={profileForm.phone} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} className="input" placeholder="+212 6XX XXX XXX" />
                </div>
                <div>
                  <label style={labelStyle}>Ville</label>
                  <input value={profileForm.city} onChange={e => setProfileForm(p => ({ ...p, city: e.target.value }))} className="input" placeholder="Casablanca" />
                </div>
              </div>

              <button className="btn btn-primary" onClick={saveProfile} disabled={saving} style={{ marginTop: 24, width: '100%', justifyContent: 'center' }}>
                {saving ? 'Sauvegarde...' : saved ? '✓ Sauvegardé' : 'Sauvegarder'}
              </button>
            </div>

            {/* Danger zone */}
            <div style={{ marginTop: 24, background: 'var(--surface)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--r-lg)', padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--error)', marginBottom: 8 }}>Zone dangereuse</div>
              <p style={{ fontSize: 13, marginBottom: 16 }}>La suppression de votre compte est irréversible.</p>
              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error)', borderColor: 'rgba(239,68,68,0.3)' }}>
                Supprimer mon compte
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function BookingRow({ b }: { b: any }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: 'var(--surface-2)', borderRadius: 'var(--r-md)' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'var(--faby-rose)', flexShrink: 0 }}>
        {b.pro?.user?.full_name?.[0]?.toUpperCase() || '?'}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{b.pro?.user?.full_name}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{b.service?.name} · {new Date(b.booked_at).toLocaleDateString('fr-MA')}</div>
      </div>
      <StatusBadge status={b.status} />
    </div>
  )
}

function BookingCard({ b }: { b: any }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20 }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, var(--faby-rose-light), var(--faby-gold-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: 'var(--faby-rose)', flexShrink: 0 }}>
        {b.pro?.user?.full_name?.[0]?.toUpperCase() || '?'}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600 }}>{b.pro?.user?.full_name}</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{b.service?.name} · {b.location_type === 'home' ? '🏠 Domicile' : '💇 Salon'}</div>
        <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 4 }}>
          {new Date(b.booked_at).toLocaleDateString('fr-MA', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--faby-gold)' }}>{b.total_price} MAD</div>
        <div style={{ marginTop: 6 }}><StatusBadge status={b.status} /></div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    pending:   { label: 'En attente', color: 'var(--warning)',    bg: 'rgba(245,158,11,0.12)' },
    confirmed: { label: 'Confirmée',  color: 'var(--info)',       bg: 'rgba(96,165,250,0.12)' },
    completed: { label: 'Terminée',   color: 'var(--success)',    bg: 'rgba(62,207,142,0.12)' },
    cancelled: { label: 'Annulée',    color: 'var(--text-faint)', bg: 'var(--surface-3)' },
  }
  const s = map[status] || map.pending
  return <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, color: s.color, background: s.bg }}>{s.label}</span>
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600,
  color: 'var(--text-muted)', marginBottom: 6,
  letterSpacing: '0.05em', textTransform: 'uppercase',
}