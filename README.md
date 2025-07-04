# Periploko - Personal Movie Streaming Server

A modern, Plex-like web application for streaming your personal movie collection. Built with Node.js, Express, React, and TypeScript.

## Features

- 🎬 **Movie Library Management** - Organize and browse your movie collection
- 📺 **Video Streaming** - Stream movies with range requests and transcoding support
- 🔍 **Search & Filter** - Find movies quickly with real-time search
- 📱 **Responsive Design** - Beautiful UI that works on desktop and mobile
- 🎨 **Modern Interface** - Dark theme with smooth animations
- 📊 **Library Statistics** - Track your collection size and formats
- 🔄 **Auto-scan** - Automatically detect new movies in your library
- 📁 **File Upload** - Upload movies directly through the web interface

## Tech Stack

### Backend
- **Node.js** with Express.js
- **FFmpeg** for video processing and transcoding
- **SQLite** for metadata storage (future)
- **Multer** for file uploads
- **CORS** and **Helmet** for security

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Query** for data fetching
- **React Router** for navigation
- **React Player** for video playback

## Prerequisites

- Node.js 16+ and npm
- FFmpeg installed on your system

### Installing FFmpeg

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ffmpeg
```

**Windows:**
Download from [FFmpeg official website](https://ffmpeg.org/download.html)

## Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd periploko
```

2. **Install dependencies:**
```bash
# Install root dependencies
npm install

# Install all dependencies (backend + frontend)
npm run install-all
```

3. **Set up environment variables:**
```bash
# Copy the example environment file
cp server/env.example server/.env

# Edit the .env file with your preferences
nano server/.env
```

4. **Create media directory:**
```bash
mkdir server/media
```

## Usage

### Development Mode

Start both backend and frontend in development mode:
```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:3001`
- Frontend development server on `http://localhost:3000`

### Production Mode

1. **Build the frontend:**
```bash
npm run build
```

2. **Start the backend:**
```bash
cd server
npm start
```

## API Endpoints

### Movies
- `GET /api/movies` - Get all movies
- `GET /api/movies/:id` - Get movie by ID
- `GET /api/movies/search/:query` - Search movies

### Streaming
- `GET /api/stream/:filename` - Stream video file
- `GET /api/stream/transcode/:filename` - Transcode video
- `GET /api/stream/thumbnail/:filename` - Get video thumbnail
- `GET /api/stream/info/:filename` - Get video metadata

### Library Management
- `GET /api/library/stats` - Get library statistics
- `POST /api/library/scan` - Scan library for new files
- `POST /api/library/upload` - Upload movie file
- `DELETE /api/library/:filename` - Delete movie file
- `GET /api/library/directories` - Get directories
- `POST /api/library/directories` - Create directory

## File Structure

```
periploko/
├── server/                 # Backend API
│   ├── routes/            # API routes
│   ├── media/             # Movie files directory
│   ├── index.js           # Main server file
│   └── package.json       # Backend dependencies
├── client/                # Frontend React app
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   └── App.tsx        # Main app component
│   └── package.json       # Frontend dependencies
├── package.json           # Root package.json
└── README.md             # This file
```

## Adding Movies

### Method 1: File Upload
1. Go to the Library Management page
2. Click "Select Files" and choose your movie files
3. Wait for upload to complete

### Method 2: Direct File Placement
1. Copy your movie files to `server/media/`
2. Go to Library Management and click "Scan Library"
3. Your movies will appear in the library

## Supported Video Formats

- MP4 (.mp4)
- AVI (.avi)
- MKV (.mkv)
- MOV (.mov)
- WMV (.wmv)
- FLV (.flv)
- WebM (.webm)
- M4V (.m4v)

## Mobile Support

The web interface is fully responsive and works great on mobile devices. For future iOS app development, the API endpoints are designed to be easily consumed by mobile applications.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Troubleshooting

### Common Issues

**FFmpeg not found:**
- Make sure FFmpeg is installed and in your PATH
- Restart your terminal after installation

**Port already in use:**
- Change the PORT in server/.env
- Or kill the process using the port

**CORS errors:**
- Check that CLIENT_URL in server/.env matches your frontend URL
- Ensure the backend is running before starting the frontend

**Video not playing:**
- Check that the video file is in a supported format
- Verify the file is not corrupted
- Check browser console for errors

## Future Features

- [ ] User authentication and authorization
- [ ] Watch history and progress tracking
- [ ] Movie metadata from external APIs (TMDB)
- [ ] Subtitle support
- [ ] Multiple audio track support
- [ ] iOS/Android mobile apps
- [ ] Remote access and sharing
- [ ] Automatic library organization
- [ ] Movie recommendations
- [ ] Playlist support

## Support

If you encounter any issues or have questions, please open an issue on GitHub. 