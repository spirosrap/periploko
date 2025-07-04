const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs-extra');
const ffmpeg = require('fluent-ffmpeg');

// Stream video file (now supports ?path=...)
router.get('/', async (req, res) => {
  try {
    const relPath = req.query.path;
    if (!relPath) {
      return res.status(400).json({ error: 'Missing path parameter' });
    }
    const mediaDir = path.join(__dirname, '..', 'media');
    // Prevent path traversal
    const filePath = path.resolve(mediaDir, relPath);
    if (!filePath.startsWith(mediaDir)) {
      return res.status(400).json({ error: 'Invalid path' });
    }
    // Check if file exists
    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    const stat = await fs.stat(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    if (range) {
      // Handle range requests for video streaming
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': getContentType(filePath),
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      // Full file request
      const head = {
        'Content-Length': fileSize,
        'Content-Type': getContentType(filePath),
        'Accept-Ranges': 'bytes',
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    console.error('Error streaming file:', error);
    res.status(500).json({ error: 'Failed to stream file' });
  }
});

// Transcode video for different qualities
router.get('/transcode/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const { quality = '720p' } = req.query;
    const mediaDir = path.join(__dirname, '..', 'media');
    const filePath = path.join(mediaDir, filename);

    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Set quality settings
    const qualitySettings = {
      '480p': { width: 854, height: 480, bitrate: '800k' },
      '720p': { width: 1280, height: 720, bitrate: '1500k' },
      '1080p': { width: 1920, height: 1080, bitrate: '3000k' }
    };

    const settings = qualitySettings[quality] || qualitySettings['720p'];

    // Set headers for streaming
    res.writeHead(200, {
      'Content-Type': 'video/mp4',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    // Transcode and stream
    ffmpeg(filePath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .size(`${settings.width}x${settings.height}`)
      .videoBitrate(settings.bitrate)
      .audioBitrate('128k')
      .fps(24)
      .format('mp4')
      .on('error', (err) => {
        console.error('Transcoding error:', err);
        res.end();
      })
      .on('end', () => {
        console.log('Transcoding finished');
        res.end();
      })
      .pipe(res, { end: true });

  } catch (error) {
    console.error('Error transcoding file:', error);
    res.status(500).json({ error: 'Failed to transcode file' });
  }
});

// Get video thumbnail
router.get('/thumbnail/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const { time = '00:00:10' } = req.query;
    const mediaDir = path.join(__dirname, '..', 'media');
    const filePath = path.join(mediaDir, filename);

    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.writeHead(200, {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=86400'
    });

    ffmpeg(filePath)
      .seekInput(time)
      .frames(1)
      .size('320x180')
      .format('image2')
      .on('error', (err) => {
        console.error('Thumbnail generation error:', err);
        res.end();
      })
      .pipe(res);

  } catch (error) {
    console.error('Error generating thumbnail:', error);
    res.status(500).json({ error: 'Failed to generate thumbnail' });
  }
});

// Get video info
router.get('/info/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const mediaDir = path.join(__dirname, '..', 'media');
    const filePath = path.join(mediaDir, filename);

    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        console.error('Error getting video info:', err);
        return res.status(500).json({ error: 'Failed to get video info' });
      }

      const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
      const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');

      const info = {
        format: metadata.format,
        video: videoStream ? {
          codec: videoStream.codec_name,
          resolution: `${videoStream.width}x${videoStream.height}`,
          bitrate: videoStream.bit_rate,
          fps: videoStream.r_frame_rate
        } : null,
        audio: audioStream ? {
          codec: audioStream.codec_name,
          channels: audioStream.channels,
          sampleRate: audioStream.sample_rate
        } : null
      };

      res.json({ success: true, data: info });
    });

  } catch (error) {
    console.error('Error getting video info:', error);
    res.status(500).json({ error: 'Failed to get video info' });
  }
});

// Serve subtitle file
router.get('/subtitle', async (req, res) => {
  try {
    const relPath = req.query.path;
    if (!relPath) {
      return res.status(400).json({ error: 'Missing path parameter' });
    }
    const mediaDir = path.join(__dirname, '..', 'media');
    const filePath = path.resolve(mediaDir, relPath);
    if (!filePath.startsWith(mediaDir)) {
      return res.status(400).json({ error: 'Invalid path' });
    }
    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({ error: 'Subtitle not found' });
    }
    res.setHeader('Content-Type', 'text/vtt');
    // Convert SRT to VTT on the fly
    const srt = await fs.readFile(filePath, 'utf-8');
    const vtt = 'WEBVTT\n\n' + srt.replace(/\r/g, '').replace(/(\d+)\n(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/g, '$1\n$2 --> $3').replace(/,/g, '.');
    res.send(vtt);
  } catch (error) {
    console.error('Error serving subtitle:', error);
    res.status(500).json({ error: 'Failed to serve subtitle' });
  }
});

// Helper function to get content type
function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const contentTypes = {
    '.mp4': 'video/mp4',
    '.avi': 'video/x-msvideo',
    '.mkv': 'video/x-matroska',
    '.mov': 'video/quicktime',
    '.wmv': 'video/x-ms-wmv',
    '.flv': 'video/x-flv',
    '.webm': 'video/webm',
    '.m4v': 'video/x-m4v'
  };
  return contentTypes[ext] || 'application/octet-stream';
}

module.exports = router; 