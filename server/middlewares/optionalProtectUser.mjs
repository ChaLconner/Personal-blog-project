import { supabase } from '../config/database.js';

// Optional authentication middleware: if Authorization header present, verify token and attach user; otherwise continue anonymously
const optionalProtectUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return next(); // no token, continue as anonymous
    }

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      // token invalid -> continue without user rather than blocking
      return next();
    }

    const supabaseUserId = data.user.id;
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, username, profile_pic')
      .eq('id', supabaseUserId)
      .single();

    if (!userError && userData) {
      req.user = { ...data.user, ...userData };
      req.userId = supabaseUserId;
    }

    return next();
  } catch (err) {
    // On error, do not block the request; treat as anonymous
    return next();
  }
};

export default optionalProtectUser;
