# Safety & Envi Week E-Stamp — Starter

เว็บต้นแบบแบบ Paperless ที่เปิดบนโทรศัพท์ได้โดยไม่ใช้อีเมล

## ทดลองบนเครื่อง

เปิด `index.html` ด้วยเว็บเบราว์เซอร์ หรือใช้ local web server

## นำขึ้น GitHub

1. สร้าง GitHub repository ใหม่
2. อัปโหลดไฟล์ทั้งหมดในโฟลเดอร์นี้
3. อย่าอัปโหลดไฟล์ `.env` หรือ Service Account Key

## นำขึ้น Firebase Hosting

1. สร้าง Firebase Project
2. ติดตั้ง Firebase CLI
3. รัน `firebase login`
4. รัน `firebase use --add`
5. รัน `firebase deploy --only hosting`

## ข้อสำคัญ

เวอร์ชันนี้เป็น Frontend Prototype ข้อมูลอยู่ในหน่วยความจำและหายเมื่อรีเฟรชหน้า PIN ยังไม่ได้ถูกบันทึก เพื่อความปลอดภัย ขั้นต่อไปต้องเพิ่ม Firebase Authentication, Firestore, Cloud Functions, rate limiting และ Security Rules ก่อนใช้งานจริง
