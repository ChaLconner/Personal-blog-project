import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { getSupabase } from '../config/database.js';
import protectUser from '../middlewares/protectUser.js';
import protectAdmin from '../middlewares/protectAdmin.js';
import { prepareImageForStorage } from '../utils/imageProcessing.js';

const router = Router();

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

const IMAGE_EXTENSIONS = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp'
};

export const MAX_IMAGE_SIZE_MB = 5;
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const MAX_IMAGE_SIZE_ERROR = `File too large. Maximum size is ${MAX_IMAGE_SIZE_MB}MB`;

export const verifyImageMagicBytes = (buffer, mimetype) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return false;

  const signatures = {
    'image/jpeg': buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])),
    'image/jpg': buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])),
    'image/png': buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    'image/gif': ['GIF87a', 'GIF89a'].includes(buffer.toString('ascii', 0, 6)),
    'image/webp': buffer.toString('ascii', 0, 4) === 'RIFF'
      && buffer.toString('ascii', 8, 12) === 'WEBP'
  };

  return signatures[mimetype] === true;
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_IMAGE_SIZE_BYTES,
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (IMAGE_EXTENSIONS[file.mimetype]) {
      cb(null, true);
    } else {
      const error = new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
      error.status = 400;
      cb(error);
    }
  }
});

const sendStorageUploadError = (res, bucket, error) => {
  console.error(`❌ Supabase ${bucket} upload failed:`, {
    message: error?.message,
    name: error?.name,
    statusCode: error?.statusCode,
  });

  return res.status(502).json({
    success: false,
    error: 'Image storage upload failed. Please try again.',
  });
};

// Profile picture upload to Supabase Storage
router.post('/profile', protectUser, upload.single('imageFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    if (!verifyImageMagicBytes(req.file.buffer, req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file signature. File header does not match valid image format.'
      });
    }

    const userId = req.userId;
    const file = req.file;
    const preparedImage = await prepareImageForStorage(
      file.buffer,
      file.mimetype,
      'profile',
    );
    const timestamp = Date.now();
    const fileName = `${userId}/${timestamp}-profile${preparedImage.extension}`;

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from('profile-pictures')
      .upload(fileName, preparedImage.buffer, {
        contentType: preparedImage.contentType,
        upsert: false
      });

    if (error) {
      return sendStorageUploadError(res, 'profile-pictures', error);
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
        error: MAX_IMAGE_SIZE_ERROR
      });
    }
    
    if (error.status === 400) {
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

    if (!verifyImageMagicBytes(req.file.buffer, req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file signature. File header does not match valid image format.'
      });
    }

    const file = req.file;
    const preparedImage = await prepareImageForStorage(
      file.buffer,
      file.mimetype,
      'article',
    );
    const timestamp = Date.now();
    const originalExt = path.extname(file.originalname);
    const cleanBaseName = path.basename(file.originalname, originalExt).replace(/[^a-zA-Z0-9.-]/g, '');
    const fileName = `articles/${timestamp}-${cleanBaseName}${preparedImage.extension}`;

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from('article-images')
      .upload(fileName, preparedImage.buffer, {
        contentType: preparedImage.contentType,
        upsert: false
      });

    if (error) {
      return sendStorageUploadError(res, 'article-images', error);
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
        error: MAX_IMAGE_SIZE_ERROR
      });
    }
    
    if (error.status === 400) {
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
