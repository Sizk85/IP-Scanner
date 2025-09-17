import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { readIpList, addIps, updateIpRecord, deleteIp } from '@/lib/fs-json'
import type { IpRecord } from '@/lib/fs-json'

// GET /api/ips - อ่านรายการ IP ทั้งหมด
export async function GET(request: NextRequest) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const ipList = await readIpList()
    return NextResponse.json({ success: true, data: ipList })
  } catch (error) {
    console.error('Error reading IP list:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอ่านข้อมูล' },
      { status: 500 }
    )
  }
}

// POST /api/ips - เพิ่ม IP หลายตัว
export async function POST(request: NextRequest) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const { ips, notes } = await request.json()

    if (!Array.isArray(ips)) {
      return NextResponse.json(
        { error: 'ข้อมูล IP ไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    const ipRecords: IpRecord[] = ips.map(ip => ({
      ip,
      notes: notes || '',
      updatedAt: new Date().toISOString()
    }))

    const updatedList = await addIps(ipRecords)
    
    return NextResponse.json({ 
      success: true, 
      data: updatedList,
      message: `เพิ่ม IP สำเร็จ ${ipRecords.length} รายการ`
    })
  } catch (error) {
    console.error('Error adding IPs:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการเพิ่ม IP' },
      { status: 500 }
    )
  }
}

// PATCH /api/ips - อัปเดต IP record
export async function PATCH(request: NextRequest) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const updates = await request.json()
    const { ip, ...updateData } = updates

    if (!ip) {
      return NextResponse.json(
        { error: 'ไม่พบ IP address' },
        { status: 400 }
      )
    }

    const updatedList = await updateIpRecord(ip, updateData)
    
    return NextResponse.json({ 
      success: true, 
      data: updatedList,
      message: 'อัปเดตข้อมูลสำเร็จ'
    })
  } catch (error) {
    console.error('Error updating IP:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัปเดต' },
      { status: 500 }
    )
  }
}

// DELETE /api/ips - ลบ IP
export async function DELETE(request: NextRequest) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const ip = searchParams.get('ip')

    if (!ip) {
      return NextResponse.json(
        { error: 'ไม่พบ IP address' },
        { status: 400 }
      )
    }

    const updatedList = await deleteIp(ip)
    
    return NextResponse.json({ 
      success: true, 
      data: updatedList,
      message: 'ลบ IP สำเร็จ'
    })
  } catch (error) {
    console.error('Error deleting IP:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบ' },
      { status: 500 }
    )
  }
}
