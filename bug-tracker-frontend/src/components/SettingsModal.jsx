import { useState, useEffect } from 'react';
import { X, User, Mail, Shield, CheckCircle, Bell, Key, Layout } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const SettingsModal = ({ onClose, defaultTab = 'profile' }) => {
    const { user, updateUser } = useAuth();
    const [activeTab, setActiveTab] = useState(defaultTab);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        setActiveTab(defaultTab);
    }, [defaultTab]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const response = await api.put('/auth/profile', formData);
            updateUser(response.data);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const getRoleStyles = (role) => {
        switch (role) {
            case 'Admin': return { text: 'Admin', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' };
            case 'Manager': return { text: 'Manager', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
            case 'Developer': return { text: 'Developer', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
            case 'Viewer': return { text: 'Viewer', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' };
            default: return { text: 'Standard User', color: 'text-primary', bg: 'bg-background/50', border: 'border-border' };
        }
    };

    const roleStyle = getRoleStyles(user?.role);

    const tabs = [
        { id: 'profile', label: 'Profile', icon: <User size={16} /> },
        { id: 'security', label: 'Security', icon: <Key size={16} /> }
    ];

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
            <div className="bg-surface max-w-2xl w-full rounded-sm shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in duration-200 h-[500px]">
                {/* Sidebar */}
                <div className="w-full md:w-48 bg-background border-r border-border flex flex-col">
                    <div className="p-6 border-b border-border hidden md:block text-center">
                        <div className="w-12 h-12 rounded-full bg-primary mx-auto flex items-center justify-center text-white font-bold text-lg mb-2">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <p className="text-xs font-bold text-text truncate">{user?.name}</p>
                    </div>
                    <div className="p-2 space-y-1">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-sm text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-primary text-white' : 'text-text-muted hover:bg-surface hover:text-text'}`}
                            >
                                {tab.icon}
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col bg-surface relative min-w-0">
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 text-text-muted hover:text-text transition-colors z-10"
                    >
                        <X size={20} />
                    </button>

                    <div className="p-8 overflow-y-auto">
                        <h2 className="text-xl font-bold text-text mb-6 capitalize">{activeTab} Settings</h2>

                        {activeTab === 'profile' && (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {error && (
                                    <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-sm text-sm">
                                        {error}
                                    </div>
                                )}

                                {success && (
                                    <div className="p-3 bg-green-50 text-green-600 border border-green-100 rounded-sm text-sm flex items-center gap-2">
                                        <CheckCircle size={16} />
                                        Profile updated successfully!
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-text-muted uppercase mb-1 flex items-center gap-2">
                                            <User size={14} />
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-3 py-2 bg-background border border-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-text-muted uppercase mb-1 flex items-center gap-2">
                                            <Mail size={14} />
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            className="w-full px-3 py-2 bg-background border border-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>

                                    <div className="pt-2">
                                        <label className="block text-xs font-bold text-text-muted uppercase mb-2">Account Role</label>
                                        <div className={`flex items-center gap-2 px-3 py-2 ${roleStyle.bg} border ${roleStyle.border} border-dashed rounded-sm`}>
                                            <Shield size={16} className={roleStyle.color} />
                                            <span className={`text-sm font-medium ${roleStyle.color}`}>{roleStyle.text}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-border mt-8">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className={`bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-sm transition-colors text-sm font-medium shadow-sm flex items-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-6">
                                <div className="p-4 bg-background border border-border rounded-sm">
                                    <h3 className="text-sm font-bold text-text mb-2 flex items-center gap-2">
                                        <Shield size={16} className="text-primary" />
                                        Password Management
                                    </h3>
                                    <p className="text-xs text-text-muted mb-4 leading-relaxed">
                                        Manage your account security and authentication methods.
                                    </p>
                                    <button className="text-xs font-bold text-primary hover:underline uppercase tracking-wider">
                                        Change Password
                                    </button>
                                </div>
                                <div className="p-4 bg-red-50/50 border border-red-100 rounded-sm">
                                    <h3 className="text-sm font-bold text-red-600 mb-2 whitespace-nowrap overflow-hidden text-ellipsis">Danger Zone</h3>
                                    <p className="text-xs text-text-muted mb-3">
                                        Permanently delete your account and all associated data.
                                    </p>
                                    <button className="text-xs font-bold text-red-600 hover:text-red-700 uppercase tracking-wider">
                                        Delete Account
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
