import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './components/Sidebar';
import MovieLibrary from './pages/MovieLibrary';
import MoviePlayer from './pages/MoviePlayer';
import LibraryManagement from './pages/LibraryManagement';
import { MovieProvider } from './contexts/MovieContext';

const App: React.FC = () => {
  return (
    <MovieProvider>
      <div className="flex h-screen bg-gray-900">
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="h-full"
          >
            <Routes>
              <Route path="/" element={<MovieLibrary />} />
              <Route path="/movie/:id" element={<MoviePlayer />} />
              <Route path="/library" element={<LibraryManagement />} />
            </Routes>
          </motion.div>
        </main>
      </div>
    </MovieProvider>
  );
};

export default App; 