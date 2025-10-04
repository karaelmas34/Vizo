import React, { useState, useEffect } from 'react';
import type { VideoSettings } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';

interface Step4SceneProps {
  initialSettings: VideoSettings;
  onGenerate: (settings: VideoSettings) => void;
  onBack: () => void;
}

const generationConfig = {
    user: {
        costPerSecond: 0.1,
        resolutions: {
            '480p': { maxDuration: 10 },
            '720p': { maxDuration: 0 },
            '1080p': { maxDuration: 0 },
        }
    },
    admin: { // Admins have premium-like capabilities for testing
        costPerSecond: 0.1,
        resolutions: {
            '480p': { maxDuration: 60 },
            '720p': { maxDuration: 45 },
            '1080p': { maxDuration: 30 },
        }
    }
};


const Step4Scene: React.FC<Step4SceneProps> = ({ initialSettings, onGenerate, onBack }) => {
  const { user } = useAuth();
  const plan = user?.role || 'user';
  
  const [settings, setSettings] = useState<VideoSettings>(initialSettings);
  const { t } = useLanguage();
  
  const configForPlan = generationConfig[plan];
  const maxDuration = configForPlan.resolutions[settings.resolution]?.maxDuration || 1;
  const creditCost = parseFloat((settings.duration * configForPlan.costPerSecond).toFixed(2));
  const hasEnoughCredits = user ? user.role === 'admin' || user.credits >= creditCost : false;

  useEffect(() => {
    const currentResConfig = configForPlan.resolutions[settings.resolution];
    if (currentResConfig.maxDuration === 0) {
        const firstValidRes = (Object.keys(configForPlan.resolutions) as Array<keyof typeof configForPlan.resolutions>).find(
            res => configForPlan.resolutions[res].maxDuration > 0
        ) || '480p';
        
        setSettings(prev => ({
            ...prev,
            resolution: firstValidRes,
            duration: Math.min(prev.duration, configForPlan.resolutions[firstValidRes].maxDuration || 1)
        }));
    } else {
        if (settings.duration > currentResConfig.maxDuration) {
             setSettings(prev => ({ ...prev, duration: currentResConfig.maxDuration }));
        }
    }
  }, [plan, settings.resolution, settings.duration, configForPlan]);


  const handleInputChange = <K extends keyof VideoSettings,>(key: K, value: VideoSettings[K]) => {
      setSettings(prev => ({...prev, [key]: value}));
  }

  return (
    <div className="p-8 bg-gray-800/50 rounded-lg border border-gray-700 max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold mb-2 text-center">{t('step4_title')}</h2>
      <p className="text-gray-400 mb-8 text-center">{t('step4_subtitle')}</p>
      
      <div className="space-y-6">
        <div>
          <label htmlFor="scene-prompt" className="block text-lg font-semibold text-gray-300 mb-2">
            {t('step4_prompt_label')}
          </label>
          <textarea
            id="scene-prompt"
            rows={3}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-indigo-500 focus:border-indigo-500 resize-y"
            placeholder={t('step4_prompt_placeholder')}
            value={settings.scenePrompt}
            onChange={e => handleInputChange('scenePrompt', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
                 <label htmlFor="resolution" className="block text-lg font-semibold text-gray-300 mb-2">
                    {t('step4_resolution_label')}
                 </label>
                 <select
                    id="resolution"
                    value={settings.resolution}
                    onChange={e => handleInputChange('resolution', e.target.value as VideoSettings['resolution'])}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-indigo-500 focus:border-indigo-500"
                 >
                    <option value="480p" disabled={configForPlan.resolutions['480p'].maxDuration === 0}>480p</option>
                    <option value="720p" disabled={configForPlan.resolutions['720p'].maxDuration === 0}>720p {plan === 'user' ? `(${t('user_status_premium')})` : ''}</option>
                    <option value="1080p" disabled={configForPlan.resolutions['1080p'].maxDuration === 0}>1080p {plan === 'user' ? `(${t('user_status_premium')})` : ''}</option>
                 </select>
            </div>
            <div className="md:col-span-1">
                 <label className="block text-lg font-semibold text-gray-300 mb-2">
                    {t('step4_aspect_ratio_label')}
                 </label>
                 <div 
                    className="flex items-center justify-center space-x-2 bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white h-[42px]"
                    title={t('step4_aspect_ratio_auto_detected_tooltip')}
                 >
                    {settings.aspectRatio === '16:9' ?
                        <svg width="20" height="20" viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><rect x="3" y="6" width="18" height="12" rx="2"></rect></svg> :
                        <svg width="20" height="20" viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><rect x="8" y="3" width="8" height="18" rx="2"></rect></svg>
                    }
                    <span className="font-semibold">{settings.aspectRatio === '16:9' ? t('step4_aspect_ratio_landscape') : t('step4_aspect_ratio_portrait')}</span>
                </div>
            </div>
            <div className="md:col-span-1">
                 <label htmlFor="duration" className="block text-lg font-semibold text-gray-300 mb-2">
                    {t('step4_duration_label', { duration: settings.duration, max: maxDuration })}
                 </label>
                 <input
                    id="duration"
                    type="range"
                    min="1"
                    max={maxDuration > 0 ? maxDuration : 1}
                    step="1"
                    value={settings.duration}
                    onChange={e => handleInputChange('duration', parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    disabled={maxDuration === 0}
                 />
            </div>
        </div>
        
        <div className="mt-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700 text-center">
            <h3 className="text-lg font-semibold text-gray-300">{t('step4_cost_title')}</h3>
            <p className="text-3xl font-bold text-indigo-400 my-2">{creditCost} {t('step4_tokens_unit')}</p>
            <p className="text-sm text-gray-400">{t('step4_cost_calculation', { duration: settings.duration, rate: configForPlan.costPerSecond })}</p>
            <p className="text-sm text-gray-400 mt-2">{t('step4_available_tokens', { tokens: user ? (user.role === 'admin' ? '∞' : user.credits) : 0 })}</p>
            {!hasEnoughCredits && (
                <p className="mt-2 text-sm text-red-500 font-semibold">{t('step4_insufficient_tokens')}</p>
            )}
        </div>
      </div>


      <div className="mt-10 flex justify-center space-x-4">
        <button
            onClick={onBack}
            className="bg-gray-600 hover:bg-gray-500 text-white font-semibold px-10 py-4 rounded-lg transition-colors"
        >
            {t('back_button')}
        </button>
        <button
          onClick={() => onGenerate(settings)}
          className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-lg px-10 py-4 rounded-lg transition-transform transform hover:scale-105 shadow-lg shadow-purple-500/30 disabled:bg-purple-800 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
          disabled={!hasEnoughCredits || maxDuration === 0}
        >
          {t('step4_generate_button_cost', { cost: creditCost })}
        </button>
      </div>
    </div>
  );
};

export default Step4Scene;