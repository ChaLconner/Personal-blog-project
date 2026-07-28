import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ตรวจสอบว่าไม่มีการ redirect ที่ไม่จำเป็นใน URL ปัจจุบัน
if (window.location.pathname === '/' && window.location.search.includes('redirect=')) {
  // ล้าง query parameters ที่อาจทำให้ redirect ไปหน้า login
  const url = new URL(window.location);
  url.searchParams.delete('redirect');
  url.searchParams.delete('from');
  window.history.replaceState({}, '', url);
}

// ตรวจสอบว่าไม่มีการ redirect ไปยังหน้า auth/get-user โดยตรง
if (window.location.pathname === '/auth/get-user') {
  // ถ้าผู้ใช้พยายามเข้าถึง /auth/get-user โดยตรง ให้ redirect ไปหน้าแรก
  window.location.replace('/');
}

createRoot(document.getElementById('root')).render(
    <App />
)

