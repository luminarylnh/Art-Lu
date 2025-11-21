import React, { useState, useEffect } from 'react';
import { RecipeBasic } from './types';
import { fetchRecipeList } from './services/gemini';
import RecipeCard from './components/RecipeCard';
import CookingAssistant from './components/CookingAssistant';
import { UtensilsCrossed, Search, Loader2, AlertCircle, Globe } from 'lucide-react';
import { getAudioContext } from './utils/audio';

const App: React.FC = () => {
  const [recipes, setRecipes] = useState<RecipeBasic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeBasic | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Initialize data
  useEffect(() => {
    const loadRecipes = async () => {
      try {
        const list = await fetchRecipeList();
        setRecipes(list);
      } catch (err) {
        console.error(err);
        setError("無法載入食譜。請確認網路連線或 API Key 設定正確。");
      } finally {
        setLoading(false);
      }
    };
    loadRecipes();
  }, []);

  // Initialize Audio Context on first user interaction
  const handleStart = (recipe: RecipeBasic) => {
    getAudioContext(); // Trigger context creation
    setSelectedRecipe(recipe);
  };

  const filteredRecipes = recipes.filter(r => 
    r.name.includes(searchTerm) || r.category.includes(searchTerm)
  );

  if (selectedRecipe) {
    return <CookingAssistant recipe={selectedRecipe} onBack={() => setSelectedRecipe(null)} />;
  }

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-slate-800 font-sans pb-20">
      {/* Web Header */}
      <header className="bg-white sticky top-0 z-20 shadow-sm border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 rounded-xl text-white shadow-lg shadow-orange-200">
              <UtensilsCrossed size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Celestial Wok</h1>
              <p className="text-xs text-slate-500 font-medium tracking-wide">AI 中華料理智慧廚房</p>
            </div>
          </div>
          
          {/* Desktop Search */}
          <div className="hidden md:block w-96 relative group">
             <input 
               type="text" 
               placeholder="搜尋想吃的料理..."
               className="w-full bg-slate-100 border-2 border-transparent rounded-full py-3 pl-12 pr-6 text-sm focus:bg-white focus:border-orange-200 focus:ring-4 focus:ring-orange-50 outline-none transition-all"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
             <Search className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={18} />
          </div>

          {/* Mobile Search Icon Placeholder or Menu (Optional) */}
          <div className="md:hidden text-orange-500">
             <Globe size={24} />
          </div>
        </div>
      </header>

      {/* Mobile Search Bar (Sticky below header) */}
      <div className="md:hidden px-4 py-3 bg-white/80 backdrop-blur border-b border-slate-100 sticky top-[88px] z-10">
        <div className="relative">
             <input 
               type="text" 
               placeholder="搜尋食譜..."
               className="w-full bg-slate-100 border-none rounded-full py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-orange-200 outline-none"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
             <Search className="absolute left-3 top-3.5 text-slate-400" size={16} />
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-orange-500">
            <Loader2 className="animate-spin mb-6 text-orange-600" size={56} />
            <p className="font-medium text-lg text-slate-600">AI 主廚正在為您精心挑選今日菜單...</p>
          </div>
        ) : error ? (
           <div className="flex flex-col items-center justify-center py-32 text-red-500">
            <AlertCircle className="mb-6" size={56} />
            <p className="font-medium text-lg">{error}</p>
          </div>
        ) : (
          <>
            <div className="mb-10 text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">精選中華料理</h2>
              <p className="text-slate-500 text-lg">探索 {recipes.length} 道經典美味，在家也能做大廚</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredRecipes.map(recipe => (
                <RecipeCard 
                  key={recipe.id} 
                  recipe={recipe} 
                  onClick={handleStart} 
                />
              ))}
            </div>
            
            {filteredRecipes.length === 0 && (
              <div className="text-center py-32 text-slate-400 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <p className="text-lg">找不到符合「{searchTerm}」的食譜</p>
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="mt-4 text-orange-600 font-bold hover:underline"
                >
                  查看所有食譜
                </button>
              </div>
            )}
          </>
        )}
      </main>
      
      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <UtensilsCrossed size={24} />
            <span className="font-bold text-white text-lg">Celestial Wok</span>
          </div>
          <p className="text-sm">© 2025 AI 智慧廚房. Powered by Gemini 2.5</p>
        </div>
      </footer>
    </div>
  );
};

export default App;