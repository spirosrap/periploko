import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Maximize,
  Clock,
  HardDrive,
  Film,
  ImageOff,
  Star
} from 'lucide-react';
import { useMovieContext, Movie } from '../contexts/MovieContext';
import axios from 'axios';

const MoviePlayer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useMovieContext();
  const playerRef = useRef<HTMLVideoElement>(null);
  
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [quality, setQuality] = useState('720p');
  const [uiHidden, setUiHidden] = useState(false);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get('/api/movies').then(res => {
      const decodedId = decodeURIComponent(id || '');
      const found = res.data.data.find((m: Movie) => m.id === decodedId);
      setMovie(found);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowControls(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [showControls]);

  if (loading) {
    return (
      <div className="content-area p-8">
        <div className="text-center text-white">Loading...</div>
      </div>
    );
  }

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

  // Determine if we need to transcode (for x265/hevc)
  const needsTranscode = movie.codec && ["hevc", "x265"].includes(movie.codec.toLowerCase());
  const videoUrl = needsTranscode
    ? `/api/stream/transcode/${encodeURIComponent(movie.path)}?quality=720p`
    : `/api/stream?path=${encodeURIComponent(movie.path)}`;
  const subtitleUrl = movie.subtitle ? `/api/stream/subtitle?path=${encodeURIComponent(movie.subtitle)}` : null;

  const handlePlayPause = () => {
    setPlaying(!playing);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(e.target.value);
    setPlayed(seekTime);
    if (playerRef.current) {
      playerRef.current.currentTime = seekTime;
    }
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

  return (
    <div className="content-area bg-black relative">
      {/* Hide UI Button */}
      <button
        onClick={() => setUiHidden(!uiHidden)}
        className="absolute top-4 right-4 z-50 bg-gray-800 bg-opacity-80 text-white px-4 py-2 rounded shadow hover:bg-gray-700 transition"
        style={{ opacity: 0.7 }}
      >
        {uiHidden ? 'Show UI' : 'Hide UI'}
      </button>
      {/* Header and Info Panel, only show if !uiHidden */}
      {!uiHidden && (
        <>
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
          {/* Movie Info Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute top-0 right-0 w-80 h-full bg-gray-800 bg-opacity-95 backdrop-blur-sm p-6 overflow-y-auto"
          >
            {/* Poster and title */}
            <div className="flex flex-col items-center mb-4">
              {movie.tmdb?.poster ? (
                <img
                  src={movie.tmdb.poster}
                  alt={movie.tmdb.title || movie.title}
                  className="w-32 h-48 object-cover rounded shadow mb-2"
                />
              ) : (
                <div className="w-32 h-48 flex items-center justify-center bg-gray-700 rounded shadow mb-2">
                  <ImageOff className="w-10 h-10 text-gray-500" />
                </div>
              )}
              <h2 className="text-2xl font-bold text-white text-center mb-1">
                {movie.tmdb?.title || movie.title}
              </h2>
              {movie.tmdb?.year && (
                <div className="text-gray-400 text-sm mb-1">{movie.tmdb.year}</div>
              )}
              {movie.tmdb?.vote_average && (
                <div className="flex items-center text-yellow-400 text-sm mb-1">
                  <Star className="w-4 h-4 mr-1" />
                  {movie.tmdb.vote_average.toFixed(1)}
                </div>
              )}
            </div>
            {/* Overview */}
            {movie.tmdb?.overview && (
              <div className="text-gray-300 text-sm mb-4">
                {movie.tmdb.overview}
              </div>
            )}
            {/* Technical details */}
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
        </>
      )}
      {/* Video Player */}
      <div className={`relative w-full h-screen ${uiHidden ? '' : ''}`}>
        {needsTranscode && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-yellow-600 text-white px-4 py-1 rounded shadow text-sm font-semibold">
            Transcoding...
          </div>
        )}
        <video
          ref={playerRef}
          src={videoUrl}
          controls
          autoPlay={playing}
          style={{ width: '100%', height: '100%', objectFit: 'contain', background: 'black' }}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onVolumeChange={e => setVolume((e.target as HTMLVideoElement).volume)}
          onError={e => console.error('Player error:', e)}
        >
          {subtitleUrl && (
            <track
              label="English"
              kind="subtitles"
              srcLang="en"
              src={subtitleUrl}
              default
            />
          )}
        </video>
      </div>
    </div>
  );
};

export default MoviePlayer; 