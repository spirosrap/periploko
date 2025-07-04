const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs-extra');
const ffmpeg = require('fluent-ffmpeg');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const TMDB_API_KEY = process.env.TMDB_API_KEY;

// Video file extensions
const VIDEO_EXTENSIONS = ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v'];

// Helper to recursively find all video files in a directory
async function findAllVideoFiles(dir) {
  let results = [];
  const list = await fs.readdir(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      results = results.concat(await findAllVideoFiles(filePath));
    } else {
      const ext = path.extname(file).toLowerCase();
      if (VIDEO_EXTENSIONS.includes(ext)) {
        results.push({ file, filePath });
      }
    }
  }
  return results;
}

// Get all movies
router.get('/', async (req, res) => {
  try {
    // Load media folders from config
    const configPath = path.join(__dirname, '../config.json');
    const config = await fs.readJson(configPath);
    const mediaFolders = config.mediaFolders || ['media'];
    const movies = [];

    for (const folder of mediaFolders) {
      const absFolder = path.isAbsolute(folder)
        ? folder
        : path.join(__dirname, '..', folder);
      if (await fs.pathExists(absFolder)) {
        const videoFiles = await findAllVideoFiles(absFolder);
        for (const { file, filePath } of videoFiles) {
          const movieInfo = await getMovieInfo(file, filePath);
          movies.push(movieInfo);
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

// Helper to fetch TMDb metadata
async function fetchTMDbMetadata(title, year) {
  if (!TMDB_API_KEY) return null;
  try {
    const query = encodeURIComponent(title);
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${query}${year ? `&year=${year}` : ''}`;
    const response = await axios.get(url);
    if (response.data && response.data.results && response.data.results.length > 0) {
      const movie = response.data.results[0];
      return {
        tmdb_id: movie.id,
        title: movie.title,
        overview: movie.overview,
        poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
        backdrop: movie.backdrop_path ? `https://image.tmdb.org/t/p/w780${movie.backdrop_path}` : null,
        release_date: movie.release_date,
        year: movie.release_date ? movie.release_date.split('-')[0] : null,
        vote_average: movie.vote_average,
        genres: movie.genre_ids,
      };
    }
  } catch (err) {
    console.error('TMDb fetch error:', err.message);
  }
  return null;
}

// Helper to extract title and year from filename
function extractTitleYear(filename) {
  // Example: The.Matrix.1999.1080p.mkv -> { title: 'The Matrix', year: 1999 }
  const name = path.parse(filename).name;
  const match = name.match(/(.+?)[. _-]((19|20)\d{2})/);
  if (match) {
    return { title: match[1].replace(/[._-]/g, ' ').trim(), year: match[2] };
  }
  return { title: name.replace(/[._-]/g, ' ').trim(), year: undefined };
}

// Helper function to get movie information
async function getMovieInfo(filename, filePath) {
  const stat = await fs.stat(filePath);
  const parsed = path.parse(filename);
  const { title, year } = extractTitleYear(filename);
  const dir = path.dirname(filePath);
  const baseName = parsed.name;
  let subtitle = null;
  // Look for .srt with same base name in same folder
  const srtPath = path.join(dir, baseName + '.srt');
  if (await fs.pathExists(srtPath)) {
    // Store relative path from media dir
    const mediaDir = path.join(__dirname, '..', 'media');
    subtitle = path.relative(mediaDir, srtPath);
  }

  return new Promise((resolve) => {
    // Store relative path from media directory instead of full path
    const mediaDir = path.join(__dirname, '..', 'media');
    const relativePath = path.relative(mediaDir, filePath);
    
    const movieInfo = {
      id: relativePath,
      title: parsed.name,
      filename: filename,
      path: relativePath,
      size: stat.size,
      sizeFormatted: formatFileSize(stat.size),
      createdAt: stat.birthtime,
      modifiedAt: stat.mtime,
      duration: null,
      resolution: null,
      codec: null,
      tmdb: null,
      subtitle
    };

    // Get video metadata using ffmpeg
    ffmpeg.ffprobe(filePath, async (err, metadata) => {
      if (!err && metadata && metadata.format) {
        const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
        if (videoStream) {
          movieInfo.duration = metadata.format.duration;
          movieInfo.durationFormatted = formatDuration(metadata.format.duration);
          movieInfo.resolution = `${videoStream.width}x${videoStream.height}`;
          movieInfo.codec = videoStream.codec_name;
        }
      }
      // Fetch TMDb metadata
      movieInfo.tmdb = await fetchTMDbMetadata(title, year);
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