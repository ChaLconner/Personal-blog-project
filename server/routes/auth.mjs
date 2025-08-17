import express from 'express';
import { supabase } from '../config/database.js';

const authRouter = express.Router();

// Helper function to check table schema
const checkUsersTableSchema = async () => {
  try {
    console.log('🔍 Checking users table schema...');
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Schema check error:', error);
      return null;
    }
    
    console.log('✅ Users table accessible');
    return true;
  } catch (error) {
    console.log('❌ Schema check failed:', error);
    return null;
  }
};

// Check schema on startup
checkUsersTableSchema();

// Debug endpoint to check users table structure
authRouter.get("/debug/users-schema", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
      
    if (error) {
      return res.json({
        error: error,
        message: "Error accessing users table"
      });
    }
    
    const { error: insertError } = await supabase
      .from('users')
      .insert([{}]);
    
    res.json({
      message: "Users table accessible",
      sampleData: data,
      insertError: insertError,
      availableColumns: insertError ? insertError.message : 'Could not determine columns'
    });
  } catch (error) {
    res.json({ 
      error: error.message,
      message: "Failed to check schema"
    });
  }
});

// Register endpoint using Supabase Auth
authRouter.post("/register", async (req, res) => {
  console.log('📝 Registration request received:', { 
    email: req.body.email, 
    username: req.body.username, 
    name: req.body.name,
    hasPassword: !!req.body.password 
  });
  
  const { email, password, username, name } = req.body;

  // Validate required fields
  if (!email || !password || !username || !name) {
    const missing = [];
    if (!email) missing.push('email');
    if (!password) missing.push('password');
    if (!username) missing.push('username');
    if (!name) missing.push('name');
    
    console.log('❌ Missing required fields:', missing);
    return res.status(400).json({ 
      error: `Missing required fields: ${missing.join(', ')}`,
      success: false,
      message: "กรุณากรอกข้อมูลให้ครบถ้วน"
    });
  }

  try {
    console.log('🔍 Checking if username already exists...');
    // Check if username already exists
    const { data: existingUser, error: usernameCheckError } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .single();

    if (existingUser) {
      console.log('❌ Username already exists');
      return res.status(400).json({ 
        error: "This username is already taken",
        success: false,
        message: "ชื่อผู้ใช้นี้ถูกใช้แล้ว"
      });
    }

    console.log('🔐 Creating user with Supabase Auth...');
    
    // Use Supabase Auth to create user (will send verification email automatically)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          username: username,
          name: name
        },
        emailRedirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/callback`
      }
    });

    if (authError) {
      console.error('❌ Supabase Auth error:', authError);
      
      if (authError.message.includes('already registered')) {
        return res.status(400).json({
          success: false,
          message: "อีเมลนี้ได้ลงทะเบียนแล้ว",
          error: authError.message
        });
      }
      
      return res.status(400).json({
        success: false,
        message: "เกิดข้อผิดพลาดในการลงทะเบียน",
        error: authError.message
      });
    }

    console.log('✅ User created with Supabase Auth:', authData.user?.id);

    // Insert additional user data into users table
    if (authData.user) {
      const { error: insertError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,  // Use Supabase Auth user ID
          email: email,
          username: username,
          name: name,
          profile_pic: null,
          role: 'user',
          password: 'supabase_auth' // Placeholder since password is managed by Supabase Auth
        }]);

      if (insertError) {
        console.error('❌ Error inserting user data:', insertError);
        // User is created in auth but not in users table
        return res.status(500).json({
          success: false,
          message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
          error: insertError.message
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: "ลงทะเบียนสำเร็จ! กรุณาตรวจสอบอีเมลเพื่อยืนยันตัวตน",
      requiresVerification: true,
      user: {
        id: authData.user?.id,
        email: authData.user?.email,
        emailConfirmed: authData.user?.email_confirmed_at ? true : false
      }
    });

  } catch (error) {
    console.error("❌ Registration error:", error);
    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการลงทะเบียน",
      error: error.message
    });
  }
});

// Login endpoint using Supabase Auth
authRouter.post("/login", async (req, res) => {
  console.log('🔐 Login request received:', { email: req.body.email });
  
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ 
      error: "Email and password are required",
      success: false,
      message: "กรุณากรอกอีเมลและรหัสผ่าน"
    });
  }

  try {
    console.log('🔐 Attempting Supabase Auth login...');
    
    // Use Supabase Auth to sign in
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.error('❌ Supabase Auth login error:', authError);
      
      if (authError.message.includes('Invalid login credentials')) {
        return res.status(401).json({
          success: false,
          message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
          error: authError.message
        });
      }
      
      if (authError.message.includes('Email not confirmed')) {
        return res.status(401).json({
          success: false,
          message: "กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ",
          error: authError.message,
          requiresVerification: true
        });
      }
      
      return res.status(400).json({
        success: false,
        message: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ",
        error: authError.message
      });
    }

    if (!authData.session) {
      return res.status(401).json({
        success: false,
        message: "ไม่สามารถสร้างเซสชันได้",
        error: "No session created"
      });
    }

    console.log('✅ Supabase Auth login successful');

    // Get additional user data from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('username, name, profile_pic, role')
      .eq('id', authData.user.id)
      .single();

    if (userError) {
      console.error('⚠️ Could not fetch user data:', userError);
    }

    return res.status(200).json({
      success: true,
      message: "เข้าสู่ระบบสำเร็จ",
      access_token: authData.session.access_token,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        username: userData?.username,
        name: userData?.name,
        profile_pic: userData?.profile_pic,
        role: userData?.role || 'user',
        emailConfirmed: authData.user.email_confirmed_at ? true : false
      }
    });

  } catch (error) {
    console.error("❌ Login error:", error);
    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ",
      error: error.message
    });
  }
});

// Resend verification email endpoint
authRouter.post("/resend-verification", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "กรุณาระบุอีเมล",
      error: "Email is required"
    });
  }

  try {
    console.log('📧 Resending verification email for:', email);
    
    // Use Supabase Auth to resend verification
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/callback`
      }
    });

    if (error) {
      console.error('❌ Resend verification error:', error);
      return res.status(400).json({
        success: false,
        message: "ไม่สามารถส่งอีเมลยืนยันได้",
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      message: "ส่งอีเมลยืนยันใหม่แล้ว กรุณาตรวจสอบกล่องจดหมายของคุณ"
    });

  } catch (error) {
    console.error("❌ Resend verification error:", error);
    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการส่งอีเมล",
      error: error.message
    });
  }
});

// Logout endpoint
authRouter.post("/logout", async (req, res) => {
  try {
    // Supabase Auth handles logout on client side
    // This endpoint is mainly for logging purposes
    console.log('👋 User logout requested');
    
    return res.status(200).json({
      success: true,
      message: "ออกจากระบบสำเร็จ"
    });

  } catch (error) {
    console.error("❌ Logout error:", error);
    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการออกจากระบบ",
      error: error.message
    });
  }
});

export default authRouter;