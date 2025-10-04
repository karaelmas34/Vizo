import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import type { User } from '../../types';

// Mock Data
const mockUsers: User[] = [
    { id: 1, name: 'Alice Johnson', email: 'alice@example.com', credits: 100, role: 'user', createdAt: '2023-10-26T10:00:00Z' },
    { id: 2, name: 'Bob Smith', email: 'bob@example.com', credits: 8, role: 'user', createdAt: '2023-10-25T11:30:00Z' },
    { id: 3, name: 'Charlie Brown', email: 'charlie@example.com', credits: 10, role: 'user', createdAt: '2023-10-24T15:00:00Z' },
    { id: 4, name: 'Admin User', email: 'admin@vizo.ai', credits: Infinity, role: 'admin', createdAt: '2023-01-01T00:00:00Z' },
    { id: 5, name: 'Diana Prince', email: 'diana@example.com', credits: 50, role: 'user', createdAt: '2023-10-22T09:00:00Z' },
];


const UserManagement: React.FC = () => {
    const { t } = useLanguage();
    const [users] = useState<User[]>(mockUsers);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredUsers = useMemo(() => {
        return users.filter(user =>
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white">{t('admin_users_title')}</h1>
                    <p className="mt-1 text-gray-400">{t('admin_users_subtitle')}</p>
                </div>
            </div>

            <div className="mb-4">
                <input
                    type="text"
                    placeholder={t('admin_users_search_placeholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full max-w-sm bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white placeholder-gray-400 focus:ring-cyan-500 focus:border-cyan-500"
                />
            </div>
            
            <div className="bg-gray-900/50 border border-gray-700 rounded-lg overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-800">
                        <tr>
                            <th scope="col" className="px-6 py-3">{t('admin_users_table_head_name')}</th>
                            <th scope="col" className="px-6 py-3">{t('admin_users_table_head_tokens')}</th>
                            <th scope="col" className="px-6 py-3">{t('admin_users_table_head_role')}</th>
                            <th scope="col" className="px-6 py-3">{t('admin_users_table_head_joined')}</th>
                            <th scope="col" className="px-6 py-3">{t('admin_users_table_head_actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(user => (
                            <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-800">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-white">{user.name}</div>
                                    <div className="text-gray-400">{user.email}</div>
                                </td>
                                <td className="px-6 py-4 font-mono">{user.credits === Infinity ? '∞' : user.credits}</td>
                                <td className="px-6 py-4">
                                     <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                                        user.role === 'admin' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-gray-600/30 text-gray-300'
                                    }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4">{formatDate(user.createdAt)}</td>
                                <td className="px-6 py-4">
                                    <button className="font-medium text-cyan-400 hover:underline">{t('admin_users_action_edit')}</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredUsers.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        No users found.
                    </div>
                 )}
            </div>
        </div>
    );
};

export default UserManagement;
