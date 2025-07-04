import React, { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { Search, Play, Clock, HardDrive, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import MovieCard from '../components/MovieCard';
import { useMovieContext } from '../contexts/MovieContext';
import { Movie } from '../contexts/MovieContext';

const MovieLibrary: React.FC = () => {
  const { state, dispatch } = useMovieContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [moviesPerPage] = useState(20);

  // Fetch movies from API with pagination
  const { data: moviesData, isLoading, error } = useQuery(
    ['movies', currentPage, moviesPerPage],
    async () => {
      const response = await axios.get(`/api/movies?page=${currentPage}&limit=${moviesPerPage}`);
      return response.data;
    },
    {
      refetchInterval: 30000, // Refetch every 30 seconds
      keepPreviousData: true, // Keep previous data while loading new page
    }
  );

  // Fetch total count
  const { data: countData } = useQuery(
    'movieCount',
    async () => {
      const response = await axios.get('/api/movies/count');
      return response.data;
    },
    {
      refetchInterval: 60000, // Refetch count every minute
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

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalMovies = countData?.success ? countData.count : 0;
  const totalPages = Math.ceil(totalMovies / moviesPerPage);

  if (isLoading && !moviesData) {
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
          {totalMovies} movie{totalMovies !== 1 ? 's' : ''} in your collection
          {searchQuery && ` • ${filteredMovies.length} matching "${searchQuery}"`}
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
        <>
          {isLoading && moviesData && (
            <div className="mb-4 text-center">
              <div className="inline-flex items-center text-gray-400">
                <div className="loading-spinner mr-2"></div>
                Loading page {currentPage}...
              </div>
            </div>
          )}
          
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

          {/* Pagination */}
          {!searchQuery && totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center space-x-4">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 border border-gray-700 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </button>
              
              <div className="flex items-center space-x-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 bg-gray-800 border border-gray-700 hover:bg-gray-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 border border-gray-700 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          )}
        </>
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