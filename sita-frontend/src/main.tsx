import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'

// ═══════════════════════════════════════════════════════════════
// TanStack Query Configuration
// - staleTime: 3 menit — data dianggap fresh selama 3 menit
//   (navigasi ulang ke halaman sama → data instan dari cache)
// - gcTime: 10 menit — cache data dibuang setelah 10 menit idle
// - refetchOnWindowFocus: true — auto-refresh saat tab aktif kembali
// - retry: 1 — coba ulang sekali jika request gagal
// ═══════════════════════════════════════════════════════════════
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 3 * 60 * 1000,      // 3 menit
      gcTime: 10 * 60 * 1000,         // 10 menit
      refetchOnWindowFocus: true,
      retry: 1,
      refetchOnMount: true,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)
