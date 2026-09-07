export type AppStep = 'upload' | 'action' | 'processing' | 'result';

export type ActionCategory =
  | 'remove-bg'
  | 'change-bg'
  | 'enhance'
  | 'remove-object'
  | 'creative-styles'
  | 'custom';

export interface BackgroundPreset {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  prompt: string;
}

export interface CreativeStylePreset {
  id: string;
  name: string;
  category: 'Popular' | 'Artistic' | 'Fun';
  iconName: string;
  description: string;
  previewPrompt: string;
  prompt: string;
  badge?: string;
}

export interface EnhanceOption {
  id: string;
  name: string;
  description: string;
  prompt: string;
}

export interface SamplePhoto {
  id: string;
  name: string;
  category: string;
  url: string;
  description: string;
}

export interface EditRequestPayload {
  image: string; // Base64 data URL
  prompt: string;
  actionType: string;
  maskImage?: string; // Optional mask Base64
  aspectRatio?: string;
  modelPreference?: 'standard' | 'high-quality';
}

export interface EditResult {
  originalImage: string;
  resultImage: string;
  actionName: string;
  actionCategory: ActionCategory;
  appliedPrompt: string;
  timestamp: number;
}
