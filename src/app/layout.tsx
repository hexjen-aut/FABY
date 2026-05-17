import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Faby — La beauté à portée de main',
    template: '%s | Faby',
  },
  description: 'Trouvez les meilleures professionnelles de beauté près de chez vous au Maroc. Coiffure, esthétique, manucure, massage, maquillage.',
  keywords: ['coiffeuse à domicile', 'esthéticienne Maroc', 'manucure Casablanca', 'beauté à domicile'],
  openGraph: {
    title: 'Faby — La beauté à portée de main',
    description: 'Réservez vos prestataires beauté en ligne au Maroc',
    type: 'website',
    locale: 'fr_MA',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: 'var(--surface)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: 'var(--success)', secondary: 'var(--bg)' },
            },
            error: {
              iconTheme: { primary: 'var(--error)', secondary: 'var(--bg)' },
            },
          }}
        />
      </body>
    </html>
  )
}
