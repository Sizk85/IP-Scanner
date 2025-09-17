import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { writeIpList } from '@/lib/fs-json'

// DELETE /api/ips/clear - ลบ IP ทั้งหมด
export async function DELETE(request: NextRequest) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    // เคลียร์ข้อมูลทั้งหมด
    await writeIpList([])
    
    return NextResponse.json({ 
      success: true, 
      message: 'ลบ IP Address ทั้งหมดแล้ว'
    })
  } catch (error) {
    console.error('Error clearing all IPs:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบ IP ทั้งหมด' },
      { status: 500 }
    )
  }
}
