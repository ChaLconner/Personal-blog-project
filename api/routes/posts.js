import { supabase } from '../config/database.js';

export async function getAllPosts(req, res) {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      id, title, description, image, author, date, 
      category:categories(name)
    `)
    .eq('status_id', 2) // เฉพาะบทความที่ published
    .order('date', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  
  // Transform data to match frontend expectations
  const transformedData = data.map(post => ({
    id: post.id,
    title: post.title,
    description: post.description,
    image: post.image,
    author: post.author || 'Admin', // ใช้ author จาก posts table
    date: post.date,
    category: post.category?.name || 'Uncategorized'
  }));
  
  res.json(transformedData);
}