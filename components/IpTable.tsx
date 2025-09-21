"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { useFilteredIpList, useIpScannerStore } from '@/lib/store'
import { 
  Wifi, 
  WifiOff, 
  Clock, 
  Trash2, 
  Edit, 
  Check, 
  X, 
  Loader2,
  List,
  History
} from 'lucide-react'

export default function IpTable() {
  const filteredIpList = useFilteredIpList()
  const { updateIpRecord, removeIpRecord, scanningIps, setScanningIp } = useIpScannerStore()
  const [editingIp, setEditingIp] = useState<string | null>(null)
  const [editingNotes, setEditingNotes] = useState('')
  const [showHistory, setShowHistory] = useState<string | null>(null)
  const { toast } = useToast()

  const getStatusBadge = (status?: string, latencyMs?: number) => {
    switch (status) {
      case 'online':
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <Wifi className="h-3 w-3" />
            Online {latencyMs && `(${latencyMs}ms)`}
          </Badge>
        )
      case 'offline':
        return (
          <Badge variant="error" className="flex items-center gap-1">
            <WifiOff className="h-3 w-3" />
            Offline
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            รอสแกน
          </Badge>
        )
    }
  }

  const handlePingSingle = async (ip: string) => {
    setScanningIp(ip, true)
    
    try {
      const response = await fetch('/api/ping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ip })
      })

      const result = await response.json()

      if (result.success) {
        // อัปเดตใน store
        updateIpRecord(ip, {
          lastStatus: result.data.status,
          lastLatencyMs: result.data.latencyMs,
          updatedAt: new Date().toISOString()
        })
        
        // อัปเดตใน database
        await fetch('/api/ips', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ip,
            lastStatus: result.data.status,
            lastLatencyMs: result.data.latencyMs
          })
        })

        toast({
          title: "สำเร็จ",
          description: `Ping ${ip}: ${result.data.status}`
        })
      } else {
        toast({
          title: "ข้อผิดพลาด",
          description: result.error || 'เกิดข้อผิดพลาดในการ ping',
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error pinging IP:', error)
      toast({
        title: "ข้อผิดพลาด",
        description: 'เกิดข้อผิดพลาดในการ ping',
        variant: "destructive"
      })
    } finally {
      setScanningIp(ip, false)
    }
  }

  const handleDeleteIp = async (ip: string) => {
    if (!confirm(`ต้องการลบ IP ${ip} หรือไม่?`)) {
      return
    }

    try {
      const response = await fetch(`/api/ips?ip=${encodeURIComponent(ip)}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        removeIpRecord(ip)
        toast({
          title: "สำเร็จ",
          description: `ลบ IP ${ip} แล้ว`
        })
      } else {
        toast({
          title: "ข้อผิดพลาด",
          description: result.error || 'เกิดข้อผิดพลาดในการลบ',
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error deleting IP:', error)
      toast({
        title: "ข้อผิดพลาด",
        description: 'เกิดข้อผิดพลาดในการลบ',
        variant: "destructive"
      })
    }
  }

  const handleEditNotes = (ip: string, currentNotes: string = '') => {
    setEditingIp(ip)
    setEditingNotes(currentNotes)
  }

  const handleSaveNotes = async (ip: string) => {
    try {
      const response = await fetch('/api/ips', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ip,
          notes: editingNotes.trim()
        })
      })

      const result = await response.json()

      if (result.success) {
        updateIpRecord(ip, {
          notes: editingNotes.trim(),
          updatedAt: new Date().toISOString()
        })
        
        setEditingIp(null)
        setEditingNotes('')
        
        toast({
          title: "สำเร็จ",
          description: "บันทึก Notes แล้ว"
        })
      } else {
        toast({
          title: "ข้อผิดพลาด",
          description: result.error || 'เกิดข้อผิดพลาดในการบันทึก',
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error saving notes:', error)
      toast({
        title: "ข้อผิดพลาด",
        description: 'เกิดข้อผิดพลาดในการบันทึก',
        variant: "destructive"
      })
    }
  }

  const handleCancelEdit = () => {
    setEditingIp(null)
    setEditingNotes('')
  }

  if (filteredIpList.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <List className="h-5 w-5" />
            รายการ IP Address
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            ไม่มีข้อมูล IP Address
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <List className="h-5 w-5" />
          รายการ IP Address ({filteredIpList.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">IP Address</TableHead>
                <TableHead className="w-[180px]">Status</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="w-[120px]">อัปเดตล่าสุด</TableHead>
                <TableHead className="w-[150px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIpList.map((record) => (
                <>
                <TableRow key={record.ip}>
                  <TableCell className="font-mono font-medium">
                    {record.ip}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {scanningIps.has(record.ip) && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      {getStatusBadge(record.lastStatus, record.lastLatencyMs)}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {editingIp === record.ip ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editingNotes}
                          onChange={(e) => setEditingNotes(e.target.value)}
                          className="h-8"
                          placeholder="หมายเหตุ..."
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSaveNotes(record.ip)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelEdit}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {record.notes || '-'}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditNotes(record.ip, record.notes)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                  
                  <TableCell className="text-sm text-muted-foreground">
                    {record.updatedAt 
                      ? new Date(record.updatedAt).toLocaleTimeString('th-TH', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })
                      : '-'
                    }
                  </TableCell>
                  
                  <TableCell className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePingSingle(record.ip)}
                        disabled={scanningIps.has(record.ip)}
                        title="Ping IP"
                      >
                        <Wifi className="h-3 w-3" />
                      </Button>
                      
                      {record.scanHistory && record.scanHistory.length > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowHistory(showHistory === record.ip ? null : record.ip)}
                          title="ดูประวัติการสแกน"
                        >
                          <History className="h-3 w-3" />
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteIp(record.ip)}
                        title="ลบ IP"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                
                {/* แสดงประวัติการสแกน */}
                {showHistory === record.ip && record.scanHistory && (
                  <TableRow>
                    <TableCell colSpan={5} className="bg-muted/50">
                      <div className="p-4">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <History className="h-4 w-4" />
                          ประวัติการสแกน {record.ip}
                        </h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {record.scanHistory.slice(0, 10).map((entry, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                {entry.status === 'online' ? (
                                  <Wifi className="h-3 w-3 text-green-500" />
                                ) : (
                                  <WifiOff className="h-3 w-3 text-red-500" />
                                )}
                                <span className={entry.status === 'online' ? 'text-green-600' : 'text-red-600'}>
                                  {entry.status === 'online' ? 'Online' : 'Offline'}
                                </span>
                                {entry.latencyMs && (
                                  <span className="text-muted-foreground">({entry.latencyMs}ms)</span>
                                )}
                              </div>
                              <span className="text-muted-foreground">
                                {new Date(entry.timestamp).toLocaleString('th-TH')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
