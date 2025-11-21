import React, { useState, useEffect } from 'react';
import { generateImage } from '../services/gemini';
import { Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';

interface AsyncImageProps {
  prompt: string;
  alt: string;
  aspectRatio?: "1:1" | "16:9";
  className?: string;
}

// Simple memory cache to prevent refetching images for the same prompt during the session
const imageCache: Record<string, string> = {};

const AsyncImage: React.FC<AsyncImageProps> = ({ prompt, alt, aspectRatio = "1:1", className = "" }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchImage = async () => {
      if (!prompt) return;
      
      // Check cache first
      if (imageCache[prompt]) {
        setImageUrl(imageCache[prompt]);
        return;
      }

      setLoading(true);
      setError(false);
      try {
        const url = await generateImage(prompt, aspectRatio as "1:1" | "16:9");
        if (url) {
          imageCache[prompt] = url;
          setImageUrl(url);
        } else {
          setError(true);
        }
      } catch (e) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchImage();
  }, [prompt, aspectRatio]);

  if (loading) {
    return (
      <div className={`bg-slate-100 flex items-center justify-center text-slate-300 ${className}`}>
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className={`bg-slate-100 flex flex-col items-center justify-center text-slate-400 ${className}`}>
        <ImageIcon size={24} />
        <span className="text-[10px] mt-1">無法載入圖片</span>
      </div>
    );
  }

  return (
    <img 
      src={imageUrl} 
      alt={alt} 
      className={`object-cover animate-fade-in ${className}`} 
    />
  );
};

export default AsyncImage;