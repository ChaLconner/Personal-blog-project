import { supabase } from '../config/database.js';

export async function getAllPosts(req, res) {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      id, title, description, image, date, 
      category:categories(name), 
      author:users(name, profile_pic)
    `)
    .order('date', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}