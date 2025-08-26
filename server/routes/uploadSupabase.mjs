import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { createClient } from '@supabase/supabase-js';
import protectUser from '../middlewares/protectUser.mjs';

const router = Router();

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Configure multer for memory storage (since we're uploading to Supabase)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  }
});

// Profile picture upload to Supabase Storage
router.post('/profile', protectUser, upload.single('imageFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const userId = req.userId;
    const file = req.file;
    const timestamp = Date.now();
    const fileExt = path.extname(file.originalname);
    const fileName = `${userId}/${timestamp}-profile${fileExt}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('profile-pictures')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to upload image to storage'
      });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    res.json({
      success: true,
      url: publicUrl,
      path: fileName,
      message: 'Profile image uploaded successfully'
    });

  } catch (error) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 5MB'
      });
    }
    
    if (error.message.includes('Invalid file type')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Article image upload (for admin)
router.post('/image', protectUser, upload.single('imageFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const file = req.file;
    const timestamp = Date.now();
    const fileExt = path.extname(file.originalname);
    const fileName = `articles/${timestamp}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '')}`;

    // Upload to Supabase Storage (you might want a separate bucket for articles)
    const { data, error } = await supabase.storage
      .from('article-images') // You'll need to create this bucket
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to upload image to storage'
      });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('article-images')
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    res.json({
      success: true,
      url: publicUrl,
      path: fileName,
      message: 'Article image uploaded successfully'
    });

  } catch (error) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 5MB'
      });
    }
    
    if (error.message.includes('Invalid file type')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete image from Supabase Storage
router.delete('/image/:bucket/:path(*)', protectUser, async (req, res) => {
  try {
    const { bucket, path: filePath } = req.params;
    const allowedBuckets = ['profile-pictures', 'article-images'];
    
    if (!allowedBuckets.includes(bucket)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid storage bucket'
      });
    }

    // For profile pictures, ensure user owns the file
    if (bucket === 'profile-pictures') {
      const userId = req.userId;
      const pathUserId = filePath.split('/')[0];
      
      if (userId !== pathUserId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }
    }

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to delete image'
      });
    }

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
