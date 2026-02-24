import axios from 'axios';
import { auth } from './firebase';

const api = axios.create({
    baseURL: '/api/v1',
});

// Inject Firebase ID Token into every request
api.interceptors.request.use(async (config) => {
    const user = auth.currentUser;
    if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export const fetchMovieFromOMDb = (searchTerm) => api.post('/admin/movies/fetch', { search_term: searchTerm });
export const searchMovies = (title) => api.get(`/admin/movies/search?title=${title}`);
export const getLatestMovies = (category = 'english') => api.get(`/admin/movies/latest?category=${category}`);
export const getReviews = (params = {}) => api.get('/admin/reviews', { params });
export const getReview = (id) => api.get(`/admin/reviews/${id}`);
export const getDNAAnalytics = () => api.get('/admin/analytics/dna');
export const draftVerdict = (aspects) => api.post('/admin/ai/draft-verdict', { aspects });
export const createReview = (reviewData) => api.post('/admin/reviews', reviewData);
export const updateReview = (id, reviewData) => api.put(`/admin/reviews/${id}`, reviewData);
export const deleteReview = (id) => api.delete(`/admin/reviews/${id}`);
export const uploadImage = (formData) => api.post('/admin/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});
export const exportDataVault = () => api.get('/admin/export/vault', { responseType: 'blob' });

export default api;
