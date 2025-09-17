export interface ParsedIp {
  ip: string
  isValid: boolean
}

// ตรวจสอบว่า IP address ถูกต้อง
export function isValidIpAddress(ip: string): boolean {
  const parts = ip.split('.')
  if (parts.length !== 4) return false
  
  return parts.every(part => {
    const num = parseInt(part, 10)
    return !isNaN(num) && num >= 0 && num <= 255
  })
}

// ตรวจสอบว่า IP address ถูกต้อง (ไม่จำกัด subnet)
export function isInAllowedSubnet(ip: string): boolean {
  return isValidIpAddress(ip)
}

// แปลง range เป็น array ของ IP
function expandRange(start: number, end: number, subnet: string): string[] {
  const ips: string[] = []
  for (let i = start; i <= end && i <= 255; i++) {
    ips.push(`${subnet}.${i}`)
  }
  return ips
}

// แยกวิเคราะห์ส่วนของ IP ที่เป็นตัวเลข (octet สุดท้าย)
function parseLastOctet(input: string): number[] {
  const results: number[] = []
  
  // แยกด้วย comma
  const parts = input.split(',').map(part => part.trim())
  
  for (const part of parts) {
    if (part.includes('-')) {
      // กรณี range เช่น 1-10
      const [startStr, endStr] = part.split('-').map(s => s.trim())
      const start = parseInt(startStr, 10)
      const end = parseInt(endStr, 10)
      
      if (!isNaN(start) && !isNaN(end) && start >= 0 && end <= 255 && start <= end) {
        for (let i = start; i <= end; i++) {
          results.push(i)
        }
      }
    } else {
      // กรณีเดี่ยว
      const num = parseInt(part, 10)
      if (!isNaN(num) && num >= 0 && num <= 255) {
        results.push(num)
      }
    }
  }
  
  return results
}

export function parseIpInput(input: string, defaultSubnet?: string): ParsedIp[] {
  const trimmedInput = input.trim()
  if (!trimmedInput) return []
  
  const results: ParsedIp[] = []
  
  // แยกด้วย comma สำหรับหลาย IP
  const ipParts = trimmedInput.split(',').map(part => part.trim())
  
  for (const part of ipParts) {
    if (part.includes('xxx')) {
      // กรณี wildcard xxx = 0-255
      const basePart = part.replace('.xxx', '')
      // ตรวจสอบว่าเป็น subnet ที่ถูกต้อง (3 octets)
      const subnetParts = basePart.split('.')
      if (subnetParts.length === 3 && subnetParts.every(octet => {
        const num = parseInt(octet, 10)
        return !isNaN(num) && num >= 0 && num <= 255
      })) {
        // สร้าง IP ทั้งช่วง 0-255
        for (let i = 0; i <= 255; i++) {
          const ip = `${basePart}.${i}`
          results.push({ ip, isValid: true })
        }
      }
    } else if (part.includes('.')) {
      // กรณีมี dot = IP address เต็ม
      if (part.includes('-')) {
        // กรณี IP range เช่น 192.168.1.1-50
        const lastDotIndex = part.lastIndexOf('.')
        const subnet = part.substring(0, lastDotIndex)
        const rangePart = part.substring(lastDotIndex + 1)
        
        if (rangePart.includes('-')) {
          const [startStr, endStr] = rangePart.split('-').map(s => s.trim())
          const start = parseInt(startStr, 10)
          const end = parseInt(endStr, 10)
          
          if (!isNaN(start) && !isNaN(end) && start >= 0 && end <= 255 && start <= end) {
            const expandedIps = expandRange(start, end, subnet)
            for (const ip of expandedIps) {
              const isValid = isValidIpAddress(ip)
              results.push({ ip, isValid })
            }
          }
        }
      } else {
        // กรณี IP เดี่ยว
        const isValid = isValidIpAddress(part)
        results.push({ ip: part, isValid })
      }
    } else {
      // กรณีไม่มี dot = ใช้ default subnet (ถ้ามี)
      if (defaultSubnet) {
        const octets = parseLastOctet(part)
        for (const octet of octets) {
          const ip = `${defaultSubnet}.${octet}`
          const isValid = isValidIpAddress(ip)
          results.push({ ip, isValid })
        }
      } else {
        // ไม่มี default subnet ให้ถือว่าไม่ถูกต้อง
        results.push({ ip: part, isValid: false })
      }
    }
  }
  
  // ลบ IP ที่ซ้ำ
  const uniqueResults = results.reduce((acc: ParsedIp[], current) => {
    if (!acc.find(item => item.ip === current.ip)) {
      acc.push(current)
    }
    return acc
  }, [])
  
  return uniqueResults
}

// ตัวอย่างการใช้งาน:
// parseIpInput('192.168.1.xxx') → 256 IPs
// parseIpInput('1-5,10,20-22', '192.168.1') → 192.168.1.1, .2, .3, .4, .5, .10, .20, .21, .22
// parseIpInput('192.168.1.7') → 192.168.1.7
// parseIpInput('10.0.0.1-50') → 10.0.0.1 ถึง 10.0.0.50
