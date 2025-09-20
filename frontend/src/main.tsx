import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MantineProvider } from '@mantine/core'
import { BrowserRouter as Router } from 'react-router-dom'


const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <QueryClientProvider client={queryClient}>
     <MantineProvider>
        <Router>
          <App />
        </Router>
      </MantineProvider>
      </QueryClientProvider>
  </StrictMode>,
)
