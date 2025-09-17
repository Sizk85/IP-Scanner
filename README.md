# IP Scanner

เครื่องมือสแกน IP Address และตรวจสอบสถานะแบบ Web Application ที่สร้างด้วย Next.js

## ฟีเจอร์หลัก

- 🔐 **ระบบล็อกอิน**: ป้องกันการเข้าถึงด้วย Access Code
- 📊 **สแกน IP**: ตรวจสอบสถานะ IP Address พร้อมแสดงเวลา ping
- 📝 **จัดการรายการ**: เพิ่ม ลบ แก้ไข IP และ Notes
- 🔍 **ค้นหาและกรอง**: ค้นหาและกรองตามสถานะ
- 📈 **สรุปผล**: แสดงสถิติการสแกน
- 💾 **ส่งออกข้อมูล**: Export เป็นไฟล์ CSV
- 🎨 **UI สวยงาม**: ใช้ shadcn/ui และ Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI)
- **State Management**: Zustand
- **Data Storage**: JSON Files
- **Containerization**: Docker + Docker Compose

## การติดตั้งและรัน

### วิธีที่ 1: รันแบบ Development

```bash
# 1. Clone repository
git clone <repository-url>
cd ip-scanner

# 2. ติดตั้ง dependencies
npm install

# 3. รันโปรเจกต์
npm run dev
```

เปิดเบราว์เซอร์ไปที่ `http://localhost:3000`

### วิธีที่ 2: รันด้วย Docker

```bash
# 1. Build และรันด้วย Docker Compose
npm run docker:up

# หรือรันคำสั่งโดยตรง
docker-compose up -d
```

เปิดเบราว์เซอร์ไปที่ `http://localhost:3000`

### วิธีที่ 3: Build Production

```bash
# 1. Build โปรเจกต์
npm run build

# 2. รัน production server
npm start
```

## การใช้งาน

### 1. เข้าสู่ระบบ
- กรอก Access Code: `1212312121.` (มีจุดท้ายสุด)
- ระบบจะจำสถานะล็อกอินไว้ 7 วัน

### 2. เพิ่ม IP Address
รองรับรูปแบบต่างๆ:
- **IP เดี่ยว**: `192.168.1.7`
- **ช่วง IP**: `192.168.1.1-50`
- **หลายค่า**: `1,5,10-20` (ใช้ Default Subnet ที่กรอกไว้)
- **Wildcard**: `192.168.1.xxx` (ทั้งช่วง 0-255)
- **Default Subnet**: กรอกได้เอง เช่น `192.168.1`, `10.0.0`, `172.16.1`

### 3. สแกน IP
- **Scan All**: สแกนทุก IP ในรายการพร้อมกัน
- **Ping เดี่ยว**: กดปุ่ม ping ในแต่ละแถว
- **ดูผลลัพธ์**: Online (เขียว), Offline (แดง), Timeout (เหลือง)

### 4. จัดการข้อมูล
- **แก้ไข Notes**: คลิกปุ่มแก้ไขในคอลัมน์ Notes
- **ลบ IP**: กดปุ่มลบในคอลัมน์ Actions
- **กรองข้อมูล**: ใช้ตัวกรองและช่องค้นหา

### 5. ส่งออกข้อมูล
- กดปุ่ม "Export CSV" เพื่อดาวน์โหลดไฟล์ CSV
- ไฟล์จะรวมข้อมูล: IP, Status, Latency, Notes, Updated Time

## โครงสร้างโปรเจกต์

```
├── app/
│   ├── (auth)/login/          # หน้าล็อกอิน
│   ├── (app)/scan/            # หน้าสแกนหลัก
│   ├── api/                   # API Routes
│   │   ├── auth/              # Authentication APIs
│   │   ├── ips/               # IP CRUD APIs
│   │   └── ping/              # Ping APIs
│   └── layout.tsx             # Layout หลัก
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── AddIpForm.tsx          # ฟอร์มเพิ่ม IP
│   ├── IpTable.tsx            # ตารางแสดง IP
│   └── SummaryBar.tsx         # แถบสรุปผล
├── lib/
│   ├── auth.ts                # ระบบ Authentication
│   ├── fs-json.ts             # จัดการไฟล์ JSON
│   ├── ip-parse.ts            # Parser สำหรับ IP syntax
│   └── store.ts               # Zustand store
├── data/
│   └── ip-list.json           # ไฟล์เก็บข้อมูล IP
├── Dockerfile                 # Docker configuration
└── docker-compose.yml         # Docker Compose setup
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - เข้าสู่ระบบ
- `POST /api/auth/logout` - ออกจากระบบ

### IP Management
- `GET /api/ips` - อ่านรายการ IP ทั้งหมด
- `POST /api/ips` - เพิ่ม IP หลายตัว
- `PATCH /api/ips` - อัปเดต IP record
- `DELETE /api/ips?ip=<ip>` - ลบ IP

### Ping Operations
- `POST /api/ping` - Ping IP เดี่ยว
- `POST /api/ping/bulk` - Ping หลาย IP พร้อมกัน

## การกำหนดค่า

### Environment Variables
สร้างไฟล์ `.env.local` (ถ้าต้องการ):
```env
NODE_ENV=development
```

### Docker Environment
แก้ไขใน `docker-compose.yml`:
```yaml
environment:
  - NODE_ENV=production
  - PORT=3000
```

## ข้อกำหนดระบบ

- **Node.js**: 18.0.0 หรือใหม่กว่า
- **RAM**: อย่างน้อย 512MB
- **Storage**: อย่างน้อย 1GB
- **Network**: สามารถเข้าถึงเครือข่ายที่ต้องการสแกน

## การพัฒนาต่อ

### เพิ่มฟีเจอร์ใหม่
1. สร้าง component ใหม่ในโฟลเดอร์ `components/`
2. เพิ่ม API route ในโฟลเดอร์ `app/api/`
3. อัปเดต store ใน `lib/store.ts`

### การทดสอบ
```bash
# ทดสอบ IP parser
npm run test:parser

# ทดสอบ API
npm run test:api
```

## การแก้ไขปัญหา

### ปัญหาที่พบบ่อย

1. **ล็อกอินไม่ได้**
   - ตรวจสอบ Access Code: `1212312121.` (ต้องมีจุดท้าย)
   - ลบ cookies และลองใหม่

2. **Ping ไม่ทำงาน**
   - ตรวจสอบว่าระบบมีคำสั่ง `ping`
   - ใน Docker อาจต้องรัน privileged mode

3. **ไม่สามารถบันทึกข้อมูล**
   - ตรวจสอบสิทธิ์การเขียนไฟล์ในโฟลเดอร์ `data/`
   - ใน Docker ตรวจสอบ volume mounting

### Logs
```bash
# ดู logs ของ Docker container
docker-compose logs -f ip-scanner

# ดู logs แบบ real-time
docker logs -f ip-scanner-app
```

## การสนับสนุน

หากพบปัญหาหรือต้องการความช่วยเหลือ กรุณาติดต่อทีมพัฒนา

## License

MIT License - ดูรายละเอียดในไฟล์ LICENSE
