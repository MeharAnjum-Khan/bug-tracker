import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import socket from '../socket';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import {
    Plus,
    ArrowLeft,
    Search,
    Filter,
    MoreHorizontal,
    Clock,
    AlertCircle,
    CheckCircle2,
    Circle,
    Bug,
    ChevronDown,
    Layout,
    List,
    Users,
    ArrowUpDown,
    Menu,
    X
} from 'lucide-react';
import KanbanBoard from '../components/KanbanBoard';
import TicketDetailsModal from '../components/TicketDetailsModal';
import TeamManagementModal from '../components/TeamManagementModal';
import toast from 'react-hot-toast';

const ProjectDetails = () => {
    const { projectId } = useParams();
    const [project, setProject] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newTicket, setNewTicket] = useState({
        title: '',
        description: '',
        priority: 'Medium',
        status: 'To Do',
        assignee: ''
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterPriority, setFilterPriority] = useState('All');
    const [view, setView] = useState('board'); // Default to board view
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [showTeamModal, setShowTeamModal] = useState(false);
    const [sortBy, setSortBy] = useState('newest'); // Item 1: Sorting state
    const [allProjects, setAllProjects] = useState([]); // Item 3: Project Switcher state
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMobileSwitcherOpen, setIsMobileSwitcherOpen] = useState(false); // Mobile switcher state
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const [isPriorityOpen, setIsPriorityOpen] = useState(false);
    const [isSortOpen, setIsSortOpen] = useState(false);

    const switcherRef = useRef(null);
    const statusRef = useRef(null);
    const priorityRef = useRef(null);
    const sortRef = useRef(null);

    const { user } = useAuth();
    const navigate = useNavigate();

    // Item 4: Role-Based Access logic
    const currentUserRole = project?.teamMembers?.find(m => (m.user?._id || m.user) === user?._id)?.role || 'Viewer';
    const canCreateIssue = ['Admin', 'Manager', 'Developer'].includes(currentUserRole);
    const isAdminOrOwner = currentUserRole === 'Admin' || (project?.owner?._id || project?.owner) === user?._id;
    const canManageTeam = isAdminOrOwner || currentUserRole === 'Manager';

    useEffect(() => {
        fetchProjectAndTickets();
        fetchAllProjects();

        // Socket logic
        socket.connect();
        socket.emit('join-project', projectId);

        socket.on('ticket-created', () => {
            fetchProjectAndTickets();
        });

        socket.on('ticket-updated', () => {
            fetchProjectAndTickets();
        });

        socket.on('ticket-deleted', () => {
            fetchProjectAndTickets();
        });

        return () => {
            socket.off('ticket-created');
            socket.off('ticket-updated');
            socket.off('ticket-deleted');
            socket.disconnect();
        };
    }, [projectId]);

    const fetchAllProjects = async () => {
        try {
            const response = await api.get('/projects');
            setAllProjects(response.data);
        } catch (error) {
            console.error('Error fetching projects:', error);
        }
    };

    const fetchProjectAndTickets = async () => {
        try {
            const [projectRes, ticketsRes] = await Promise.all([
                api.get(`/projects/${projectId}`),
                api.get(`/tickets/project/${projectId}`)
            ]);
            setProject(projectRes.data);
            setTickets(ticketsRes.data);

            // If a ticket is currently selected, update its data too
            if (selectedTicket) {
                const updated = ticketsRes.data.find(t => t._id === selectedTicket._id);
                if (updated) setSelectedTicket(updated);
            }
        } catch (error) {
            toast.error('Error fetching project data.');
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Click outside handler for all dropdowns
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (switcherRef.current && !switcherRef.current.contains(event.target)) {
                setIsMobileSwitcherOpen(false);
            }
            if (statusRef.current && !statusRef.current.contains(event.target)) {
                setIsStatusOpen(false);
            }
            if (priorityRef.current && !priorityRef.current.contains(event.target)) {
                setIsPriorityOpen(false);
            }
            if (sortRef.current && !sortRef.current.contains(event.target)) {
                setIsSortOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSwitcherToggle = () => {
        // Only toggle via click on mobile/tablet (below 1024px)
        if (window.innerWidth < 1024) {
            setIsMobileSwitcherOpen(!isMobileSwitcherOpen);
        }
    };

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        try {
            await api.post('/tickets', {
                ...newTicket,
                projectId
            });
            fetchProjectAndTickets();
            setShowModal(false);
            setNewTicket({
                title: '',
                description: '',
                priority: 'Medium',
                status: 'To Do',
                assignee: ''
            });
            toast.success('Ticket created!');
        } catch (error) {
            toast.error('Error creating ticket.');
            console.error('Error creating ticket:', error);
        }
    };

    const handleUpdateStatus = async (ticketId, newStatus) => {
        try {
            await api.put(`/tickets/${ticketId}`, { status: newStatus });
            fetchProjectAndTickets();
        } catch (error) {
            toast.error('Error updating status.');
            console.error('Error updating status:', error);
        }
    };

    const handleDeleteTicket = async (ticketId) => {
        if (!window.confirm('Are you sure you want to delete this issue?')) return;
        try {
            await api.delete(`/tickets/${ticketId}`);
            fetchProjectAndTickets();
            setSelectedTicket(null);
            toast.success('Ticket deleted.');
        } catch (error) {
            toast.error('Error deleting ticket.');
            console.error('Error deleting ticket:', error);
        }
    };

    const filteredTickets = tickets.filter((ticket, originalIndex) => {
        const query = searchTerm.toLowerCase().trim();
        if (!query) {
            const matchesStatus = filterStatus === 'All' || ticket.status === filterStatus;
            const matchesPriority = filterPriority === 'All' || ticket.priority === filterPriority;
            return matchesStatus && matchesPriority;
        }

        const tokens = query.split(/\s+/);

        // Prepare searchable text fields
        const searchableFields = [
            `bt-${originalIndex + 1}`, // Key (matching the UI format)
            (ticket.title || '').toLowerCase(),
            (ticket.description || '').toLowerCase(),
            (ticket.assignee?.name || '').toLowerCase()
        ];

        // Jira-style: Every word in the search box must be found in at least one field
        const matchesSearch = tokens.every(token =>
            searchableFields.some(field => field.includes(token))
        );

        const matchesStatus = filterStatus === 'All' || ticket.status === filterStatus;
        const matchesPriority = filterPriority === 'All' || ticket.priority === filterPriority;

        return matchesSearch && matchesStatus && matchesPriority;
    }).sort((a, b) => {
        // Item 1: Sorting logic
        if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
        if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
        if (sortBy === 'priority') {
            const priorityMap = { 'Highest': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
            return priorityMap[b.priority] - priorityMap[a.priority];
        }
        return 0;
    });

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'Highest': return 'text-red-600 bg-red-50';
            case 'High': return 'text-orange-600 bg-orange-50';
            case 'Medium': return 'text-blue-600 bg-blue-50';
            case 'Low': return 'text-slate-600 bg-slate-50';
            default: return 'text-slate-600 bg-slate-50';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'To Do': return <Circle size={16} className="text-text-muted" />;
            case 'In Progress': return <Clock size={16} className="text-primary" />;
            case 'Done': return <CheckCircle2 size={16} className="text-green-600" />;
            default: return <Circle size={16} />;
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-background text-primary">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <div className="flex h-screen bg-background relative overflow-hidden">
            {/* Mobile Header */}
            <header className="lg:hidden absolute top-0 left-0 right-0 h-16 bg-surface border-b border-border flex items-center justify-between px-4 z-40">
                <div className="flex items-center gap-2 text-primary font-bold text-xl">
                    <Bug size={24} />
                    <span>BugTracker</span>
                </div>
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 text-text-muted hover:text-primary transition-colors"
                >
                    <Menu size={24} />
                </button>
            </header>

            {/* Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 lg:hidden transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-border flex flex-col transition-transform duration-300 transform
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0 lg:static lg:block
            `}>
                <div className="p-6 flex items-center justify-between text-primary font-bold text-xl cursor-pointer" onClick={() => navigate('/dashboard')}>
                    <div className="flex items-center gap-2">
                        <Bug size={24} />
                        <span>BugTracker</span>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="lg:hidden p-1 text-text-muted hover:text-primary transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                <nav className="flex-1 px-4 py-4 space-y-1">
                    <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2 text-text-muted hover:bg-background rounded-sm transition-colors">
                        <ArrowLeft size={18} />
                        <span>Back to Projects</span>
                    </Link>
                    <div className="pt-4 pb-2 px-3 text-xs font-bold text-text-muted uppercase tracking-wider">
                        {project?.name}
                    </div>
                    <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); setView('board'); }}
                        className={`flex items-center gap-3 px-3 py-2 rounded-sm transition-colors ${(view === 'board' || view === 'list') ? 'bg-primary-light/10 text-primary font-medium' : 'text-text-muted hover:bg-background'}`}
                    >
                        <Search size={18} />
                        <span>Issues</span>
                    </a>
                    <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); if (canManageTeam) setShowTeamModal(true); }}
                        className={`flex items-center gap-3 px-3 py-2 rounded-sm transition-colors ${!canManageTeam ? 'opacity-50 cursor-not-allowed' : 'text-text-muted hover:bg-background'}`}
                        title={!canManageTeam ? 'Only Admins and Managers can manage team' : ''}
                    >
                        <Users size={18} />
                        <span>People</span>
                    </a>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-4 md:p-8 pt-20 lg:pt-8">
                <header className="mb-8">
                    <div className="flex items-center gap-2 text-sm text-text-muted mb-2">
                        <Link to="/dashboard" className="hover:text-primary">Projects</Link>
                        <span>/</span>
                        <div className="relative group" ref={switcherRef}>
                            <button
                                onClick={handleSwitcherToggle}
                                className="flex items-center gap-1 text-text hover:text-primary transition-colors font-medium"
                            >
                                {project?.name}
                                <ChevronDown size={14} />
                            </button>
                            <div className={`
                                absolute left-0 top-full mt-1 w-64 bg-surface border border-border rounded-sm shadow-xl transition-all z-50 py-1 max-h-60 overflow-y-auto
                                ${isMobileSwitcherOpen ? 'opacity-100 visible' : 'opacity-0 invisible lg:group-hover:opacity-100 lg:group-hover:visible'}
                            `}>
                                <div className="px-3 py-2 text-[10px] font-bold text-text-muted uppercase tracking-widest border-b border-border mb-1">
                                    Switch Project
                                </div>
                                {allProjects.map(p => (
                                    <button
                                        key={p._id}
                                        onClick={() => {
                                            if (p._id !== projectId) {
                                                navigate(`/project/${p._id}`);
                                                setIsMobileSwitcherOpen(false);
                                            }
                                        }}
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-background transition-colors flex items-center justify-between ${p._id === projectId ? 'text-primary bg-primary-light/5 font-bold' : 'text-text'}`}
                                    >
                                        <span className="truncate">{p.name}</span>
                                        {p._id === projectId && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <h1 className="text-2xl font-bold text-text">Issues</h1>
                            <div className="flex items-center bg-surface border border-border rounded-sm p-1">
                                <button
                                    onClick={() => setView('list')}
                                    className={`p-1.5 rounded-sm transition-colors ${view === 'list' ? 'bg-primary text-white' : 'text-text-muted hover:text-text'}`}
                                    title="List View"
                                >
                                    <List size={16} />
                                </button>
                                <button
                                    onClick={() => setView('board')}
                                    className={`p-1.5 rounded-sm transition-colors ${view === 'board' ? 'bg-primary text-white' : 'text-text-muted hover:text-text'}`}
                                    title="Board View"
                                >
                                    <Layout size={16} />
                                </button>
                            </div>
                        </div>
                        {canCreateIssue && (
                            <button
                                onClick={() => setShowModal(true)}
                                className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-sm flex items-center gap-2 transition-colors font-medium shadow-sm"
                            >
                                <Plus size={18} />
                                <span>Create Issue</span>
                            </button>
                        )}
                    </div>
                </header>

                {/* Filters bar */}
                <div className="grid grid-cols-2 lg:flex lg:flex-wrap gap-4 mb-6">
                    <div className="relative col-span-2 lg:flex-1 lg:max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                        <input
                            type="text"
                            placeholder="Search issues..."
                            className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {/* Status Dropdown */}
                    <div className="relative col-span-1 lg:w-auto" ref={statusRef}>
                        <button
                            onClick={() => setIsStatusOpen(!isStatusOpen)}
                            className="w-full lg:w-auto px-3 py-2 border border-border bg-surface text-text hover:bg-background rounded-sm text-sm focus:outline-none cursor-pointer flex items-center justify-between gap-2 min-w-[100px] shadow-sm transition-colors"
                        >
                            <span className="truncate">{filterStatus === 'All' ? 'Status' : filterStatus}</span>
                            <ChevronDown size={14} className={`text-text-muted transition-transform duration-200 ${isStatusOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <div className={`
                            absolute left-0 top-full mt-1 w-full lg:min-w-[150px] bg-surface border border-border rounded-sm shadow-xl transition-all z-50 py-1
                            ${isStatusOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}
                        `}>
                            <div className="px-3 py-2 text-[10px] font-bold text-text-muted uppercase tracking-widest border-b border-border mb-1">
                                Status
                            </div>
                            {['All', 'To Do', 'In Progress', 'Done'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => {
                                        setFilterStatus(status);
                                        setIsStatusOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-background transition-colors flex items-center justify-between ${filterStatus === status ? 'text-primary bg-primary-light/5 font-bold' : 'text-text'}`}
                                >
                                    <span>{status}</span>
                                    {filterStatus === status && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Priority (Filter) Dropdown */}
                    <div className="relative col-span-1 lg:w-auto" ref={priorityRef}>
                        <button
                            onClick={() => setIsPriorityOpen(!isPriorityOpen)}
                            className="w-full lg:w-auto px-3 py-2 border border-border bg-surface text-text hover:bg-background rounded-sm text-sm focus:outline-none cursor-pointer flex items-center justify-between gap-2 min-w-[100px] shadow-sm transition-colors"
                        >
                            <span className="truncate">{filterPriority === 'All' ? 'Filter' : filterPriority}</span>
                            <ChevronDown size={14} className={`text-text-muted transition-transform duration-200 ${isPriorityOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <div className={`
                            absolute left-0 top-full mt-1 w-full lg:min-w-[150px] bg-surface border border-border rounded-sm shadow-xl transition-all z-50 py-1
                            ${isPriorityOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}
                        `}>
                            <div className="px-3 py-2 text-[10px] font-bold text-text-muted uppercase tracking-widest border-b border-border mb-1">
                                Priority
                            </div>
                            {['All', 'Low', 'Medium', 'High', 'Highest'].map(priority => (
                                <button
                                    key={priority}
                                    onClick={() => {
                                        setFilterPriority(priority);
                                        setIsPriorityOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-background transition-colors flex items-center justify-between ${filterPriority === priority ? 'text-primary bg-primary-light/5 font-bold' : 'text-text'}`}
                                >
                                    <span>{priority}</span>
                                    {filterPriority === priority && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sort Dropdown */}
                    <div className="relative col-span-2 lg:w-auto" ref={sortRef}>
                        <button
                            onClick={() => setIsSortOpen(!isSortOpen)}
                            className="w-full lg:w-auto px-3 py-2 border border-border bg-surface text-text hover:bg-background rounded-sm text-sm focus:outline-none cursor-pointer flex items-center justify-between gap-2 min-w-[120px] shadow-sm transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <ArrowUpDown size={14} className="text-text-muted" />
                                <span>{sortBy === 'newest' ? 'Newest First' : sortBy === 'oldest' ? 'Oldest First' : 'Priority'}</span>
                            </div>
                            <ChevronDown size={14} className={`text-text-muted transition-transform duration-200 ${isSortOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <div className={`
                            absolute left-0 lg:right-0 lg:left-auto top-full mt-1 w-full lg:min-w-[160px] bg-surface border border-border rounded-sm shadow-xl transition-all z-50 py-1
                            ${isSortOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}
                        `}>
                            <div className="px-3 py-2 text-[10px] font-bold text-text-muted uppercase tracking-widest border-b border-border mb-1">
                                Sort By
                            </div>
                            {[
                                { value: 'newest', label: 'Newest First' },
                                { value: 'oldest', label: 'Oldest First' },
                                { value: 'priority', label: 'Priority' }
                            ].map(option => (
                                <button
                                    key={option.value}
                                    onClick={() => {
                                        setSortBy(option.value);
                                        setIsSortOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-background transition-colors flex items-center justify-between ${sortBy === option.value ? 'text-primary bg-primary-light/5 font-bold' : 'text-text'}`}
                                >
                                    <span>{option.label}</span>
                                    {sortBy === option.value && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content View */}
                {view === 'board' ? (
                    <KanbanBoard
                        tickets={filteredTickets}
                        allTickets={tickets}
                        onStatusChange={handleUpdateStatus}
                        getPriorityColor={getPriorityColor}
                        onTicketClick={setSelectedTicket}
                        canEdit={canCreateIssue}
                    />
                ) : (
                    <div className="bg-surface border border-border rounded-sm shadow-sm overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-background/50 border-b border-border text-xs font-bold text-text-muted uppercase tracking-wider">
                                    <th className="px-6 py-3 w-12">Type</th>
                                    <th className="px-6 py-3">Key & Summary</th>
                                    <th className="px-6 py-3 w-28 text-center">Priority</th>
                                    <th className="px-6 py-3 w-32 text-center">Status</th>
                                    <th className="px-6 py-3 w-32">Assignee</th>
                                    <th className="px-6 py-3 w-12 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredTickets.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-10 text-center text-text-muted">
                                            No issues found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTickets.map((ticket, index) => (
                                        <tr
                                            key={ticket._id}
                                            className="hover:bg-background/30 transition-colors group cursor-pointer"
                                            onClick={() => setSelectedTicket(ticket)}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="bg-red-500 p-1 rounded text-white inline-block">
                                                    <Bug size={14} />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-text-muted uppercase font-bold tracking-tighter">
                                                        BT-{tickets.indexOf(ticket) + 1}
                                                    </span>
                                                    <span className="text-sm font-medium text-text group-hover:text-primary cursor-pointer">
                                                        {ticket.title}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`text-xs font-bold px-2 py-1 rounded-sm text-center ${getPriorityColor(ticket.priority)}`}>
                                                    {ticket.priority}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <select
                                                    className="text-xs font-medium text-text bg-transparent border-none focus:ring-0 cursor-pointer hover:bg-background/50 rounded p-1"
                                                    value={ticket.status}
                                                    onChange={(e) => handleUpdateStatus(ticket._id, e.target.value)}
                                                >
                                                    <option value="To Do">To Do</option>
                                                    <option value="In Progress">In Progress</option>
                                                    <option value="Done">Done</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                                                        {ticket.assignee?.name?.charAt(0).toUpperCase() || '?'}
                                                    </div>
                                                    <span className="text-xs text-text truncate max-w-[100px]">
                                                        {ticket.assignee?.name || 'Unassigned'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => handleDeleteTicket(ticket._id)}
                                                    className="text-text-muted hover:text-red-600 transition-colors"
                                                    title="Delete Issue"
                                                >
                                                    <MoreHorizontal size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            {/* Create Ticket Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-surface max-w-lg w-full rounded-sm shadow-xl p-8">
                        <h2 className="text-xl font-bold text-text mb-6">Create Issue</h2>
                        <form onSubmit={handleCreateTicket} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-text-muted uppercase mb-1">Summary</label>
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    className="w-full px-3 py-2 border border-border rounded-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary"
                                    placeholder="Summarize the issue"
                                    value={newTicket.title}
                                    onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-text-muted uppercase mb-1">Description</label>
                                <textarea
                                    className="w-full px-3 py-2 border border-border rounded-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary"
                                    rows="4"
                                    placeholder="Describe the bug or task in detail..."
                                    value={newTicket.description}
                                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-text-muted uppercase mb-1">Priority</label>
                                    <select
                                        className="w-full px-3 py-2 border border-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                        value={newTicket.priority}
                                        onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                        <option value="Highest">Highest</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-text-muted uppercase mb-1">Assignee</label>
                                    <select
                                        className="w-full px-3 py-2 border border-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                        value={newTicket.assignee}
                                        onChange={(e) => setNewTicket({ ...newTicket, assignee: e.target.value })}
                                    >
                                        <option value="">Unassigned</option>
                                        <option value={user?._id}>{user?.name} (You)</option>
                                        {/* In a real app, populate with team members */}
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-text hover:bg-background rounded-sm transition-colors text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-sm transition-colors text-sm font-medium"
                                >
                                    Create Issue
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Ticket Details Modal */}
            {selectedTicket && (
                <TicketDetailsModal
                    ticket={selectedTicket}
                    onClose={() => setSelectedTicket(null)}
                    onUpdate={fetchProjectAndTickets}
                    onDelete={handleDeleteTicket}
                    getPriorityColor={getPriorityColor}
                    originalIndex={tickets.findIndex(t => t._id === selectedTicket._id)}
                    userRole={currentUserRole}
                    canDelete={isAdminOrOwner}
                />
            )}

            {/* Team Management Modal */}
            {showTeamModal && (
                <TeamManagementModal
                    project={project}
                    onClose={() => setShowTeamModal(false)}
                    onUpdate={fetchProjectAndTickets}
                />
            )}
        </div>
    );
};

export default ProjectDetails;
