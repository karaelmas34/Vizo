
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import type { User } from '../types';


interface AuthModalProps {
  onClose: () => void;
  onSuccess: (user: User) => void;
}

type AuthMode = 'login' | 'register';

const AuthModal: React.FC<AuthModalProps> = ({ onClose, onSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, register } = useAuth();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      let user: User;
      if (mode === 'login') {
        user = await login(email, password);
      } else {
        user = await register(name, email, password);
      }
      onSuccess(user);
    } catch (err) {
      setError('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const switchMode = () => {
    setMode(prev => prev === 'login' ? 'register' : 'login');
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity" onClick={onClose}>
      <div 
        className="bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-md m-4 transform transition-transform"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-center mb-1">{mode === 'login' ? t('auth_login_title') : t('auth_register_title')}</h2>
        <p className="text-center text-gray-400 mb-6 text-sm">
          {mode === 'login' ? t('auth_register_prompt') : t('auth_login_prompt')}{' '}
          <button onClick={switchMode} className="font-semibold text-indigo-400 hover:text-indigo-300">
            {mode === 'login' ? t('auth_register_button') : t('auth_login_button')}
          </button>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">{t('auth_name_label')}</label>
              <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">{t('auth_email_label')}</label>
            <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">{t('auth_password_label')}</label>
            <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-md transition-colors disabled:bg-indigo-800 disabled:cursor-not-allowed">
            {isLoading ? '...' : (mode === 'login' ? t('auth_login_button') : t('auth_register_button'))}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;