import { useState } from 'react';
import { X, User, Mail, Shield, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const SettingsModal = ({ onClose }) => {
    const { user, updateUser } = useAuth();
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

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

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-60">
            <div className="bg-surface max-w-md w-full rounded-sm shadow-xl p-8 relative animate-in fade-in zoom-in duration-200">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-text-muted hover:text-text transition-colors"
                >
                    <X size={20} />
                </button>

                <h2 className="text-xl font-bold text-text mb-6">User Settings</h2>

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
                            <p className="text-[10px] text-text-muted mt-2 italic">
                                Role-based permissions are managed by system administrators.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-border mt-8">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-text hover:bg-background rounded-sm transition-colors text-sm font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-sm transition-colors text-sm font-medium shadow-sm flex items-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SettingsModal;
