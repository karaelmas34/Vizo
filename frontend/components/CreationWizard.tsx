import { add as addJob } from "../services/jobTracker";
import React, { useState, useEffect } from 'react';
import type { Character, Dialogue, VideoSettings } from '../types';
import * as api from '../services/apiService';
import Step1Upload from './steps/Step1Upload';
import Step2Characters from './steps/Step2Characters';
import Step3Dialogues from './steps/Step3Dialogues';
import Step4Scene from './steps/Step4Scene';
import LoadingScreen from './LoadingScreen';
import VideoResult from './VideoResult';
import { useLanguage } from '../contexts/LanguageContext';

interface CreationWizardProps {
  onStartNew: () => void;
}
const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '');

const CreationWizard: React.FC<CreationWizardProps> = ({ onStartNew }) => {
  const [step, setStep] = useState(1);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePath, setImagePath] = useState<string>('');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [dialogues, setDialogues] = useState<Dialogue[]>([]);
  const [videoSettings, setVideoSettings] = useState<VideoSettings>({
    scenePrompt: '',
    duration: 5,
    resolution: '480p',
    aspectRatio: '16:9',
  });
  const [loadingMessage, setLoadingMessage] = useState('');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (!jobId) return;

    const pollJobStatus = async () => {
      try {
        const status = await api.getJobStatus(jobId);
        setLoadingMessage(`Job status: ${status.status}...`);

        if (status.status === 'done') {
          if (status.video_path) {
            // ⬇️ Windows \ karakterlerini / yap ve baştaki /’ları temizle
            const cleanPath = status.video_path.replace(/\\/g, '/').replace(/^\/+/, '');
            setGeneratedVideoUrl(`${API_BASE}/${cleanPath}`);
            setStep(6);
          } else {
            throw new Error("Job done but no video path received.");
          }
          setJobId(null);
        } else if (status.status === 'error') {
          console.error("Job failed:", status.error);
          alert(`Video generation failed: ${status.error}`);
          setJobId(null);
          setStep(4);
        }
      } catch (error) {
        console.error("Failed to get job status:", error);
        alert("Failed to get job status. Please check console for details.");
        setJobId(null);
        setStep(4);
      }
    };


  const handleImageUpload = (file: File, path: string, detectedCharacters: Character[], aspectRatio: '16:9' | '9:16') => {
    setImageFile(file);
    setImagePath(path);
    setCharacters(detectedCharacters);
    setDialogues(detectedCharacters.map(c => ({ characterId: c.id, text: '', audioSource: 'text', ttsGender: 'female' })));
    setVideoSettings(prev => ({
        ...prev,
        aspectRatio,
    }));
    setStep(2);
  };

  const handleCharactersSet = (updatedCharacters: Character[]) => {
    setCharacters(updatedCharacters);
    const newDialogues = updatedCharacters.map((char): Dialogue => {
        const existingDialogue = dialogues.find(d => d.characterId === char.id);
        return existingDialogue || { characterId: char.id, text: '', audioSource: 'text', ttsGender: 'female' };
    });
    setDialogues(newDialogues);
    setStep(3);
  };

  const handleDialoguesSet = (updatedDialogues: Dialogue[]) => {
    setDialogues(updatedDialogues);
    setStep(4);
  };

  const handleBack = () => {
    setStep(prev => Math.max(1, prev - 1));
  }

  const handleGeneration = async (settings: VideoSettings) => {
    if (!imageFile || !imagePath) return;
    setVideoSettings(settings);
    setStep(5);
    setLoadingMessage(t('loading_magic'));
    try {
      const payload = {
        imagePath: imagePath,
        prompt: settings.scenePrompt,
        aspect: settings.aspectRatio,
        resolution: settings.resolution,
        dialogues: dialogues,
        voice: {}, // Placeholder
        settings: settings
      };
      const result = await api.generateS2V(payload);
      if (result?.job_id) { try { addJob(result.job_id); } catch (e) {} }
      setJobId(result.job_id);
    } catch (error) {
      console.error("Video generation failed to start:", error);
      alert(`Failed to start video generation: ${error}`);
      setStep(4);
    }
  };

  const handleReset = () => {
    setStep(1);
    setImageFile(null);
    setImagePath('');
    setCharacters([]);
    setDialogues([]);
    setGeneratedVideoUrl(null);
    setLoadingMessage('');
    setJobId(null);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <Step1Upload onImageUploaded={handleImageUpload} />;
      case 2:
        return imageFile && <Step2Characters imageFile={imageFile} initialCharacters={characters} onNext={handleCharactersSet} onBack={handleBack} />;
      case 3:
        return <Step3Dialogues characters={characters} initialDialogues={dialogues} onNext={handleDialoguesSet} onBack={handleBack} />;
      case 4:
        return <Step4Scene initialSettings={videoSettings} onGenerate={handleGeneration} onBack={handleBack} />;
      case 5:
        return <LoadingScreen message={loadingMessage} />;
      case 6:
        return generatedVideoUrl && <VideoResult videoUrl={generatedVideoUrl} onRestart={handleReset} onNewProject={onStartNew} />;
      default:
        return <Step1Upload onImageUploaded={handleImageUpload} />;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
        {renderStep()}
    </div>
  );
};

export default CreationWizard;
