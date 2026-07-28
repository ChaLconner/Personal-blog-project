import { getSupabase, getSupabaseAuth } from '../config/database.js';

const getSupabaseProxy = () => new Proxy({}, {
  get: (_, prop) => {
    const client = getSupabase();
    const val = client[prop];
    return typeof val === 'function' ? val.bind(client) : val;
  }
});

const getSupabaseAuthProxy = () => new Proxy({}, {
  get: (_, prop) => {
    const client = getSupabaseAuth();
    const val = client[prop];
    return typeof val === 'function' ? val.bind(client) : val;
  }
});

const supabase = getSupabaseProxy();
const supabaseAuth = getSupabaseAuthProxy();

export const checkEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: "Email is required" });
    }

    const { data, error } = await getSupabase()
      .from("users")
      .select("id")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    if (error) {
      console.error("Error checking email:", error);
      return res.status(500).json({ success: false, error: "Failed to check email" });
    }

    res.json({
      success: true,
      exists: !!data
    });
  } catch (err) {
    console.error("Server error checking email:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

export const register = async (req, res) => {
  const { email, password, username, name } = req.body;

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

  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
  if (!usernameRegex.test(username)) {
    return res.status(400).json({
      success: false,
      error: "Invalid username",
      message: "ชื่อผู้ใช้ต้องมีความยาว 3-30 ตัวอักษร และประกอบด้วยตัวอักษรภาษาอังกฤษ ตัวเลข หรือขีดล่างเท่านั้น"
    });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();

    const { data: existingUser } = await supabase
      .from('users')
      .select('username, email')
      .or(`username.eq.${username},email.eq.${normalizedEmail}`)
      .maybeSingle();

    if (existingUser) {
      if (existingUser.email?.toLowerCase() === normalizedEmail) {
        return res.status(400).json({
          error: "This email is already registered",
          success: false,
          message: "อีเมลนี้ได้ลงทะเบียนแล้ว"
        });
      }
      return res.status(400).json({ 
        error: "This username is already taken",
        success: false,
        message: "ชื่อผู้ใช้นี้ถูกใช้แล้ว"
      });
    }

    const { data: authData, error: authError } = await supabaseAuth.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: { username, name },
        emailRedirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/callback`
      }
    });

    if (authError) {
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

    if (authData.user) {
      const { error: insertError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          email: normalizedEmail,
          username,
          name,
          profile_pic: null,
          role: 'user',
          password: 'supabase_auth'
        }]);

      if (insertError) {
        if (insertError.message?.includes('users_email_key') || insertError.code === '23505') {
          return res.status(400).json({
            success: false,
            message: "อีเมลนี้ได้ลงทะเบียนแล้ว",
            error: "Email already registered"
          });
        }
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
        emailConfirmed: !!authData.user?.email_confirmed_at
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการลงทะเบียน",
      error: error.message
    });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ 
      error: "Email and password are required",
      success: false,
      message: "กรุณากรอกอีเมลและรหัสผ่าน"
    });
  }

  try {
    const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
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

    const { data: userData } = await supabase
      .from('users')
      .select('username, name, profile_pic, bio, role')
      .eq('id', authData.user.id)
      .single();

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
        bio: userData?.bio || null,
        role: userData?.role || 'user',
        emailConfirmed: !!authData.user.email_confirmed_at
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ",
      error: error.message
    });
  }
};

export const resendVerification = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "กรุณาระบุอีเมล",
      error: "Email is required"
    });
  }

  try {
    const { error } = await supabaseAuth.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/callback`
      }
    });

    if (error) {
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
    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการส่งอีเมล",
      error: error.message
    });
  }
};

export const logout = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "ออกจากระบบสำเร็จ"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการออกจากระบบ",
      error: error.message
    });
  }
};

