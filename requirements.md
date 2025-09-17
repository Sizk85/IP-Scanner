คุณคือวิศวกรซอฟต์แวร์ สร้างเว็บแอป “IP Scanner” ตามสเปคละเอียดด้านล่างนี้ให้เสร็จพร้อมรันและสวยงามในครั้งเดียว

Tech stack

Next.js (App Router) + TypeScript

TailwindCSS + shadcn/ui (ใช้ Button, Card, Table, Input, Textarea, Badge, Dialog, Toast)

Zustand หรือ React Query สำหรับ state/query ฝั่ง client

API Route ของ Next.js สำหรับ logic ping

ไม่ใช้ DB ภาคบังคับ: เก็บรายการชั่วคราวในไฟล์ JSON บนเซิร์ฟเวอร์ (/data/ip-list.json) หากไม่มีไฟล์ให้สร้างอัตโนมัติ

Dockerfile + simple docker-compose (node:18-alpine)

ฟีเจอร์หลัก

ล็อกอินแบบ Code เดียว

หน้าแรกเป็นหน้ากรอก “Access Code”

โค้ดถูกต้องเท่านั้นถึงเข้าหน้าหลักได้

โค้ดที่ถูกต้อง ต้องตรงกับ: 1212312121. (มีจุดท้ายสุด)

จัดเก็บสถานะล็อกอินด้วย cookie (HttpOnly) ชื่อ ipscan_auth อายุ 7 วัน

หน้า IP Scan (หลังล็อกอิน)

Header: ชื่อระบบ “IP Scanner”, ปุ่ม Logout

การสแกนเริ่มต้นที่ subnet 185.241.210.0 - 185.241.210.255

แสดง Table List ของ IP ทั้งช่วง โดยคอลัมน์:

IP

Ping (ms/สถานะ: Online/Offline/Timeout)

Notes (แก้ไขได้, ว่างได้)

Actions (ปุ่ม Ping เดี่ยว, ลบแถว)

แถบ Summary ด้านบน: นับ Online / Offline / Timeout + ปุ่ม “Scan All” ทั้งช่วง

ปุ่ม “Export CSV” และ “Import CSV” (โครงรองรับ import)

กล่องค้นหา (กรองตาม IP/Notes แบบ substring)

เพิ่มรายการแบบกำหนดเอง

โซน “Add IP(s)” มี Input เดียวรองรับ syntax แบบ range

รูปแบบที่ต้องรองรับ:

เดี่ยว: 185.241.210.7

ช่วง: 185.241.210.1-50 (เติม 185.241.210.* ให้ครบออโต้)

หลายค่า: คั่นด้วยคอมมา เช่น 185.241.210.10,185.241.210.20,185.241.210.30-40

wildcard เฉพาะท้ายแบบ 185.241.210.xxx = ทั้งช่วง 0–255

ถ้าไม่ระบุ subnet เต็ม ให้สมมติฐานฐานเป็น 185.241.210 (เช่นพิมพ์ 1-10 หมายถึง 185.241.210.1-10)

ปุ่ม “Add” จะขยายเป็นรายการ IP ที่ยูนีก (ไม่ซ้ำตารางเดิม) แล้วแสดงในตาราง

ช่อง Notes (ไม่บังคับ) เพิ่มพร้อมรายการได้

การ Ping

API: POST /api/ping รองรับ body: { ip: string } → คืน { ip, status: "online"|"offline"|"timeout", latencyMs?: number }

API: POST /api/ping/bulk รองรับ body: { ips: string[] } → คืนผลแบบ array

ฝั่งเซิร์ฟเวอร์เรียกคำสั่งระบบ ping -c 1 -W 1 <ip> (Linux) แล้ว parse เวลา round-trip (ถ้าได้)

จำกัด concurrency (เช่น 30 งานพร้อมกัน) ป้องกันโหลดเครื่อง

ตั้ง timeout ต่อ IP ~ 1500ms

แสดงผลแบบ progressive (UI อัปเดตสถานะทีละแถวขณะสแกน)

การเก็บข้อมูล

เก็บรายการ (ip, lastStatus, lastLatencyMs, notes, updatedAt) ในไฟล์ JSON: /data/ip-list.json

CRUD API:

