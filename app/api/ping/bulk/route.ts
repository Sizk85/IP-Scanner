import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { addScanHistory, readScanInfo, writeScanInfo } from '@/lib/fs-json'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

interface PingResult {
  ip: string
  status: 'online' | 'offline'
  latencyMs?: number
}

// จำกัด concurrency เพื่อไม่ให้โหลดเครื่องมาก
const MAX_CONCURRENT_PINGS = 30

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

// ฟังก์ชันสำหรับ ping หลาย IP พร้อมกัน แต่จำกัด concurrency
async function pingMultipleIps(ips: string[]): Promise<PingResult[]> {
  const results: PingResult[] = []
  
  // แบ่ง IPs เป็น batches
  for (let i = 0; i < ips.length; i += MAX_CONCURRENT_PINGS) {
    const batch = ips.slice(i, i + MAX_CONCURRENT_PINGS)
    const batchPromises = batch.map(ip => pingIp(ip))
    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)
  }
  
  return results
}

// POST /api/ping/bulk - Ping หลาย IP
export async function POST(request: NextRequest) {
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const { ips } = await request.json()

    if (!Array.isArray(ips)) {
      return NextResponse.json(
        { error: 'ข้อมูล IPs ไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    if (ips.length === 0) {
      return NextResponse.json({ 
        success: true, 
        data: [] 
      })
    }

    if (ips.length > 500) {
      return NextResponse.json(
        { error: 'จำนวน IP มากเกินไป (สูงสุด 500)' },
        { status: 400 }
      )
    }

    // Validate IP formats
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
    const invalidIps = ips.filter((ip: string) => !ipRegex.test(ip))
    
    if (invalidIps.length > 0) {
      return NextResponse.json(
        { error: `รูปแบบ IP ไม่ถูกต้อง: ${invalidIps.join(', ')}` },
        { status: 400 }
      )
    }

    console.log(`Starting bulk ping for ${ips.length} IPs`)
    const results = await pingMultipleIps(ips)
    console.log(`Completed bulk ping for ${ips.length} IPs`)
    
    // บันทึกประวัติการสแกนทั้งหมด
    for (const result of results) {
      await addScanHistory(result.ip, result.status, result.latencyMs)
    }
    
    // อัปเดตข้อมูลการสแกนรวม
    const scanInfo = await readScanInfo()
    const now = new Date()
    const nextScan = new Date(now.getTime() + 10 * 60 * 1000) // +10 นาที
    
    await writeScanInfo({
      lastScanTime: now.toISOString(),
      nextScanTime: nextScan.toISOString(),
      totalScans: (scanInfo.totalScans || 0) + 1
    })
    
    return NextResponse.json({ 
      success: true, 
      data: results 
    })
  } catch (error) {
    console.error('Error in bulk ping:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการ ping แบบจำนวนมาก' },
      { status: 500 }
    )
  }
}
