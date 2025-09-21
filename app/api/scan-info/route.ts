import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { readScanInfo } from '@/lib/fs-json'

// GET /api/scan-info - ดึงข้อมูลการสแกนรวม
export async function GET(request: NextRequest) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const scanInfo = await readScanInfo()
    return NextResponse.json({ 
      success: true, 
      data: scanInfo 
    })
  } catch (error) {
    console.error('Error reading scan info:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอ่านข้อมูลการสแกน' },
      { status: 500 }
    )
  }
}
