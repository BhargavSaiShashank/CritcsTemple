import axios from 'axios';

const API_URL = 'http://localhost:8000/api/v1';

const api = axios.create({
    baseURL: API_URL,
});

export const getLatestReviews = (limit = 12, offset = 0) => api.get(`/reviews?limit=${limit}&offset=${offset}`);
export const getReviewBySlug = (slug) => api.get(`/reviews/${slug}`);
export const getMasterpieces = () => api.get('/masterpieces');
export const getHallOfFameReviews = () => api.get('/masterpieces');
export const getMovieDetails = (imdbId) => api.get(`/movie/${imdbId}`);

export default api;
