import React from 'react';
import { RecipeBasic } from '../types';
import { Clock, BarChart2, ChevronRight } from 'lucide-react';

interface RecipeCardProps {
  recipe: RecipeBasic;
  onClick: (recipe: RecipeBasic) => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onClick }) => {
  return (
    <div 
      onClick={() => onClick(recipe)}
      className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer border border-slate-100"
    >
      <div className="h-32 bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center relative overflow-hidden">
        <span className="text-4xl group-hover:scale-110 transition-transform duration-500">🥘</span>
        <div className="absolute top-3 right-3">
          <span className="px-2 py-1 bg-white/80 backdrop-blur text-xs font-medium rounded-full text-orange-700 shadow-sm">
            {recipe.category}
          </span>
        </div>
      </div>
      
      <div className="p-5">
        <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-orange-600 transition-colors">
          {recipe.name}
        </h3>
        <p className="text-sm text-slate-500 line-clamp-2 mb-4">
          {recipe.description}
        </p>
        
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>{recipe.time}</span>
          </div>
          <div className="flex items-center gap-1">
            <BarChart2 size={14} />
            <span className={`${
              recipe.difficulty === 'Easy' ? 'text-green-500' :
              recipe.difficulty === 'Medium' ? 'text-amber-500' : 'text-red-500'
            } font-medium`}>
              {recipe.difficulty}
            </span>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 w-full h-1 bg-orange-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
      </div>
    </div>
  );
};

export default RecipeCard;
