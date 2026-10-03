import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { Login } from './login.tsx'
import './index.css'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './query-client.ts'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
        <Login />
    </QueryClientProvider>
  </StrictMode>,
)
