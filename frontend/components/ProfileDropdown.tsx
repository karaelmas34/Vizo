

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import type { DashboardView } from '../App';

type View = 'home' | 'creating' | 'dashboard' | 'pricing' | 'features' | 'buyCredits' | 'admin';

interface ProfileDropdownProps {
  onNavigate: (view: View, subView?: DashboardView) => void;
}

const UserIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);


const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ onNavigate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { user, logout } = useAuth();
    const { t } = useLanguage();
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        onNavigate('home');
        setIsOpen(false);
    }
    
    const handleNavigation = (view: 'dashboard' | 'admin', subView?: DashboardView) => {
        onNavigate(view, subView);
        setIsOpen(false);
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center text-gray-300 hover:text-white">
                <UserIcon />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-700">
                    <div className="px-4 py-2 border-b border-gray-700">
                        <p className="text-sm text-gray-400">{t('profile_welcome')}</p>
                        <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                    </div>
                    {user?.role === 'admin' && (
                         <a href="#" onClick={(e) => { e.preventDefault(); handleNavigation('admin'); }} className="block px-4 py-2 text-sm font-bold text-cyan-400 hover:bg-gray-700">{t('admin_panel_title')}</a>
                    )}
                    <a href="#" onClick={(e) => { e.preventDefault(); handleNavigation('dashboard', 'dashboard'); }} className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">{t('profile_dashboard')}</a>
                    <a href="#" onClick={(e) => { e.preventDefault(); handleNavigation('dashboard', 'creations'); }} className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">{t('profile_creations')}</a>
                    <a href="#" onClick={(e) => { e.preventDefault(); handleNavigation('dashboard', 'settings'); }} className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">{t('profile_settings')}</a>
                    <a href="#" onClick={(e) => { e.preventDefault(); handleNavigation('dashboard', 'billing'); }} className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">{t('profile_billing')}</a>
                    <div className="border-t border-gray-700 my-1"></div>
                    <button onClick={handleLogout} className="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-red-500 hover:text-white">{t('profile_logout')}</button>
                </div>
            )}
        </div>
    );
};

export default ProfileDropdown;