import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bug, Search, Bell, Menu, Folder, Ticket, Loader2, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import socket from '../socket';

import NotificationsDropdown from './NotificationsDropdown';
import ProfileDropdown from './ProfileDropdown';
import SettingsModal from './SettingsModal';
import CreateIssueModal from './CreateIssueModal';

const Navbar = ({ toggleSidebar }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState({ projects: [], tickets: [] });
    const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [settingsTab, setSettingsTab] = useState('profile');
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isCreateIssueModalOpen, setIsCreateIssueModalOpen] = useState(false);

    const searchRef = useRef(null);
    const notificationsRef = useRef(null);
    const profileRef = useRef(null);

    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsSearchDropdownOpen(false);
            }
            if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
                setIsNotificationsOpen(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (user) {
            fetchUnreadCount();

            const handleNewNotification = () => {
                setUnreadCount(prev => prev + 1);
            };

            socket.on(`notification-${user._id}`, handleNewNotification);

            return () => {
                socket.off(`notification-${user._id}`, handleNewNotification);
            };
        }
    }, [user]);

    const fetchUnreadCount = async () => {
        try {
            const response = await api.get('/notifications');
            const unread = response.data.filter(n => !n.isRead).length;
            setUnreadCount(unread);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    useEffect(() => {
        const fetchResults = async () => {
            if (searchQuery.trim().length === 0) {
                setSearchResults({ projects: [], tickets: [] });
                return;
            }

            setIsSearching(true);
            try {
                const response = await api.get(`/search?q=${searchQuery}`);
                setSearchResults(response.data);
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setIsSearching(false);
            }
        };

        const debounceTimer = setTimeout(() => {
            if (searchQuery.trim().length > 0) {
                fetchResults();
            } else {
                setSearchResults({ projects: [], tickets: [] });
            }
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [searchQuery]);

    const handleResultClick = (type, id, projectId) => {
        setIsSearchDropdownOpen(false);
        setSearchQuery('');
        if (type === 'project') {
            navigate(`/project/${id}`);
        } else if (type === 'ticket') {
            navigate(`/project/${projectId}?issueId=${id}`);
        }
    };

    const handleSettingsModalOpen = (tab = 'profile') => {
        setSettingsTab(tab);
        setIsSettingsModalOpen(true);
        setIsProfileOpen(false);
    };

    return (
        <nav className={`h-14 bg-surface border-b border-border flex items-center justify-between px-4 sticky top-0 transition-all shadow-sm ${(isSettingsModalOpen || isCreateIssueModalOpen) ? 'z-[10001]' : 'z-50'}`}>
            {/* Left: Branding & Mobile Menu */}
            <div className="flex items-center gap-4 min-w-[200px]">
                <button
                    onClick={toggleSidebar}
                    className="lg:hidden p-1.5 text-text-muted hover:text-primary hover:bg-background rounded-sm transition-colors"
                >
                    <Menu size={20} />
                </button>
                <Link to="/dashboard" className="flex items-center gap-2 text-primary font-bold text-xl flex-shrink-0">
                    <Bug size={24} />
                    <span className="hidden sm:inline">BugTracker</span>
                </Link>
            </div>

            {/* Center: Search Bar & Create Button */}
            <div className="hidden md:flex items-center gap-4 flex-1 justify-center max-w-2xl px-4">
                {/* Search Bar */}
                <div className="relative group flex-1 max-w-md" ref={searchRef}>
                    <Search
                        size={16}
                        className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isSearching ? 'text-primary' : 'text-text-muted'} group-focus-within:text-primary`}
                    />
                    <input
                        type="text"
                        placeholder="Search projects or issues..."
                        className="w-full pl-10 pr-10 py-1.5 bg-background border border-border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary transition-all"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setIsSearchDropdownOpen(true);
                        }}
                        onFocus={() => {
                            if (searchQuery.trim().length > 0) setIsSearchDropdownOpen(true);
                        }}
                    />
                    {isSearching && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 size={14} className="animate-spin text-primary" />
                        </div>
                    )}

                    {/* Search Results Dropdown */}
                    {isSearchDropdownOpen && (searchQuery.trim().length > 0) && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-sm shadow-xl z-50 max-h-[70vh] overflow-y-auto py-2">
                            {isSearching && searchResults.projects.length === 0 && searchResults.tickets.length === 0 ? (
                                <div className="px-4 py-8 text-center text-text-muted">
                                    <Loader2 size={24} className="animate-spin mx-auto mb-2 text-primary" />
                                    <p className="text-sm">Searching...</p>
                                </div>
                            ) : searchResults.projects.length === 0 && searchResults.tickets.length === 0 ? (
                                <div className="px-4 py-8 text-center text-text-muted italic text-sm">
                                    No results found for "{searchQuery}"
                                </div>
                            ) : (
                                <>
                                    {searchResults.projects.length > 0 && (
                                        <div className="mb-4">
                                            <div className="px-4 py-1 text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Projects</div>
                                            {searchResults.projects.map(project => (
                                                <button
                                                    key={project._id}
                                                    onClick={() => handleResultClick('project', project._id)}
                                                    className="w-full text-left px-4 py-2 hover:bg-background flex items-center gap-3 group transition-colors"
                                                >
                                                    <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-blue-600">
                                                        <Folder size={18} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-text group-hover:text-primary transition-colors truncate">{project.name}</p>
                                                        <p className="text-xs text-text-muted truncate">Project</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {searchResults.tickets.length > 0 && (
                                        <div>
                                            <div className="px-4 py-1 text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Issues</div>
                                            {searchResults.tickets.map(ticket => (
                                                <button
                                                    key={ticket._id}
                                                    onClick={() => handleResultClick('ticket', ticket._id, ticket.project?._id)}
                                                    className="w-full text-left px-4 py-2 hover:bg-background flex items-center gap-3 group transition-colors"
                                                >
                                                    <div className="w-8 h-8 rounded bg-red-100 flex items-center justify-center text-red-600">
                                                        <Ticket size={18} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-text group-hover:text-primary transition-colors truncate">{ticket.title}</p>
                                                        <p className="text-xs text-text-muted truncate">{ticket.project?.name} • {ticket.status}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Global Create Button */}
                <button
                    onClick={() => setIsCreateIssueModalOpen(true)}
                    className="bg-primary hover:bg-primary-dark text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-sm flex items-center gap-1.5 sm:gap-2 transition-all text-sm font-bold shadow-sm shrink-0 font-inter active:scale-95"
                >
                    <Plus size={18} />
                    <span className="hidden sm:inline">Create</span>
                </button>
            </div>

            {/* Right: Actions & Profile */}
            <div className="flex items-center gap-2 min-w-[200px] justify-end">
                {/* Utility Icons */}
                <div className="hidden sm:flex items-center gap-1">
                    <div className="relative" ref={notificationsRef}>
                        <button
                            onClick={() => {
                                setIsNotificationsOpen(!isNotificationsOpen);
                                setIsProfileOpen(false);
                                if (!isNotificationsOpen) setUnreadCount(0); // Optimistic clear
                            }}
                            className={`p-2 rounded-full transition-colors relative ${isNotificationsOpen ? 'bg-primary/10 text-primary' : 'text-text-muted hover:bg-background'}`}
                            title="Notifications"
                        >
                            <Bell size={20} />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-surface">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>
                        <NotificationsDropdown
                            isOpen={isNotificationsOpen}
                            onClose={() => setIsNotificationsOpen(false)}
                        />
                    </div>
                </div>

                {/* User Profile */}
                <div className="relative" ref={profileRef}>
                    <div
                        onClick={() => {
                            setIsProfileOpen(!isProfileOpen);
                            setIsNotificationsOpen(false);
                        }}
                        className="flex items-center gap-2 ml-2 pl-2 border-l border-border cursor-pointer"
                    >
                        <div className={`w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold ring-2 transition-all ${isProfileOpen ? 'ring-primary ring-offset-2' : 'ring-primary/20'}`} title={user?.name}>
                            {getInitials(user?.name)}
                        </div>
                    </div>
                    <ProfileDropdown
                        isOpen={isProfileOpen}
                        onClose={() => setIsProfileOpen(false)}
                        onSettingsClick={handleSettingsModalOpen}
                    />
                </div>
            </div>

            {/* Global Settings Modal */}
            {isSettingsModalOpen && (
                <SettingsModal onClose={() => setIsSettingsModalOpen(false)} defaultTab={settingsTab} />
            )}

            {/* Global Create Issue Modal */}
            <CreateIssueModal
                isOpen={isCreateIssueModalOpen}
                onClose={() => setIsCreateIssueModalOpen(false)}
            />
        </nav >
    );
};

export default Navbar;
