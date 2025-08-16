import { supabase } from '../config/database.js';

// Middleware ตรวจสอบ JWT token และดึง user_id
const protectUser = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // ดึง token จาก Authorization header

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Token missing" });
  }

  try {
    // ใช้ Supabase ตรวจสอบ token และดึงข้อมูลผู้ใช้
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    // ดึงข้อมูลผู้ใช้จากตาราง users
    const supabaseUserId = data.user.id;
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', supabaseUserId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: "User not found" });
    }

    // แนบข้อมูลผู้ใช้เข้ากับ request object
    req.user = { ...data.user, ...userData };
    req.userId = supabaseUserId;

    // ดำเนินการต่อไปยัง middleware หรือ route handler ถัดไป
    next();
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export default protectUser;
