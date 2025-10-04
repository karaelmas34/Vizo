import React, { useState, useCallback } from 'react';
import { uploadImage } from '../../services/apiService';
import type { Character } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

interface Step1UploadProps {
  onImageUploaded: (file: File, path: string, characters: Character[], aspectRatio: '16:9' | '9:16') => void;
}

const UploadIcon = () => (
    <svg className="w-12 h-12 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
    </svg>
);


const Step1Upload: React.FC<Step1UploadProps> = ({ onImageUploaded }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  const handleFileChange = async (file: File | null) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        setError(t('step1_error_file_type'));
        return;
    }
    setError(null);
    setIsProcessing(true);
    
    try {
        const { path, faces } = await uploadImage(file);
        const characters: Character[] = faces.map((face: any) => ({
            id: face.id,
            name: face.name,
            box: {
                x: face.boundingBox.x,
                y: face.boundingBox.y,
                width: face.boundingBox.width,
                height: face.boundingBox.height,
            }
        }));

        // Determine aspect ratio
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        img.onload = () => {
            const aspectRatio = img.naturalWidth >= img.naturalHeight ? '16:9' : '9:16';
            onImageUploaded(file, path, characters, aspectRatio);
            URL.revokeObjectURL(objectUrl);
        };
        img.onerror = () => {
             // Fallback if image fails to load, default to landscape
            onImageUploaded(file, path, characters, '16:9');
            URL.revokeObjectURL(objectUrl);
        };
        img.src = objectUrl;

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(`${t('step1_error_detection')}: ${errorMessage}`);
        console.error(err);
        setIsProcessing(false);
    }
  };

  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      handleFileChange(event.dataTransfer.files[0]);
      event.dataTransfer.clearData();
    }
  }, []);

  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div className="text-center p-8 bg-gray-800/50 rounded-lg border border-gray-700">
      <h2 className="text-3xl font-bold mb-2">{t('step1_title')}</h2>
      <p className="text-gray-400 mb-6">{t('step1_subtitle')}</p>
      
      {isProcessing ? (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-indigo-500"></div>
          <p className="mt-4 text-lg">{t('step1_processing')}</p>
        </div>
      ) : (
        <div 
          onDrop={onDrop} 
          onDragOver={onDragOver}
          className="flex items-center justify-center w-full"
        >
          <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-800 hover:bg-gray-700 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <UploadIcon />
              <p className="mb-2 text-sm text-gray-400"><span className="font-semibold">{t('step1_upload_click')}</span> {t('step1_upload_drag')}</p>
              <p className="text-xs text-gray-500">PNG, JPG or GIF</p>
            </div>
            <input id="dropzone-file" type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)} />
          </label>
        </div> 
      )}

      {error && <p className="mt-4 text-red-500">{error}</p>}
    </div>
  );
};

export default Step1Upload;