import React, { createContext, useContext, useReducer, ReactNode } from 'react';

export interface Movie {
  id: string;
  title: string;
  filename: string;
  path: string;
  size: number;
  sizeFormatted: string;
  createdAt: Date;
  modifiedAt: Date;
  duration?: number;
  durationFormatted?: string;
  resolution?: string;
  codec?: string;
  tmdb?: {
    tmdb_id: number;
    title: string;
    overview: string;
    poster: string | null;
    backdrop: string | null;
    release_date: string;
    year: string | null;
    vote_average: number;
    genres: number[];
  } | null;
  subtitle?: string | null;
}

interface MovieState {
  movies: Movie[];
  loading: boolean;
  error: string | null;
  selectedMovie: Movie | null;
  searchQuery: string;
}

type MovieAction =
  | { type: 'SET_MOVIES'; payload: Movie[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SELECT_MOVIE'; payload: Movie | null }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'ADD_MOVIE'; payload: Movie }
  | { type: 'REMOVE_MOVIE'; payload: string };

const initialState: MovieState = {
  movies: [],
  loading: false,
  error: null,
  selectedMovie: null,
  searchQuery: '',
};

function movieReducer(state: MovieState, action: MovieAction): MovieState {
  switch (action.type) {
    case 'SET_MOVIES':
      return { ...state, movies: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SELECT_MOVIE':
      return { ...state, selectedMovie: action.payload };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    case 'ADD_MOVIE':
      return { ...state, movies: [...state.movies, action.payload] };
    case 'REMOVE_MOVIE':
      return { ...state, movies: state.movies.filter(movie => movie.id !== action.payload) };
    default:
      return state;
  }
}

interface MovieContextType {
  state: MovieState;
  dispatch: React.Dispatch<MovieAction>;
}

const MovieContext = createContext<MovieContextType | undefined>(undefined);

export const useMovieContext = () => {
  const context = useContext(MovieContext);
  if (context === undefined) {
    throw new Error('useMovieContext must be used within a MovieProvider');
  }
  return context;
};

interface MovieProviderProps {
  children: ReactNode;
}

export const MovieProvider: React.FC<MovieProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(movieReducer, initialState);

  return (
    <MovieContext.Provider value={{ state, dispatch }}>
      {children}
    </MovieContext.Provider>
  );
}; 