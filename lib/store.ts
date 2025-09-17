import { create } from 'zustand'

export interface IpRecord {
  ip: string
  lastStatus?: 'online' | 'offline' | 'timeout'
  lastLatencyMs?: number
  notes?: string
  updatedAt?: string
}

export interface PingResult {
  ip: string
  status: 'online' | 'offline' | 'timeout'
  latencyMs?: number
}

interface IpScannerState {
  // ข้อมูล IP
  ipList: IpRecord[]
  
  // สถานะการสแกน
  isScanning: boolean
  scanningIps: Set<string>
  
  // การกรอง
  statusFilter: 'all' | 'online' | 'offline' | 'timeout'
  searchQuery: string
  
  // Actions
  setIpList: (ips: IpRecord[]) => void
  updateIpRecord: (ip: string, updates: Partial<IpRecord>) => void
  removeIpRecord: (ip: string) => void
  
  // Scanning
  setScanning: (isScanning: boolean) => void
  setScanningIp: (ip: string, isScanning: boolean) => void
  
  // Filtering
  setStatusFilter: (filter: 'all' | 'online' | 'offline' | 'timeout') => void
  setSearchQuery: (query: string) => void
}

export const useIpScannerStore = create<IpScannerState>((set, get) => ({
  ipList: [],
  isScanning: false,
  scanningIps: new Set(),
  statusFilter: 'all',
  searchQuery: '',

  setIpList: (ips) => set({ ipList: ips }),
  
  updateIpRecord: (ip, updates) => set((state) => ({
    ipList: state.ipList.map(record =>
      record.ip === ip ? { ...record, ...updates } : record
    )
  })),
  
  removeIpRecord: (ip) => set((state) => ({
    ipList: state.ipList.filter(record => record.ip !== ip)
  })),
  
  setScanning: (isScanning) => set({ isScanning }),
  
  setScanningIp: (ip, isScanning) => set((state) => {
    const newScanningIps = new Set(state.scanningIps)
    if (isScanning) {
      newScanningIps.add(ip)
    } else {
      newScanningIps.delete(ip)
    }
    return { scanningIps: newScanningIps }
  }),
  
  setStatusFilter: (filter) => set({ statusFilter: filter }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}))

// Selectors
export const useFilteredIpList = () => {
  const { ipList, statusFilter, searchQuery } = useIpScannerStore()
  
  return ipList.filter(record => {
    // กรองตามสถานะ
    if (statusFilter !== 'all' && record.lastStatus !== statusFilter) {
      return false
    }
    
    // กรองตามการค้นหา
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        record.ip.toLowerCase().includes(query) ||
        (record.notes && record.notes.toLowerCase().includes(query))
      )
    }
    
    return true
  })
}

export const useSummaryStats = () => {
  const ipList = useFilteredIpList()
  
  return {
    total: ipList.length,
    online: ipList.filter(ip => ip.lastStatus === 'online').length,
    offline: ipList.filter(ip => ip.lastStatus === 'offline').length,
    timeout: ipList.filter(ip => ip.lastStatus === 'timeout').length,
    pending: ipList.filter(ip => !ip.lastStatus).length
  }
}
