'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { createClient } from '@/lib/supabase/client'
import { CATEGORY_LABELS, CATEGORY_EMOJI, type ServiceCategory, COMMISSION_RATE } from '@/types'

const DAYS_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

function generateSlots(startTime: string, endTime: string, durationMin: number): string[] {
  const slots: string[] = []
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  let current = sh * 60 + sm
  const end = eh * 60 + em
  while (current + durationMin <= end) {
    const h = Math.floor(current / 60).toString().padStart(2, '0')
    const m = (current % 60).toString().padStart(2, '0')
    slots.push(`${h}:${m}`)
    current += durationMin
  }
  return slots
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

type Step = 'service' | 'datetime' | 'location' | 'confirm'

export default function BookingPage() {
  const { proId } = useParams()
  const router = useRouter()

  const [step, setStep] = useState<Step>('service')
  const [pro, setPro] = useState<any>(null)
  const [services, setServices] = useState<any[]>([])
  const [availability, setAvailability] = useState<any[]>([])
  const [bookedSlots, setBookedSlots] = useState<string[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Selections
  const [selectedService, setSelectedService] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [locationType, setLocationType] = useState<'home' | 'salon'>('home')
  const [address, setAddress] = useState('')
  const [note, setNote] = useState('')

  // Calendar state
  const today = new Date()
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())

  useEffect(() => { loadData() }, [proId])

  async function loadData() {
    const supabase = createClient()

    // Check auth
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) { router.push(`/login?redirect=/booking/${proId}`); return }
    const { data: userData } = await supabase.from('users').select('*').eq('auth_id', authUser.id).single()
    setCurrentUser(userData)

    // Load pro
    const { data: proData } = await supabase.from('pros').select('*, user:users(full_name, avatar_url, city)').eq('id', proId).single()
    if (!proData) { router.push('/pros'); return }
    setPro(proData)

    // Load services + availability
    const [{ data: svcs }, { data: avail }] = await Promise.all([
      supabase.from('services').select('*').eq('pro_id', proId).eq('is_active', true).order('price'),
      supabase.from('availability').select('*').eq('pro_id', proId),
    ])
    setServices(svcs || [])
    setAvailability(avail || [])
    if (proData.at_home) setLocationType('home')
    else setLocationType('salon')

    setLoading(false)
  }

  async function loadBookedSlots(date: Date) {
    const supabase = createClient()
    const dateStr = date.toISOString().split('T')[0]
    const { data } = await supabase.from('bookings')
      .select('booked_at')
      .eq('pro_id', proId)
      .gte('booked_at', `${dateStr}T00:00:00`)
      .lte('booked_at', `${dateStr}T23:59:59`)
      .not('status', 'eq', 'cancelled')
    setBookedSlots((data || []).map((b: any) => new Date(b.booked_at).toTimeString().slice(0, 5)))
  }

  function selectDate(date: Date) {
    setSelectedDate(date)
    setSelectedSlot(null)
    loadBookedSlots(date)
  }

  function isAvailableDay(date: Date): boolean {
    const day = date.getDay()
    return availability.some(a => a.day_of_week === day)
  }

  function getAvailabilityForDay(date: Date) {
    return availability.find(a => a.day_of_week === date.getDay())
  }

  async function submitBooking() {
    if (!selectedService || !selectedDate || !selectedSlot || !currentUser) return
    setSubmitting(true)
    const supabase = createClient()

    const bookedAt = new Date(selectedDate)
    const [h, m] = selectedSlot.split(':').map(Number)
    bookedAt.setHours(h, m, 0, 0)

    const commission = selectedService.price * COMMISSION_RATE

    const { data, error } = await supabase.from('bookings').insert({
      client_id: currentUser.id,
      pro_id: proId,
      service_id: selectedService.id,
      booked_at: bookedAt.toISOString(),
      location_type: locationType,
      address: locationType === 'home' ? address : pro.address,
      total_price: selectedService.price,
      commission,
      status: 'pending',
      payment_status: 'pending',
    }).select().single()

    if (!error && data) {
      router.push(`/dashboard-client?booking=${data.id}&success=true`)
    }
    setSubmitting(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontStyle: 'italic', color: 'var(--faby-rose)' }}>Faby</div>
    </div>
  )

  const slots = selectedDate && selectedService
    ? (() => {
        const avail = getAvailabilityForDay(selectedDate)
        return avail ? generateSlots(avail.start_time, avail.end_time, selectedService.duration_min) : []
      })()
    : []

  const totalDays = getDaysInMonth(calYear, calMonth)
  const firstDay = getFirstDayOfMonth(calYear, calMonth)

  const commission = selectedService ? selectedService.price * COMMISSION_RATE : 0
  const proEarns = selectedService ? selectedService.price - commission : 0

  return (
    <>
      <Navbar />
      <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 'var(--nav-h)', paddingBottom: 80 }}>
        <div className="container" style={{ paddingTop: 40, maxWidth: 900 }}>

          {/* Back */}
          <Link href={`/pro/${proId}`} style={{ fontSize: 13, color: 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 32 }}>
            ← Retour au profil
          </Link>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, var(--faby-rose), var(--faby-gold))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {pro?.user?.full_name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="section-label" style={{ marginBottom: 2 }}>Réservation</p>
              <h2 style={{ fontSize: '1.5rem' }}>{pro?.user?.full_name}</h2>
            </div>
          </div>

          {/* Progress steps */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 40, background: 'var(--surface)', borderRadius: 'var(--r-pill)', padding: 4, border: '1px solid var(--border)' }}>
            {([
              { id: 'service',  label: '1. Service' },
              { id: 'datetime', label: '2. Date & Heure' },
              { id: 'location', label: '3. Lieu' },
              { id: 'confirm',  label: '4. Confirmation' },
            ] as { id: Step; label: string }[]).map(({ id, label }) => {
              const steps: Step[] = ['service', 'datetime', 'location', 'confirm']
              const currentIdx = steps.indexOf(step)
              const thisIdx = steps.indexOf(id)
              const isDone = thisIdx < currentIdx
              const isActive = id === step
              return (
                <button key={id} onClick={() => isDone && setStep(id)} style={{
                  flex: 1, padding: '9px 8px', borderRadius: 'var(--r-pill)',
                  background: isActive ? 'var(--faby-rose)' : isDone ? 'var(--surface-3)' : 'transparent',
                  color: isActive ? '#fff' : isDone ? 'var(--text-muted)' : 'var(--text-faint)',
                  fontSize: 12, fontWeight: isActive ? 700 : 500,
                  border: 'none', cursor: isDone ? 'pointer' : 'default',
                  transition: 'all var(--t-fast)', fontFamily: 'var(--font-body)',
                  whiteSpace: 'nowrap',
                }}>{isDone ? '✓ ' : ''}{label}</button>
              )
            })}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>

            {/* LEFT — Steps */}
            <div>

              {/* STEP 1: Service */}
              {step === 'service' && (
                <div>
                  <h3 style={{ marginBottom: 20 }}>Choisissez un service</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {services.length === 0 ? (
                      <p style={{ color: 'var(--text-faint)', textAlign: 'center', padding: 40 }}>Aucun service disponible</p>
                    ) : services.map(s => (
                      <button key={s.id} onClick={() => { setSelectedService(s); setTimeout(() => setStep('datetime'), 300) }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 16,
                          background: selectedService?.id === s.id ? 'var(--faby-rose-light)' : 'var(--surface)',
                          border: `1px solid ${selectedService?.id === s.id ? 'var(--faby-rose)' : 'var(--border)'}`,
                          borderRadius: 'var(--r-lg)', padding: '18px 20px',
                          cursor: 'pointer', textAlign: 'left', width: '100%',
                          transition: 'all var(--t-fast)', fontFamily: 'var(--font-body)',
                        }}>
                        <span style={{ fontSize: 28, flexShrink: 0 }}>{CATEGORY_EMOJI[s.category as ServiceCategory]}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>{s.name}</div>
                          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                            {CATEGORY_LABELS[s.category as ServiceCategory]} · ⏱ {s.duration_min} min
                          </div>
                          {s.description && <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 4 }}>{s.description}</div>}
                        </div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--faby-gold)', flexShrink: 0 }}>
                          {s.price} MAD
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2: Date & Time */}
              {step === 'datetime' && (
                <div>
                  <h3 style={{ marginBottom: 20 }}>Choisissez une date</h3>

                  {/* Calendar */}
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: 24, marginBottom: 24 }}>
                    {/* Month nav */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                      <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) } else setCalMonth(m => m - 1) }}
                        style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        ‹
                      </button>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.05rem' }}>
                        {MONTHS[calMonth]} {calYear}
                      </div>
                      <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) } else setCalMonth(m => m + 1) }}
                        style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        ›
                      </button>
                    </div>

                    {/* Day headers */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
                      {DAYS_SHORT.map(d => (
                        <div key={d} style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-faint)', fontWeight: 600, padding: '4px 0' }}>{d}</div>
                      ))}
                    </div>

                    {/* Days grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                      {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                      {Array.from({ length: totalDays }).map((_, i) => {
                        const day = i + 1
                        const date = new Date(calYear, calMonth, day)
                        const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate())
                        const isAvail = !isPast && isAvailableDay(date)
                        const isSelected = selectedDate?.toDateString() === date.toDateString()
                        const isToday = date.toDateString() === today.toDateString()
                        return (
                          <button key={day} onClick={() => isAvail && selectDate(date)} style={{
                            aspectRatio: '1', borderRadius: 'var(--r-sm)',
                            background: isSelected ? 'var(--faby-rose)' : isToday ? 'var(--faby-rose-light)' : 'transparent',
                            border: `1px solid ${isSelected ? 'var(--faby-rose)' : isToday ? 'var(--faby-rose-border)' : 'transparent'}`,
                            color: isSelected ? '#fff' : isPast ? 'var(--text-faint)' : isAvail ? 'var(--text)' : 'var(--text-faint)',
                            fontSize: 13, fontWeight: isSelected || isToday ? 600 : 400,
                            cursor: isAvail ? 'pointer' : 'not-allowed',
                            opacity: isPast ? 0.3 : isAvail ? 1 : 0.4,
                            transition: 'all var(--t-fast)',
                            fontFamily: 'var(--font-body)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            position: 'relative',
                          }}>
                            {day}
                            {isAvail && !isSelected && (
                              <div style={{ position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', background: 'var(--faby-rose)', opacity: 0.6 }} />
                            )}
                          </button>
                        )
                      })}
                    </div>

                    <div style={{ marginTop: 16, display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-faint)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--faby-rose)', opacity: 0.6, display: 'inline-block' }} />
                        Disponible
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--surface-3)', display: 'inline-block' }} />
                        Indisponible
                      </span>
                    </div>
                  </div>

                  {/* Time slots */}
                  {selectedDate && (
                    <div>
                      <h3 style={{ marginBottom: 16, fontSize: '1rem' }}>
                        Créneaux disponibles — {selectedDate.toLocaleDateString('fr-MA', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </h3>
                      {slots.length === 0 ? (
                        <p style={{ color: 'var(--text-faint)', fontSize: 14 }}>Aucun créneau disponible ce jour</p>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 8 }}>
                          {slots.map(slot => {
                            const isBooked = bookedSlots.includes(slot)
                            const isChosen = selectedSlot === slot
                            return (
                              <button key={slot} onClick={() => !isBooked && setSelectedSlot(slot)} style={{
                                padding: '10px 8px', borderRadius: 'var(--r-md)',
                                background: isChosen ? 'var(--faby-rose)' : isBooked ? 'var(--surface-2)' : 'var(--surface)',
                                border: `1px solid ${isChosen ? 'var(--faby-rose)' : 'var(--border)'}`,
                                color: isChosen ? '#fff' : isBooked ? 'var(--text-faint)' : 'var(--text)',
                                fontSize: 13, fontWeight: 600,
                                cursor: isBooked ? 'not-allowed' : 'pointer',
                                opacity: isBooked ? 0.4 : 1,
                                textDecoration: isBooked ? 'line-through' : 'none',
                                transition: 'all var(--t-fast)',
                                fontFamily: 'var(--font-body)',
                              }}>{slot}</button>
                            )
                          })}
                        </div>
                      )}

                      {selectedSlot && (
                        <button className="btn btn-primary" onClick={() => setStep('location')} style={{ marginTop: 24 }}>
                          Continuer →
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: Location */}
              {step === 'location' && (
                <div style={{ maxWidth: 480 }}>
                  <h3 style={{ marginBottom: 20 }}>Lieu de la prestation</h3>

                  <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                    {pro?.at_home && (
                      <button onClick={() => setLocationType('home')} style={{
                        flex: 1, padding: 20, borderRadius: 'var(--r-lg)',
                        border: `2px solid ${locationType === 'home' ? 'var(--faby-rose)' : 'var(--border)'}`,
                        background: locationType === 'home' ? 'var(--faby-rose-light)' : 'var(--surface)',
                        cursor: 'pointer', textAlign: 'center',
                        transition: 'all var(--t-fast)', fontFamily: 'var(--font-body)',
                      }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>🏠</div>
                        <div style={{ fontWeight: 600, color: locationType === 'home' ? 'var(--faby-rose)' : 'var(--text)' }}>À domicile</div>
                        <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 4 }}>La pro vient chez vous</div>
                      </button>
                    )}
                    {pro?.in_salon && (
                      <button onClick={() => setLocationType('salon')} style={{
                        flex: 1, padding: 20, borderRadius: 'var(--r-lg)',
                        border: `2px solid ${locationType === 'salon' ? 'var(--faby-rose)' : 'var(--border)'}`,
                        background: locationType === 'salon' ? 'var(--faby-rose-light)' : 'var(--surface)',
                        cursor: 'pointer', textAlign: 'center',
                        transition: 'all var(--t-fast)', fontFamily: 'var(--font-body)',
                      }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>💇</div>
                        <div style={{ fontWeight: 600, color: locationType === 'salon' ? 'var(--faby-rose)' : 'var(--text)' }}>En salon</div>
                        <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 4 }}>{pro?.address || 'Adresse communiquée'}</div>
                      </button>
                    )}
                  </div>

                  {locationType === 'home' && (
                    <div style={{ marginBottom: 20 }}>
                      <label style={labelStyle}>Votre adresse</label>
                      <input value={address} onChange={e => setAddress(e.target.value)}
                        className="input" placeholder="Ex: 12 Rue Mohammed V, Casablanca" />
                      <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 6 }}>La prestataire se déplacera à cette adresse</div>
                    </div>
                  )}

                  <div style={{ marginBottom: 24 }}>
                    <label style={labelStyle}>Note pour la prestataire (optionnel)</label>
                    <textarea value={note} onChange={e => setNote(e.target.value)}
                      className="input" rows={3}
                      placeholder="Ex: Cheveux longs, couleur souhaitée, instructions d'accès..."
                      style={{ resize: 'vertical' }} />
                  </div>

                  <button className="btn btn-primary" onClick={() => setStep('confirm')}
                    disabled={locationType === 'home' && !address.trim()}>
                    Continuer →
                  </button>
                </div>
              )}

              {/* STEP 4: Confirm */}
              {step === 'confirm' && (
                <div style={{ maxWidth: 480 }}>
                  <h3 style={{ marginBottom: 24 }}>Récapitulatif</h3>

                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: 24, marginBottom: 20 }}>
                    {[
                      { label: 'Prestataire', value: pro?.user?.full_name },
                      { label: 'Service', value: selectedService?.name },
                      { label: 'Durée', value: `${selectedService?.duration_min} min` },
                      { label: 'Date', value: selectedDate?.toLocaleDateString('fr-MA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) },
                      { label: 'Heure', value: selectedSlot },
                      { label: 'Lieu', value: locationType === 'home' ? `🏠 ${address}` : `💇 ${pro?.address || 'Salon'}` },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-faint)' }}>{label}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, textAlign: 'right', maxWidth: 260 }}>{value}</span>
                      </div>
                    ))}

                    {/* Price breakdown */}
                    <div style={{ marginTop: 16, padding: '16px', background: 'var(--surface-2)', borderRadius: 'var(--r-md)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Prix du service</span>
                        <span style={{ fontSize: 13 }}>{selectedService?.price} MAD</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Frais de service (8%)</span>
                        <span style={{ fontSize: 13 }}>{commission.toFixed(0)} MAD</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                        <span style={{ fontWeight: 700 }}>Total</span>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--faby-gold)' }}>
                          {selectedService?.price} MAD
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ background: 'var(--faby-rose-light)', border: '1px solid var(--faby-rose-border)', borderRadius: 'var(--r-md)', padding: '12px 16px', marginBottom: 20, fontSize: 13, color: 'var(--faby-rose)' }}>
                    ✦ Paiement sécurisé — Votre réservation sera confirmée par la prestataire
                  </div>

                  <button className="btn btn-primary btn-lg" onClick={submitBooking} disabled={submitting}
                    style={{ width: '100%', justifyContent: 'center' }}>
                    {submitting ? 'Envoi...' : 'Confirmer la réservation'}
                  </button>

                  <p style={{ fontSize: 12, color: 'var(--text-faint)', textAlign: 'center', marginTop: 12 }}>
                    En confirmant, vous acceptez les CGU de Faby
                  </p>
                </div>
              )}
            </div>

            {/* RIGHT — Summary card */}
            <div style={{ position: 'sticky', top: 'calc(var(--nav-h) + 24px)' }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: 20 }}>
                <div style={{ fontSize: 12, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Récapitulatif</div>

                {selectedService ? (
                  <>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 20 }}>{CATEGORY_EMOJI[selectedService.category as ServiceCategory]}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{selectedService.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{selectedService.duration_min} min</div>
                      </div>
                      <div style={{ marginLeft: 'auto', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--faby-gold)' }}>{selectedService.price} MAD</div>
                    </div>

                    {selectedDate && selectedSlot && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                        📅 {selectedDate.toLocaleDateString('fr-MA', { day: 'numeric', month: 'short' })} à {selectedSlot}
                      </div>
                    )}
                    {locationType && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
                        {locationType === 'home' ? '🏠 À domicile' : '💇 En salon'}
                      </div>
                    )}

                    <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--r-md)', padding: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700 }}>
                        <span>Total</span>
                        <span style={{ color: 'var(--faby-gold)', fontFamily: 'var(--font-display)' }}>{selectedService.price} MAD</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <p style={{ fontSize: 13, color: 'var(--text-faint)', textAlign: 'center', padding: '16px 0' }}>
                    Sélectionnez un service
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600,
  color: 'var(--text-muted)', marginBottom: 6,
  letterSpacing: '0.05em', textTransform: 'uppercase',
}