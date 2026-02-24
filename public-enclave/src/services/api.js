import axios from 'axios';

const API_URL = 'http://localhost:8000/api/v1';

const api = axios.create({
    baseURL: API_URL,
});

export const getLatestReviews = (limit = 12, offset = 0, search = '', verdict = '', sortBy = 'date', order = 'desc') => {
    const params = new URLSearchParams({ limit, offset, sort_by: sortBy, order });
    if (search) params.append('search', search);
    if (verdict && verdict !== 'All') params.append('verdict', verdict);
    return api.get(`/reviews?${params.toString()}`);
};
export const getReviewBySlug = (slug) => api.get(`/reviews/${slug}`);
export const getMasterpieces = () => api.get('/masterpieces');
export const getHallOfFameReviews = () => api.get('/masterpieces');
export const getMovieDetails = (imdbId) => api.get(`/movie/${imdbId}`);

export default api;
