'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { createClient } from '@/lib/supabase/client'
import { CATEGORY_LABELS, CATEGORY_EMOJI, type ServiceCategory } from '@/types'

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

export default function ProProfilePage() {
  const { id } = useParams()
  const router = useRouter()
  const [pro, setPro] = useState<any>(null)
  const [services, setServices] = useState<any[]>([])
  const [portfolios, setPortfolios] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [availability, setAvailability] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'services' | 'portfolio' | 'avis'>('services')
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<any>(null)

  useEffect(() => {
    if (id) loadPro()
  }, [id])

  async function loadPro() {
    const supabase = createClient()
    const { data: proData } = await supabase
      .from('pros')
      .select('*, user:users(full_name, avatar_url, city, email)')
      .eq('id', id)
      .single()

    if (!proData) { router.push('/pros'); return }
    setPro(proData)

    const [{ data: svcs }, { data: ports }, { data: revs }, { data: avail }] = await Promise.all([
      supabase.from('services').select('*').eq('pro_id', id).eq('is_active', true).order('price'),
      supabase.from('portfolios').select('*').eq('pro_id', id).order('created_at', { ascending: false }),
      supabase.from('reviews').select('*, client:users!reviews_client_id_fkey(full_name)').eq('pro_id', id).order('created_at', { ascending: false }),
      supabase.from('availability').select('*').eq('pro_id', id).order('day_of_week'),
    ])
    setServices(svcs || [])
    setPortfolios(ports || [])
    setReviews(revs || [])
    setAvailability(avail || [])
    setLoading(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontStyle: 'italic', color: 'var(--faby-rose)', marginBottom: 12 }}>Faby</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Chargement du profil...</div>
      </div>
    </div>
  )

  if (!pro) return null

  const minPrice = services.length ? Math.min(...services.map(s => s.price)) : null

  return (
    <>
      <Navbar />

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'zoom-out',
        }}>
          <img src={lightbox} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 'var(--r-lg)', objectFit: 'contain' }} />
          <button onClick={() => setLightbox(null)} style={{
            position: 'absolute', top: 24, right: 24,
            background: 'var(--surface)', border: '1px solid var(--border)',
            color: 'var(--text)', width: 40, height: 40, borderRadius: '50%',
            fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>
      )}

      {/* Booking modal */}
      {selectedService && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-xl)', padding: 32, maxWidth: 480, width: '100%',
            boxShadow: 'var(--shadow-lg)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3>Réserver</h3>
              <button onClick={() => setSelectedService(null)} style={{
                background: 'var(--surface-2)', border: 'none', width: 32, height: 32,
                borderRadius: '50%', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16,
              }}>×</button>
            </div>

            <div style={{
              background: 'var(--surface-2)', borderRadius: 'var(--r-md)',
              padding: '16px 20px', marginBottom: 20,
              border: '1px solid var(--border)',
            }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{selectedService.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {selectedService.duration_min} min · {CATEGORY_LABELS[selectedService.category as ServiceCategory]}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--faby-gold)', marginTop: 8 }}>
                {selectedService.price} MAD
              </div>
            </div>

            <p style={{ fontSize: 13, marginBottom: 20, color: 'var(--text-muted)' }}>
              Pour finaliser votre réservation, connectez-vous ou créez un compte.
            </p>

            <div style={{ display: 'flex', gap: 10 }}>
              <Link href={`/login?redirect=/pro/${id}`} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                Se connecter
              </Link>
              <Link href={`/register?redirect=/pro/${id}`} className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>
                S&apos;inscrire
              </Link>
            </div>
          </div>
        </div>
      )}

      <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 'var(--nav-h)' }}>

        {/* HERO BANNER */}
        <div style={{
          height: 220,
          background: 'linear-gradient(135deg, var(--surface-2) 0%, var(--surface-3) 50%, rgba(232,82,122,0.08) 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {portfolios[0] && (
            <img src={portfolios[0].image_url} alt="" style={{
              width: '100%', height: '100%', objectFit: 'cover', opacity: 0.25,
            }} />
          )}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, transparent 40%, var(--bg) 100%)',
          }} />
        </div>

        <div className="container" style={{ position: 'relative', marginTop: -60, paddingBottom: 80 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32, alignItems: 'start' }}>

            {/* LEFT COLUMN */}
            <div>
              {/* Profile header */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, marginBottom: 24 }}>
                <div style={{
                  width: 96, height: 96, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, var(--faby-rose), var(--faby-gold))',
                  border: '4px solid var(--bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 36, fontWeight: 700, color: '#fff',
                  boxShadow: 'var(--shadow-rose)',
                  overflow: 'hidden',
                }}>
                  {pro.user?.avatar_url
                    ? <img src={pro.user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : pro.user?.full_name?.[0]?.toUpperCase()
                  }
                </div>
                <div style={{ paddingBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <h2 style={{ fontSize: 'clamp(1.3rem,3vw,1.8rem)' }}>{pro.user?.full_name}</h2>
                    {pro.is_verified && <span className="badge badge-rose">✓ Vérifiée</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 6, flexWrap: 'wrap' }}>
                    {pro.user?.city && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>📍 {pro.user.city}</span>}
                    {pro.at_home && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>🏠 Domicile</span>}
                    {pro.in_salon && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>💇 Salon</span>}
                  </div>
                </div>
              </div>

              {/* Stats bar */}
              <div style={{
                display: 'flex', gap: 24, padding: '16px 20px',
                background: 'var(--surface)', borderRadius: 'var(--r-lg)',
                border: '1px solid var(--border)', marginBottom: 24, flexWrap: 'wrap',
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--faby-gold)' }}>
                    {pro.rating ? pro.rating.toFixed(1) : '—'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>Note</div>
                </div>
                <div style={{ width: 1, background: 'var(--border)' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700 }}>{pro.review_count}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>Avis</div>
                </div>
                <div style={{ width: 1, background: 'var(--border)' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700 }}>{services.length}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>Services</div>
                </div>
                {minPrice !== null && (
                  <>
                    <div style={{ width: 1, background: 'var(--border)' }} />
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--faby-rose)' }}>
                        {minPrice} MAD
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>Dès</div>
                    </div>
                  </>
                )}
              </div>

              {/* Bio */}
              {pro.bio && (
                <div style={{ marginBottom: 24 }}>
                  <p style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--text-muted)' }}>{pro.bio}</p>
                </div>
              )}

              {/* Categories */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32 }}>
                {pro.categories?.map((c: ServiceCategory) => (
                  <span key={c} className="badge badge-muted" style={{ fontSize: 13 }}>
                    {CATEGORY_EMOJI[c]} {CATEGORY_LABELS[c]}
                  </span>
                ))}
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
                {(['services', 'portfolio', 'avis'] as const).map(t => (
                  <button key={t} onClick={() => setActiveTab(t)} style={{
                    padding: '12px 20px', fontSize: 14, fontWeight: activeTab === t ? 600 : 400,
                    color: activeTab === t ? 'var(--faby-rose)' : 'var(--text-muted)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    borderBottom: `2px solid ${activeTab === t ? 'var(--faby-rose)' : 'transparent'}`,
                    marginBottom: -1, transition: 'all var(--t-fast)',
                    fontFamily: 'var(--font-body)',
                    textTransform: 'capitalize',
                  }}>
                    {t === 'services' ? `Services (${services.length})` : t === 'portfolio' ? `Portfolio (${portfolios.length})` : `Avis (${reviews.length})`}
                  </button>
                ))}
              </div>

              {/* Tab: Services */}
              {activeTab === 'services' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {services.length === 0 ? (
                    <p style={{ color: 'var(--text-faint)', textAlign: 'center', padding: '40px 0' }}>Aucun service renseigné</p>
                  ) : services.map(s => (
                    <div key={s.id} style={{
                      display: 'flex', alignItems: 'center', gap: 16,
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: 'var(--r-lg)', padding: '18px 20px',
                      transition: 'border-color var(--t-fast), transform var(--t-fast)',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--faby-rose-border)'; e.currentTarget.style.transform = 'translateX(4px)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateX(0)' }}
                    >
                      <span style={{ fontSize: 24, flexShrink: 0 }}>{CATEGORY_EMOJI[s.category as ServiceCategory]}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>{s.name}</div>
                        {s.description && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{s.description}</div>}
                        <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 4 }}>⏱ {s.duration_min} min</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--faby-gold)' }}>
                          {s.price} MAD
                        </div>
                        <button onClick={() => setSelectedService(s)} className="btn btn-primary btn-sm">
                          Réserver
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab: Portfolio */}
              {activeTab === 'portfolio' && (
                <div>
                  {portfolios.length === 0 ? (
                    <p style={{ color: 'var(--text-faint)', textAlign: 'center', padding: '40px 0' }}>Aucune photo dans le portfolio</p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                      {portfolios.map(p => (
                        <div key={p.id} onClick={() => setLightbox(p.image_url)}
                          style={{
                            aspectRatio: '1', borderRadius: 'var(--r-md)', overflow: 'hidden',
                            cursor: 'zoom-in', background: 'var(--surface-2)',
                            transition: 'transform var(--t-base), box-shadow var(--t-base)',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = 'var(--shadow-rose)' }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none' }}
                        >
                          <img src={p.image_url} alt={p.caption || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Avis */}
              {activeTab === 'avis' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {reviews.length === 0 ? (
                    <p style={{ color: 'var(--text-faint)', textAlign: 'center', padding: '40px 0' }}>Aucun avis pour l&apos;instant</p>
                  ) : reviews.map(r => (
                    <div key={r.id} style={{
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: 'var(--r-lg)', padding: '20px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: 'var(--surface-3)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 14, fontWeight: 700, color: 'var(--faby-rose)',
                          }}>
                            {r.client?.full_name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{r.client?.full_name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                              {new Date(r.created_at).toLocaleDateString('fr-MA', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 2 }}>
                          {[1, 2, 3, 4, 5].map(i => (
                            <span key={i} style={{ fontSize: 14, color: i <= r.rating ? 'var(--faby-gold)' : 'var(--surface-3)' }}>★</span>
                          ))}
                        </div>
                      </div>
                      {r.comment && <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-muted)' }}>{r.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN — Booking sticky card */}
            <div style={{ position: 'sticky', top: 'calc(var(--nav-h) + 24px)' }}>
              <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--r-xl)', padding: 24,
                boxShadow: 'var(--shadow-md)',
              }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>
                  {pro.user?.full_name}
                </div>
                {minPrice !== null && (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                    À partir de <span style={{ color: 'var(--faby-gold)', fontWeight: 700 }}>{minPrice} MAD</span>
                  </div>
                )}

                {/* Stars */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <span key={i} style={{ fontSize: 16, color: i <= Math.round(pro.rating || 0) ? 'var(--faby-gold)' : 'var(--surface-3)' }}>★</span>
                  ))}
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{pro.rating ? pro.rating.toFixed(1) : '—'}</span>
                </div>

                {/* Quick services */}
                {services.slice(0, 3).map(s => (
                  <button key={s.id} onClick={() => setSelectedService(s)} style={{
                    width: '100%', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', padding: '10px 12px',
                    background: 'var(--surface-2)', borderRadius: 'var(--r-md)',
                    border: '1px solid var(--border)', marginBottom: 8,
                    cursor: 'pointer', transition: 'border-color var(--t-fast)',
                    fontFamily: 'var(--font-body)',
                  }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--faby-rose-border)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{s.name}</span>
                    <span style={{ fontSize: 13, color: 'var(--faby-gold)', fontWeight: 700 }}>{s.price} MAD</span>
                  </button>
                ))}

                <button className="btn btn-primary" onClick={() => setActiveTab('services')}
                  style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
                  Réserver maintenant
                </button>

                <div style={{ borderTop: '1px solid var(--border)', marginTop: 20, paddingTop: 16 }}>
                  {/* Availability summary */}
                  <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Disponible</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {availability.length === 0
                      ? <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>Non renseigné</span>
                      : availability.map(a => (
                        <span key={a.id} className="badge badge-muted" style={{ fontSize: 11 }}>
                          {DAYS[a.day_of_week].slice(0, 3)}
                        </span>
                      ))
                    }
                  </div>

                  {/* Location */}
                  <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {pro.at_home && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        🏠 <span>Se déplace à domicile</span>
                      </div>
                    )}
                    {pro.in_salon && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        💇 <span>Reçoit en salon</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Back link */}
              <Link href="/pros" style={{ display: 'block', textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text-faint)' }}>
                ← Retour aux prestataires
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .pro-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  )
}