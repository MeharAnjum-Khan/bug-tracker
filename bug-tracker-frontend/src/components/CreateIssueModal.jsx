import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import { X, Bug, ChevronDown, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const CreateIssueModal = ({ isOpen, onClose }) => {
    const { projectId: routeProjectId } = useParams();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'Medium',
        projectId: routeProjectId || '',
        assignee: ''
    });

    const [projectMembers, setProjectMembers] = useState([]);
    const [isPriorityOpen, setIsPriorityOpen] = useState(false);
    const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);

    const priorityRef = useRef(null);
    const assigneeRef = useRef(null);
    const { user } = useAuth();

    const fetchProjectMembers = async (pid) => {
        try {
            const response = await api.get(`/projects/${pid}`);
            setProjectMembers(response.data.teamMembers || []);
        } catch (error) {
            console.error('Error fetching project members:', error);
        }
    };

    const fetchProjects = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/projects');
            setProjects(response.data);

            // If no project is selected and we have projects, don't pre-select unless we have routeProjectId
            if (!response.data.length > 0 && !routeProjectId) {
                // We keep it empty to force user to choose if not on a project page
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
            toast.error('Failed to load projects');
        } finally {
            setLoading(false);
        }
    }, [routeProjectId]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (priorityRef.current && !priorityRef.current.contains(event.target)) setIsPriorityOpen(false);
            if (assigneeRef.current && !assigneeRef.current.contains(event.target)) setIsAssigneeOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            fetchProjects();
            // Update projectId if route changes while modal is open
            setFormData(prev => ({
                ...prev,
                projectId: routeProjectId || ''
            }));
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, routeProjectId, fetchProjects]);

    useEffect(() => {
        if (formData.projectId) {
            fetchProjectMembers(formData.projectId);
        } else {
            setProjectMembers([]);
        }
    }, [formData.projectId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.projectId) {
            toast.error('Please select a project');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/tickets', formData);
            toast.success('Issue created successfully');
            onClose();
            // Reset form
            setFormData({
                title: '',
                description: '',
                priority: 'Medium',
                projectId: routeProjectId || '',
                assignee: ''
            });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error creating issue');
            console.error('Error creating issue:', error);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-10001">
            <div className="bg-surface max-w-xl w-full rounded-sm shadow-2xl flex flex-col max-h-[90vh] relative animate-in zoom-in-95 duration-300">
                {/* Fixed Header */}
                <div className="flex items-center justify-between px-8 py-5 border-b border-border bg-surface shrink-0 rounded-t-sm z-20">
                    <div>
                        <h2 className="text-xl font-bold text-text tracking-tight font-inter">Create Issue</h2>
                        <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold mt-0.5 opacity-70 font-inter">New ticket for {projects.find(p => p._id === formData.projectId)?.name || 'Project'}</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-sm text-text-muted hover:text-text hover:bg-background transition-all">
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Form Area */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-8 py-8 space-y-8 custom-scrollbar">
                    {/* Project Selection */}
                    <div>
                        <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2 font-inter">Project <span className="text-red-500">*</span></label>
                        <div className="relative group">
                            <select
                                required
                                value={formData.projectId}
                                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                                className="w-full pl-3 pr-10 py-2.5 border border-border rounded-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none bg-surface text-sm transition-all shadow-sm group-hover:border-text-muted/30"
                                disabled={loading}
                            >
                                <option value="" disabled>Select a project</option>
                                {projects.map(p => (
                                    <option key={p._id} value={p._id}>{p.name}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted group-focus-within:text-primary transition-colors">
                                <ChevronDown size={16} />
                            </div>
                        </div>
                    </div>

                    {/* Summary */}
                    <div>
                        <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2 font-inter">Summary <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            required
                            autoFocus
                            className="w-full px-4 py-2.5 border border-border rounded-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-surface transition-all shadow-sm placeholder:text-text-muted/40 font-medium"
                            placeholder="Briefly summarize the issue"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2 font-inter">Description</label>
                        <textarea
                            className="w-full px-4 py-3 border border-border rounded-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-surface transition-all shadow-sm placeholder:text-text-muted/40 resize-none leading-relaxed"
                            rows="6"
                            placeholder="Describe the bug or feature in detail..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    {/* Meta Section */}
                    <div className="grid grid-cols-2 gap-8 pt-2">
                        {/* Priority */}
                        <div className="relative" ref={priorityRef}>
                            <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2 font-inter">Priority</label>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsPriorityOpen(!isPriorityOpen);
                                    setIsAssigneeOpen(false);
                                }}
                                className="w-full px-4 py-2.5 border border-border bg-surface text-text hover:bg-background rounded-sm text-sm focus:outline-none flex items-center justify-between gap-2 shadow-sm transition-all hover:border-text-muted/30"
                            >
                                <span className="font-semibold">{formData.priority}</span>
                                <ChevronDown size={16} className={`text-text-muted transition-transform duration-300 ${isPriorityOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isPriorityOpen && (
                                <div className="absolute bottom-full left-0 right-0 mb-2 bg-surface border border-border rounded-sm shadow-2xl z-50 py-1.5 max-h-50 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-bottom-2 duration-200">
                                    <div className="px-4 py-2 text-[9px] font-bold text-text-muted uppercase tracking-widest border-b border-border/50 mb-1 font-inter">Set Priority</div>
                                    {['Low', 'Medium', 'High', 'Highest'].map(p => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => {
                                                setFormData({ ...formData, priority: p });
                                                setIsPriorityOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-background transition-colors flex items-center justify-between ${formData.priority === p ? 'text-primary bg-primary/5 font-bold' : 'text-text'}`}
                                        >
                                            {p}
                                            {formData.priority === p && <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.5)]" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Assignee */}
                        <div className="relative" ref={assigneeRef}>
                            <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2 font-inter">Assignee</label>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsAssigneeOpen(!isAssigneeOpen);
                                    setIsPriorityOpen(false);
                                }}
                                className="w-full px-4 py-2.5 border border-border bg-surface text-text hover:bg-background rounded-sm text-sm focus:outline-none flex items-center justify-between gap-2 shadow-sm transition-all hover:border-text-muted/30"
                            >
                                <span className="truncate font-semibold uppercase text-[12px]">
                                    {projectMembers.find(m => (m.user?._id || m.user) === formData.assignee)?.user?.name || (formData.assignee === '' ? 'Unassigned' : 'Unknown')}
                                </span>
                                <ChevronDown size={16} className={`text-text-muted transition-transform duration-300 ${isAssigneeOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isAssigneeOpen && (
                                <div className="absolute bottom-full left-0 right-0 mb-2 bg-surface border border-border rounded-sm shadow-2xl z-50 py-1.5 max-h-50 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-bottom-2 duration-200">
                                    <div className="px-4 py-2 text-[9px] font-bold text-text-muted uppercase tracking-widest border-b border-border/50 mb-1 font-inter">Assign To</div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData({ ...formData, assignee: '' });
                                            setIsAssigneeOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-background transition-colors flex items-center justify-between ${formData.assignee === '' ? 'text-primary bg-primary/5 font-bold' : 'text-text'}`}
                                    >
                                        Unassigned
                                        {formData.assignee === '' && <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.5)]" />}
                                    </button>
                                    {projectMembers.map(m => {
                                        const memberId = m.user?._id || m.user;
                                        const memberName = m.user?.name || 'Unknown';
                                        return (
                                            <button
                                                key={memberId}
                                                type="button"
                                                onClick={() => {
                                                    setFormData({ ...formData, assignee: memberId });
                                                    setIsAssigneeOpen(false);
                                                }}
                                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-background transition-colors flex items-center justify-between ${formData.assignee === memberId ? 'text-primary bg-primary/5 font-bold' : 'text-text'}`}
                                            >
                                                <span className="truncate">{memberName} {memberId === user?._id ? '(You)' : ''}</span>
                                                {formData.assignee === memberId && <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.5)]" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </form>

                {/* Fixed Footer */}
                <div className="px-8 py-5 border-t border-border bg-surface flex justify-end items-center gap-4 shrink-0 z-20 rounded-b-sm">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 text-text-muted hover:text-text hover:bg-background rounded-sm transition-all text-sm font-bold border border-transparent hover:border-border font-inter"
                        disabled={submitting}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !formData.projectId || !formData.title.trim()}
                        className="bg-primary hover:bg-primary-dark text-white px-8 py-2.5 rounded-sm transition-all text-sm font-bold shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group active:scale-95 font-inter"
                    >
                        {submitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Creating...</span>
                            </>
                        ) : (
                            <>
                                <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                                <span>Create Issue</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateIssueModal;
