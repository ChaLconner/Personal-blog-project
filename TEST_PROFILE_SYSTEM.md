# การทดสอบระบบ Profile และ Reset Password

## ปัญหาที่แก้ไข:

### 1. ProfilePage (หน้าแก้ไขโปรไฟล์)
- **ปัญหาเดิม**: การอัปโหลดรูปภาพโปรไฟล์ไม่ทำงาน
- **สาเหตุ**: API endpoint ไม่รองรับ multipart/form-data และการอัปโหลดไฟล์
- **การแก้ไข**:
  - สร้าง `/api/upload/profile` endpoint สำหรับอัปโหลดรูปภาพโปรไฟล์
  - ปรับปรุง `/api/auth/update-profile` endpoint ให้รองรับ URL รูปภาพ
  - แยกการอัปโหลดไฟล์และการอัปเดตโปรไฟล์เป็น 2 ขั้นตอน
  - เพิ่ม validation สำหรับ username ซ้ำ

### 2. ResetPasswordPage (หน้าเปลี่ยนรหัสผ่าน)
- **ปัญหาเดิม**: การตรวจสอบรหัสผ่านเก่าไม่ทำงานกับ Supabase Auth
- **สาเหตุ**: Supabase Auth ไม่อนุญาตให้ตรวจสอบรหัสผ่านเก่าโดยตรง
- **การแก้ไข**:
  - ปรับวิธีการตรวจสอบรหัสผ่านเก่าโดยใช้ signInWithPassword
  - ปรับปรุงการจัดการ session สำหรับการเปลี่ยนรหัสผ่าน
  - เพิ่มการตรวจสอบความยาวรหัสผ่านใหม่ (ขั้นต่ำ 6 ตัวอักษร)

## API Endpoints ที่เพิ่ม/ปรับปรุง:

### Upload Routes (upload.mjs)
- `POST /api/upload/profile` - อัปโหลดรูปภาพโปรไฟล์ (ต้องการ authentication)

### Auth Routes (auth.mjs)
- `PUT /api/auth/update-profile` - อัปเดตข้อมูลโปรไฟล์ (รองรับ imageUrl)
- `PUT /api/auth/reset-password` - เปลี่ยนรหัสผ่าน (ปรับปรุงการตรวจสอบ)

## การปรับปรุง Frontend:

### API Service (api.js)
- เพิ่ม `uploadProfileImage()` function
- เพิ่ม `auth.updateProfile()` function
- เพิ่ม `auth.resetPassword()` function

### ProfilePage.jsx
- แยกการอัปโหลดไฟล์และการอัปเดตโปรไฟล์
- ปรับปรุงการจัดการ error messages
- เพิ่มการตรวจสอบไฟล์รูปภาพ

### ResetPasswordPage.jsx
- ปรับใช้ blogApi แทน axios โดยตรง
- ปรับปรุงการตรวจสอบรหัสผ่านใหม่ (ขั้นต่ำ 6 ตัวอักษร)
- ปรับปรุงการแสดง error messages

## วิธีทดสอบ:

1. **ทดสอบการอัปโหลดรูปโปรไฟล์**:
   - เข้าสู่ระบบ
   - ไปหน้า Profile (/profile)
   - คลิก "Upload profile picture"
   - เลือกไฟล์รูปภาพ (JPEG, PNG, GIF, WebP)
   - กรอกข้อมูล Name, Username
   - คลิก Save
   - ตรวจสอบว่ารูปภาพแสดงใน NavBar และ Profile page

2. **ทดสอบการเปลี่ยนรหัสผ่าน**:
   - เข้าสู่ระบบ
   - ไปหน้า Reset Password (/reset-password)
   - กรอกรหัสผ่านปัจจุบัน
   - กรอกรหัสผ่านใหม่ (ขั้นต่ำ 6 ตัวอักษร)
   - ยืนยันรหัสผ่านใหม่
   - คลิก Reset password
   - ตรวจสอบการเปลี่ยนรหัสผ่านโดยล็อกเอาท์และล็อกอินใหม่

## สถานะปัจจุบัน:
- ✅ เซิร์ฟเวอร์ทำงานที่ http://localhost:3001
- ✅ ไคลเอนท์ทำงานที่ http://localhost:5174
- ✅ API endpoints ทั้งหมดพร้อมใช้งาน
- ✅ Frontend components ได้รับการปรับปรุงแล้ว

## หมายเหตุ:
- รูปภาพโปรไฟล์จะถูกเก็บใน `/server/uploads/images/`
- ขนาดไฟล์สูงสุด: 5MB
- รองรับรูปแบบไฟล์: JPEG, PNG, GIF, WebP
- รหัสผ่านใหม่ต้องมีความยาวขั้นต่ำ 6 ตัวอักษร
