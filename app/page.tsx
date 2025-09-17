import { redirect } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'

export default function HomePage() {
  // ตรวจสอบสถานะการล็อกอิน
  const authenticated = isAuthenticated()
  
  if (authenticated) {
    redirect('/scan')
  } else {
    redirect('/login')
  }
}
