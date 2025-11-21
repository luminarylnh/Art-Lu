
export interface RecipeBasic {
  id: string;
  name: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  time: string;
  category: string;
}

export interface Ingredient {
  item: string;
  amount: string;
  visualDescription: string; // Prompt for generating an image of this ingredient
}

export interface CookingStep {
  instruction: string;
  visualDescription: string; // Prompt for generating an image of this step
}

export interface RecipeDetail extends RecipeBasic {
  intro: string; // The heartfelt story/intro
  ingredients: Ingredient[];
  steps: CookingStep[]; // Array of cooking instructions with visuals
}

export enum CookingState {
  IDLE = 'IDLE',
  LOADING_DETAILS = 'LOADING_DETAILS',
  INTRO = 'INTRO',
  INGREDIENTS = 'INGREDIENTS',
  COOKING = 'COOKING',
  FINISHED = 'FINISHED',
  GRADING = 'GRADING',
  GRADING_RESULT = 'GRADING_RESULT'
}

export interface GradingResult {
  score: number;
  feedback: string;
  tips: string;
}
