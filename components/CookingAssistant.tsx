
import React, { useState, useEffect, useCallback } from 'react';
import { RecipeBasic, RecipeDetail, CookingState, GradingResult } from '../types';
import { fetchRecipeDetails, generateSpeech, gradeDish } from '../services/gemini';
import { playPCMData } from '../utils/audio';
import { ChefHat, Volume2, ArrowRight, CheckCircle, Play, List, Award, ArrowLeft, Loader2 } from 'lucide-react';
import CameraCapture from './CameraCapture';
import AsyncImage from './AsyncImage';

interface CookingAssistantProps {
  recipe: RecipeBasic;
  onBack: () => void;
}

const CookingAssistant: React.FC<CookingAssistantProps> = ({ recipe, onBack }) => {
  const [details, setDetails] = useState<RecipeDetail | null>(null);
  const [state, setState] = useState<CookingState>(CookingState.LOADING_DETAILS);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [gradingResult, setGradingResult] = useState<GradingResult | null>(null);
  const [audioCache, setAudioCache] = useState<Record<string, string>>({});

  // Load details on mount
  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchRecipeDetails(recipe.name);
        setDetails(data);
        setState(CookingState.INTRO);
      } catch (e) {
        console.error(e);
        // Handle error gracefully in a real app
      }
    };
    load();
  }, [recipe]);

  // Helper to speak text
  const speak = useCallback(async (text: string) => {
    if (isPlaying) return; // Simple debounce/block
    setIsPlaying(true);
    
    let audioData = audioCache[text];
    if (!audioData) {
      const fetched = await generateSpeech(text);
      if (fetched) {
        audioData = fetched;
        setAudioCache(prev => ({ ...prev, [text]: fetched }));
      }
    }

    if (audioData) {
      try {
        await playPCMData(audioData);
      } catch (e) {
        console.error("Playback error", e);
      }
    }
    setIsPlaying(false);
  }, [audioCache, isPlaying]);

  // Auto-speak when state/step changes
  useEffect(() => {
    if (!details) return;
    
    // Small delay to allow UI transition before speaking
    const timeout = setTimeout(() => {
      if (state === CookingState.INTRO) {
        speak(`歡迎來到${details.name}的教學。${details.intro}。準備好了嗎？讓我們開始查看食材。`);
      } else if (state === CookingState.INGREDIENTS) {
        speak("請準備以下食材。確認齊全後，點擊開始烹飪。");
      } else if (state === CookingState.COOKING) {
        speak(`步驟 ${currentStepIndex + 1}。${details.steps[currentStepIndex].instruction}`);
      } else if (state === CookingState.FINISHED) {
        speak("恭喜完成！請拍一張照片，讓我為這道菜評分。");
      }
    }, 500);

    return () => clearTimeout(timeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, currentStepIndex, details]);

  // Handlers
  const handleNextStep = () => {
    if (!details) return;
    if (currentStepIndex < details.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      setState(CookingState.FINISHED);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    } else {
      setState(CookingState.INGREDIENTS);
    }
  };

  const handleGrade = async (base64: string) => {
    setShowCamera(false);
    setState(CookingState.GRADING);
    try {
      const result = await gradeDish(base64, recipe.name);
      setGradingResult(result);
      setState(CookingState.GRADING_RESULT);
      speak(`評分完成。得分${result.score}分。${result.feedback}`);
    } catch (e) {
      console.error(e);
      setState(CookingState.FINISHED); // Fallback
    }
  };

  // Render Loading
  if (state === CookingState.LOADING_DETAILS || !details) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-amber-50">
        <Loader2 className="animate-spin text-orange-500 mb-4" size={48} />
        <p className="text-orange-800 font-medium animate-pulse">正在向主廚請教秘方...</p>
      </div>
    );
  }

  // Render Grading Logic
  if (showCamera) {
    return <CameraCapture onCapture={handleGrade} onCancel={() => setShowCamera(false)} />;
  }

  // Render Main Wizard
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm flex items-center justify-between sticky top-0 z-30">
        <button onClick={onBack} className="text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors">
          <ArrowLeft size={20} /> <span className="hidden sm:inline">返回食譜列表</span>
        </button>
        <h1 className="font-bold text-lg text-slate-800">{details.name}</h1>
        <div className="w-20"></div>
      </div>

      {/* Content Area */}
      <div className="flex-1 w-full max-w-6xl mx-auto p-6 pb-32">
        
        {/* INTRO VIEW */}
        {state === CookingState.INTRO && (
          <div className="animate-fade-in grid md:grid-cols-2 gap-8 items-start">
            <div className="w-full aspect-video bg-orange-100 rounded-3xl overflow-hidden shadow-lg ring-1 ring-black/5">
                <AsyncImage 
                  prompt={`Professional food photography of ${details.name}, authentic Chinese cuisine, appetizing, high resolution, soft lighting`} 
                  alt={details.name}
                  aspectRatio="16:9"
                  className="w-full h-full transition-transform duration-700 hover:scale-105"
                />
            </div>
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-orange-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-orange-100 p-2 rounded-full">
                     <ChefHat className="text-orange-600 w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800">主廚介紹</h2>
                </div>
                <p className="text-lg text-slate-600 leading-relaxed">{details.intro}</p>
              </div>
              <button 
                onClick={() => speak(details.intro)}
                className="flex items-center gap-2 text-orange-600 font-medium hover:bg-orange-50 px-4 py-2 rounded-full transition-colors"
              >
                <Volume2 size={20} /> 重聽介紹
              </button>
            </div>
          </div>
        )}

        {/* INGREDIENTS VIEW */}
        {state === CookingState.INGREDIENTS && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center md:text-left">
              <h2 className="text-3xl font-bold text-slate-800 flex items-center justify-center md:justify-start gap-3 mb-2">
                <List className="text-orange-500" /> 食材清單
              </h2>
              <p className="text-slate-500">AI 已為您準備好食材參考圖，請確認準備齊全。</p>
            </div>
            
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {details.ingredients.map((ing, i) => (
                <div key={i} className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 flex items-center gap-4 group">
                  <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-slate-50 ring-1 ring-slate-100">
                    <AsyncImage 
                      prompt={ing.visualDescription || `Fresh ${ing.item} ingredient, isolated white background, studio lighting`} 
                      alt={ing.item}
                      className="w-full h-full group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-slate-800 block text-lg truncate">{ing.item}</span>
                    <span className="inline-block bg-orange-50 text-orange-700 px-2 py-1 rounded-md text-sm font-medium mt-1">
                      {ing.amount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* COOKING STEPS VIEW */}
        {state === CookingState.COOKING && (
          <div className="animate-fade-in h-full flex flex-col md:flex-row gap-6 md:gap-10">
            {/* Left: Visual */}
            <div className="w-full md:w-1/2 flex flex-col gap-4">
               <div className="flex justify-between items-center text-slate-400 text-sm font-bold uppercase tracking-wider md:hidden">
                  <span>Step {currentStepIndex + 1} / {details.steps.length}</span>
               </div>
               <div className="w-full aspect-square md:aspect-[4/3] bg-slate-100 rounded-3xl overflow-hidden shadow-lg ring-1 ring-black/5 relative group">
                  <AsyncImage 
                    prompt={details.steps[currentStepIndex].visualDescription}
                    alt={`Step ${currentStepIndex + 1}`}
                    aspectRatio="1:1" 
                    className="w-full h-full transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-xs backdrop-blur font-medium">
                    AI 示意圖
                  </div>
               </div>
            </div>

            {/* Right: Instruction & Controls */}
            <div className="w-full md:w-1/2 flex flex-col justify-center space-y-8">
               <div className="hidden md:flex items-center gap-4">
                  <span className="text-6xl font-black text-slate-100 select-none">
                    {String(currentStepIndex + 1).padStart(2, '0')}
                  </span>
                  <div className="h-1 flex-1 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-orange-500 transition-all duration-500"
                      style={{ width: `${((currentStepIndex + 1) / details.steps.length) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-slate-400 font-bold">
                     / {details.steps.length}
                  </span>
               </div>

               <div className="bg-white p-8 rounded-3xl shadow-sm border-l-8 border-orange-500 relative">
                  <p className="text-2xl md:text-3xl font-medium text-slate-800 leading-snug">
                    {details.steps[currentStepIndex].instruction}
                  </p>
                  <button 
                    onClick={() => speak(details.steps[currentStepIndex].instruction)}
                    className="mt-6 flex items-center gap-2 text-slate-400 hover:text-orange-600 transition-colors text-sm font-medium"
                  >
                    <Volume2 size={18} /> 點擊重聽語音
                  </button>
               </div>

               {/* Desktop inline controls (Optional enhancement, keeping sticky bar for mobile consistency but we could move them here for desktop) */}
               <div className="hidden md:block text-slate-500 text-sm">
                  <p>💡 提示：您可以隨時點擊下方按鈕切換步驟</p>
               </div>
            </div>
          </div>
        )}

        {/* FINISHED VIEW */}
        {state === CookingState.FINISHED && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 text-center animate-fade-in max-w-2xl mx-auto">
            <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center text-green-500 shadow-xl shadow-green-100">
              <CheckCircle size={64} />
            </div>
            <div>
              <h2 className="text-4xl font-bold text-slate-800 mb-4">大功告成！</h2>
              <p className="text-xl text-slate-600">這道菜看起來一定很美味。<br/>現在，請拍一張照片，讓我為您的作品評分。</p>
            </div>
          </div>
        )}

        {/* GRADING LOADING */}
        {state === CookingState.GRADING && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
             <div className="relative">
               <div className="absolute inset-0 bg-orange-200 rounded-full blur-xl opacity-50 animate-pulse"></div>
               <Loader2 className="animate-spin text-orange-600 relative z-10" size={64} />
             </div>
             <p className="text-slate-500 mt-8 text-lg">AI 主廚正在細細品鑑您的作品...</p>
          </div>
        )}

        {/* RESULT VIEW */}
        {state === CookingState.GRADING_RESULT && gradingResult && (
          <div className="space-y-8 animate-fade-in max-w-3xl mx-auto">
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-12 rounded-[2rem] shadow-2xl text-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-white/10 transition-colors duration-700"></div>
              <Award className="mx-auto mb-6 text-yellow-400 drop-shadow-lg" size={64} />
              <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 mb-2 drop-shadow-sm">{gradingResult.score}</div>
              <div className="text-slate-400 font-bold tracking-[0.5em] uppercase text-sm">總分</div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-4 text-lg flex items-center gap-2">
                  <span className="w-2 h-8 bg-slate-800 rounded-full"></span> 大廚點評
                </h3>
                <p className="text-slate-600 leading-relaxed text-lg">{gradingResult.feedback}</p>
              </div>

              <div className="bg-orange-50 p-8 rounded-3xl border border-orange-100">
                <h3 className="font-bold text-orange-800 mb-4 text-lg flex items-center gap-2">
                  <span className="w-2 h-8 bg-orange-500 rounded-full"></span> 下次改進秘訣
                </h3>
                <p className="text-orange-700 text-lg">{gradingResult.tips}</p>
              </div>
            </div>
            
            <button 
              onClick={onBack}
              className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold text-lg shadow-lg hover:bg-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all"
            >
              挑戰下一道料理
            </button>
          </div>
        )}

      </div>

      {/* Sticky Bottom Controls - Responsive Container */}
      <div className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-md border-t border-slate-200 p-4 pb-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-40">
        <div className="max-w-4xl mx-auto flex gap-4">
          {state === CookingState.INTRO && (
             <button 
               onClick={() => setState(CookingState.INGREDIENTS)}
               className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-4 px-8 rounded-2xl font-bold text-lg shadow-lg shadow-orange-200 transition-all hover:shadow-orange-300 hover:-translate-y-0.5 flex items-center justify-center gap-2"
             >
               查看食材清單 <ArrowRight />
             </button>
          )}

          {state === CookingState.INGREDIENTS && (
             <button 
               onClick={() => setState(CookingState.COOKING)}
               className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-4 px-8 rounded-2xl font-bold text-lg shadow-lg shadow-orange-200 transition-all hover:shadow-orange-300 hover:-translate-y-0.5 flex items-center justify-center gap-2"
             >
               開始烹飪 <Play fill="currentColor" />
             </button>
          )}

          {state === CookingState.COOKING && (
            <>
              <button 
                onClick={handlePrevStep}
                className="flex-1 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 py-4 rounded-2xl font-bold transition-all"
              >
                上一步
              </button>
              <button 
                onClick={handleNextStep}
                className="flex-[2] bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-orange-200 transition-all hover:shadow-orange-300 hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                {currentStepIndex === details.steps.length - 1 ? '完成烹飪' : '下一步'} <ArrowRight />
              </button>
            </>
          )}

          {state === CookingState.FINISHED && (
             <button 
               onClick={() => setShowCamera(true)}
               className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-4 px-8 rounded-2xl font-bold text-lg shadow-lg shadow-orange-200 transition-all hover:shadow-orange-300 hover:-translate-y-0.5 flex items-center justify-center gap-2"
             >
               <CameraCaptureIcon /> 拍照讓 AI 評分
             </button>
          )}
        </div>
      </div>
    </div>
  );
};

const CameraCaptureIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
    <circle cx="12" cy="13" r="4"></circle>
  </svg>
);

export default CookingAssistant;
