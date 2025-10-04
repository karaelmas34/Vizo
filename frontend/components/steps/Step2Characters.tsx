import React, { useState, useEffect, useRef } from 'react';
import type { Character } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

interface Step2CharactersProps {
  imageFile: File;
  initialCharacters: Character[];
  onNext: (characters: Character[]) => void;
  onBack: () => void;
}

type Interaction = {
    type: 'drag' | 'resize';
    characterId: string;
    handle: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
    initialBox: Character['box'];
    startX: number;
    startY: number;
} | null;

const DeleteIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);


const Step2Characters: React.FC<Step2CharactersProps> = ({ imageFile, initialCharacters, onNext, onBack }) => {
  const [characters, setCharacters] = useState<Character[]>(initialCharacters);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [faceCrops, setFaceCrops] = useState<Record<string, string>>({});
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [interaction, setInteraction] = useState<Interaction>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const objectUrl = URL.createObjectURL(imageFile);
    setImageUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => handleInteractionMove(e);
    const handleMouseUp = () => handleInteractionEnd();
    
    if (interaction) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [interaction]);

  useEffect(() => {
      if (!imageUrl || !imageRef.current) return;

      const image = new Image();
      image.src = imageUrl;
      image.crossOrigin = 'anonymous'; // In case the URL is not a blob URL in the future
      image.onload = () => {
          const newCrops: Record<string, string> = {};
          characters.forEach(char => {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              if (!ctx) return;

              const box = char.box;
              canvas.width = box.width;
              canvas.height = box.height;
              
              const sx = Math.max(0, box.x);
              const sy = Math.max(0, box.y);
              const sWidth = Math.min(box.width, image.naturalWidth - sx);
              const sHeight = Math.min(box.height, image.naturalHeight - sy);
              
              if (sWidth > 0 && sHeight > 0) {
                 ctx.drawImage(image, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);
                 newCrops[char.id] = canvas.toDataURL('image/png');
              }
          });
          setFaceCrops(newCrops);
      };
  }, [characters, imageUrl]);

  const getScale = () => {
      if (!imageRef.current?.naturalWidth || !imageRef.current?.offsetWidth) return 1;
      return imageRef.current.offsetWidth / imageRef.current.naturalWidth;
  }

  const handleNameChange = (id: string, newName: string) => {
    setCharacters(prev => prev.map(c => (c.id === id ? { ...c, name: newName } : c)));
  };

  const handleAddCharacter = () => {
    const newChar: Character = {
        id: `char_${Date.now()}`,
        name: `Character ${characters.length + 1}`,
        box: { x: 50, y: 50, width: 150, height: 150 }
    };
    setCharacters(prev => [...prev, newChar]);
  };

  const handleDeleteCharacter = (id: string) => {
    setCharacters(prev => prev.filter(c => c.id !== id));
  };
  
  const handleInteractionStart = (e: React.MouseEvent, characterId: string, type: Interaction['type'], handle: Interaction['handle'] = 'se') => {
      e.preventDefault();
      e.stopPropagation();
      const char = characters.find(c => c.id === characterId);
      if (!char) return;
      
      setInteraction({
          type,
          characterId,
          handle,
          initialBox: { ...char.box },
          startX: e.clientX,
          startY: e.clientY,
      });
  };

  const handleInteractionMove = (e: MouseEvent) => {
      if (!interaction || !containerRef.current) return;
      
      const scale = getScale();
      const dx = (e.clientX - interaction.startX) / scale;
      const dy = (e.clientY - interaction.startY) / scale;
      
      setCharacters(prev => prev.map(char => {
          if (char.id !== interaction.characterId) return char;

          let { x, y, width, height } = interaction.initialBox;
          
          if(interaction.type === 'drag') {
              x += dx;
              y += dy;
          } else { // resize
              if (interaction.handle.includes('e')) width += dx;
              if (interaction.handle.includes('w')) { x += dx; width -= dx; }
              if (interaction.handle.includes('s')) height += dy;
              if (interaction.handle.includes('n')) { y += dy; height -= dy; }
          }
          
          // Prevent negative width/height
          if (width < 20) {
              if (interaction.handle.includes('w')) x = char.box.x + char.box.width - 20;
              width = 20;
          }
          if (height < 20) {
              if (interaction.handle.includes('n')) y = char.box.y + char.box.height - 20;
              height = 20;
          }

          return { ...char, box: { x, y, width, height } };
      }));
  };
  
  const handleInteractionEnd = () => {
      setInteraction(null);
  };
  
  const resizeHandles: Interaction['handle'][] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

  return (
    <div className="p-8 bg-gray-800/50 rounded-lg border border-gray-700">
      <h2 className="text-3xl font-bold mb-2 text-center">{t('step2_title')}</h2>
      <p className="text-gray-400 mb-6 text-center">{t('step2_subtitle')}</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 relative select-none" ref={containerRef}>
            <img 
                ref={imageRef}
                src={imageUrl} 
                alt="Uploaded content" 
                className="rounded-lg w-full h-auto object-contain pointer-events-none"
            />
            {characters.map((char) => {
                const scale = getScale();
                const style = {
                    transform: `translate(${char.box.x * scale}px, ${char.box.y * scale}px)`,
                    width: `${char.box.width * scale}px`,
                    height: `${char.box.height * scale}px`,
                };
                return (
                    <div 
                        key={char.id}
                        className="absolute border-2 border-cyan-400 rounded-md cursor-move group"
                        style={style}
                        onMouseDown={(e) => handleInteractionStart(e, char.id, 'drag')}
                    >
                        <span className="absolute -top-6 left-0 bg-cyan-400 text-black text-xs font-semibold px-2 py-0.5 rounded">{char.name}</span>
                        {resizeHandles.map(handle => (
                            <div
                                key={handle}
                                onMouseDown={(e) => handleInteractionStart(e, char.id, 'resize', handle)}
                                className={`absolute w-3 h-3 bg-cyan-400 rounded-full -m-1.5 opacity-0 group-hover:opacity-100 transition-opacity
                                ${handle.includes('n') ? 'top-0' : ''} ${handle.includes('s') ? 'bottom-0' : ''}
                                ${handle.includes('w') ? 'left-0' : ''} ${handle.includes('e') ? 'right-0' : ''}
                                ${handle.length === 1 && (handle === 'n' || handle === 's') ? 'left-1/2' : ''}
                                ${handle.length === 1 && (handle === 'w' || handle === 'e') ? 'top-1/2' : ''}
                                cursor-${handle}-resize`}
                            />
                        ))}
                    </div>
                )
            })}
        </div>
        
        <div className="flex flex-col">
            <h3 className="text-xl font-semibold mb-4">{t('step2_characters_list_title')}</h3>
            <div className="space-y-4 flex-grow overflow-y-auto pr-2 max-h-[400px]">
              {characters.map((char, index) => (
                  <div key={char.id} className="flex items-center space-x-3 bg-gray-900/50 p-2 rounded-md border border-gray-700">
                      {faceCrops[char.id] ? (
                          <img src={faceCrops[char.id]} alt={char.name} className="w-14 h-14 rounded object-cover border-2 border-gray-600 flex-shrink-0" />
                      ) : (
                          <div className="w-14 h-14 rounded bg-gray-700 flex-shrink-0"></div>
                      )}
                      <div className="flex-grow">
                          <label htmlFor={`char-name-${index}`} className="block text-xs font-medium text-gray-400 mb-1">{t('step2_character_label', { index: index + 1 })}</label>
                          <input 
                              type="text"
                              id={`char-name-${index}`}
                              value={char.name}
                              onChange={(e) => handleNameChange(char.id, e.target.value)}
                              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-1.5 text-white focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          />
                      </div>
                      <button onClick={() => handleDeleteCharacter(char.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors self-center flex-shrink-0">
                        <DeleteIcon />
                      </button>
                  </div>
              ))}
              {characters.length === 0 && (
                <p className='text-gray-500 text-center py-4'>{t('step2_no_characters')}</p>
              )}
            </div>
            <div className="mt-6 border-t border-gray-700 pt-4">
              <button onClick={handleAddCharacter} className="w-full bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 rounded-md transition-colors mb-4">
                  {t('step2_add_character_button')}
              </button>
              <button
                  onClick={() => onNext(characters)}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-md transition-colors disabled:bg-indigo-800 disabled:cursor-not-allowed"
                  disabled={characters.length === 0}
              >
                  {t('step2_next_button')}
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Step2Characters;