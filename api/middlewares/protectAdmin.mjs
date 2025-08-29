import { supabase } from '../config/database.js';

// Middleware ตรวจสอบ JWT token และสิทธิ์ Admin
const protectAdmin = async (req, res, next) => {
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

    // ดึงข้อมูล role ของผู้ใช้จากฐานข้อมูล
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', supabaseUserId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: "User role not found" });
    }

    // แนบข้อมูลผู้ใช้พร้อม role เข้ากับ request object
    req.user = { ...data.user, ...userData };
    req.userId = supabaseUserId;

    // ตรวจสอบว่าผู้ใช้เป็น admin หรือไม่
    if (userData.role !== "admin") {
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
