const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs-extra');
const ffmpeg = require('fluent-ffmpeg');
const { v4: uuidv4 } = require('uuid');

// Video file extensions
const VIDEO_EXTENSIONS = ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v'];

// Get all movies
router.get('/', async (req, res) => {
  try {
    const mediaDir = path.join(__dirname, '..', 'media');
    const movies = [];

    if (await fs.pathExists(mediaDir)) {
      const files = await fs.readdir(mediaDir);
      
      for (const file of files) {
        const filePath = path.join(mediaDir, file);
        const stat = await fs.stat(filePath);
        
        if (stat.isFile()) {
          const ext = path.extname(file).toLowerCase();
          if (VIDEO_EXTENSIONS.includes(ext)) {
            const movieInfo = await getMovieInfo(file, filePath);
            movies.push(movieInfo);
          }
        }
      }
    }

    res.json({
      success: true,
      data: movies,
      count: movies.length
    });
  } catch (error) {
    console.error('Error fetching movies:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch movies' });
  }
});

// Get movie by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const mediaDir = path.join(__dirname, '..', 'media');
    
    if (await fs.pathExists(mediaDir)) {
      const files = await fs.readdir(mediaDir);
      const movie = files.find(file => {
        const ext = path.extname(file).toLowerCase();
        return VIDEO_EXTENSIONS.includes(ext) && file.includes(id);
      });

      if (movie) {
        const filePath = path.join(mediaDir, movie);
        const movieInfo = await getMovieInfo(movie, filePath);
        res.json({ success: true, data: movieInfo });
      } else {
        res.status(404).json({ success: false, error: 'Movie not found' });
      }
    } else {
      res.status(404).json({ success: false, error: 'Media directory not found' });
    }
  } catch (error) {
    console.error('Error fetching movie:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch movie' });
  }
});

// Search movies
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const mediaDir = path.join(__dirname, '..', 'media');
    const movies = [];

    if (await fs.pathExists(mediaDir)) {
      const files = await fs.readdir(mediaDir);
      
      for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (VIDEO_EXTENSIONS.includes(ext)) {
          const fileName = path.parse(file).name.toLowerCase();
          if (fileName.includes(query.toLowerCase())) {
            const filePath = path.join(mediaDir, file);
            const movieInfo = await getMovieInfo(file, filePath);
            movies.push(movieInfo);
          }
        }
      }
    }

    res.json({
      success: true,
      data: movies,
      count: movies.length,
      query
    });
  } catch (error) {
    console.error('Error searching movies:', error);
    res.status(500).json({ success: false, error: 'Failed to search movies' });
  }
});

// Helper function to get movie information
async function getMovieInfo(filename, filePath) {
  const stat = await fs.stat(filePath);
  const parsed = path.parse(filename);
  
  return new Promise((resolve) => {
    const movieInfo = {
      id: uuidv4(),
      title: parsed.name,
      filename: filename,
      path: filePath,
      size: stat.size,
      sizeFormatted: formatFileSize(stat.size),
      createdAt: stat.birthtime,
      modifiedAt: stat.mtime,
      duration: null,
      resolution: null,
      codec: null
    };

    // Get video metadata using ffmpeg
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (!err && metadata && metadata.format) {
        const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
        if (videoStream) {
          movieInfo.duration = metadata.format.duration;
          movieInfo.durationFormatted = formatDuration(metadata.format.duration);
          movieInfo.resolution = `${videoStream.width}x${videoStream.height}`;
          movieInfo.codec = videoStream.codec_name;
        }
      }
      resolve(movieInfo);
    });
  });
}

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Helper function to format duration
function formatDuration(seconds) {
  if (!seconds) return 'Unknown';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

module.exports = router; 