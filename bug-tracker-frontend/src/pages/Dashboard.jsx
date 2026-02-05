import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Plus, Folder, Layout, Users, Settings, LogOut, Bug } from 'lucide-react';
import SettingsModal from '../components/SettingsModal';

const Dashboard = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [newProject, setNewProject] = useState({ name: '', description: '' });

    const { user, logout } = useAuth();

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await api.get('/projects');
            setProjects(response.data);
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/projects', newProject);
            setProjects([...projects, response.data]);
            setShowModal(false);
            setNewProject({ name: '', description: '' });
        } catch (error) {
            console.error('Error creating project:', error);
        }
    };

    return (
        <div className="flex h-screen bg-background">
            {/* Sidebar */}
            <aside className="w-64 bg-surface border-r border-border flex flex-col">
                <div className="p-6 flex items-center gap-2 text-primary font-bold text-xl">
                    <Bug size={24} />
                    <span>BugTracker</span>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-1">
                    <a href="#" className="flex items-center gap-3 px-3 py-2 bg-primary-light/10 text-primary rounded-sm font-medium">
                        <Layout size={18} />
                        <span>Projects</span>
                    </a>
                    <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); setShowSettingsModal(true); }}
                        className="flex items-center gap-3 px-3 py-2 text-text-muted hover:bg-background rounded-sm transition-colors"
                    >
                        <Settings size={18} />
                        <span>Settings</span>
                    </a>
                </nav>

                <div className="p-4 border-t border-border">
                    <div className="flex items-center gap-3 px-3 py-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text truncate">{user?.name}</p>
                            <p className="text-xs text-text-muted truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-3 py-2 text-text-muted hover:text-red-600 hover:bg-red-50 rounded-sm transition-colors text-sm"
                    >
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-8">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-text">Projects</h1>
                        <p className="text-text-muted">Manage your team's projects and issues</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-sm flex items-center gap-2 transition-colors font-medium shadow-sm"
                    >
                        <Plus size={18} />
                        <span>Create Project</span>
                    </button>
                </header>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : projects.length === 0 ? (
                    <div className="text-center py-20 bg-surface rounded-sm border border-border border-dashed">
                        <Folder size={48} className="mx-auto text-text-muted mb-4 opacity-20" />
                        <h3 className="text-lg font-medium text-text">No projects found</h3>
                        <p className="text-text-muted mb-6">Start by creating your first project</p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="text-primary hover:underline font-medium"
                        >
                            Create Project
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map((project) => (
                            <Link
                                key={project._id}
                                to={`/project/${project._id}`}
                                className="bg-surface p-6 rounded-sm border border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                            >
                                <div className="w-10 h-10 bg-primary/10 rounded-sm flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                                    <Folder size={20} />
                                </div>
                                <h3 className="font-bold text-lg text-text mb-2">{project.name}</h3>
                                <p className="text-text-muted text-sm line-clamp-2 mb-4">
                                    {project.description || 'No description provided.'}
                                </p>
                                <div className="flex items-center justify-between pt-4 border-t border-border">
                                    <span className="text-xs text-text-muted">
                                        Owner: {project.owner?.name === user?.name ? 'You' : project.owner?.name}
                                    </span>
                                    <span className="text-xs bg-background px-2 py-1 rounded-sm text-text-muted">
                                        {project.teamMembers?.length} {project.teamMembers?.length === 1 ? 'Member' : 'Members'}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>

            {/* Create Project Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-surface max-w-md w-full rounded-sm shadow-xl p-6">
                        <h2 className="text-xl font-bold text-text mb-4">Create New Project</h2>
                        <form onSubmit={handleCreateProject} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text mb-1">Project Name</label>
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    className="w-full px-3 py-2 border border-border rounded-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary"
                                    placeholder="e.g. Mobile App Redesign"
                                    value={newProject.name}
                                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text mb-1">Description (Optional)</label>
                                <textarea
                                    className="w-full px-3 py-2 border border-border rounded-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary"
                                    rows="3"
                                    placeholder="Briefly describe what this project is about..."
                                    value={newProject.description}
                                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
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
                                    Create Project
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Settings Modal */}
            {showSettingsModal && (
                <SettingsModal onClose={() => setShowSettingsModal(false)} />
            )}
        </div>
    );
};

export default Dashboard;
