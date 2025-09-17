"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { Shield, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [accessCode, setAccessCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showCode, setShowCode] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!accessCode.trim()) {
      toast({
        title: "ข้อผิดพลาด",
        description: "กรุณากรอกรหัสเข้าใช้งาน",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessCode: accessCode.trim() })
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "สำเร็จ",
          description: result.message
        })
        
        // รีไดเรคไปหน้า scan
        setTimeout(() => {
          window.location.replace('/scan')
        }, 1500)
      } else {
        toast({
          title: "ข้อผิดพลาด",
          description: result.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Login error:', error)
      toast({
        title: "ข้อผิดพลาด",
        description: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ',
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">IP Scanner</CardTitle>
          <CardDescription>
            กรุณากรอกรหัสเข้าใช้งานเพื่อเข้าสู่ระบบ
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="accessCode" className="text-sm font-medium">
                รหัสเข้าใช้งาน
              </label>
              <div className="relative">
                <Input
                  id="accessCode"
                  type={showCode ? "text" : "password"}
                  placeholder="กรอกรหัสเข้าใช้งาน"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  disabled={isLoading}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowCode(!showCode)}
                  disabled={isLoading}
                >
                  {showCode ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <div className="text-sm text-muted-foreground">
              เครื่องมือสแกนและตรวจสอบสถานะ IP Address
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Subnet: 185.241.210.0 - 185.241.210.255
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
