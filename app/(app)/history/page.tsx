"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { 
  History, 
  ArrowLeft, 
  Wifi, 
  WifiOff, 
  Search,
  Calendar,
  StickyNote
} from 'lucide-react'

interface ScanHistoryEntry {
  timestamp: string
  status: 'online' | 'offline'
  latencyMs?: number
}

interface IpRecord {
  ip: string
  lastStatus?: 'online' | 'offline'
  lastLatencyMs?: number
  notes?: string
  updatedAt?: string
  scanHistory?: ScanHistoryEntry[]
}

interface HistoryRecord {
  ip: string
  notes?: string
  timestamp: string
  status: 'online' | 'offline'
  latencyMs?: number
}

export default function HistoryPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [historyData, setHistoryData] = useState<HistoryRecord[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all')
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const loadHistoryData = async () => {
      try {
        const response = await fetch('/api/ips')
        
        if (response.status === 401) {
          router.push('/login')
          return
        }

        const result = await response.json()
        
        if (result.success) {
          // แปลงข้อมูลเป็น flat history list
          const allHistory: HistoryRecord[] = []
          
          result.data.forEach((ipRecord: IpRecord) => {
            if (ipRecord.scanHistory) {
              ipRecord.scanHistory.forEach((entry: ScanHistoryEntry) => {
                allHistory.push({
                  ip: ipRecord.ip,
                  notes: ipRecord.notes,
                  timestamp: entry.timestamp,
                  status: entry.status,
                  latencyMs: entry.latencyMs
                })
              })
            }
          })
          
          // เรียงตามเวลาล่าสุด
          allHistory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          
          setHistoryData(allHistory)
        } else {
          toast({
            title: "ข้อผิดพลาด",
            description: result.error || 'เกิดข้อผิดพลาดในการโหลดประวัติ',
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error('Error loading history:', error)
        toast({
          title: "ข้อผิดพลาด",
          description: 'เกิดข้อผิดพลาดในการโหลดประวัติ',
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadHistoryData()
  }, [router, toast])

  // กรองข้อมูล
  const filteredHistory = historyData.filter(record => {
    // กรองตามสถานะ
    if (statusFilter !== 'all' && record.status !== statusFilter) {
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <History className="h-8 w-8 animate-pulse mx-auto mb-2" />
          <div>กำลังโหลดประวัติ...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                onClick={() => router.push('/scan')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                กลับ
              </Button>
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <History className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">ประวัติการสแกน</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Filter and Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="ค้นหา IP หรือ Notes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {['all', 'online', 'offline'].map((filter) => (
                    <Badge
                      key={filter}
                      variant={statusFilter === filter ? 'default' : 'outline'}
                      className="cursor-pointer px-3 py-1"
                      onClick={() => setStatusFilter(filter as any)}
                    >
                      {filter === 'all' ? 'ทั้งหมด' : 
                       filter === 'online' ? 'Online' : 'Offline'}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* History Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                ประวัติการสแกนทั้งหมด ({filteredHistory.length} รายการ)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  ไม่มีประวัติการสแกน
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[150px]">IP Address</TableHead>
                        <TableHead className="w-[120px]">Status</TableHead>
                        <TableHead className="w-[100px]">Latency</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="w-[180px]">เวลาสแกน</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredHistory.map((record, index) => (
                        <TableRow key={`${record.ip}-${record.timestamp}-${index}`}>
                          <TableCell className="font-mono font-medium">
                            {record.ip}
                          </TableCell>
                          
                          <TableCell>
                            {record.status === 'online' ? (
                              <Badge variant="success" className="flex items-center gap-1 w-fit">
                                <Wifi className="h-3 w-3" />
                                Online
                              </Badge>
                            ) : (
                              <Badge variant="error" className="flex items-center gap-1 w-fit">
                                <WifiOff className="h-3 w-3" />
                                Offline
                              </Badge>
                            )}
                          </TableCell>
                          
                          <TableCell className="text-sm">
                            {record.latencyMs ? `${record.latencyMs}ms` : '-'}
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {record.notes && (
                                <StickyNote className="h-3 w-3 text-muted-foreground" />
                              )}
                              <span className="text-sm">
                                {record.notes || '-'}
                              </span>
                            </div>
                          </TableCell>
                          
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(record.timestamp).toLocaleString('th-TH')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
