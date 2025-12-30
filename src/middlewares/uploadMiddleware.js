import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define upload directories
const uploadsDir = path.join(__dirname, '../../uploads');
const profilesDir = path.join(uploadsDir, 'profiles');
const ktpDir = path.join(uploadsDir, 'ktp');
const postsDir = path.join(uploadsDir, 'posts');

// Ensure upload directories exist
[uploadsDir, profilesDir, ktpDir, postsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isPostUpload = req.path.includes('/posts') || req.baseUrl.includes('/posts');
    const type = req.body.fotoType || req.query.fotoType;
    
    let uploadPath = profilesDir;
    
    if (isPostUpload) {
      uploadPath = postsDir;
    } else if (type === 'ktp') {
      uploadPath = ktpDir;
    } else if (type === 'profil') {
      uploadPath = profilesDir;
    }
    
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    console.log(`📁 Upload destination: ${uploadPath}`);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const userId = req.user?.id || 'anonymous';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    
    const isPostUpload = req.path.includes('/posts') || req.baseUrl.includes('/posts');
    
    if (isPostUpload) {
      // Initialize counter on first file
      if (!req.uploadCounter) {
        req.uploadCounter = 0;
      }
      req.uploadCounter++;
      
      const filename = `post-${userId}-${timestamp}-${req.uploadCounter}${ext}`;
      console.log(`📸 Generated filename: ${filename}`);
      cb(null, filename);
    } else {
      const random = Math.round(Math.random() * 1E9);
      const type = req.body.fotoType || req.query.fotoType || 'profil';
      const filename = `${type}-${userId}-${timestamp}-${random}${ext}`;
      console.log(`📄 Generated filename: ${filename}`);
      cb(null, filename);
    }
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 10 // Max 10 files per request
  },
  fileFilter: fileFilter
});

// Export untuk single file (profile, KTP)
export const uploadPhoto = upload;

// Export untuk multiple files (posts)
export const uploadPostImages = upload.array('images', 10);

// Error handler for multer
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum 5MB per file'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 10 images allowed'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};

// Default export
export default upload;