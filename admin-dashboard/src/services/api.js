import axios from 'axios';
import { auth } from './firebase';
import { Capacitor } from '@capacitor/core';

export const API_BASE_URL = Capacitor.isNativePlatform()
    ? 'https://shashank182123-critics-temple-api.hf.space/api/v1'
    : window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:8000/api/v1'
        : 'https://shashank182123-critics-temple-api.hf.space/api/v1';

console.log(`[API_CONFIG] Base URL: ${API_BASE_URL}`);

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    }
});


// Inject Firebase ID Token into every request
api.interceptors.request.use(async (config) => {
    if (auth && auth.currentUser) {
        try {
            const token = await auth.currentUser.getIdToken();
            config.headers.Authorization = `Bearer ${token}`;
        } catch (error) {
            console.error("[API Auth] Failed to attach token", error);
        }
    }
    if (Capacitor.isNativePlatform()) {
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
        // Add unique timestamp for every GET request on native to bypass CapacitorHttp cache
        if (config.method?.toLowerCase() === 'get') {
            config.params = { ...config.params, _t: Date.now() };
            config.headers['X-Request-Id'] = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

api.interceptors.response.use(
    response => {
        if (Capacitor.isNativePlatform()) {
            console.log(`[API Response] Success: ${response.status} for ${response.config.url}`);
        }
        return response;
    },
    error => {
        if (Capacitor.isNativePlatform()) {
            console.error('[API Error] Full Object:', JSON.stringify(error, null, 2));
            if (error.response) {
                console.error(`[API Error] Status: ${error.response.status}`);
                console.error(`[API Error] Data:`, error.response.data);
            } else if (error.request) {
                console.error(`[API Error] No response received. Request details:`, error.request);
            } else {
                console.error(`[API Error] Message: ${error.message}`);
            }
        }
        return Promise.reject(error);
    }
);

export const fetchMovieFromOMDb = (searchTerm) => api.post('/admin/movies/fetch', { search_term: searchTerm });
export const searchMovies = (title) => api.get(`/admin/movies/search?title=${title}`);
export const fetchShowFromTMDB = (tmdbId) => api.post('/admin/shows/fetch', { tmdb_id: tmdbId });
export const searchShows = (title) => api.get(`/admin/shows/search?title=${title}`);
export const getLatestMovies = (category = 'english') => api.get(`/admin/movies/latest?category=${category}`);
export const getReviews = (params = {}) => api.get('/admin/reviews', { params });
export const getReview = (id) => api.get(`/admin/reviews/${id}`);
export const getDNAAnalytics = () => api.get('/admin/analytics/dna');
export const getEngagementAnalytics = () => api.get('/admin/analytics/engagement');
export const createReview = (reviewData) => api.post('/admin/reviews', reviewData);
export const updateReview = (id, reviewData) => api.put(`/admin/reviews/${id}`, reviewData);
export const deleteReview = (id) => api.delete(`/admin/reviews/${id}`);
export const uploadImage = (formData) => api.post('/admin/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});
export const exportDataVault = () => api.get('/admin/export/vault', { responseType: 'blob' });
export const updateOscarRankings = (payload) => api.put('/admin/oscar-rankings', payload);

// Category Management
export const getCategories = () => api.get('/admin/categories');
export const createCategory = (data) => api.post('/admin/categories', data);
export const updateCategory = (id, data) => api.put(`/admin/categories/${id}`, data);
export const deleteCategory = (id) => api.delete(`/admin/categories/${id}`);

// Upcoming Movies (Predictions)
export const createUpcomingMovie = (data) => api.post('/admin/upcoming-movies', data);
export const getUpcomingMovies = () => api.get('/admin/upcoming-movies');
export const deleteUpcomingMovie = (id) => api.delete(`/admin/upcoming-movies/${id}`);
export const resolveUpcomingMovie = (id, actual_verdict) => api.patch(`/admin/upcoming-movies/${id}/resolve`, { actual_verdict });

// Global Settings
export const getSettings = () => api.get('/admin/settings');
export const updateSettings = (data) => api.put('/admin/settings', data);

// Image Proxy
export const getProxyImageUrl = (url) => {
    if (!url || url === 'N/A') return '';
    // Prevent double-proxying
    if (url.includes('/admin/proxy-image?url=')) return url;
    return `${API_BASE_URL}/admin/proxy-image?url=${encodeURIComponent(url)}`;
};


// Dynamic Ratings
export const updateDynamicRating = (data) => api.post('/ratings', data);
export const getRatingTimeline = (movieId) => api.get(`/ratings/${movieId}/timeline`);
export const resetRatingTimeline = (movieId) => api.delete(`/ratings/${movieId}`);

// Bias Detector
export const getBiasMetrics = (userId = 'default_user') => api.get('/bias', { params: { user_id: userId } });
export const recomputeBias = (userId = 'default_user') => api.post('/bias/recompute', null, { params: { user_id: userId } });

export default api;
