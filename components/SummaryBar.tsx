"use client"

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useIpScannerStore, useSummaryStats, useFilteredIpList } from '@/lib/store'
import { useToast } from '@/components/ui/use-toast'
import { 
  Download,
  Search,
  Filter
} from 'lucide-react'

export default function SummaryBar() {
  const stats = useSummaryStats()
  const filteredIpList = useFilteredIpList()
  const { 
    statusFilter, 
    searchQuery, 
    setStatusFilter, 
    setSearchQuery
  } = useIpScannerStore()
  const { toast } = useToast()



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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
              <div className="text-2xl font-bold text-yellow-600">{stats.timeout}</div>
              <div className="text-sm text-muted-foreground">Timeout</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.pending}</div>
              <div className="text-sm text-muted-foreground">รอสแกน</div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-4">
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
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
              {['all', 'online', 'offline', 'timeout'].map((filter) => (
                <Badge
                  key={filter}
                  variant={statusFilter === filter ? 'default' : 'outline'}
                  className="cursor-pointer px-3 py-1"
                  onClick={() => setStatusFilter(filter as any)}
                >
                  {filter === 'all' ? 'ทั้งหมด' : 
                   filter === 'online' ? 'Online' : 
                   filter === 'offline' ? 'Offline' : 'Timeout'}
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