GET /api/ips → อ่านทั้งหมด

POST /api/ips → เพิ่มหลาย IP (พร้อม notes เดียวกันได้)

PATCH /api/ips → อัปเดต { ip, notes? }

DELETE /api/ips?ip=... → ลบตาม IP

ป้องกัน race โดยล็อกเขียนไฟล์แบบ atomic

UX เสริม

แถบคุม subnet ด้านบน: มีชิปป้าย “185.241.210.0 - 185.241.210.255” (ค่าเริ่ม)

ปุ่ม “Scan All” จะสแกนเฉพาะแถวที่อยู่ใน subnet ปัจจุบัน

ปุ่ม “Clear Results” เคลียร์เฉพาะสถานะ ping (ไม่ลบรายการ)

Toast แจ้งผลเพิ่ม/ลบ/บันทึก notes สำเร็จ

สถานะ Online แสดง Badge, Offline/Timeout อีกสี (ใช้สี default ของ shadcn/ui)

รองรับ Mobile/Tablets (table overflow-x)

ความปลอดภัย/ข้อกำหนด

ป้องกัน unauthenticated access ทุก API (ตรวจ cookie)

ตรวจ input IP อย่างเข้ม (regex) และ validate ช่วง 0–255

บล็อก IP นอก 185.241.210.* เมื่อใช้ wildcard xxx (อนุญาตแค่ subnet นี้)

สำหรับรูปแบบย่อ (เช่น 1-10): บังคับให้ผูกกับ subnet 185.241.210

อย่ารัน ping กับ host ที่ไม่ใช่ IPv4

หน้าตา (UI)

โทนเข้มอ่านง่าย, layout แบบ Card:

Card: “Summary”

Card: “Add IP(s)”

Card: “IP Table”

ตารางมี sticky header, แถวสแกนอยู่ให้โชว์ spinner เล็กในคอลัมน์ Ping

มี Pill filter “All / Online / Offline / Timeout”

ตัวอย่างกรณีทดสอบ Syntax

อินพุต: 185.241.210.xxx → ขยายเป็น 256 IP

อินพุต: 1-5,10,20-22 → แปลเป็น 185.241.210.1, .2, .3, .4, .5, .10, .20, .21, .22

อินพุต: 185.241.210.7 → เพิ่ม 1 รายการ

อินพุต: 185.241.210.300 → invalid (แจ้งเตือน)

โครงไฟล์ (แนะนำ)
/app
  /(auth)/login/page.tsx
  /(app)/scan/page.tsx
  /api/auth/login/route.ts
  /api/auth/logout/route.ts
  /api/ips/route.ts        // GET, POST, PATCH, DELETE (method-based)
  /api/ping/route.ts
  /api/ping/bulk/route.ts
/components
  AddIpForm.tsx
  IpTable.tsx
  SummaryBar.tsx
/lib
  ip-parse.ts      // parser + validator + expander ranges
  store.ts         // Zustand/React Query setup
  fs-json.ts       // read/write JSON with lock
  auth.ts          // cookie helpers
/data
  ip-list.json     // auto-create if missing

เกณฑ์ยอมรับงาน

npm run dev เปิดได้, ล็อกอินด้วย 1212312121. แล้วเห็นหน้าสแกน

“Scan All” ทำงาน (แสดงผลทยอย, มี concurrency limit)

เพิ่ม IP ด้วย range syntax ได้ครบตามสเปค

แก้ Notes ต่อแถวและบันทึกได้ (persist ลงไฟล์)

Export CSV ใช้งานได้ (หัวข้อ: ip,status,latencyMs,notes,updatedAt)

โค้ดสะอาด, type-safe, มีฟังก์ชันแยก parser/validator ชัดเจน

Dockerfile build & start ได้

เสริม (ถ้ามีเวลา)

ปุ่ม “Schedule Re-scan” (เช่นทุก 5 นาทีฝั่ง client) เปิด/ปิดได้

High-contrast mode

แสดงเวลาล่าสุดที่ ping ของแต่ละแถว

โปรดสร้างโปรเจกต์ให้ครบ พร้อมคอมโพเนนต์, API, ตัวอย่างทดสอบ, และคอมเมนต์สำคัญในโค้ด