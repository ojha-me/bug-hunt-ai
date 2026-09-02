import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@fontsource-variable/inter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MantineProvider, localStorageColorSchemeManager } from '@mantine/core'
import { BrowserRouter as Router } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { Notifications } from "@mantine/notifications";
import { theme } from "./theme";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
})
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

const colorSchemeManager = localStorageColorSchemeManager({
  key: 'bughunt-color-scheme',
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <MantineProvider
          theme={theme}
          defaultColorScheme="light"
          colorSchemeManager={colorSchemeManager}
        >
          <Notifications position="top-right" zIndex={5000} />
          <Router>
            <App />
          </Router>
        </MantineProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)