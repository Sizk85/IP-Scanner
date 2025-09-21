import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { addScanHistory } from '@/lib/fs-json'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

interface PingResult {
  ip: string
  status: 'online' | 'offline'
  latencyMs?: number
}

async function pingIp(ip: string): Promise<PingResult> {
  try {
    // ใช้คำสั่ง ping สำหรับ Windows และ Linux/Mac
    const isWindows = process.platform === 'win32'
    const command = isWindows 
      ? `ping -n 1 -w 1500 ${ip}` 
      : `ping -c 1 -W 1 ${ip}`

    const { stdout, stderr } = await execAsync(command)
    
    if (stderr) {
      return { ip, status: 'offline' }
    }

    // Parse latency จาก output
    let latencyMs: number | undefined
    
    if (isWindows) {
      // Windows: "Average = 23ms" หรือ "time=23ms"
      const match = stdout.match(/(?:Average = |time[<=])(\d+)ms/i)
      if (match) {
        latencyMs = parseInt(match[1], 10)
      }
    } else {
      // Linux/Mac: "time=23.4 ms"
      const match = stdout.match(/time=(\d+\.?\d*)\s*ms/i)
      if (match) {
        latencyMs = Math.round(parseFloat(match[1]))
      }
    }

    // ตรวจสอบว่า ping สำเร็จหรือไม่
    const success = isWindows 
      ? stdout.includes('Reply from') || stdout.includes('bytes from')
      : stdout.includes('bytes from') || stdout.includes('1 packets transmitted, 1 received')

    if (success) {
      return { 
        ip, 
        status: 'online', 
        latencyMs: latencyMs || 0 
      }
    } else {
      return { ip, status: 'offline' }
    }
  } catch (error) {
    // Timeout หรือ error อื่นๆ รวมเป็น offline
    return { ip, status: 'offline' }
  }
}

// POST /api/ping - Ping IP เดี่ยว
export async function POST(request: NextRequest) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const { ip } = await request.json()

    if (!ip || typeof ip !== 'string') {
      return NextResponse.json(
        { error: 'IP address ไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    // Validate IP format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
    if (!ipRegex.test(ip)) {
      return NextResponse.json(
        { error: 'รูปแบบ IP address ไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    const result = await pingIp(ip)
    
    // บันทึกประวัติการสแกน
    await addScanHistory(ip, result.status, result.latencyMs)
    
    return NextResponse.json({ 
      success: true, 
      data: result 
    })
  } catch (error) {
    console.error('Error pinging IP:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการ ping' },
      { status: 500 }
    )
  }
}
