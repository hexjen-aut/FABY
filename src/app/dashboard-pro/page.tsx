'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { CATEGORY_LABELS, CATEGORY_EMOJI, type ServiceCategory } from '@/types'

const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

type Tab = 'overview' | 'services' | 'availability' | 'portfolio' | 'bookings' | 'boutique'

export default function DashboardPro() {
  const [tab, setTab] = useState<Tab>('overview')
  const [pro, setPro] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [services, setServices] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [portfolios, setPortfolios] = useState<any[]>([])
  const [availability, setAvailability] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Service form
  const [svcForm, setSvcForm] = useState({ name: '', category: 'coiffure', description: '', duration_min: 60, price: '' })
  const [svcLoading, setSvcLoading] = useState(false)

  // Boutique form
  const [boutiqueForm, setBoutiqueForm] = useState({ bio: '', at_home: true, in_salon: false, address: '' })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const supabase = createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) { window.location.href = '/login'; return }

    const { data: userData } = await supabase.from('users').select('*').eq('auth_id', authUser.id).single()
    setUser(userData)

    const { data: proData } = await supabase.from('pros').select('*').eq('user_id', userData?.id).single()
    if (proData) {
      setPro(proData)
      setBoutiqueForm({ bio: proData.bio || '', at_home: proData.at_home, in_salon: proData.in_salon, address: proData.address || '' })

      const [{ data: svcs }, { data: bkgs }, { data: ports }, { data: avail }] = await Promise.all([
        supabase.from('services').select('*').eq('pro_id', proData.id).order('created_at', { ascending: false }),
        supabase.from('bookings').select('*, client:users!bookings_client_id_fkey(full_name,avatar_url), service:services(name,category)').eq('pro_id', proData.id).order('booked_at', { ascending: false }).limit(10),
        supabase.from('portfolios').select('*').eq('pro_id', proData.id).order('created_at', { ascending: false }),
        supabase.from('availability').select('*').eq('pro_id', proData.id),
      ])
      setServices(svcs || [])
      setBookings(bkgs || [])
      setPortfolios(ports || [])
      setAvailability(avail || [])
    }
    setLoading(false)
  }

  async function createProProfile() {
    const supabase = createClient()
    const { data, error } = await supabase.from('pros').insert({ user_id: user.id, categories: [], cities: [], at_home: true, in_salon: false }).select().single()
    if (!error && data) { setPro(data); loadData() }
  }

  async function addService() {
    if (!svcForm.name || !svcForm.price) return
    setSvcLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.from('services').insert({
      pro_id: pro.id, name: svcForm.name, category: svcForm.category,
      description: svcForm.description, duration_min: svcForm.duration_min,
      price: parseFloat(svcForm.price), is_active: true
    }).select().single()
    if (!error && data) {
      setServices(prev => [data, ...prev])
      setSvcForm({ name: '', category: 'coiffure', description: '', duration_min: 60, price: '' })
    }
    setSvcLoading(false)
  }

  async function deleteService(id: string) {
    const supabase = createClient()
    await supabase.from('services').delete().eq('id', id)
    setServices(prev => prev.filter(s => s.id !== id))
  }

  async function toggleAvailability(day: number) {
    const supabase = createClient()
    const existing = availability.find(a => a.day_of_week === day)
    if (existing) {
      await supabase.from('availability').delete().eq('id', existing.id)
      setAvailability(prev => prev.filter(a => a.day_of_week !== day))
    } else {
      const { data } = await supabase.from('availability').insert({ pro_id: pro.id, day_of_week: day, start_time: '09:00', end_time: '18:00' }).select().single()
      if (data) setAvailability(prev => [...prev, data])
    }
  }

  async function saveBoutique() {
    const supabase = createClient()
    await supabase.from('pros').update(boutiqueForm).eq('id', pro.id)
    setPro({ ...pro, ...boutiqueForm })
  }

  async function uploadPortfolio(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !pro) return
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${pro.id}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('portfolios').upload(path, file)
    if (upErr) return
    const { data: { publicUrl } } = supabase.storage.from('portfolios').getPublicUrl(path)
    const { data } = await supabase.from('portfolios').insert({ pro_id: pro.id, image_url: publicUrl }).select().single()
    if (data) setPortfolios(prev => [data, ...prev])
  }

  const totalRevenue = bookings.filter(b => b.payment_status === 'paid').reduce((s, b) => s + (b.total_price - b.commission), 0)
  const pendingCount = bookings.filter(b => b.status === 'pending').length
  const completedCount = bookings.filter(b => b.status === 'completed').length

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontStyle: 'italic', color: 'var(--faby-rose)', marginBottom: 12 }}>Faby</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Chargement...</div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex' }}>

      {/* SIDEBAR */}
      <aside style={{
        width: 240, flexShrink: 0,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh',
        overflowY: 'auto',
      }}>
        <div style={{ padding: '28px 20px 20px' }}>
          <Link href="/" style={{
            fontFamily: 'var(--font-display)', fontSize: '1.6rem',
            fontStyle: 'italic', fontWeight: 700,
            background: 'linear-gradient(135deg, var(--faby-rose), var(--faby-gold))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>Faby</Link>
          <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Espace Pro</div>
        </div>

        {/* Pro avatar */}
        {user && (
          <div style={{ padding: '0 20px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--faby-rose), var(--faby-gold))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0,
              }}>
                {user.full_name?.[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{user.full_name}</div>
                {pro && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <span style={{ fontSize: 11, color: 'var(--faby-gold)' }}>★ {pro.rating || '—'}</span>
                    {pro.is_verified && <span className="badge badge-rose" style={{ fontSize: 10, padding: '1px 6px' }}>Vérifiée</span>}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 12px' }}>
          {([
            { id: 'overview',     label: 'Vue d\'ensemble', icon: '◈' },
            { id: 'boutique',     label: 'Ma boutique',     icon: '✦' },
            { id: 'services',     label: 'Mes services',    icon: '◎' },
            { id: 'availability', label: 'Disponibilités',  icon: '◷' },
            { id: 'portfolio',    label: 'Portfolio',       icon: '▦' },
            { id: 'bookings',     label: 'Réservations',    icon: '◉' },
          ] as { id: Tab; label: string; icon: string }[]).map(({ id, label, icon }) => (
            <button key={id} onClick={() => setTab(id)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 'var(--r-md)', marginBottom: 2,
              background: tab === id ? 'var(--faby-rose-light)' : 'transparent',
              color: tab === id ? 'var(--faby-rose)' : 'var(--text-muted)',
              fontWeight: tab === id ? 600 : 400,
              fontSize: 13, cursor: 'pointer', border: 'none',
              transition: 'all var(--t-fast)',
              textAlign: 'left',
            }}>
              <span style={{ fontSize: 14, width: 18, textAlign: 'center' }}>{icon}</span>
              {label}
              {id === 'bookings' && pendingCount > 0 && (
                <span style={{
                  marginLeft: 'auto', background: 'var(--faby-rose)', color: '#fff',
                  fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 99,
                }}>{pendingCount}</span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ padding: '12px 20px 24px', borderTop: '1px solid var(--border)' }}>
          <Link href="/pros" style={{ fontSize: 12, color: 'var(--text-faint)' }}>← Voir le site</Link>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>

        {/* No pro profile yet */}
        {!pro && (
          <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✦</div>
            <h2 style={{ marginBottom: 12 }}>Créez votre profil pro</h2>
            <p style={{ marginBottom: 32 }}>Complétez votre profil pour apparaître dans les recherches et recevoir des réservations.</p>
            <button className="btn btn-primary" onClick={createProProfile}>Créer mon profil</button>
          </div>
        )}

        {pro && (
          <>
            {/* ── OVERVIEW ── */}
            {tab === 'overview' && (
              <div>
                <div style={{ marginBottom: 32 }}>
                  <p className="section-label">Tableau de bord</p>
                  <h2>Bonjour, {user?.full_name?.split(' ')[0]} 👋</h2>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
                  {[
                    { label: 'Revenus totaux', value: `${totalRevenue.toFixed(0)} MAD`, sub: 'Commissions déduites', color: 'var(--faby-gold)' },
                    { label: 'Réservations', value: bookings.length, sub: `${completedCount} complétées`, color: 'var(--faby-rose)' },
                    { label: 'En attente', value: pendingCount, sub: 'À confirmer', color: 'var(--warning)' },
                    { label: 'Note moyenne', value: pro.rating ? `${pro.rating}/5` : '—', sub: `${pro.review_count} avis`, color: 'var(--success)' },
                  ].map(({ label, value, sub, color }) => (
                    <div key={label} style={{
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: 'var(--r-lg)', padding: '24px',
                    }}>
                      <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color }}>{value}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>
                    </div>
                  ))}
                </div>

                {/* Recent bookings */}
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 24 }}>
                  <h3 style={{ marginBottom: 20, fontSize: '1rem' }}>Dernières réservations</h3>
                  {bookings.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-faint)' }}>Aucune réservation pour l'instant</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {bookings.slice(0, 5).map((b) => (
                        <div key={b.id} style={{
                          display: 'flex', alignItems: 'center', gap: 16,
                          padding: '12px 16px', background: 'var(--surface-2)',
                          borderRadius: 'var(--r-md)',
                        }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: 'var(--surface-3)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 14, fontWeight: 700, color: 'var(--faby-rose)', flexShrink: 0,
                          }}>
                            {b.client?.full_name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{b.client?.full_name || 'Cliente'}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{b.service?.name} · {new Date(b.booked_at).toLocaleDateString('fr-MA')}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{b.total_price} MAD</div>
                            <StatusBadge status={b.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── BOUTIQUE ── */}
            {tab === 'boutique' && (
              <div style={{ maxWidth: 600 }}>
                <div style={{ marginBottom: 32 }}>
                  <p className="section-label">Personnalisation</p>
                  <h2>Ma boutique</h2>
                </div>

                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 28 }}>
                  <div style={{ marginBottom: 20 }}>
                    <label style={labelStyle}>Bio / Présentation</label>
                    <textarea value={boutiqueForm.bio} onChange={e => setBoutiqueForm(p => ({ ...p, bio: e.target.value }))}
                      className="input" rows={4} placeholder="Décrivez votre expérience, vos spécialités..."
                      style={{ resize: 'vertical' }} />
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label style={labelStyle}>Type de service</label>
                    <div style={{ display: 'flex', gap: 12 }}>
                      {[
                        { key: 'at_home', label: '🏠 À domicile' },
                        { key: 'in_salon', label: '💇 En salon' },
                      ].map(({ key, label }) => (
                        <button key={key} onClick={() => setBoutiqueForm(p => ({ ...p, [key]: !p[key as keyof typeof p] }))}
                          style={{
                            flex: 1, padding: '12px', borderRadius: 'var(--r-md)',
                            border: `1px solid ${boutiqueForm[key as keyof typeof boutiqueForm] ? 'var(--faby-rose)' : 'var(--border)'}`,
                            background: boutiqueForm[key as keyof typeof boutiqueForm] ? 'var(--faby-rose-light)' : 'var(--surface-2)',
                            color: boutiqueForm[key as keyof typeof boutiqueForm] ? 'var(--faby-rose)' : 'var(--text-muted)',
                            fontWeight: 500, fontSize: 14, cursor: 'pointer',
                            transition: 'all var(--t-fast)',
                          }}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {boutiqueForm.in_salon && (
                    <div style={{ marginBottom: 20 }}>
                      <label style={labelStyle}>Adresse du salon</label>
                      <input value={boutiqueForm.address} onChange={e => setBoutiqueForm(p => ({ ...p, address: e.target.value }))}
                        className="input" placeholder="Ex: 45 Rue Hassan II, Casablanca" />
                    </div>
                  )}

                  <button className="btn btn-primary" onClick={saveBoutique} style={{ width: '100%' }}>
                    Sauvegarder
                  </button>
                </div>

                {/* Aperçu public */}
                <div style={{ marginTop: 24, padding: 20, background: 'var(--surface-2)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 8 }}>APERÇU PUBLIC</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700 }}>{user?.full_name}</div>
                  {boutiqueForm.bio && <p style={{ fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>{boutiqueForm.bio}</p>}
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    {boutiqueForm.at_home && <span className="badge badge-rose">À domicile</span>}
                    {boutiqueForm.in_salon && <span className="badge badge-gold">En salon</span>}
                    {pro.is_verified && <span className="badge badge-success">✓ Vérifiée</span>}
                  </div>
                </div>
              </div>
            )}

            {/* ── SERVICES ── */}
            {tab === 'services' && (
              <div>
                <div style={{ marginBottom: 32 }}>
                  <p className="section-label">Gestion</p>
                  <h2>Mes services</h2>
                </div>

                {/* Add service form */}
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 24, marginBottom: 24 }}>
                  <h3 style={{ marginBottom: 20, fontSize: '0.95rem', color: 'var(--text-muted)' }}>Ajouter un service</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={labelStyle}>Nom du service</label>
                      <input value={svcForm.name} onChange={e => setSvcForm(p => ({ ...p, name: e.target.value }))}
                        className="input" placeholder="Ex: Brushing + coupe" />
                    </div>
                    <div>
                      <label style={labelStyle}>Catégorie</label>
                      <select value={svcForm.category} onChange={e => setSvcForm(p => ({ ...p, category: e.target.value }))}
                        className="input">
                        {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Prix (MAD)</label>
                      <input type="number" value={svcForm.price} onChange={e => setSvcForm(p => ({ ...p, price: e.target.value }))}
                        className="input" placeholder="150" />
                    </div>
                    <div>
                      <label style={labelStyle}>Durée (min)</label>
                      <input type="number" value={svcForm.duration_min} onChange={e => setSvcForm(p => ({ ...p, duration_min: parseInt(e.target.value) }))}
                        className="input" placeholder="60" />
                    </div>
                    <div style={{ gridColumn: '1/-1' }}>
                      <label style={labelStyle}>Description (optionnel)</label>
                      <input value={svcForm.description} onChange={e => setSvcForm(p => ({ ...p, description: e.target.value }))}
                        className="input" placeholder="Détails sur la prestation..." />
                    </div>
                  </div>
                  <button className="btn btn-primary" onClick={addService} disabled={svcLoading}
                    style={{ marginTop: 16 }}>
                    {svcLoading ? 'Ajout...' : '+ Ajouter'}
                  </button>
                </div>

                {/* Services list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {services.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-faint)' }}>Aucun service ajouté</p>
                  ) : services.map((s) => (
                    <div key={s.id} style={{
                      display: 'flex', alignItems: 'center', gap: 16,
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: 'var(--r-md)', padding: '16px 20px',
                    }}>
                      <span style={{ fontSize: 20 }}>{CATEGORY_EMOJI[s.category as ServiceCategory]}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{CATEGORY_LABELS[s.category as ServiceCategory]} · {s.duration_min} min</div>
                      </div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--faby-gold)' }}>{s.price} MAD</div>
                      <button onClick={() => deleteService(s.id)} style={{
                        width: 28, height: 28, borderRadius: '50%', border: 'none',
                        background: 'var(--surface-3)', color: 'var(--text-muted)',
                        cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── AVAILABILITY ── */}
            {tab === 'availability' && (
              <div style={{ maxWidth: 500 }}>
                <div style={{ marginBottom: 32 }}>
                  <p className="section-label">Planning</p>
                  <h2>Mes disponibilités</h2>
                </div>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 24 }}>
                  <p style={{ fontSize: 14, marginBottom: 20 }}>Sélectionnez vos jours de travail :</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {DAYS.map((day, i) => {
                      const avail = availability.find(a => a.day_of_week === i)
                      return (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', gap: 16,
                          padding: '12px 16px', borderRadius: 'var(--r-md)',
                          background: avail ? 'var(--faby-rose-light)' : 'var(--surface-2)',
                          border: `1px solid ${avail ? 'var(--faby-rose-border)' : 'var(--border)'}`,
                          transition: 'all var(--t-fast)',
                        }}>
                          <button onClick={() => toggleAvailability(i)} style={{
                            width: 22, height: 22, borderRadius: 6, border: `2px solid ${avail ? 'var(--faby-rose)' : 'var(--border)'}`,
                            background: avail ? 'var(--faby-rose)' : 'transparent',
                            cursor: 'pointer', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontSize: 12,
                          }}>{avail ? '✓' : ''}</button>
                          <span style={{ fontWeight: 600, fontSize: 14, width: 40 }}>{day}</span>
                          {avail && (
                            <span style={{ fontSize: 12, color: 'var(--faby-rose)' }}>
                              {avail.start_time} — {avail.end_time}
                            </span>
                          )}
                          {!avail && <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>Non disponible</span>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── PORTFOLIO ── */}
            {tab === 'portfolio' && (
              <div>
                <div style={{ marginBottom: 32 }}>
                  <p className="section-label">Visuels</p>
                  <h2>Mon portfolio</h2>
                </div>

                {/* Upload */}
                <label style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', gap: 8,
                  border: '2px dashed var(--border)', borderRadius: 'var(--r-lg)',
                  padding: '32px', cursor: 'pointer', marginBottom: 24,
                  background: 'var(--surface)', transition: 'border-color var(--t-fast)',
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--faby-rose)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                  <span style={{ fontSize: 28 }}>▦</span>
                  <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Ajouter une photo</span>
                  <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>JPG, PNG · Max 5MB</span>
                  <input type="file" accept="image/*" onChange={uploadPortfolio} style={{ display: 'none' }} />
                </label>

                {/* Grid */}
                {portfolios.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-faint)' }}>Aucune photo dans votre portfolio</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                    {portfolios.map((p) => (
                      <div key={p.id} style={{ borderRadius: 'var(--r-md)', overflow: 'hidden', aspectRatio: '1', background: 'var(--surface-2)', position: 'relative' }}>
                        <img src={p.image_url} alt={p.caption || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── BOOKINGS ── */}
            {tab === 'bookings' && (
              <div>
                <div style={{ marginBottom: 32 }}>
                  <p className="section-label">Gestion</p>
                  <h2>Réservations</h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {bookings.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '60px', color: 'var(--text-faint)' }}>Aucune réservation</p>
                  ) : bookings.map((b) => (
                    <div key={b.id} style={{
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: 'var(--r-lg)', padding: '20px 24px',
                      display: 'flex', alignItems: 'center', gap: 20,
                    }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--faby-rose-light), var(--faby-gold-light))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18, fontWeight: 700, color: 'var(--faby-rose)', flexShrink: 0,
                      }}>
                        {b.client?.full_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{b.client?.full_name}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                          {b.service?.name} · {b.location_type === 'home' ? '🏠 Domicile' : '💇 Salon'}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>
                          {new Date(b.booked_at).toLocaleDateString('fr-MA', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--faby-gold)' }}>{b.total_price} MAD</div>
                        <div style={{ marginTop: 6 }}><StatusBadge status={b.status} /></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    pending:     { label: 'En attente',  color: 'var(--warning)', bg: 'rgba(245,158,11,0.12)' },
    confirmed:   { label: 'Confirmée',   color: 'var(--info)',    bg: 'rgba(96,165,250,0.12)' },
    in_progress: { label: 'En cours',    color: 'var(--faby-rose)', bg: 'var(--faby-rose-light)' },
    completed:   { label: 'Terminée',    color: 'var(--success)', bg: 'rgba(62,207,142,0.12)' },
    cancelled:   { label: 'Annulée',     color: 'var(--text-faint)', bg: 'var(--surface-3)' },
    disputed:    { label: 'Litige',      color: 'var(--error)',   bg: 'rgba(239,68,68,0.12)' },
  }
  const s = map[status] || map.pending
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99,
      color: s.color, background: s.bg,
    }}>{s.label}</span>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600,
  color: 'var(--text-muted)', marginBottom: 6,
  letterSpacing: '0.05em', textTransform: 'uppercase',
}