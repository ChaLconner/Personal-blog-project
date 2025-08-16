// apps/postRoutes.mjs
import { Router } from "express";
import { supabase } from "../config/database.js";
import protectAdmin from "../middlewares/protectAdmin.mjs";
import multer from "multer";

const postRouter = Router();

// ตั้งค่า Multer สำหรับการอัปโหลดไฟล์
const multerUpload = multer({ storage: multer.memoryStorage() });

// กำหนดฟิลด์ที่จะรับไฟล์ (สามารถรับได้หลายฟิลด์)
const imageFileUpload = multerUpload.fields([
  { name: "imageFile", maxCount: 1 },
]);

// Route สำหรับการสร้างโพสต์ใหม่
postRouter.post("/", [imageFileUpload, protectAdmin], async (req, res) => {
  try {
    // 1) รับข้อมูลจาก request body และไฟล์ที่อัปโหลด
    const newPost = req.body;
    const file = req.files.imageFile[0];

    // 2) กำหนด bucket และ path ที่จะเก็บไฟล์ใน Supabase
    const bucketName = "my-personal-blog";
    const filePath = `posts/${Date.now()}_${file.originalname}`; // สร้าง path ที่ไม่ซ้ำกัน

    // 3) อัปโหลดไฟล์ไปยัง Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false, // ป้องกันการเขียนทับไฟล์เดิม
      });

    if (error) {
      throw error;
    }

    // 4) ดึง URL สาธารณะของไฟล์ที่อัปโหลด
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucketName).getPublicUrl(data.path);

    // 5) บันทึกข้อมูลโพสต์ลงในฐานข้อมูล
    const { data: newPostData, error: insertError } = await supabase
      .from('blog_posts')
      .insert([{
        title: newPost.title,
        image: publicUrl, // เก็บ URL ของรูปภาพ
        category: newPost.category || 'General',
        description: newPost.description,
        content: newPost.content,
        likes: 0,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // 6) ส่งผลลัพธ์กลับไปยัง client
    return res.status(201).json({ message: "Created post successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Server could not create post",
      error: err.message,
    });
  }
});

export default postRouter;
