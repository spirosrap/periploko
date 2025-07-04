import React, { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { Search, Play, Clock, HardDrive } from 'lucide-react';
import axios from 'axios';
import MovieCard from '../components/MovieCard';
import { useMovieContext } from '../contexts/MovieContext';
import { Movie } from '../contexts/MovieContext';

const MovieLibrary: React.FC = () => {
  const { state, dispatch } = useMovieContext();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch movies from API
  const { data: moviesData, isLoading, error } = useQuery(
    'movies',
    async () => {
      const response = await axios.get('/api/movies');
      return response.data;
    },
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  useEffect(() => {
    if (moviesData?.success) {
      dispatch({ type: 'SET_MOVIES', payload: moviesData.data });
    }
  }, [moviesData, dispatch]);

  // Filter movies based on search query
  const filteredMovies = state.movies.filter(movie =>
    movie.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  if (isLoading) {
    return (
      <div className="content-area p-8">
        <div className="flex items-center justify-center h-64">
          <div className="loading-spinner"></div>
          <span className="ml-3 text-gray-400">Loading movies...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content-area p-8">
        <div className="text-center">
          <div className="text-red-400 text-lg mb-4">Error loading movies</div>
          <button 
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="content-area p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Movie Library</h1>
        <p className="text-gray-400">
          {filteredMovies.length} movie{filteredMovies.length !== 1 ? 's' : ''} in your collection
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search movies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>
      </div>

      {/* Movies Grid */}
      {filteredMovies.length > 0 ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
        >
          {filteredMovies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </motion.div>
      ) : (
        <div className="text-center py-16">
          <div className="text-gray-400 text-lg mb-4">
            {searchQuery ? 'No movies found matching your search.' : 'No movies in your library yet.'}
          </div>
          {!searchQuery && (
            <p className="text-gray-500">
              Add some movies to get started!
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default MovieLibrary; 