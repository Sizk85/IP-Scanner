"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { parseIpInput } from '@/lib/ip-parse'
import { useIpScannerStore } from '@/lib/store'
import { Plus, HelpCircle, Trash2 } from 'lucide-react'

export default function AddIpForm() {
  const [ipInput, setIpInput] = useState('')
  const [notes, setNotes] = useState('')
  const [defaultSubnet, setDefaultSubnet] = useState('192.168.1')
  const [isLoading, setIsLoading] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const { toast } = useToast()
  const { setIpList } = useIpScannerStore()

  const handleClearAllIps = async () => {
    if (!confirm('ต้องการลบ IP Address ทั้งหมดหรือไม่?')) {
      return
    }

    try {
      // เรียก API เพื่อลบ IP ทั้งหมด
      const response = await fetch('/api/ips/clear', {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        setIpList([])
        toast({
          title: "สำเร็จ",
          description: "ลบ IP Address ทั้งหมดแล้ว"
        })
      } else {
        toast({
          title: "ข้อผิดพลาด",
          description: result.error || 'เกิดข้อผิดพลาดในการลบ',
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error clearing all IPs:', error)
      toast({
        title: "ข้อผิดพลาด",
        description: 'เกิดข้อผิดพลาดในการลบ IP ทั้งหมด',
        variant: "destructive"
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!ipInput.trim()) {
      toast({
        title: "ข้อผิดพลาด",
        description: "กรุณากรอก IP address",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    
    try {
      // Parse IP input with default subnet
      const parsedIps = parseIpInput(ipInput.trim(), defaultSubnet.trim())
      
      if (parsedIps.length === 0) {
        toast({
          title: "ข้อผิดพลาด",
          description: "ไม่พบ IP address ที่ถูกต้อง",
          variant: "destructive"
        })
        return
      }

      // ตรวจสอบ IP ที่ไม่ถูกต้อง
      const invalidIps = parsedIps.filter(ip => !ip.isValid)
      if (invalidIps.length > 0) {
        toast({
          title: "ข้อผิดพลาด",
          description: `IP ไม่ถูกต้อง: ${invalidIps.map(ip => ip.ip).join(', ')}`,
          variant: "destructive"
        })
        return
      }

      const validIps = parsedIps.filter(ip => ip.isValid).map(ip => ip.ip)

      // เพิ่ม IP ผ่าน API
      const response = await fetch('/api/ips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ips: validIps,
          notes: notes.trim()
        })
      })

      const result = await response.json()

      if (result.success) {
        setIpList(result.data)
        setIpInput('')
        setNotes('')
        toast({
          title: "สำเร็จ",
          description: result.message
        })
      } else {
        toast({
          title: "ข้อผิดพลาด",
          description: result.error || 'เกิดข้อผิดพลาดในการเพิ่ม IP',
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error adding IPs:', error)
      toast({
        title: "ข้อผิดพลาด",
        description: 'เกิดข้อผิดพลาดในการเพิ่ม IP',
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            เพิ่ม IP Address
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHelp(!showHelp)}
            className="text-muted-foreground"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          เพิ่ม IP address เดี่ยวหรือหลายตัวพร้อมกัน
        </CardDescription>
      </CardHeader>
      <CardContent>
        {showHelp && (
          <div className="mb-4 p-3 bg-muted rounded-md text-sm">
            <h4 className="font-medium mb-2">รูปแบบที่รองรับ:</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• <code>192.168.1.7</code> - IP เดี่ยว</li>
              <li>• <code>192.168.1.1-50</code> - ช่วง IP</li>
              <li>• <code>1-10,20,30-35</code> - หลายค่า (ใช้ Default Subnet)</li>
              <li>• <code>192.168.1.xxx</code> - ทั้งช่วง 0-255</li>
              <li>• คั่นด้วยคอมมา เช่น <code>1,5,10-15</code></li>
            </ul>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Default Subnet (สำหรับรูปแบบย่อ)</label>
            <Input
              placeholder="เช่น 192.168.1 หรือ 10.0.0"
              value={defaultSubnet}
              onChange={(e) => setDefaultSubnet(e.target.value)}
              disabled={isLoading}
              className="mb-3"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">IP Address</label>
            <Input
              placeholder="เช่น 192.168.1.1-50 หรือ 1,5,10-20 หรือ 192.168.1.xxx"
              value={ipInput}
              onChange={(e) => setIpInput(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div>
            <Textarea
              placeholder="หมายเหตุ (ไม่บังคับ)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isLoading}
              rows={2}
            />
          </div>
          
          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading} className="flex-1">
              <Plus className="mr-2 h-4 w-4" />
              {isLoading ? 'กำลังเพิ่ม...' : 'เพิ่ม IP'}
            </Button>
            
            <Button 
              type="button" 
              variant="destructive"
              onClick={handleClearAllIps}
              disabled={isLoading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              เคลียร์ทั้งหมด
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
