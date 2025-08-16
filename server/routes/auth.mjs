import express from 'express';
import { supabase } from '../config/database.js';

const authRouter = express.Router();

authRouter.post("/register", async (req, res) => {
  console.log('📝 Registration request received:', { email: req.body.email, username: req.body.username, name: req.body.name });
  
  const { email, password, username, name } = req.body;

  // Validate required fields
  if (!email || !password || !username || !name) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // ตรวจสอบว่า username มีในฐานข้อมูลหรือไม่
    const { data: existingUser, error: usernameCheckError } = await supabase
      .from('users')
      .select('*')
      .eq('username', username);

    console.log('🔍 Username check result:', { existingUser, usernameCheckError });

    if (usernameCheckError) {
      console.error('❌ Username check error:', usernameCheckError);
      return res.status(500).json({ error: "Error checking username availability" });
    }

    if (existingUser.length > 0) {
      return res.status(400).json({ error: "This username is already taken" });
    }

    // เพิ่มข้อมูลผู้ใช้ในฐานข้อมูล (แบบง่าย ไม่ใช้ Auth)
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([{
        email: email,
        password: password, // ในระบบจริงควร hash password
        username: username,
        name: name,
        role: 'user'
      }])
      .select()
      .single();

    console.log('💾 Insert result:', { newUser, insertError });

    if (insertError) {
      console.error('❌ Insert error:', insertError);
      if (insertError.code === '23505') { // Unique constraint violation
        return res.status(400).json({ error: "Username or email already exists" });
      }
      return res.status(500).json({ error: "Error creating user profile: " + insertError.message });
    }

    console.log('✅ User created successfully:', newUser.id);
    res.status(201).json({
      message: "User created successfully",
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        name: newUser.name,
        role: newUser.role
      },
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ error: "An error occurred during registration: " + error.message });
  }
});

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // ตรวจสอบว่า error เกิดจากข้อมูลเข้าสู่ระบบไม่ถูกต้องหรือไม่
      if (
        error.code === "invalid_credentials" ||
        error.message.includes("Invalid login credentials")
      ) {
        return res.status(400).json({
          error: "Your password is incorrect or this email doesn't exist",
        });
      }
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({
      message: "Signed in successfully",
      access_token: data.session.access_token,
    });
  } catch (error) {
    return res.status(500).json({ error: "An error occurred during login" });
  }
});

authRouter.get("/get-user", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Token missing" });
  }

  try {
    // ดึงข้อมูลผู้ใช้จาก Supabase
    const { data, error } = await supabase.auth.getUser(token);
    if (error) {
      return res.status(401).json({ error: "Unauthorized or token expired" });
    }

    const supabaseUserId = data.user.id;
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', supabaseUserId)
      .single();

    if (userError) {
      return res.status(500).json({ error: "Error fetching user data" });
    }

    res.status(200).json({
      id: data.user.id,
      email: data.user.email,
      username: userData.username,
      name: userData.name,
      role: userData.role,
      profilePic: userData.profile_pic,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

authRouter.put("/reset-password", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1]; // ดึง token จาก Authorization header
  const { oldPassword, newPassword } = req.body;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Token missing" });
  }

  if (!newPassword) {
    return res.status(400).json({ error: "New password is required" });
  }

  try {
    // ตั้งค่า session ด้วย token ที่ส่งมา
    const { data: userData, error: userError } = await supabase.auth.getUser(
      token
    );

    if (userError) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    // ตรวจสอบรหัสผ่านเดิมโดยลองล็อกอิน
    const { data: loginData, error: loginError } =
      await supabase.auth.signInWithPassword({
        email: userData.user.email,
        password: oldPassword,
      });

    if (loginError) {
      return res.status(400).json({ error: "Invalid old password" });
    }

    // อัปเดตรหัสผ่านของผู้ใช้
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json({
      message: "Password updated successfully",
      user: data.user,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default authRouter;