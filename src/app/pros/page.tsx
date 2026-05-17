'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { createClient } from '@/lib/supabase/client'
import { CATEGORY_LABELS, CATEGORY_EMOJI, MOROCCAN_CITIES, type ServiceCategory } from '@/types'

const CATEGORIES = Object.keys(CATEGORY_LABELS) as ServiceCategory[]

export default function ProsPage() {
  const [pros, setPros] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('')
  const [city, setCity] = useState<string>('')
  const [locationFilter, setLocationFilter] = useState<'all' | 'home' | 'salon'>('all')
  const [sortBy, setSortBy] = useState<'rating' | 'recent'>('rating')

  useEffect(() => {
    loadPros()
  }, [category, city, locationFilter, sortBy])

  async function loadPros() {
    setLoading(true)
    const supabase = createClient()
    let query = supabase
      .from('pros')
      .select('*, user:users(full_name, avatar_url, city), services(id, name, price, category)')
      .eq('is_active', true)

    if (category) query = query.contains('categories', [category])
    if (city) query = query.contains('cities', [city])
    if (locationFilter === 'home') query = query.eq('at_home', true)
    if (locationFilter === 'salon') query = query.eq('in_salon', true)
    if (sortBy === 'rating') query = query.order('rating', { ascending: false })
    else query = query.order('created_at', { ascending: false })

    const { data } = await query.limit(24)
    setPros(data || [])
    setLoading(false)
  }

  const filtered = pros.filter(p =>
    !search || p.user?.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <Navbar />
      <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 'var(--nav-h)' }}>

        {/* HEADER */}
        <div style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          padding: '40px 0 0',
        }}>
          <div className="container">
            <p className="section-label">Marketplace</p>
            <h1 style={{ marginBottom: 24, fontSize: 'clamp(1.8rem,4vw,2.8rem)' }}>
              Nos{' '}
              <span style={{ fontStyle: 'italic', color: 'var(--faby-rose)' }}>professionnelles</span>
            </h1>

            {/* Search bar */}
            <div style={{ position: 'relative', maxWidth: 480, marginBottom: 28 }}>
              <span style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-faint)', fontSize: 16,
              }}>◎</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input"
                placeholder="Rechercher une prestataire..."
                style={{ paddingLeft: 40 }}
              />
            </div>

            {/* Filters row */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingBottom: 20, overflowX: 'auto' }}>
              {/* Categories */}
              <button onClick={() => setCategory('')}
                style={filterBtn(category === '')}>Toutes</button>
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCategory(category === c ? '' : c)}
                  style={filterBtn(category === c)}>
                  {CATEGORY_EMOJI[c]} {CATEGORY_LABELS[c]}
                </button>
              ))}

              <div style={{ width: 1, background: 'var(--border)', margin: '0 4px', alignSelf: 'stretch' }} />

              {/* Location type */}
              {(['all', 'home', 'salon'] as const).map(l => (
                <button key={l} onClick={() => setLocationFilter(l)}
                  style={filterBtn(locationFilter === l)}>
                  {l === 'all' ? 'Tout' : l === 'home' ? '🏠 Domicile' : '💇 Salon'}
                </button>
              ))}

              <div style={{ width: 1, background: 'var(--border)', margin: '0 4px', alignSelf: 'stretch' }} />

              {/* City */}
              <select value={city} onChange={e => setCity(e.target.value)}
                style={{
                  background: city ? 'var(--faby-rose-light)' : 'var(--surface-2)',
                  border: `1px solid ${city ? 'var(--faby-rose-border)' : 'var(--border)'}`,
                  color: city ? 'var(--faby-rose)' : 'var(--text-muted)',
                  borderRadius: 'var(--r-pill)', padding: '7px 14px',
                  fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                }}>
                <option value="">Toutes les villes</option>
                {MOROCCAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              {/* Sort */}
              <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
                style={{
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  color: 'var(--text-muted)', borderRadius: 'var(--r-pill)',
                  padding: '7px 14px', fontSize: 13, fontWeight: 500,
                  cursor: 'pointer', fontFamily: 'var(--font-body)',
                }}>
                <option value="rating">★ Mieux notées</option>
                <option value="recent">◷ Plus récentes</option>
              </select>
            </div>
          </div>
        </div>

        {/* RESULTS */}
        <div className="container" style={{ padding: '32px var(--sp-lg)' }}>
          {/* Count */}
          <div style={{ fontSize: 13, color: 'var(--text-faint)', marginBottom: 24 }}>
            {loading ? 'Chargement...' : `${filtered.length} prestataire${filtered.length > 1 ? 's' : ''} trouvée${filtered.length > 1 ? 's' : ''}`}
          </div>

          {/* Grid */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 320, borderRadius: 'var(--r-lg)' }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>◎</div>
              <h3 style={{ marginBottom: 8 }}>Aucune prestataire trouvée</h3>
              <p>Essayez d&apos;ajuster vos filtres</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {filtered.map(pro => <ProCard key={pro.id} pro={pro} />)}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function ProCard({ pro }: { pro: any }) {
  const minPrice = pro.services?.length
    ? Math.min(...pro.services.map((s: any) => s.price))
    : null

  return (
    <Link href={`/pro/${pro.id}`} style={{ display: 'block', textDecoration: 'none' }}>
      <div className="card" style={{ overflow: 'hidden', cursor: 'pointer' }}>

        {/* Card header */}
        <div style={{
          height: 120,
          background: `linear-gradient(135deg, var(--surface-2) 0%, var(--surface-3) 100%)`,
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-end',
          padding: '0 20px 0',
        }}>
          {/* Category tags */}
          <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {pro.categories?.slice(0, 2).map((c: ServiceCategory) => (
              <span key={c} style={{
                fontSize: 11, padding: '3px 8px', borderRadius: 99,
                background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
                color: 'var(--text-muted)', border: '1px solid var(--border)',
              }}>
                {CATEGORY_EMOJI[c]} {CATEGORY_LABELS[c]}
              </span>
            ))}
          </div>

          {/* Location badges */}
          <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 4 }}>
            {pro.at_home && <span style={{ fontSize: 14 }}>🏠</span>}
            {pro.in_salon && <span style={{ fontSize: 14 }}>💇</span>}
          </div>

          {/* Avatar */}
          <div style={{
            width: 64, height: 64,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--faby-rose), var(--faby-gold))',
            border: '3px solid var(--surface)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 700, color: '#fff',
            position: 'absolute', bottom: -32, left: 20,
            flexShrink: 0,
            boxShadow: 'var(--shadow-rose)',
          }}>
            {pro.user?.avatar_url
              ? <img src={pro.user.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              : pro.user?.full_name?.[0]?.toUpperCase()
            }
          </div>
        </div>

        {/* Card body */}
        <div style={{ padding: '40px 20px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text)' }}>
                {pro.user?.full_name}
              </div>
              {pro.user?.city && (
                <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>
                  📍 {pro.user.city}
                </div>
              )}
            </div>
            {pro.is_verified && (
              <span className="badge badge-rose" style={{ fontSize: 11 }}>✓ Vérifiée</span>
            )}
          </div>

          {/* Bio */}
          {pro.bio && (
            <p style={{
              fontSize: 13, color: 'var(--text-muted)', marginBottom: 12,
              lineHeight: 1.5,
              display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {pro.bio}
            </p>
          )}

          {/* Rating + services count */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Stars rating={pro.rating || 0} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {pro.rating ? pro.rating.toFixed(1) : '—'}
                {pro.review_count > 0 && ` (${pro.review_count})`}
              </span>
            </div>
            {minPrice !== null && (
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                À partir de{' '}
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--faby-gold)' }}>
                  {minPrice} MAD
                </span>
              </div>
            )}
          </div>

          {/* CTA */}
          <div style={{
            marginTop: 16, paddingTop: 16,
            borderTop: '1px solid var(--border)',
            display: 'flex', justifyContent: 'flex-end',
          }}>
            <span style={{
              fontSize: 13, fontWeight: 600, color: 'var(--faby-rose)',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              Voir le profil →
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

function Stars({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ fontSize: 12, color: i <= Math.round(rating) ? 'var(--faby-gold)' : 'var(--surface-3)' }}>★</span>
      ))}
    </div>
  )
}

function filterBtn(active: boolean): React.CSSProperties {
  return {
    padding: '7px 14px',
    borderRadius: 'var(--r-pill)',
    border: `1px solid ${active ? 'var(--faby-rose-border)' : 'var(--border)'}`,
    background: active ? 'var(--faby-rose-light)' : 'var(--surface-2)',
    color: active ? 'var(--faby-rose)' : 'var(--text-muted)',
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    fontFamily: 'var(--font-body)',
    transition: 'all 150ms ease-out',
  }
}