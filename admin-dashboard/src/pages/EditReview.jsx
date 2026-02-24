import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getReview } from '../services/api';
import ReviewForm from '../components/ReviewForm';
import { Loader2, ArrowLeft } from 'lucide-react';
import BackgroundAtmosphere from '../components/BackgroundAtmosphere';

const EditReview = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [review, setReview] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReview = async () => {
            try {
                const { data } = await getReview(id);
                setReview(data);
            } catch (error) {
                console.error("Failed to fetch review for editing:", error);
                alert("Failed to load review data.");
                navigate('/intelligence');
            } finally {
                setLoading(false);
            }
        };
        if (id) {
            fetchReview();
        }
    }, [id, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#020202] text-white flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
            </div>
        );
    }

    if (!review) return null;

    // Reconstruct movie object for ReviewForm header and layout
    const movieData = {
        id: review.movie_id,
        title: review.movie_title,
        poster_url: review.movie_poster_url,
    };

    return (
        <div className="min-h-screen bg-[#020202] text-[#f0f0f0] font-premium selection:bg-amber-500/30">
            <BackgroundAtmosphere imageUrl={movieData.poster_url} />
            <div className="fixed inset-0 spotlight pointer-events-none" />
            <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none animate-pulse" />

            <div className="relative z-10 max-w-[1800px] mx-auto pt-10 px-8 md:px-12 lg:px-20">
                <Link to="/intelligence" className="inline-flex items-center gap-3 text-white/40 hover:text-white transition-colors mb-10 group">
                    <div className="p-3 bg-white/5 border border-white/10 rounded-2xl group-hover:bg-amber-500/10 group-hover:border-amber-500/20 group-hover:text-amber-500 transition-all">
                        <ArrowLeft size={18} />
                    </div>
                    <span className="text-[10px] uppercase font-black tracking-widest">Back to Intelligence</span>
                </Link>

                <div className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter">
                        REFORGING <span className="text-amber-500">CRITIQUE</span>
                    </h1>
                </div>

                <ReviewForm
                    movie={movieData}
                    initialData={review}
                    onSubmit={() => navigate('/intelligence')}
                />
            </div>
        </div>
    );
};

export default EditReview;
