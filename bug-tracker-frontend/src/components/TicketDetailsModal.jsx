import React, { useState, useEffect } from 'react';
import {
    X,
    MessageSquare,
    Send,
    Trash2,
    User as UserIcon,
    Clock,
    AlertCircle,
    ChevronRight,
    Bug,
    Paperclip,
    FileText,
    Download,
    Upload,
    File
} from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const TicketDetailsModal = ({ ticket, onClose, onUpdate, onDelete, getPriorityColor, originalIndex, userRole, canDelete }) => {
    const { user } = useAuth();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editedTicket, setEditedTicket] = useState({ ...ticket });
    const [loadingComments, setLoadingComments] = useState(false);
    const [submittingComment, setSubmittingComment] = useState(false);
    const [uploading, setUploading] = useState(false);

    const isViewer = userRole === 'Viewer';
    const canEdit = ['Admin', 'Manager', 'Developer'].includes(userRole);

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        const formData = new FormData();
        files.forEach(file => formData.append('attachments', file));

        try {
            await api.post(`/tickets/${ticket._id}/attachments`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            onUpdate();
        } catch (error) {
            console.error('Error uploading files:', error);
            alert('Failed to upload files. Max 5MB, format: images/docs.');
        } finally {
            setUploading(false);
            e.target.value = null; // Reset input
        }
    };

    const handleRemoveAttachment = async (attachmentId) => {
        if (!window.confirm('Remove this attachment?')) return;
        try {
            await api.delete(`/tickets/${ticket._id}/attachments/${attachmentId}`);
            onUpdate();
        } catch (error) {
            console.error('Error removing attachment:', error);
        }
    };

    useEffect(() => {
        if (ticket) {
            fetchComments();
            setEditedTicket({ ...ticket });
        }
    }, [ticket]);

    const fetchComments = async () => {
        setLoadingComments(true);
        try {
            const response = await api.get(`/comments/ticket/${ticket._id}`);
            setComments(response.data);
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setLoadingComments(false);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setSubmittingComment(true);
        try {
            const response = await api.post('/comments', {
                text: newComment,
                ticketId: ticket._id
            });
            setComments([response.data, ...comments]);
            setNewComment('');
        } catch (error) {
            console.error('Error adding comment:', error);
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleUpdate = async () => {
        try {
            await api.put(`/tickets/${ticket._id}`, editedTicket);
            onUpdate();
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating ticket:', error);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm('Delete this comment?')) return;
        try {
            await api.delete(`/comments/${commentId}`);
            setComments(comments.filter(c => c._id !== commentId));
        } catch (error) {
            console.error('Error deleting comment:', error);
        }
    };

    if (!ticket) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in duration-200">
            <div className="bg-surface w-full max-w-4xl max-h-[90vh] rounded-sm shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <header className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="bg-red-500 p-1 rounded text-white shadow-sm">
                            <Bug size={16} />
                        </div>
                        <div className="flex items-center gap-2 text-text-muted text-xs font-bold uppercase tracking-wider">
                            <span>BT-{originalIndex + 1}</span>
                            <ChevronRight size={14} />
                            <span>Issue Details</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {canDelete && (
                            <button
                                onClick={() => onDelete(ticket._id)}
                                className="p-2 text-text-muted hover:text-red-600 hover:bg-red-50 rounded-sm transition-all"
                                title="Delete Issue"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 text-text-muted hover:text-text hover:bg-background rounded-sm transition-all"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-auto flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border">
                    {/* Left Column: Details & Description */}
                    <div className="flex-[1.5] p-6 space-y-8 min-w-0">
                        {/* Title Section */}
                        <section>
                            {isEditing ? (
                                <input
                                    className="w-full text-2xl font-bold text-text bg-background border border-primary px-3 py-1 rounded-sm focus:outline-none"
                                    value={editedTicket.title}
                                    onChange={(e) => setEditedTicket({ ...editedTicket, title: e.target.value })}
                                    autoFocus
                                />
                            ) : (
                                <h2
                                    className={`text-2xl font-bold text-text rounded-sm transition-colors ${canEdit ? 'cursor-pointer hover:bg-background/50 p-1' : ''}`}
                                    onClick={() => canEdit && setIsEditing(true)}
                                >
                                    {ticket.title}
                                </h2>
                            )}
                        </section>

                        {/* Description Section */}
                        <section>
                            <h3 className="text-xs font-bold text-text-muted uppercase mb-3 tracking-widest">Description</h3>
                            {isEditing ? (
                                <textarea
                                    className="w-full h-32 text-sm text-text bg-background border border-border px-3 py-2 rounded-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                    value={editedTicket.description}
                                    onChange={(e) => setEditedTicket({ ...editedTicket, description: e.target.value })}
                                    placeholder="Add a description..."
                                />
                            ) : (
                                <div
                                    className={`text-sm text-text whitespace-pre-wrap min-h-[40px] rounded-sm transition-colors ${canEdit ? 'cursor-pointer hover:bg-background/50 p-2' : ''}`}
                                    onClick={() => canEdit && setIsEditing(true)}
                                >
                                    {ticket.description || <span className="text-text-muted italic">No description provided. {canEdit && 'Click to add one.'}</span>}
                                </div>
                            )}
                        </section>

                        {isEditing && (
                            <div className="flex gap-2">
                                <button
                                    onClick={handleUpdate}
                                    className="bg-primary text-white px-4 py-1.5 rounded-sm text-sm font-bold hover:bg-primary-dark transition-colors"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => {
                                        setEditedTicket({ ...ticket });
                                        setIsEditing(false);
                                    }}
                                    className="text-text hover:bg-background px-4 py-1.5 rounded-sm text-sm font-bold transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}

                        {/* Attachments Section */}
                        <section className="pt-8 border-t border-border">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Paperclip size={18} className="text-primary" />
                                    <h3 className="text-sm font-bold text-text uppercase tracking-widest">Attachments</h3>
                                </div>
                                {canEdit && (
                                    <label className="flex items-center gap-2 px-3 py-1.5 bg-background border border-border rounded-sm text-xs font-bold text-text-muted hover:text-primary hover:border-primary cursor-pointer transition-all">
                                        {uploading ? (
                                            <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                        ) : (
                                            <Upload size={14} />
                                        )}
                                        <span>Upload</span>
                                        <input type="file" multiple className="hidden" onChange={handleFileUpload} disabled={uploading} />
                                    </label>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {ticket.attachments?.length > 0 ? (
                                    ticket.attachments.map((att) => (
                                        <div key={att._id} className="group flex items-center justify-between p-3 bg-background/30 border border-border rounded-sm hover:border-primary/30 transition-all">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="bg-primary-light/10 p-2 rounded text-primary">
                                                    <FileText size={16} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-text truncate pr-2" title={att.filename}>{att.filename}</p>
                                                    <p className="text-[10px] text-text-muted">{(att.size / 1024).toFixed(1)} KB</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                <a
                                                    href={`${api.defaults.baseURL.replace('/api', '')}${att.url}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1.5 text-text-muted hover:text-primary hover:bg-primary-light/10 rounded-sm"
                                                    title="Download"
                                                >
                                                    <Download size={14} />
                                                </a>
                                                {canEdit && (
                                                    <button
                                                        onClick={() => handleRemoveAttachment(att._id)}
                                                        className="p-1.5 text-text-muted hover:text-red-600 hover:bg-red-50 rounded-sm"
                                                        title="Remove"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full py-6 bg-background/20 border border-dashed border-border rounded-sm text-center">
                                        <p className="text-xs text-text-muted">No attachments yet.</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Comments Section */}
                        <section className="pt-8 border-t border-border">
                            <div className="flex items-center gap-2 mb-6">
                                <MessageSquare size={18} className="text-primary" />
                                <h3 className="text-sm font-bold text-text uppercase tracking-widest">Comments</h3>
                            </div>

                            {/* Add Comment */}
                            <form onSubmit={handleAddComment} className="flex gap-3 mb-8">
                                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                                    {user?.name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 relative">
                                    <textarea
                                        className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary min-h-[40px] resize-none"
                                        placeholder="Add a comment..."
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleAddComment(e);
                                            }
                                        }}
                                    />
                                    <button
                                        type="submit"
                                        disabled={submittingComment || !newComment.trim()}
                                        className="absolute right-2 bottom-2 text-primary hover:text-primary-dark disabled:text-text-muted transition-colors"
                                    >
                                        <Send size={16} />
                                    </button>
                                </div>
                            </form>

                            {/* Comment List */}
                            <div className="space-y-6">
                                {loadingComments ? (
                                    <div className="py-4 text-center text-text-muted text-sm italic">Loading comments...</div>
                                ) : comments.length === 0 ? (
                                    <div className="py-4 text-center text-text-muted text-sm italic">No comments yet. Start the conversation!</div>
                                ) : (
                                    comments.map(comment => (
                                        <div key={comment._id} className="flex gap-3 group">
                                            <div className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-text-muted text-xs font-bold shrink-0">
                                                {comment.user?.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-bold text-text">{comment.user?.name}</span>
                                                        <span className="text-[10px] text-text-muted flex items-center gap-1">
                                                            <Clock size={10} />
                                                            {new Date(comment.createdAt).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    {comment.user?._id === user?._id && (
                                                        <button
                                                            onClick={() => handleDeleteComment(comment._id)}
                                                            className="text-text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="text-sm text-text leading-relaxed bg-background/30 p-2 rounded-sm border border-border/50">
                                                    {comment.text}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Status & Attributes */}
                    <div className="flex-1 p-6 bg-background/10 space-y-6 min-w-[280px]">
                        <div>
                            <h3 className="text-[10px] font-bold text-text-muted uppercase mb-2 tracking-widest">Status</h3>
                            <select
                                className={`w-full bg-surface border border-border px-3 py-2 rounded-sm text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary ${canEdit ? 'cursor-pointer' : 'opacity-70 cursor-not-allowed'}`}
                                disabled={!canEdit}
                                value={editedTicket.status}
                                onChange={(e) => {
                                    const newStatus = e.target.value;
                                    setEditedTicket({ ...editedTicket, status: newStatus });
                                    api.put(`/tickets/${ticket._id}`, { status: newStatus }).then(onUpdate);
                                }}
                            >
                                <option value="To Do">To Do</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Done">Done</option>
                            </select>
                        </div>

                        <div>
                            <h3 className="text-[10px] font-bold text-text-muted uppercase mb-2 tracking-widest">Priority</h3>
                            <select
                                className={`w-full bg-surface border border-border px-3 py-2 rounded-sm text-sm font-bold focus:outline-none focus:ring-1 focus:ring-primary ${getPriorityColor(editedTicket.priority)} ${canEdit ? 'cursor-pointer' : 'opacity-70 cursor-not-allowed'}`}
                                disabled={!canEdit}
                                value={editedTicket.priority}
                                onChange={(e) => {
                                    const newPriority = e.target.value;
                                    setEditedTicket({ ...editedTicket, priority: newPriority });
                                    api.put(`/tickets/${ticket._id}`, { priority: newPriority }).then(onUpdate);
                                }}
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Highest">Highest</option>
                            </select>
                        </div>

                        <div>
                            <h3 className="text-[10px] font-bold text-text-muted uppercase mb-2 tracking-widest">Assignee</h3>
                            <div className="flex items-center gap-3 bg-surface border border-border p-3 rounded-sm">
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                                    {ticket.assignee?.name?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-text truncate">{ticket.assignee?.name || 'Unassigned'}</p>
                                    <p className="text-[10px] text-text-muted truncate">{ticket.assignee?.email || 'No email'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-border space-y-3">
                            <div className="flex items-center justify-between text-[10px]">
                                <span className="text-text-muted uppercase font-bold tracking-widest">Reporter</span>
                                <span className="text-text font-medium">{ticket.reporter?.name || 'System'}</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px]">
                                <span className="text-text-muted uppercase font-bold tracking-widest">Created</span>
                                <span className="text-text font-medium">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px]">
                                <span className="text-text-muted uppercase font-bold tracking-widest">Updated</span>
                                <span className="text-text font-medium">{new Date(ticket.updatedAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TicketDetailsModal;
