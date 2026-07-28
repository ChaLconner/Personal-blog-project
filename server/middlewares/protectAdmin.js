import { getSupabase } from '../config/database.js';

// Middleware ตรวจสอบ JWT token และสิทธิ์ Admin
const protectAdmin = async (req, res, next) => {
  const supabase = getSupabase();
  const token = req.headers.authorization?.split(" ")[1]; // ดึง token จาก Authorization header

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Token missing" });
  }

  try {
    // ใช้ Supabase ดึงข้อมูลผู้ใช้จาก token
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    // ดึง user ID จากข้อมูลผู้ใช้ Supabase
    const supabaseUserId = data.user.id;

    // ดึงข้อมูล role ของผู้ใช้จากฐานข้อมูลหรือ app_metadata เท่านั้น
    const { data: userData } = await supabase
      .from('users')
      .select('id, name, username, role')
      .eq('id', supabaseUserId)
      .maybeSingle();

    const userRole = userData?.role || data.user.app_metadata?.role || 'user';

    // แนบข้อมูลผู้ใช้พร้อม role เข้ากับ request object
    req.user = { ...data.user, ...(userData || {}), role: userRole };
    req.userId = supabaseUserId;
    req.token = token;

    // ตรวจสอบว่าผู้ใช้เป็น admin หรือไม่
    if (userRole !== "admin") {
      return res
        .status(403)
        .json({ error: "Forbidden: You do not have admin access" });
    }

    // ดำเนินการต่อไปยัง middleware หรือ route handler ถัดไป
    next();
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export default protectAdmin;
