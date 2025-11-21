import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { RecipeBasic, RecipeDetail, GradingResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Schema Definitions
const recipeListSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      name: { type: Type.STRING },
      description: { type: Type.STRING },
      difficulty: { type: Type.STRING, enum: ['Easy', 'Medium', 'Hard'] },
      time: { type: Type.STRING },
      category: { type: Type.STRING },
    },
    required: ['id', 'name', 'description', 'difficulty', 'time', 'category'],
  },
};

const recipeDetailSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    intro: { type: Type.STRING, description: "A warm, appetizing introduction to the dish in Traditional Chinese." },
    ingredients: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          item: { type: Type.STRING, description: "Name of the ingredient" },
          amount: { type: Type.STRING, description: "Quantity" },
          visualDescription: { type: Type.STRING, description: "A short English prompt to generate a clear, isolated photo of this ingredient." }
        },
        required: ['item', 'amount', 'visualDescription'],
      },
    },
    steps: {
      type: Type.ARRAY,
      description: "Step by step cooking instructions.",
      items: {
        type: Type.OBJECT,
        properties: {
          instruction: { type: Type.STRING, description: "The instruction text in Traditional Chinese." },
          visualDescription: { type: Type.STRING, description: "A short English prompt to generate a realistic photo of this cooking step being performed." }
        },
        required: ['instruction', 'visualDescription']
      },
    },
  },
  required: ['intro', 'ingredients', 'steps'],
};

const gradingSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.NUMBER, description: "Score out of 100 based on appearance." },
    feedback: { type: Type.STRING, description: "Constructive feedback in Traditional Chinese." },
    tips: { type: Type.STRING, description: "One pro tip to improve next time." },
  },
  required: ['score', 'feedback', 'tips'],
};

// 1. Fetch a curated list of recipes
export const fetchRecipeList = async (): Promise<RecipeBasic[]> => {
  // Increased count to simulate a fuller web catalog
  const prompt = "List 30 diverse, popular, and authentic Chinese dishes (including Sichuan, Cantonese, Taiwanese, etc) with IDs, names (in Traditional Chinese), short descriptions, difficulty, time, and category.";
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: recipeListSchema,
    },
  });

  const text = response.text;
  if (!text) return [];
  return JSON.parse(text) as RecipeBasic[];
};

// 2. Fetch specific details for a recipe
export const fetchRecipeDetails = async (recipeName: string): Promise<RecipeDetail> => {
  const prompt = `Create a detailed cooking guide for ${recipeName}. Include a warm cultural intro, precise ingredients with visual prompts, and clear step-by-step cooking instructions with visual prompts. Return in Traditional Chinese (prompts in English).`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: recipeDetailSchema,
    },
  });

  const text = response.text;
  if (!text) throw new Error("Failed to load recipe details");
  const details = JSON.parse(text);
  return { ...details, name: recipeName };
};

// 3. Generate Image (New)
export const generateImage = async (prompt: string, aspectRatio: "1:1" | "16:9" = "1:1"): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        // responseMimeType not supported for image generation models
        imageConfig: {
          aspectRatio: aspectRatio,
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const base64EncodeString = part.inlineData.data;
        return `data:image/png;base64,${base64EncodeString}`;
      }
    }
    return null;
  } catch (e) {
    console.error("Image Gen Error:", e);
    return null;
  }
};

// 4. Generate TTS Audio
export const generateSpeech = async (text: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (e) {
    console.error("TTS Error:", e);
    return null;
  }
};

// 5. Grade the dish using Vision
export const gradeDish = async (base64Image: string, recipeName: string): Promise<GradingResult> => {
  const prompt = `Act as a master chef judge. Rate this photo of ${recipeName} (Traditional Chinese). Analyze the color, texture, and presentation. Give a score (0-100) and constructive feedback.`;
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image
          }
        },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: gradingSchema,
    },
  });

  const text = response.text;
  if (!text) throw new Error("Failed to grade");
  return JSON.parse(text) as GradingResult;
};