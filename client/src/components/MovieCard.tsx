import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Clock, HardDrive, Film, ImageOff } from 'lucide-react';
import { Movie } from '../contexts/MovieContext';

interface MovieCardProps {
  movie: Movie;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie }) => {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const poster = movie.tmdb?.poster;
  const year = movie.tmdb?.year || (movie.tmdb?.release_date ? movie.tmdb.release_date.split('-')[0] : undefined);

  return (
    <motion.div
      variants={cardVariants}
      className="movie-card group"
    >
      {/* Poster or fallback */}
      <div className="relative aspect-[2/3] bg-gray-700 overflow-hidden">
        {poster ? (
          <img
            src={poster}
            alt={movie.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <ImageOff className="w-12 h-12 text-gray-500" />
          </div>
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center">
          <Link
            to={`/movie/${encodeURIComponent(movie.id)}`}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <div className="bg-blue-600 hover:bg-blue-700 rounded-full p-3 transition-colors duration-200">
              <Play className="w-6 h-6 text-white fill-current" />
            </div>
          </Link>
        </div>
        {/* Year badge */}
        {year && (
          <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
            {year}
          </div>
        )}
        {/* Quality badge */}
        {movie.resolution && (
          <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
            {movie.resolution}
          </div>
        )}
      </div>
      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors duration-200">
          {movie.tmdb?.title || movie.title}
        </h3>
        {movie.tmdb?.overview && (
          <div className="text-xs text-gray-400 mb-2 line-clamp-2">{movie.tmdb.overview}</div>
        )}
        <div className="space-y-2 text-sm text-gray-400">
          {movie.durationFormatted && (
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              <span>{movie.durationFormatted}</span>
            </div>
          )}
          <div className="flex items-center">
            <HardDrive className="w-4 h-4 mr-2" />
            <span>{movie.sizeFormatted}</span>
          </div>
          {movie.codec && (
            <div className="flex items-center">
              <Film className="w-4 h-4 mr-2" />
              <span className="uppercase">{movie.codec}</span>
            </div>
          )}
        </div>
        {/* Action buttons */}
        <div className="mt-4 flex space-x-2">
          <Link
            to={`/movie/${encodeURIComponent(movie.id)}`}
            className="flex-1 btn-primary text-center text-sm"
          >
            Play
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default MovieCard; 