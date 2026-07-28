import { getSupabase } from '../config/database.js';

// Middleware ตรวจสอบ JWT token และดึง user_id
const protectUser = async (req, res, next) => {
  const supabase = getSupabase();
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

    // ดึงข้อมูลผู้ใช้จากตาราง users (ถ้าไม่มีให้ fallback ข้อมูลจาก auth)
    const supabaseUserId = data.user.id;
    const { data: userData } = await supabase
      .from('users')
      .select('id, name, username, role, profile_pic')
      .eq('id', supabaseUserId)
      .maybeSingle();

    const meta = data.user.user_metadata || {};
    const fallbackUsername = meta.username || data.user.email?.split('@')[0] || 'user';
    const fallbackName = meta.name || meta.full_name || fallbackUsername;

    // แนบข้อมูลผู้ใช้เข้ากับ request object
    req.user = {
      id: supabaseUserId,
      email: data.user.email,
      name: userData?.name || fallbackName,
      username: userData?.username || fallbackUsername,
      role: userData?.role || 'user',
      ...data.user,
      ...(userData || {})
    };
    req.userId = supabaseUserId;
    req.token = token;

    // ดำเนินการต่อไปยัง middleware หรือ route handler ถัดไป
    next();
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export default protectUser;
