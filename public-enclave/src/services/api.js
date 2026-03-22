import axios from 'axios';
import { Capacitor } from '@capacitor/core';
import { auth } from './firebase';

const BASE_URL = Capacitor.isNativePlatform()
    ? 'https://temple-backend-zgu3.onrender.com/api/v1'
    : window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:8000/api/v1'
        : 'https://temple-backend-zgu3.onrender.com/api/v1';

/**
 * CONNECTIVITY:
 * Dynamically switches between Localhost (for development) and Render (for production).
 */

export const API_URL = BASE_URL;

if (Capacitor.isNativePlatform()) {
    console.log('[Native Connectivity] Backend Active:', API_URL);
}

const api = axios.create({
    baseURL: API_URL,
});

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
    }
    return config;
});

api.interceptors.response.use(
    response => {
        if (Capacitor.isNativePlatform()) {
            console.log(`[API Response] Success: ${response.status} for ${response.config.url}`);
            console.log(`[API Response Content] ${JSON.stringify(response.data).substring(0, 500)}`);
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

export const getLatestReviews = (limit = 12, offset = 0, search = '', verdict = '', content_type = '', sortBy = 'date', order = 'desc', tag = '', year = null, mustWatch = null) => {
    const params = {
        limit,
        offset,
        sort_by: sortBy,
        order
    };
    if (search) params.search = search;
    if (verdict && verdict !== 'All') params.verdict = verdict;
    if (content_type && content_type !== 'All') params.content_type = content_type;
    if (tag) params.tag = tag;
    if (year) params.year = year;
    if (mustWatch !== null) params.must_watch = mustWatch;

    return api.get('/reviews', { params });
};
export const getReviewBySlug = (slug) => api.get(`/reviews/${slug}`);
export const clapReview = (slug) => api.post(`/reviews/${slug}/clap`);
export const unclapReview = (slug) => api.delete(`/reviews/${slug}/clap`);
export const getRelatedReviews = (slug) => api.get(`/reviews/${slug}/related`);
export const reactReview = (slug, type, previousType = null) => api.post(`/reviews/${slug}/react`, {
    reaction_type: type,
    previous_type: previousType
});
export const getMasterpieces = () => api.get('/masterpieces');
export const getHallOfFameReviews = () => api.get('/masterpieces');
export const getCategories = () => api.get('/categories');
export const getMovieDetails = (imdbId) => api.get(`/movie/${imdbId}`);
export const getTVDetails = (tmdbId) => api.get(`/tv/${tmdbId}`);
export const getOracleDebate = (slug) => api.post('/oracle/debate', { slug });
export const getOracleDuel = (movie1, movie2) => api.post('/oracle/duel', { movie1, movie2 });
export const proxyImage = (url, quality = null) => {
    let finalQuality = quality;
    if (!finalQuality) {
        try {
            // Read directly from native storage or localStorage for instantaneous image url generation
            finalQuality = localStorage.getItem('sanctorum_posterQuality') || 'High';
        } catch {
            finalQuality = 'High';
        }
    }
    return `${API_URL}/proxy-image?url=${encodeURIComponent(url)}&quality=${finalQuality}`;
};

export const getMyProfile = () => api.get('/predictions/me');
export const getUpcomingPublicMovies = () => api.get('/predictions/upcoming');
export const makePrediction = (upcoming_movie_id, predicted_verdict) => api.post('/predictions/', { upcoming_movie_id, predicted_verdict });
export const getMyPredictions = () => api.get('/predictions/my-predictions');

export const getSettings = () => api.get('/settings');
export const getOscarYears = () => api.get('/oscar-years');
export const getRatingTimeline = (movieId) => api.get(`/ratings/${movieId}/timeline`);

export default api;
