import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

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
export const clapReview = (slug) => api.post(`/reviews/${slug}/clap`);
export const unclapReview = (slug) => api.delete(`/reviews/${slug}/clap`);
export const getRelatedReviews = (slug) => api.get(`/reviews/${slug}/related`);
<<<<<<< HEAD
export const reactReview = (slug, type, previousType = null) => api.post(`/reviews/${slug}/react`, {
    reaction_type: type,
    previous_type: previousType
});
=======
export const reactReview = (slug, type) => api.post(`/reviews/${slug}/react`, { reaction_type: type });
>>>>>>> 92339b316786a5f174f406f49387b7d349e1d812
export const getMasterpieces = () => api.get('/masterpieces');
export const getHallOfFameReviews = () => api.get('/masterpieces');
export const getCategories = () => api.get('/categories');
export const getMovieDetails = (imdbId) => api.get(`/movie/${imdbId}`);

export default api;
