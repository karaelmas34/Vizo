
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface VideoResultProps {
  videoUrl: string;
  onRestart: () => void;
  onNewProject: () => void;
}

const VideoResult: React.FC<VideoResultProps> = ({ videoUrl, onRestart, onNewProject }) => {
  const { t } = useLanguage();
  return (
    <div className="p-8 bg-gray-800/50 rounded-lg border border-gray-700 text-center">
      <h2 className="text-3xl font-bold mb-4">{t('result_title')}</h2>
      <p className="text-gray-400 mb-6">{t('result_subtitle')}</p>
      
      <div className="max-w-2xl mx-auto rounded-lg overflow-hidden border-2 border-indigo-500 shadow-lg shadow-indigo-500/20">
        <video src={videoUrl} controls autoPlay loop className="w-full h-auto" />
      </div>

      <div className="mt-8 flex justify-center space-x-4">
        <button
          onClick={onRestart}
          className="bg-gray-600 hover:bg-gray-500 text-white font-semibold px-6 py-2 rounded-md transition-colors"
        >
          {t('result_restart_button')}
        </button>
        <button
          onClick={onNewProject}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-2 rounded-md transition-colors"
        >
          {t('result_new_project_button')}
        </button>
      </div>
    </div>
  );
};

export default VideoResult;