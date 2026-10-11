import './styles/theme.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

const rootEl = document.getElementById('root')

window.addEventListener('error', (event) => {
  console.error('Renderer error:', event.error ?? event.message)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled rejection:', event.reason)
})

if (!rootEl) {
  throw new Error('No se encontró #root')
}

if (!window.api) {
  rootEl.innerHTML =
    '<p style="padding:2rem;font-family:sans-serif;color:#a63d2f">Error: preload IPC no disponible (window.api). Revisá sandbox/preload.</p>'
} else {
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
}