export const getUser = async (req, res) => {
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
      .select('username, name, profile_pic, bio, role')
      .eq('id', userId)
      .single();

    const meta = data.user.user_metadata || {};
    const appMeta = data.user.app_metadata || {};
    const fallbackUsername = meta.username || data.user.email?.split('@')[0] || null;
    const fallbackName = meta.name || meta.full_name || fallbackUsername;
    const role = userData?.role || appMeta.role || meta.role || (data.user.email?.toLowerCase().includes('admin') ? 'admin' : 'user');

    if (userError) {
      return res.json({
        id: userId,
        email: data.user.email,
        username: fallbackUsername,
        name: fallbackName,
        profile_pic: meta.profile_pic || null,
        bio: null,
        role: role,
        emailConfirmed: Boolean(data.user.email_confirmed_at)
      });
    }

    return res.json({
      id: userId,
      email: data.user.email,
      username: userData?.username || fallbackUsername,
      name: userData?.name || fallbackName,
      profile_pic: userData?.profile_pic || meta.profile_pic || null,
      bio: userData?.bio || null,
      role: role,
      emailConfirmed: Boolean(data.user.email_confirmed_at)
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const updateProfile = async (req, res) => {
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

    const { name, username, imageUrl, profile_pic, bio } = req.body;
    if (name) updateData.name = name.trim();
    if (username) updateData.username = username.trim();
    const pic = imageUrl || profile_pic;
    if (pic) updateData.profile_pic = pic;
    if (typeof bio === 'string') updateData.bio = bio.trim();

    if (updateData.username) {
      const { data: existingUser } = await supabase
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

    let updatedUser = null;
    let updateError = null;

    // Try normal update first
    const { data: resData, error: errRes } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (!errRes && resData) {
      updatedUser = resData;
    } else {
      // If user row does not exist yet or update returned no rows, upsert with complete required fields
      const meta = data.user.user_metadata || {};
      const fallbackName = updateData.name || meta.name || data.user.email?.split('@')[0] || 'User';
      const fallbackUsername = updateData.username || meta.username || data.user.email?.split('@')[0] || 'user';

      const fullUserPayload = {
        id: userId,
        email: data.user.email,
        name: fallbackName,
        username: fallbackUsername,
        profile_pic: updateData.profile_pic || null,
        bio: updateData.bio || null,
        role: 'user',
        password: 'supabase_auth',
        ...updateData
      };

      const { data: upsertData, error: upsertErr } = await supabase
        .from('users')
        .upsert(fullUserPayload, { onConflict: 'id' })
        .select()
        .single();

      if (upsertErr) {
        updateError = upsertErr;
        // Fallback: Sync profile fields into Supabase Auth user metadata
        try {
          await supabaseAuth.auth.updateUser({
            data: {
              ...(updateData.name && { name: updateData.name }),
              ...(updateData.username && { username: updateData.username }),
              ...(updateData.profile_pic && { profile_pic: updateData.profile_pic }),
              ...(updateData.bio && { bio: updateData.bio })
            }
          });
        } catch (metaErr) {
          console.error('Failed to update Supabase Auth user metadata:', metaErr);
        }
      } else {
        updatedUser = upsertData;
      }
    }

    if (updateError) {
      console.error('Error updating profile in Supabase:', updateError);
      if (updateError.message && updateError.message.includes('row-level security')) {
        return res.status(500).json({ 
          error: "Database RLS policy error: Please run migration '005_fix_users_rls.sql' in Supabase SQL Editor to allow users table updates.",
          details: updateError.message
        });
      }
      return res.status(500).json({ 
        error: updateError.message || "Failed to update profile",
        details: updateError.details || null
      });
    }

    return res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser
    });

  } catch (err) {
    console.error('Server exception in updateProfile:', err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
};

export const resetPassword = async (req, res) => {
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

    const oldPassword = req.body.oldPassword || req.body.currentPassword;
    const { newPassword } = req.body;

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

    const { error: signInError } = await supabaseAuth.auth.signInWithPassword({
      email: userData.user.email,
      password: oldPassword
    });

    if (signInError) {
      return res.status(400).json({ 
        error: "Current password is incorrect" 
      });
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(userData.user.id, {
      password: newPassword
    });

    if (updateError) {
      return res.status(500).json({ 
        error: "Failed to update password" 
      });
    }

    return res.json({
      success: true,
      message: "Password updated successfully"
    });

  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
};
