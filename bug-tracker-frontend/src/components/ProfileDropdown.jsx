import { LogOut, Settings, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ProfileDropdown = ({ isOpen, onClose, onSettingsClick }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    if (!isOpen) return null;

    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    const handleLogout = () => {
        logout();
        onClose();
        navigate('/login');
    };

    const menuItems = [
        { icon: <Settings size={16} />, label: 'Settings', onClick: () => onSettingsClick('profile') },
    ];

    return (
        <div className="absolute top-full right-0 mt-2 w-64 bg-surface border border-border rounded-sm shadow-xl z-60 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header / User Info */}
            <div className="px-4 py-4 bg-background/50 border-b border-border flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold ring-2 ring-primary/20">
                    {getInitials(user?.name)}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-text truncate">{user?.name}</p>
                    <p className="text-[11px] text-text-muted truncate">{user?.email}</p>
                </div>
                <button onClick={onClose} className="text-text-muted hover:text-text">
                    <X size={16} />
                </button>
            </div>

            {/* Menu Items */}
            <div className="py-2">
                {menuItems.map((item, index) => (
                    <button
                        key={index}
                        onClick={item.onClick}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-background text-text-muted hover:text-primary transition-colors text-sm group"
                    >
                        <span className="text-text-muted group-hover:text-primary transition-colors">
                            {item.icon}
                        </span>
                        <span>{item.label}</span>
                    </button>
                ))}
            </div>

            {/* Footer / Logout */}
            <div className="p-2 border-t border-border mt-auto">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 text-text-muted hover:text-red-600 hover:bg-red-50 rounded-sm transition-colors text-sm"
                >
                    <LogOut size={16} />
                    <span>Log Out</span>
                </button>
            </div>
        </div>
    );
};

export default ProfileDropdown;
