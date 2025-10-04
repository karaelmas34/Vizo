export interface Character {
  id: string;
  name: string;
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface Dialogue {
  characterId: string;
  text: string;
  audioSource: 'text' | 'tts';
  ttsGender?: 'female' | 'male';
  ttsVoice?: string;
}

export interface VideoSettings {
  scenePrompt: string;
  duration: number;
  resolution: '480p' | '720p' | '1080p';
  aspectRatio: '16:9' | '9:16';
}

export interface User {
    id: number;
    name: string;
    email: string;
    credits: number;
    role: 'user' | 'admin' | 'premium';
    createdAt?: string;
}
