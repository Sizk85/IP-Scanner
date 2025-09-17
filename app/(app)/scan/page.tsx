"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { useIpScannerStore } from '@/lib/store'
import { LogOut, Wifi } from 'lucide-react'
import AddIpForm from '@/components/AddIpForm'
import SummaryBar from '@/components/SummaryBar'
import IpTable from '@/components/IpTable'

export default function ScanPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { setIpList } = useIpScannerStore()

  // โหลดข้อมูล IP เมื่อเริ่มต้น
  useEffect(() => {
    const loadIpData = async () => {
      try {
        const response = await fetch('/api/ips')
        
        if (response.status === 401) {
          // ไม่มีสิทธิ์ เด้งไปหน้า login
          router.push('/login')
          return
        }

        const result = await response.json()
        
        if (result.success) {
          setIpList(result.data)
        } else {
          toast({
            title: "ข้อผิดพลาด",
            description: result.error || 'เกิดข้อผิดพลาดในการโหลดข้อมูล',
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error('Error loading IP data:', error)
        toast({
          title: "ข้อผิดพลาด",
          description: 'เกิดข้อผิดพลาดในการโหลดข้อมูล',
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadIpData()
  }, [setIpList, toast, router])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST'
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "สำเร็จ",
          description: result.message
        })
        
        router.push('/login')
      } else {
        toast({
          title: "ข้อผิดพลาด",
          description: result.error || 'เกิดข้อผิดพลาดในการออกจากระบบ',
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
      toast({
        title: "ข้อผิดพลาด",
        description: 'เกิดข้อผิดพลาดในการออกจากระบบ',
        variant: "destructive"
      })
    } finally {
      setIsLoggingOut(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Wifi className="h-8 w-8 animate-pulse mx-auto mb-2" />
          <div>กำลังโหลดข้อมูล...</div>
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
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Wifi className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Realms IP Scanner</h1>
            </div>
            
            <Button 
              variant="outline" 
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              {isLoggingOut ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Summary Bar */}
          <SummaryBar />
          
          {/* Add IP Form */}
          <AddIpForm />
          
          {/* IP Table */}
          <IpTable />
        </div>
      </main>
    </div>
  )
}
