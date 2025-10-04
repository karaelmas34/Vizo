

import React, { useState, useEffect } from 'react';
import type { Character, Dialogue } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

interface Step3DialoguesProps {
  characters: Character[];
  initialDialogues: Dialogue[];
  onNext: (dialogues: Dialogue[]) => void;
  onBack: () => void;
}

const Step3Dialogues: React.FC<Step3DialoguesProps> = ({ characters, initialDialogues, onNext, onBack }) => {
  const [dialogues, setDialogues] = useState<Dialogue[]>(initialDialogues);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const { t } = useLanguage();

  useEffect(() => {
    const populateVoiceList = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const uniqueVoices = Array.from(new Set(voices.map(v => v.voiceURI)))
          .map(voiceURI => voices.find(v => v.voiceURI === voiceURI) as SpeechSynthesisVoice)
          .filter(Boolean);
        
        setAvailableVoices(uniqueVoices.sort((a, b) => a.name.localeCompare(b.name)));
      }
    };

    populateVoiceList();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = populateVoiceList;
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const handleDialogueChange = <K extends keyof Dialogue>(
    characterId: string,
    key: K,
    value: Dialogue[K]
  ) => {
    setDialogues(prev =>
      prev.map(d => {
        if (d.characterId === characterId) {
          const updatedDialogue = { ...d, [key]: value };
          if (key === 'ttsGender') {
            updatedDialogue.ttsVoice = '';
          }
          return updatedDialogue;
        }
        return d;
      })
    );
  };

  const getVoiceGender = (voice: SpeechSynthesisVoice): 'female' | 'male' => {
      const name = voice.name.toLowerCase();
      if (name.includes('female') || name.includes('kadın') || name.includes('woman') || name.includes('girl') || name.includes('zena')) {
          return 'female';
      }
      if (name.includes('male') || name.includes('erkek') || name.includes('man') || name.includes('boy')) {
          return 'male';
      }
      return 'female';
  };
  
  return (
    <div className="p-8 bg-gray-800/50 rounded-lg border border-gray-700 max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold mb-2 text-center">{t('step3_title')}</h2>
      <p className="text-gray-400 mb-8 text-center">{t('step3_subtitle')}</p>
      
      <div className="space-y-8">
        {characters.map(char => {
          const dialogue = dialogues.find(d => d.characterId === char.id);
          if (!dialogue) return null;

          const filteredVoices = availableVoices.filter(voice => getVoiceGender(voice) === (dialogue.ttsGender || 'female'));

          return (
            <div key={char.id} className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
              <h3 className="text-lg font-semibold text-cyan-400 mb-3">
                {char.name}
              </h3>
              
              <div className="flex border-b border-gray-600 mb-4">
                  <button 
                      onClick={() => handleDialogueChange(char.id, 'audioSource', 'text')}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${dialogue.audioSource === 'text' ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                      {t('step3_tab_text')}
                  </button>
                  <button 
                      onClick={() => handleDialogueChange(char.id, 'audioSource', 'tts')}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${dialogue.audioSource === 'tts' ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                      {t('step3_tab_tts')}
                  </button>
              </div>

              <textarea
                rows={3}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-indigo-500 focus:border-indigo-500"
                placeholder={t('step3_dialogue_placeholder', { name: char.name })}
                value={dialogue.text}
                onChange={e => handleDialogueChange(char.id, 'text', e.target.value)}
              />

              {dialogue.audioSource === 'tts' && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor={`tts-gender-${char.id}`} className="block text-sm font-medium text-gray-300 mb-2">
                      {t('step3_tts_gender_label')}
                    </label>
                    <select
                      id={`tts-gender-${char.id}`}
                      value={dialogue.ttsGender || 'female'}
                      onChange={e => handleDialogueChange(char.id, 'ttsGender', e.target.value as 'female' | 'male')}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="female">{t('gender_female')}</option>
                      <option value="male">{t('gender_male')}</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor={`tts-voice-${char.id}`} className="block text-sm font-medium text-gray-300 mb-2">
                      {t('step3_tts_voice_label')}
                    </label>
                    <select
                      id={`tts-voice-${char.id}`}
                      value={dialogue.ttsVoice || ''}
                      onChange={e => handleDialogueChange(char.id, 'ttsVoice', e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-indigo-500 focus:border-indigo-500"
                      disabled={filteredVoices.length === 0}
                    >
                      <option value="" disabled>{t('step3_tts_voice_select')}</option>
                      {filteredVoices.map(voice => (
                          <option key={voice.voiceURI} value={voice.voiceURI}>
                            {`${voice.name} (${voice.lang})`}
                          </option>
                      ))}
                    </select>
                    {availableVoices.length > 0 && filteredVoices.length === 0 && (
                      <p className="text-xs text-gray-500 mt-1">{t('step3_tts_no_voices')}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex justify-center space-x-4">
        <button
          onClick={onBack}
          className="bg-gray-600 hover:bg-gray-500 text-white font-semibold px-8 py-3 rounded-md transition-colors"
        >
          {t('back_button')}
        </button>
        <button
          onClick={() => onNext(dialogues)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3 rounded-md transition-colors"
        >
          {t('step3_next_button')}
        </button>
      </div>
    </div>
  );
};

export default Step3Dialogues;