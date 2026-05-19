import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app'
import './index.css'

const elem = document.getElementById('root')!
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

if (import.meta.hot) {
  ;(import.meta.hot.data.root ??= createRoot(elem)).render(app)
} else {
  createRoot(elem).render(app)
}
