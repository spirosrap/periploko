import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import ReactPlayer from 'react-player';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Maximize,
  Settings,
  Clock,
  HardDrive,
  Film
} from 'lucide-react';
import axios from 'axios';
import { useMovieContext } from '../contexts/MovieContext';

const MoviePlayer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useMovieContext();
  const playerRef = useRef<ReactPlayer>(null);
  
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [quality, setQuality] = useState('720p');

  // Find the movie by ID
  const movie = state.movies.find(m => m.id === id);

  // Get video stream URL
  const videoUrl = movie ? `/api/stream/${encodeURIComponent(movie.filename)}` : '';

  const handlePlayPause = () => {
    setPlaying(!playing);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  const handleProgress = (state: { played: number }) => {
    setPlayed(state.played);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(e.target.value);
    setPlayed(seekTime);
    if (playerRef.current) {
      playerRef.current.seekTo(seekTime);
    }
  };

  const handleDuration = (duration: number) => {
    setDuration(duration);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowControls(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [showControls]);

  if (!movie) {
    return (
      <div className="content-area p-8">
        <div className="text-center">
          <div className="text-red-400 text-lg mb-4">Movie not found</div>
          <button 
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="content-area bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black to-transparent">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-white hover:text-blue-400 transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Library
        </button>
      </div>

      {/* Video Player */}
      <div className="relative w-full h-screen">
        <ReactPlayer
          ref={playerRef}
          url={videoUrl}
          playing={playing}
          volume={volume}
          muted={muted}
          onProgress={handleProgress}
          onDuration={handleDuration}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onError={(e) => console.error('Player error:', e)}
          width="100%"
          height="100%"
          style={{ objectFit: 'contain' }}
          controls={false}
          config={{
            file: {
              attributes: {
                crossOrigin: "anonymous"
              }
            }
          }}
        />

        {/* Custom Controls */}
        <div 
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
        >
          {/* Progress Bar */}
          <div className="mb-4">
            <input
              type="range"
              min={0}
              max={1}
              step={0.001}
              value={played}
              onChange={handleSeek}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-white text-sm mt-1">
              <span>{formatTime(duration * played)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handlePlayPause}
                className="text-white hover:text-blue-400 transition-colors duration-200"
              >
                {playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setMuted(!muted)}
                  className="text-white hover:text-blue-400 transition-colors duration-200"
                >
                  {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                className="bg-gray-800 text-white text-sm rounded px-2 py-1 border border-gray-600"
              >
                <option value="480p">480p</option>
                <option value="720p">720p</option>
                <option value="1080p">1080p</option>
              </select>

              <button className="text-white hover:text-blue-400 transition-colors duration-200">
                <Maximize className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Movie Info Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3 }}
        className="absolute top-0 right-0 w-80 h-full bg-gray-800 bg-opacity-95 backdrop-blur-sm p-6 overflow-y-auto"
      >
        <h2 className="text-2xl font-bold text-white mb-4">{movie.title}</h2>
        
        <div className="space-y-4 text-gray-300">
          {movie.durationFormatted && (
            <div className="flex items-center">
              <Clock className="w-5 h-5 mr-3" />
              <span>{movie.durationFormatted}</span>
            </div>
          )}
          
          <div className="flex items-center">
            <HardDrive className="w-5 h-5 mr-3" />
            <span>{movie.sizeFormatted}</span>
          </div>

          {movie.resolution && (
            <div className="flex items-center">
              <Film className="w-5 h-5 mr-3" />
              <span>{movie.resolution}</span>
            </div>
          )}

          {movie.codec && (
            <div className="flex items-center">
              <Film className="w-5 h-5 mr-3" />
              <span className="uppercase">{movie.codec}</span>
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-3">File Information</h3>
          <div className="space-y-2 text-sm text-gray-400">
            <div>
              <span className="font-medium">Filename:</span> {movie.filename}
            </div>
            <div>
              <span className="font-medium">Created:</span> {new Date(movie.createdAt).toLocaleDateString()}
            </div>
            <div>
              <span className="font-medium">Modified:</span> {new Date(movie.modifiedAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MoviePlayer; 