import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { readScanInfo, writeScanInfo } from '@/lib/fs-json'

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

// POST /api/scan-info - อัปเดตข้อมูลการสแกนรวม
export async function POST(request: NextRequest) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const updates = await request.json()
    const currentInfo = await readScanInfo()
    const updatedInfo = { ...currentInfo, ...updates }
    
    await writeScanInfo(updatedInfo)
    
    return NextResponse.json({ 
      success: true, 
      data: updatedInfo 
    })
  } catch (error) {
    console.error('Error updating scan info:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลการสแกน' },
      { status: 500 }
    )
  }
}
