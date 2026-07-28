import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { getSupabase } from '../config/database.js';
import protectUser from '../middlewares/protectUser.js';
import protectAdmin from '../middlewares/protectAdmin.js';

const router = Router();

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client lazily
const supabase = new Proxy({}, {
  get: (_, prop) => {
    const client = getSupabase();
    const val = client[prop];
    return typeof val === 'function' ? val.bind(client) : val;
  }
});

// Configure multer for memory storage (since we're uploading to Supabase)
const storage = multer.memoryStorage();

const verifyImageMagicBytes = (buffer) => {
  if (!buffer || buffer.length < 4) return false;
  const hex = buffer.toString('hex', 0, 4).toUpperCase();
  // JPEG: FFD8FF, PNG: 89504E47, GIF: 47494638, WEBP: 52494646 (RIFF)
  if (hex.startsWith('FFD8FF')) return true;
  if (hex === '89504E47') return true;
  if (hex.startsWith('474946')) return true;
  if (hex === '52494646') return true;
  return false;
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 3 * 1024 * 1024, // 3MB RAM limit
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

    if (!verifyImageMagicBytes(req.file.buffer)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file signature. File header does not match valid image format.'
      });
    }

    const userId = req.userId;
    const file = req.file;
    const timestamp = Date.now();
    const fileExt = path.extname(file.originalname);
    const fileName = `${userId}/${timestamp}-profile${fileExt}`;

    // Upload to Supabase Storage
    let { data, error } = await supabase.storage
      .from('profile-pictures')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (error) {
      console.warn('⚠️ Supabase upload error (profile-pictures), trying bucket creation...', error.message || error);
      try {
        await supabase.storage.createBucket('profile-pictures', { public: true });
        const retry = await supabase.storage
          .from('profile-pictures')
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            upsert: true
          });
        data = retry.data;
        error = retry.error;
      } catch (bErr) {
        console.warn('Failed to create profile-pictures bucket:', bErr.message);
      }
    }

    if (error) {
      console.error('❌ Supabase profile image upload failed:', error);
      // Local fallback
      try {
        const userUploadsDir = path.join(__dirname, `../uploads/profiles/${userId}`);
        await fs.mkdir(userUploadsDir, { recursive: true });
        const localFileName = `${timestamp}-profile${fileExt}`;
        const localFilePath = path.join(userUploadsDir, localFileName);
        await fs.writeFile(localFilePath, file.buffer);

        const host = req.get('host') || 'localhost:5000';
        const protocol = req.protocol || 'http';
        const localUrl = `${protocol}://${host}/uploads/profiles/${userId}/${localFileName}`;

        return res.json({
          success: true,
          url: localUrl,
          path: `profiles/${userId}/${localFileName}`,
          message: 'Profile image uploaded locally (fallback)'
        });
      } catch (localErr) {
        console.error('❌ Local fallback upload failed:', localErr);
        return res.status(500).json({
          success: false,
          error: `Upload failed: ${error.message || 'Storage error'}`
        });
      }
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
    
    if (error.message && error.message.includes('Invalid file type')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// Article image upload (for admin)
router.post('/image', protectAdmin, upload.single('imageFile'), async (req, res) => {
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
    const cleanBaseName = path.basename(file.originalname, fileExt).replace(/[^a-zA-Z0-9.-]/g, '');
    const fileName = `articles/${timestamp}-${cleanBaseName}${fileExt}`;

    // Upload to Supabase Storage
    let { data, error } = await supabase.storage
      .from('article-images')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (error) {
      console.warn('⚠️ Supabase upload error (article-images), trying bucket creation...', error.message || error);
      try {
        await supabase.storage.createBucket('article-images', { public: true });
        const retry = await supabase.storage
          .from('article-images')
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            upsert: true
          });
        data = retry.data;
        error = retry.error;
      } catch (bErr) {
        console.warn('Failed to create article-images bucket:', bErr.message);
      }
    }

    if (error) {
      console.error('❌ Supabase article image upload failed:', error);
      // Local fallback
      try {
        const uploadsDir = path.join(__dirname, '../uploads/articles');
        await fs.mkdir(uploadsDir, { recursive: true });
        const localFileName = `${timestamp}-${cleanBaseName}${fileExt}`;
        const localFilePath = path.join(uploadsDir, localFileName);
        await fs.writeFile(localFilePath, file.buffer);

        const host = req.get('host') || 'localhost:5000';
        const protocol = req.protocol || 'http';
        const localUrl = `${protocol}://${host}/uploads/articles/${localFileName}`;

        return res.json({
          success: true,
          url: localUrl,
          path: `articles/${localFileName}`,
          message: 'Article image uploaded locally (fallback)'
        });
      } catch (localErr) {
        console.error('❌ Local fallback upload failed:', localErr);
        return res.status(500).json({
          success: false,
          error: `Upload failed: ${error.message || 'Storage error'}`
        });
      }
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
    
    if (error.message && error.message.includes('Invalid file type')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});



// Delete image from Supabase Storage
router.delete('/image/:bucket/:path(*)', protectAdmin, async (req, res) => {
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
