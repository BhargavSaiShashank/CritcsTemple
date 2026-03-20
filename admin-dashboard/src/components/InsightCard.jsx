import React from 'react';
import { Sparkles, TrendingUp, TrendingDown, Info } from 'lucide-react';

const InsightCard = ({ insight }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'genre': return <Sparkles size={16} className="text-yellow-400" />;
      case 'hype': return <TrendingDown size={16} className="text-red-400" />;
      default: return <Info size={16} className="text-blue-400" />;
    }
  };

  const getBgColor = (type) => {
    switch (type) {
      case 'genre': return 'bg-yellow-500/5 border-yellow-500/20';
      case 'hype': return 'bg-red-500/5 border-red-500/20';
      default: return 'bg-blue-500/5 border-blue-500/20';
    }
  };

  return (
    <div className={`p-4 rounded-xl border ${getBgColor(insight.type)} flex gap-4 items-start transition-all hover:scale-[1.02] shadow-sm`}>
      <div className="mt-1 p-2 rounded-lg bg-black/20">
        {getIcon(insight.type)}
      </div>
      <div>
        <h4 className="text-xs font-bold uppercase tracking-tight text-gray-300 mb-1">
          {insight.type} Insight
        </h4>
        <p className="text-sm text-gray-400 leading-relaxed">
          {insight.message}
        </p>
        <div className="mt-2 w-full h-1 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-500 rounded-full" 
            style={{ width: `${insight.intensity * 100}%`, opacity: 0.7 }}
          />
        </div>
      </div>
    </div>
  );
};

export default InsightCard;
