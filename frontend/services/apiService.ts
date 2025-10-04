import type { User, Dialogue, VideoSettings } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8001";

interface ApiError {
    error: string;
}

const getAuthToken = (): string | null => {
    return localStorage.getItem('authToken');
};

const apiRequest = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    const token = getAuthToken();
    const headers = new Headers(options.headers || {});
    headers.append('Content-Type', 'application/json');
    if (token) {
        headers.append('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    const data = await response.json();

    if (!response.ok) {
        console.error('API Error:', data);
        throw new Error((data as ApiError).error || 'An unknown error occurred');
    }

    return data;
};


export const register = (name: string, email: string, password: string): Promise<{ ok: boolean, token: string, user: User }> => {
    return apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
    });
};

export const login = (email: string, password: string): Promise<{ ok: boolean, token: string, user: User }> => {
    return apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
};

export const getMe = (): Promise<{ ok: boolean, user: User }> => {
    return apiRequest('/auth/me');
};


export const uploadImage = async (file: File): Promise<{ path: string, faces: any[] }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = getAuthToken();
    const headers = new Headers();
    if (token) {
        headers.append('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        headers,
        body: formData,
    });
    
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'File upload failed');
    }
    return data;
};

interface GenerateS2VPayload {
    imagePath: string;
    prompt: string;
    aspect: '16:9' | '9:16';
    resolution: '480p' | '720p' | '1080p';
    dialogues: Dialogue[];
    voice: object; // Voice details can be fleshed out
    settings: VideoSettings;
}

export const generateS2V = (payload: GenerateS2VPayload): Promise<{ job_id: string }> => {
    return apiRequest('/api/generate-s2v', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
};

interface JobStatus {
    status: 'queued' | 'running' | 'done' | 'error';
    video_path: string | null;
    error: string | null;
}

export const getJobStatus = (jobId: string): Promise<JobStatus> => {
    return apiRequest(`/api/jobs/${jobId}`);
};
