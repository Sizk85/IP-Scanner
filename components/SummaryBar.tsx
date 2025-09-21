"use client"

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useIpScannerStore, useSummaryStats, useFilteredIpList } from '@/lib/store'
import { useToast } from '@/components/ui/use-toast'
import { useState, useEffect } from 'react'
import { 
  Download,
  Search,
  Filter,
  Clock,
  Wifi
} from 'lucide-react'

export default function SummaryBar() {
  const [nextScanCountdown, setNextScanCountdown] = useState<number>(0)
  const stats = useSummaryStats()
  const filteredIpList = useFilteredIpList()
  const { 
    statusFilter, 
    searchQuery, 
    setStatusFilter, 
    setSearchQuery,
    scanInfo,
    setScanInfo,
    isScanning,
    setScanning,
    updateIpRecord
  } = useIpScannerStore()
  const { toast } = useToast()

  // Background scanning logic
  useEffect(() => {
    const loadScanInfo = async () => {
      try {
        const response = await fetch('/api/scan-info')
        const result = await response.json()
        if (result.success) {
          setScanInfo(result.data)
        }
      } catch (error) {
        console.error('Error loading scan info:', error)
      }
    }

    loadScanInfo()
  }, [setScanInfo])

  // Countdown timer และ auto-scanning
  useEffect(() => {
    const updateCountdown = () => {
      if (scanInfo.nextScanTime) {
        const now = new Date().getTime()
        const nextScan = new Date(scanInfo.nextScanTime).getTime()
        const diff = Math.max(0, Math.floor((nextScan - now) / 1000))
        setNextScanCountdown(diff)

        // เมื่อถึงเวลาสแกน
        if (diff <= 0 && !isScanning && filteredIpList.length > 0) {
          performBackgroundScan()
        }
      }
    }

    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [scanInfo.nextScanTime, isScanning, filteredIpList])

  const performBackgroundScan = async () => {
    if (filteredIpList.length === 0) return

    setScanning(true)
    
    try {
      const ips = filteredIpList.map(record => record.ip)
      
      const response = await fetch('/api/ping/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ips })
      })

      const result = await response.json()

      if (result.success) {
        // อัปเดตผลลัพธ์ใน store
        for (const pingResult of result.data) {
          updateIpRecord(pingResult.ip, {
            lastStatus: pingResult.status,
            lastLatencyMs: pingResult.latencyMs,
            updatedAt: new Date().toISOString()
          })
          
          // อัปเดตใน database
          await fetch('/api/ips', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ip: pingResult.ip,
              lastStatus: pingResult.status,
              lastLatencyMs: pingResult.latencyMs
            })
          })
        }

        // โหลด scan info ใหม่
        const scanInfoResponse = await fetch('/api/scan-info')
        const scanInfoResult = await scanInfoResponse.json()
        if (scanInfoResult.success) {
          setScanInfo(scanInfoResult.data)
        }

        toast({
          title: "สแกนอัตโนมัติ",
          description: `สแกนเสร็จสิ้น ${result.data.length} IP`
        })
      }
    } catch (error) {
      console.error('Background scan error:', error)
    } finally {
      setScanning(false)
    }
  }

  const formatCountdown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const handleExportCSV = () => {
    const csvHeaders = ['ip', 'status', 'latencyMs', 'notes', 'updatedAt']
    const csvData = filteredIpList.map(record => [
      record.ip,
      record.lastStatus || '',
      record.lastLatencyMs || '',
      record.notes || '',
      record.updatedAt || ''
    ])
    
    const csvContent = [
      csvHeaders.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `ip-scan-results-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    
    toast({
      title: "สำเร็จ",
      description: "ส่งออกไฟล์ CSV แล้ว"
    })
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            สรุปผลการสแกน
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">ทั้งหมด</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.online}</div>
              <div className="text-sm text-muted-foreground">Online</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.offline}</div>
              <div className="text-sm text-muted-foreground">Offline</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.pending}</div>
              <div className="text-sm text-muted-foreground">รอสแกน</div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-4 items-center justify-between">
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {isScanning && (
                <div className="flex items-center gap-2">
                  <Wifi className="h-4 w-4 animate-pulse text-blue-500" />
                  <span>กำลังสแกน...</span>
                </div>
              )}
              
              {scanInfo.lastScanTime && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>สแกนล่าสุด: {new Date(scanInfo.lastScanTime).toLocaleTimeString('th-TH')}</span>
                </div>
              )}
              
              {nextScanCountdown > 0 && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span>สแกนถัดไป: {formatCountdown(nextScanCountdown)}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* Current Subnet Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">IP Addresses:</span>
              <Badge variant="secondary">ทุก Subnet</Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              แสดง {stats.total} รายการ
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
