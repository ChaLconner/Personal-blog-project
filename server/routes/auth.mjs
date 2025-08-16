import express from 'express';
import { supabase } from '../config/database.js';

const authRouter = express.Router();

authRouter.post("/register", async (req, res) => {
  console.log('📝 Registration request received:', { email: req.body.email, username: req.body.username, name: req.body.name });
  
  const { email, password, username, name } = req.body;

  // Validate required fields - support both old and new field requirements
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  
  // If username and name are provided, validate them too
  if ((username || name) && (!username || !name)) {
    return res.status(400).json({ error: "Both username and name are required when provided" });
  }

  try {
    // If username is provided, check if it already exists
    if (username) {
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
    }

    // Check if email already exists
    const { data: existingEmail, error: emailCheckError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);

    if (emailCheckError) {
      console.error('❌ Email check error:', emailCheckError);
      return res.status(500).json({ error: "Error checking email availability" });
    }

    if (existingEmail.length > 0) {
      return res.status(409).json({ error: "User already exists" });
    }

    // Prepare user data for insertion
    const userData = {
      email: email,
      password: password, // ในระบบจริงควร hash password
      role: 'user',
      created_at: new Date().toISOString() // Add timestamp
    };

    // Add optional fields if provided
    if (username) userData.username = username;
    if (name) userData.name = name;

    // Try to use Supabase Auth first, then fallback to direct insert
    let insertResult;
    
    try {
      // Method 1: Use Supabase Auth (recommended)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            username: username,
            name: name,
            role: 'user'
          }
        }
      });

      if (authError) {
        console.log('Auth signup failed, trying direct insert...', authError.message);
        
        // Method 2: Direct insert with UUID generation
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert([{
            id: crypto.randomUUID(), // Generate UUID for id
            ...userData
          }])
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        console.log('💾 Direct insert result:', { newUser });
        insertResult = { user: newUser, method: 'direct' };
      } else {
        console.log('💾 Auth signup result:', { authData });
        insertResult = { user: authData.user, method: 'auth' };
      }
      
    } catch (directError) {
      // Method 3: Try without explicit ID (let database handle it)
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([userData])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      console.log('💾 Fallback insert result:', { newUser });
      insertResult = { user: newUser, method: 'fallback' };
    }

    const { user: newUser, method } = insertResult;

    console.log('💾 Insert result:', { newUser, insertError: null, method });

    console.log('✅ User created successfully:', newUser.id);
    
    // Return user data based on what was provided
    const responseUser = {
      id: newUser.id,
      email: newUser.email || email,
      role: newUser.role || 'user'
    };
    
    if (newUser.username || username) responseUser.username = newUser.username || username;
    if (newUser.name || name) responseUser.name = newUser.name || name;

    res.status(201).json({
      message: "User created successfully",
      user: responseUser,
      method: method // For debugging
    });
  } catch (error) {
    console.error('❌ Registration handler error:', error);
    res.status(500).json({ 
      error: "An error occurred during registration",
      details: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
    });
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