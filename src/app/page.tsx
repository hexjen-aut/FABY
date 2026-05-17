'use client'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { CATEGORY_LABELS, CATEGORY_EMOJI, type ServiceCategory } from '@/types'

const categories: ServiceCategory[] = ['coiffure', 'esthetique', 'manucure', 'massage', 'maquillage']

const stats = [
  { value: '500+', label: 'Professionnelles' },
  { value: '3 000+', label: 'Réservations' },
  { value: '4.9/5', label: 'Note moyenne' },
  { value: '6', label: 'Villes couvertes' },
]

export default function HomePage() {
  return (
    <div>
      <Navbar />
      <main>
        <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: '68px' }}>
          <div className="container">
            <p className="section-label">Beauté à domicile et en salon</p>
            <h1 style={{ marginBottom: 24 }}>
              Votre beauté,{' '}
              <span style={{ fontStyle: 'italic', color: 'var(--faby-rose)' }}>
                quand vous voulez
              </span>
            </h1>
            <p style={{ fontSize: 18, marginBottom: 40, maxWidth: 520 }}>
              Réservez les meilleures coiffeuses et esthéticiennes du Maroc.
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <Link href="/pros" className="btn btn-primary btn-lg">Trouver une pro</Link>
              <Link href="/register" className="btn btn-secondary btn-lg">Devenir prestataire</Link>
            </div>
            <div style={{ display: 'flex', gap: 40, marginTop: 64, flexWrap: 'wrap' }}>
              {stats.map(({ value, label }) => (
                <div key={label}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700 }}>{value}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-faint)' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ padding: '80px 0', background: 'var(--surface)' }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <p className="section-label">Nos services</p>
              <h2>Tout ce dont vous avez besoin</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
              {categories.map((cat) => (
                <Link key={cat} href={`/pros?category=${cat}`} className="card" style={{ padding: '32px 20px', textAlign: 'center', display: 'block' }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>{CATEGORY_EMOJI[cat]}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>{CATEGORY_LABELS[cat]}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <footer style={{ padding: '40px 0', borderTop: '1px solid var(--border)' }}>
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontStyle: 'italic', color: 'var(--faby-rose)' }}>Faby</div>
            <p style={{ fontSize: 13, color: 'var(--text-faint)' }}>© 2025 Faby — Maroc</p>
          </div>
        </footer>
      </main>
    </div>
  )
}