import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Clock, User, MessageSquare, AlertCircle, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import api from '../api';
import socket from '../socket';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const NotificationsDropdown = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const dropdownRef = useRef(null);
    const isMountedRef = useRef(true);

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/notifications');
            if (isMountedRef.current) {
                // Deduplicate by Content + Ticket + Time Proximity
                // This handles cases where the DB has multiple records for the same logical event
                const uniqueNotifications = response.data.filter((n, index, self) => {
                    const firstMatchIndex = self.findIndex((t) => (
                        // Match ID OR (Same Ticket + Same Message + Same Project)
                        t._id === n._id || (
                            t.ticket?._id === n.ticket?._id &&
                            t.message === n.message &&
                            t.project?._id === n.project?._id
                        )
                    ));
                    return index === firstMatchIndex;
                });
                setNotifications(uniqueNotifications);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    useEffect(() => {
        isMountedRef.current = true;
        if (isOpen) {
            (async () => {
                await fetchNotifications();
            })();
        }
        return () => {
            isMountedRef.current = false;
        };
    }, [isOpen]);

    useEffect(() => {
        if (user) {
            const handleNewNotification = (notification) => {
                setNotifications(prev => {
                    // Smart check: skip if identical content already exists
                    const isDuplicate = prev.some(n =>
                        n._id === notification._id || (
                            (n.ticket?._id || n.ticket) === (notification.ticket?._id || notification.ticket) &&
                            n.message === notification.message
                        )
                    );
                    if (isDuplicate) return prev;
                    return [notification, ...prev];
                });
            };

            socket.on(`notification-${user._id}`, handleNewNotification);

            return () => {
                socket.off(`notification-${user._id}`, handleNewNotification);
            };
        }
    }, [user]);

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(notifications.map(n =>
                n._id === id ? { ...n, isRead: true } : n
            ));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const markAllRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const handleNotificationClick = (notification) => {
        // 1. Extract IDs robustly (handles populated objects or raw string IDs)
        const projectId = notification.project?._id || notification.project;
        const ticketId = notification.ticket?._id || notification.ticket;

        // 2. Mark as read in the background immediately if unread
        // We do this BEFORE navigating to reduce UI lag on the next page
        if (!notification.isRead) {
            markAsRead(notification._id);
        }

        // 3. Close the dropdown
        onClose();

        // 4. Perform Navigation
        if (projectId && ticketId) {
            // Using a clean path construction
            const url = `/project/${projectId}?issueId=${ticketId}`;
            navigate(url);
        } else {
            console.error('Navigation failed: missing mandatory IDs', { projectId, ticketId, notification });
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'Assignment': return <User size={14} className="text-blue-500" />;
            case 'StatusUpdate': return <Clock size={14} className="text-orange-500" />;
            case 'Comment': return <MessageSquare size={14} className="text-green-500" />;
            default: return <AlertCircle size={14} className="text-primary" />;
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-surface border border-border rounded-sm shadow-xl z-60 flex flex-col max-h-125"
            ref={dropdownRef}
        >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/50">
                <div className="flex items-center gap-2">
                    <Bell size={16} className="text-primary" />
                    <span className="font-bold text-sm text-text">Notifications</span>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={markAllRead}
                        className="text-[10px] font-bold text-primary hover:text-primary-dark uppercase tracking-wider"
                    >
                        Mark all as read
                    </button>
                    <button onClick={onClose} className="text-text-muted hover:text-text">
                        <X size={16} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-25">
                {notifications.length === 0 ? (
                    <div className="p-10 text-center text-text-muted italic text-sm">
                        No notifications yet
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {notifications.map((n) => (
                            <div
                                key={n._id}
                                onClick={() => handleNotificationClick(n)}
                                className={`px-4 py-4 hover:bg-background transition-colors cursor-pointer group relative ${!n.isRead ? 'bg-primary/5' : ''}`}
                            >
                                {!n.isRead && (
                                    <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                                )}
                                <div className="flex gap-3">
                                    <div className="mt-0.5 p-1.5 rounded bg-background border border-border">
                                        {getIcon(n.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start gap-2 mb-1">
                                            <span className="text-xs font-bold text-text truncate">
                                                {n.sender?.name || 'System'}
                                            </span>
                                            <span className="text-[10px] text-text-muted whitespace-nowrap">
                                                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-text-muted leading-relaxed">
                                            <span className="text-text font-medium">{n.message}</span>
                                            <span className="mx-1">•</span>
                                            <span>{n.project?.name}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="px-4 py-2 border-t border-border bg-background/30 text-center">
                <button className="text-[11px] font-bold text-text-muted hover:text-primary transition-colors">
                    View all notifications
                </button>
            </div>
        </div>
    );
};

export default NotificationsDropdown;
