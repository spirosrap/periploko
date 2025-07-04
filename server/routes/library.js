const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs-extra');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const mediaDir = path.join(__dirname, '..', 'media');
    fs.ensureDirSync(mediaDir);
    cb(null, mediaDir);
  },
  filename: (req, file, cb) => {
    // Keep original filename but sanitize it
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, sanitizedName);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video files are allowed.'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 * 1024 // 10GB limit
  }
});

// Get library statistics
router.get('/stats', async (req, res) => {
  try {
    const mediaDir = path.join(__dirname, '..', 'media');
    const stats = {
      totalMovies: 0,
      totalSize: 0,
      totalDuration: 0,
      formats: {},
      lastScan: new Date().toISOString()
    };

    if (await fs.pathExists(mediaDir)) {
      const files = await fs.readdir(mediaDir);
      
      for (const file of files) {
        const filePath = path.join(mediaDir, file);
        const stat = await fs.stat(filePath);
        
        if (stat.isFile()) {
          const ext = path.extname(file).toLowerCase();
          if (['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v'].includes(ext)) {
            stats.totalMovies++;
            stats.totalSize += stat.size;
            stats.formats[ext] = (stats.formats[ext] || 0) + 1;
          }
        }
      }
    }

    stats.totalSizeFormatted = formatFileSize(stats.totalSize);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error getting library stats:', error);
    res.status(500).json({ success: false, error: 'Failed to get library stats' });
  }
});

// Scan library directory
router.post('/scan', async (req, res) => {
  try {
    const mediaDir = path.join(__dirname, '..', 'media');
    const scanResults = {
      scanned: 0,
      newFiles: 0,
      errors: [],
      startTime: new Date().toISOString()
    };

    if (await fs.pathExists(mediaDir)) {
      const files = await fs.readdir(mediaDir);
      
      for (const file of files) {
        try {
          const filePath = path.join(mediaDir, file);
          const stat = await fs.stat(filePath);
          
          if (stat.isFile()) {
            const ext = path.extname(file).toLowerCase();
            if (['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v'].includes(ext)) {
              scanResults.scanned++;
              // Here you could add logic to check if file is new
              scanResults.newFiles++;
            }
          }
        } catch (error) {
          scanResults.errors.push({ file, error: error.message });
        }
      }
    }

    scanResults.endTime = new Date().toISOString();
    res.json({ success: true, data: scanResults });
  } catch (error) {
    console.error('Error scanning library:', error);
    res.status(500).json({ success: false, error: 'Failed to scan library' });
  }
});

// Upload movie file
router.post('/upload', upload.single('movie'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const fileInfo = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      sizeFormatted: formatFileSize(req.file.size),
      mimetype: req.file.mimetype,
      uploadedAt: new Date().toISOString()
    };

    res.json({ 
      success: true, 
      message: 'File uploaded successfully',
      data: fileInfo 
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ success: false, error: 'Failed to upload file' });
  }
});

// Delete movie file
router.delete('/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const mediaDir = path.join(__dirname, '..', 'media');
    const filePath = path.join(mediaDir, filename);

    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    await fs.remove(filePath);
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ success: false, error: 'Failed to delete file' });
  }
});

// Get library directories
router.get('/directories', async (req, res) => {
  try {
    const mediaDir = path.join(__dirname, '..', 'media');
    const directories = [];

    if (await fs.pathExists(mediaDir)) {
      const items = await fs.readdir(mediaDir, { withFileTypes: true });
      
      for (const item of items) {
        if (item.isDirectory()) {
          const dirPath = path.join(mediaDir, item.name);
          const dirStat = await fs.stat(dirPath);
          
          directories.push({
            name: item.name,
            path: dirPath,
            createdAt: dirStat.birthtime,
            modifiedAt: dirStat.mtime
          });
        }
      }
    }

    res.json({ success: true, data: directories });
  } catch (error) {
    console.error('Error getting directories:', error);
    res.status(500).json({ success: false, error: 'Failed to get directories' });
  }
});

// Create new directory
router.post('/directories', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, error: 'Directory name is required' });
    }

    const mediaDir = path.join(__dirname, '..', 'media');
    const newDirPath = path.join(mediaDir, name.trim());

    if (await fs.pathExists(newDirPath)) {
      return res.status(400).json({ success: false, error: 'Directory already exists' });
    }

    await fs.ensureDir(newDirPath);
    const dirStat = await fs.stat(newDirPath);

    res.json({
      success: true,
      message: 'Directory created successfully',
      data: {
        name: name.trim(),
        path: newDirPath,
        createdAt: dirStat.birthtime,
        modifiedAt: dirStat.mtime
      }
    });
  } catch (error) {
    console.error('Error creating directory:', error);
    res.status(500).json({ success: false, error: 'Failed to create directory' });
  }
});

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = router; 