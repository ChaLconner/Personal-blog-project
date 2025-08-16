import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import jwtInterceptor from './utils/jwtInterceptor'

// Initialize JWT interceptor
jwtInterceptor();

createRoot(document.getElementById('root')).render(
    <App />
)
