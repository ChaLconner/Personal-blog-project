import express from 'express';
import { supabase, supabaseAuth } from '../config/database.js';

const authRouter = express.Router();

// Helper function to check table schema
const checkUsersTableSchema = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (error) {
      return null;
    }
    
    return true;
  } catch (error) {
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
  const { email, password, username, name } = req.body;

  // Validate required fields
  if (!email || !password || !username || !name) {
    const missing = [];
    if (!email) missing.push('email');
    if (!password) missing.push('password');
    if (!username) missing.push('username');
    if (!name) missing.push('name');
    

    return res.status(400).json({ 
      error: `Missing required fields: ${missing.join(', ')}`,
      success: false,
      message: "กรุณากรอกข้อมูลให้ครบถ้วน"
    });
  }

  try {

    // Check if username already exists
    const { data: existingUser, error: usernameCheckError } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .single();

    if (existingUser) {

      return res.status(400).json({ 
        error: "This username is already taken",
        success: false,
        message: "ชื่อผู้ใช้นี้ถูกใช้แล้ว"
      });
    }


    
    // Use Supabase Auth to create user (will send verification email automatically)
    const { data: authData, error: authError } = await supabaseAuth.auth.signUp({
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

  
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ 
      error: "Email and password are required",
      success: false,
      message: "กรุณากรอกอีเมลและรหัสผ่าน"
    });
  }

  try {

    
    // Use Supabase Auth to sign in with anonymous key
    const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
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

    
    // Use Supabase Auth to resend verification
    const { error } = await supabaseAuth.auth.resend({
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

// Get current user info using Supabase Auth token
authRouter.get("/get-user", async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    if (!token) {
      return res.status(401).json({ error: "Unauthorized: Token missing" });
    }

    const { data, error } = await supabaseAuth.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    const userId = data.user.id;
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('username, name, profile_pic, role')
      .eq('id', userId)
      .single();

    if (userError) {
      // Still return basic auth info if profile not found
      return res.json({
        id: userId,
        email: data.user.email,
        username: null,
        name: null,
        profile_pic: null,
        role: 'user',
        emailConfirmed: Boolean(data.user.email_confirmed_at)
      });
    }

    return res.json({
      id: userId,
      email: data.user.email,
      username: userData?.username || null,
      name: userData?.name || null,
      profile_pic: userData?.profile_pic || null,
      role: userData?.role || 'user',
      emailConfirmed: Boolean(data.user.email_confirmed_at)
    });
  } catch (err) {
    console.error('❌ get-user error:', err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Update profile endpoint with file upload support
authRouter.put("/update-profile", async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    if (!token) {
      return res.status(401).json({ error: "Unauthorized: Token missing" });
    }

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    const userId = data.user.id;
    let updateData = {};

    // Handle form data (including file uploads)
    if (req.headers['content-type']?.includes('multipart/form-data')) {
      // File upload is handled by upload route
      const { name, username, imageUrl } = req.body;
      
      if (name) updateData.name = name.trim();
      if (username) updateData.username = username.trim();
      if (imageUrl) updateData.profile_pic = imageUrl;
    } else {
      // Regular JSON data
      const { name, username, imageUrl } = req.body;
      
      if (name) updateData.name = name.trim();
      if (username) updateData.username = username.trim();
      if (imageUrl) updateData.profile_pic = imageUrl;
    }

    // Check if username is already taken by another user
    if (updateData.username) {
      const { data: existingUser, error: usernameError } = await supabase
        .from('users')
        .select('id')
        .eq('username', updateData.username)
        .neq('id', userId)
        .single();

      if (existingUser) {
        return res.status(400).json({ 
          error: "Username is already taken" 
        });
      }
    }



    // Update user data in users table
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Profile update error:', updateError);
      return res.status(500).json({ error: "Failed to update profile" });
    }

    return res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser
    });

  } catch (err) {
    console.error('❌ update-profile error:', err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Reset password endpoint
authRouter.put("/reset-password", async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    if (!token) {
      return res.status(401).json({ error: "Unauthorized: Token missing" });
    }

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ 
        error: "Old password and new password are required" 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: "New password must be at least 6 characters long" 
      });
    }

    // Create a new Supabase client instance to verify the old password
    // We need to sign in with the old password to verify it's correct
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: userData.user.email,
      password: oldPassword
    });

    if (signInError) {
      return res.status(400).json({ 
        error: "Current password is incorrect" 
      });
    }

    // Use the original authenticated session to update the password
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: token,
      refresh_token: signInData.session.refresh_token
    });

    if (sessionError) {
      console.error('❌ Session error:', sessionError);
      return res.status(500).json({ 
        error: "Failed to authenticate for password update" 
      });
    }

    // Update the password using the authenticated session
    const { data: updateData, error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (updateError) {
      console.error('❌ Password update error:', updateError);
      return res.status(500).json({ 
        error: "Failed to update password" 
      });
    }

    return res.json({
      success: true,
      message: "Password updated successfully"
    });

  } catch (err) {
    console.error('❌ reset-password error:', err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default authRouter;
