import { NextRequest, NextResponse } from 'next/server'
import { validateAccessCode, setAuthCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { accessCode } = await request.json()

    if (!accessCode || typeof accessCode !== 'string') {
      return NextResponse.json(
        { error: 'รหัสเข้าใช้งานไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    if (!validateAccessCode(accessCode)) {
      return NextResponse.json(
        { error: 'รหัสเข้าใช้งานไม่ถูกต้อง' },
        { status: 401 }
      )
    }

    const response = NextResponse.json({ 
      success: true, 
      message: 'เข้าสู่ระบบสำเร็จ' 
    })
    
    setAuthCookie(response)
    
    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' },
      { status: 500 }
    )
  }
}
