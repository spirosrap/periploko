import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion } from 'framer-motion';
import { 
  Upload, 
  FolderOpen, 
  BarChart3, 
  Trash2, 
  RefreshCw,
  Plus,
  HardDrive,
  Film,
  Clock
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const LibraryManagement: React.FC = () => {
  const [uploading, setUploading] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const queryClient = useQueryClient();

  // Fetch library stats
  const { data: stats, isLoading: statsLoading } = useQuery(
    'library-stats',
    async () => {
      const response = await axios.get('/api/library/stats');
      return response.data;
    }
  );

  // Fetch directories
  const { data: directories, isLoading: dirsLoading } = useQuery(
    'directories',
    async () => {
      const response = await axios.get('/api/library/directories');
      return response.data;
    }
  );

  // Scan library mutation
  const scanMutation = useMutation(
    async () => {
      const response = await axios.post('/api/library/scan');
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Library scan completed!');
        queryClient.invalidateQueries('movies');
        queryClient.invalidateQueries('library-stats');
      },
      onError: () => {
        toast.error('Failed to scan library');
      }
    }
  );

  // Create directory mutation
  const createDirMutation = useMutation(
    async (name: string) => {
      const response = await axios.post('/api/library/directories', { name });
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Directory created successfully!');
        setNewFolderName('');
        queryClient.invalidateQueries('directories');
      },
      onError: () => {
        toast.error('Failed to create directory');
      }
    }
  );

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('movie', files[0]);

    try {
      const response = await axios.post('/api/library/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          console.log('Upload progress:', percentCompleted);
        },
      });

      if (response.data.success) {
        toast.success('File uploaded successfully!');
        queryClient.invalidateQueries('movies');
        queryClient.invalidateQueries('library-stats');
      }
    } catch (error) {
      toast.error('Failed to upload file');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createDirMutation.mutate(newFolderName.trim());
    }
  };

  return (
    <div className="content-area p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Library Management</h1>
        <p className="text-gray-400">Manage your movie collection and library settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Statistics Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-lg p-6"
        >
          <div className="flex items-center mb-6">
            <BarChart3 className="w-6 h-6 text-blue-400 mr-3" />
            <h2 className="text-xl font-semibold text-white">Library Statistics</h2>
          </div>

          {statsLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="loading-spinner"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center">
                    <Film className="w-5 h-5 text-blue-400 mr-2" />
                    <span className="text-gray-300">Total Movies</span>
                  </div>
                  <div className="text-2xl font-bold text-white mt-2">
                    {stats?.data?.totalMovies || 0}
                  </div>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center">
                    <HardDrive className="w-5 h-5 text-green-400 mr-2" />
                    <span className="text-gray-300">Total Size</span>
                  </div>
                  <div className="text-2xl font-bold text-white mt-2">
                    {stats?.data?.totalSizeFormatted || '0 B'}
                  </div>
                </div>
              </div>

              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-300">File Formats</span>
                  <button
                    onClick={() => scanMutation.mutate()}
                    disabled={scanMutation.isLoading}
                    className="btn-secondary text-sm flex items-center"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${scanMutation.isLoading ? 'animate-spin' : ''}`} />
                    Scan Library
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {stats?.data?.formats && Object.entries(stats.data.formats).map(([format, count]) => (
                    <div key={format} className="flex justify-between">
                      <span className="text-gray-400">{format}</span>
                      <span className="text-white font-medium">{count as number}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Upload Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800 rounded-lg p-6"
        >
          <div className="flex items-center mb-6">
            <Upload className="w-6 h-6 text-green-400 mr-3" />
            <h2 className="text-xl font-semibold text-white">Upload Movies</h2>
          </div>

          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">
                Drag and drop movie files here, or click to select
              </p>
              <input
                type="file"
                accept=".mp4,.avi,.mkv,.mov,.wmv,.flv,.webm,.m4v"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="btn-primary cursor-pointer inline-block"
              >
                {uploading ? 'Uploading...' : 'Select Files'}
              </label>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-white font-medium mb-2">Supported Formats</h3>
              <div className="text-sm text-gray-400">
                MP4, AVI, MKV, MOV, WMV, FLV, WebM, M4V
              </div>
            </div>
          </div>
        </motion.div>

        {/* Directories Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800 rounded-lg p-6 lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <FolderOpen className="w-6 h-6 text-purple-400 mr-3" />
              <h2 className="text-xl font-semibold text-white">Directories</h2>
            </div>
            <button
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim() || createDirMutation.isLoading}
              className="btn-primary text-sm flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Folder
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <input
              type="text"
              placeholder="Enter folder name..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="input-field"
            />
          </div>

          {dirsLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="loading-spinner"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {directories?.data?.map((dir: any) => (
                <div key={dir.name} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FolderOpen className="w-5 h-5 text-purple-400 mr-2" />
                      <span className="text-white font-medium">{dir.name}</span>
                    </div>
                    <button className="text-red-400 hover:text-red-300">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-sm text-gray-400 mt-2">
                    Created: {new Date(dir.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default LibraryManagement; 