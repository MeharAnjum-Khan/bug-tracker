import React, { useState } from 'react';
import { X, UserPlus, Trash2, Shield, User } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const TeamManagementModal = ({ project, onClose, onUpdate }) => {
    const { user } = useAuth();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedRole, setSelectedRole] = useState('Developer');

    const isOwner = project.owner._id === user?._id || project.owner === user?._id;

    const handleAddMember = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            await api.post(`/projects/${project._id}/members`, { email, role: selectedRole });
            setSuccess(`Successfully added ${email} to the team!`);
            setEmail('');
            onUpdate();
        } catch (err) {
            setError(err.response?.data?.message || 'Error adding member');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveMember = async (userId) => {
        if (!window.confirm('Are you sure you want to remove this member?')) return;

        setError('');
        setSuccess('');
        setLoading(true);

        try {
            await api.delete(`/projects/${project._id}/members/${userId}`);
            setSuccess('Member removed successfully');
            onUpdate();
        } catch (err) {
            setError(err.response?.data?.message || 'Error removing member');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-surface max-w-md w-full rounded-sm shadow-xl p-6 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-text">Manage Team</h2>
                    <button onClick={onClose} className="text-text-muted hover:text-text transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Add Member Form (Only for Owner) */}
                {isOwner && (
                    <form onSubmit={handleAddMember} className="mb-6 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-text-muted uppercase mb-1">Invite Member</label>
                            <div className="space-y-3">
                                <input
                                    type="email"
                                    required
                                    className="w-full px-3 py-2 border border-border rounded-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary text-sm"
                                    placeholder="colleague@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <div className="flex gap-2">
                                    <select
                                        className="flex-1 px-3 py-2 border border-border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary"
                                        value={selectedRole}
                                        onChange={(e) => setSelectedRole(e.target.value)}
                                    >
                                        <option value="Admin">Admin</option>
                                        <option value="Manager">Manager</option>
                                        <option value="Developer">Developer</option>
                                        <option value="Viewer">Viewer</option>
                                    </select>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-sm flex items-center gap-2 transition-colors font-medium shadow-sm disabled:opacity-50"
                                    >
                                        <UserPlus size={18} />
                                        <span>Add</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                )}

                {error && <p className="text-xs text-red-600 mb-4 bg-red-50 p-2 rounded border border-red-100">{error}</p>}
                {success && <p className="text-xs text-green-600 mb-4 bg-green-50 p-2 rounded border border-green-100">{success}</p>}

                {/* Member List */}
                <div className="space-y-4 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
                    <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Project Members ({project.teamMembers.length})</h3>
                    {project.teamMembers.map((memberObj) => {
                        const member = memberObj.user;
                        const role = memberObj.role;
                        const memberId = member?._id;
                        const memberName = member?.name || 'Unknown';
                        const memberEmail = member?.email || '';
                        const isMemberOwner = memberId === (typeof project.owner === 'object' ? project.owner._id : project.owner);

                        const getRoleStyles = (role) => {
                            switch (role) {
                                case 'Admin': return 'bg-purple-100 text-purple-700';
                                case 'Manager': return 'bg-blue-100 text-blue-700';
                                case 'Developer': return 'bg-green-100 text-green-700';
                                case 'Viewer': return 'bg-slate-100 text-slate-700';
                                default: return 'bg-slate-100 text-slate-700';
                            }
                        };

                        return (
                            <div key={memberId} className="flex items-center justify-between group p-2 hover:bg-background rounded-sm transition-colors border border-transparent hover:border-border">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                        {memberName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-bold text-text">{memberName}</p>
                                            <span className={`${getRoleStyles(role)} text-[10px] px-1.5 py-0.5 rounded-full font-bold flex items-center gap-1`}>
                                                {role === 'Admin' && <Shield size={10} />}
                                                {role}
                                            </span>
                                        </div>
                                        <p className="text-xs text-text-muted">{memberEmail}</p>
                                    </div>
                                </div>
                                {isOwner && !isMemberOwner && (
                                    <button
                                        onClick={() => handleRemoveMember(memberId)}
                                        disabled={loading}
                                        className="text-text-muted hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all p-2"
                                        title="Remove from team"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="mt-6 pt-4 border-t border-border flex justify-end">
                    <button
                        onClick={onClose}
                        className="text-text-muted hover:text-text px-4 py-2 font-medium text-sm transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TeamManagementModal;
