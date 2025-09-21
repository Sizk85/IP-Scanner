import { promises as fs } from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const IP_LIST_FILE = path.join(DATA_DIR, 'ip-list.json')
const SCAN_INFO_FILE = path.join(DATA_DIR, 'scan-info.json')

export interface ScanHistoryEntry {
  timestamp: string
  status: 'online' | 'offline'
  latencyMs?: number
}

export interface IpRecord {
  ip: string
  lastStatus?: 'online' | 'offline'
  lastLatencyMs?: number
  notes?: string
  updatedAt?: string
  scanHistory?: ScanHistoryEntry[]
}

export interface GlobalScanInfo {
  lastScanTime?: string
  nextScanTime?: string
  totalScans?: number
}

let writeLock = false

async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR)
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true })
  }
}

async function ensureIpListFile() {
  await ensureDataDir()
  try {
    await fs.access(IP_LIST_FILE)
  } catch {
    // สร้างไฟล์เริ่มต้นแบบเปล่า
    const initialData: IpRecord[] = []
    await fs.writeFile(IP_LIST_FILE, JSON.stringify(initialData, null, 2))
  }
}

export async function readIpList(): Promise<IpRecord[]> {
  await ensureIpListFile()
  try {
    const data = await fs.readFile(IP_LIST_FILE, 'utf-8')
    return JSON.parse(data) as IpRecord[]
  } catch (error) {
    console.error('Error reading IP list:', error)
    return []
  }
}

export async function writeIpList(data: IpRecord[]): Promise<void> {
  // Simple lock mechanism to prevent race conditions
  while (writeLock) {
    await new Promise(resolve => setTimeout(resolve, 10))
  }
  
  writeLock = true
  try {
    await ensureDataDir()
    await fs.writeFile(IP_LIST_FILE, JSON.stringify(data, null, 2))
  } finally {
    writeLock = false
  }
}

export async function addIps(newIps: IpRecord[]): Promise<IpRecord[]> {
  const existingData = await readIpList()
  const existingIps = new Set(existingData.map(item => item.ip))
  
  // เพิ่มเฉพาะ IP ที่ยังไม่มี
  const uniqueNewIps = newIps.filter(item => !existingIps.has(item.ip))
  const updatedData = [...existingData, ...uniqueNewIps]
  
  await writeIpList(updatedData)
  return updatedData
}

export async function updateIpRecord(ip: string, updates: Partial<IpRecord>): Promise<IpRecord[]> {
  const data = await readIpList()
  const index = data.findIndex(item => item.ip === ip)
  
  if (index !== -1) {
    data[index] = { ...data[index], ...updates, updatedAt: new Date().toISOString() }
    await writeIpList(data)
  }
  
  return data
}

export async function deleteIp(ip: string): Promise<IpRecord[]> {
  const data = await readIpList()
  const filteredData = data.filter(item => item.ip !== ip)
  await writeIpList(filteredData)
  return filteredData
}

// Global scan info functions
export async function readScanInfo(): Promise<GlobalScanInfo> {
  try {
    await ensureDataDir()
    const data = await fs.readFile(SCAN_INFO_FILE, 'utf-8')
    return JSON.parse(data) as GlobalScanInfo
  } catch {
    const defaultInfo: GlobalScanInfo = {
      totalScans: 0
    }
    await writeScanInfo(defaultInfo)
    return defaultInfo
  }
}

export async function writeScanInfo(info: GlobalScanInfo): Promise<void> {
  while (writeLock) {
    await new Promise(resolve => setTimeout(resolve, 10))
  }
  
  writeLock = true
  try {
    await ensureDataDir()
    await fs.writeFile(SCAN_INFO_FILE, JSON.stringify(info, null, 2))
  } finally {
    writeLock = false
  }
}

export async function addScanHistory(ip: string, status: 'online' | 'offline', latencyMs?: number): Promise<void> {
  const data = await readIpList()
  const index = data.findIndex(item => item.ip === ip)
  
  if (index !== -1) {
    if (!data[index].scanHistory) {
      data[index].scanHistory = []
    }
    
    // เพิ่มประวัติใหม่
    data[index].scanHistory.unshift({
      timestamp: new Date().toISOString(),
      status,
      latencyMs
    })
    
    // เก็บแค่ 50 รายการล่าสุด
    if (data[index].scanHistory.length > 50) {
      data[index].scanHistory = data[index].scanHistory.slice(0, 50)
    }
    
    await writeIpList(data)
  }
}
