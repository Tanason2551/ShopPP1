# ShopPP - ระบบบริหารจัดการร้านค้าและจุดขาย (POS)

ระบบบริหารจัดการร้านค้าที่ครบวงจร ประกอบด้วยระบบหลังบ้าน (Backend), หน้าจอจัดการสต็อกและรายงาน (Web Dashboard) และระบบขายหน้าร้าน (POS System)

## 🚀 ส่วนประกอบของระบบ
1.  **Backend (API):** รันบน Node.js + Express + Prisma + PostgreSQL
2.  **Web Dashboard:** รันบน Next.js (หน้าจัดการสต็อก, ตั้งค่าร้านค้า, รายงานยอดขาย)
3.  **POS System:** รันบน React + Vite (หน้าจอขายสินค้าหน้าร้าน)

## 🛠️ ฟีเจอร์หลักที่พร้อมใช้งาน
-   **ระบบบาร์โค้ด:** รองรับการยิงบาร์โค้ดเพื่อรับสินค้าเข้าสต็อก (Restock) และการขายหน้าร้าน
-   **การจัดการร้านค้า:** สามารถตั้งชื่อร้าน ที่อยู่ และเบอร์โทรศัพท์ เพื่อใช้ในเอกสารทุกฉบับ
-   **การพิมพ์เอกสารทางการ:**
    -   ใบเสร็จรับเงิน (Sales Receipt) รูปแบบสากล
    -   ใบนำเข้าสินค้า (Restock Bill) พร้อมสรุปต้นทุน
    -   รายงานยอดขาย (Sales Report)
-   **ระบบความปลอดภัย:**
    -   Security Headers ด้วย Helmet.js
    -   การจำกัดสิทธิ์เข้าถึง (CORS) ตามโดเมนที่อนุญาต
    -   การตรวจสอบสิทธิ์ Admin ผ่าน Firebase สำหรับรายการสำคัญ

## 🐳 วิธีการรันระบบด้วย Docker (แนะนำ)
เพื่อให้ระบบทำงานร่วมกันอย่างสมบูรณ์ แนะนำให้รันผ่าน Docker Compose:

```bash
docker-compose up --build -d
```

### URL สำหรับการเข้าใช้งาน:
-   **Web Dashboard:** [http://localhost:3000](http://localhost:3000)
-   **POS System:** [http://localhost:5173](http://localhost:5173)
-   **Backend API:** [http://localhost:5000](http://localhost:5000)

## 📊 การจัดการฐานข้อมูล
คุณสามารถดูและแก้ไขข้อมูลในฐานข้อมูลผ่าน GUI ได้ง่ายๆ โดยใช้ Prisma Studio:

1.  เข้าไปที่โฟลเดอร์ `backend`
2.  รันคำสั่ง: `npx prisma studio`
3.  เข้าใช้งานผ่านเบราว์เซอร์ที่: [http://localhost:5555](http://localhost:5555)

## 🛡️ การตั้งค่าความปลอดภัย (Production)
หากต้องการเปลี่ยน URL หรือ Domain เมื่อใช้งานจริง ให้แก้ไขไฟล์ `backend/.env`:
-   `ALLOWED_ORIGINS`: ระบุ URL ของ Dashboard และ POS ที่อนุญาต (คั่นด้วยเครื่องหมายคอมม่า)
-   `DATABASE_URL`: ระบุ URL ของฐานข้อมูล PostgreSQL จริง (เช่นจาก Neon หรือ Supabase)

---
© 2026 ShopPP POS System
