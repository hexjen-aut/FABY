export type UserRole = 'client' | 'pro' | 'admin'

export type ServiceCategory =
  | 'coiffure'
  | 'esthetique'
  | 'manucure'
  | 'massage'
  | 'maquillage'

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'disputed'

export type LocationType = 'home' | 'salon'

export interface User {
  id: string
  auth_id: string
  full_name: string
  email: string
  phone?: string
  role: UserRole
  avatar_url?: string
  city?: string
  created_at: string
}

export interface Pro {
  id: string
  user_id: string
  bio?: string
  categories: ServiceCategory[]
  cities: string[]
  at_home: boolean
  in_salon: boolean
  address?: string
  rating: number
  review_count: number
  is_verified: boolean
  is_active: boolean
  created_at: string
  // joined
  user?: User
  services?: Service[]
  portfolios?: Portfolio[]
}

export interface Service {
  id: string
  pro_id: string
  name: string
  category: ServiceCategory
  description?: string
  duration_min: number
  price: number
  is_active: boolean
}

export interface Availability {
  id: string
  pro_id: string
  day_of_week: number // 0 = dimanche, 1 = lundi...
  start_time: string  // "09:00"
  end_time: string    // "18:00"
}

export interface Booking {
  id: string
  client_id: string
  pro_id: string
  service_id: string
  booked_at: string
  location_type: LocationType
  address?: string
  total_price: number
  commission: number
  status: BookingStatus
  payment_status: 'pending' | 'paid' | 'refunded'
  stripe_payment_id?: string
  // joined
  client?: User
  pro?: Pro
  service?: Service
}

export interface Review {
  id: string
  booking_id: string
  client_id: string
  pro_id: string
  rating: number       // 1-5
  comment?: string
  created_at: string
  client?: User
}

export interface Portfolio {
  id: string
  pro_id: string
  image_url: string
  caption?: string
  category?: ServiceCategory
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: 'booking_confirmed' | 'booking_cancelled' | 'new_review' | 'payment_received'
  message: string
  is_read: boolean
  created_at: string
}

// Constants
export const COMMISSION_RATE = 0.08

export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  coiffure:   'Coiffure',
  esthetique: 'Esthétique',
  manucure:   'Manucure & Pédicure',
  massage:    'Massage',
  maquillage: 'Maquillage',
}

export const CATEGORY_EMOJI: Record<ServiceCategory, string> = {
  coiffure:   '✂️',
  esthetique: '🌿',
  manucure:   '💅',
  massage:    '🤲',
  maquillage: '💄',
}

export const MOROCCAN_CITIES = [
  'Casablanca', 'Rabat', 'Marrakech', 'Tanger',
  'Fès', 'Agadir', 'Meknès', 'Oujda', 'Tétouan',
]
