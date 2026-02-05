import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bug, ChevronRight } from 'lucide-react';

const LandingPage = () => {
    const { user } = useAuth();

    // If user is already logged in, redirect to dashboard
    if (user) {
        return <Navigate to="/dashboard" />;
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="bg-surface border-b border-border">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary font-bold text-xl">
                        <Bug size={24} />
                        <span>BugTracker</span>
                    </div>

                    <div className="flex items-center gap-6">
                        <Link to="/login" className="text-sm font-medium text-text-muted hover:text-primary transition-colors">
                            Sign in
                        </Link>
                        <Link to="/register" className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-sm text-sm font-bold transition-all shadow-sm">
                            Get Started
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="max-w-3xl">
                    <div className="inline-block px-3 py-1 bg-primary/5 text-primary text-xs font-bold rounded-sm mb-6 uppercase tracking-wider">
                        Agile Issue Tracking
                    </div>

                    <h1 className="text-4xl md:text-6xl font-extrabold text-text tracking-tight mb-6">
                        Manage your projects and <br />
                        <span className="text-primary">track bugs with ease.</span>
                    </h1>

                    <p className="text-lg text-text-muted mb-10 leading-relaxed max-w-2xl mx-auto">
                        A simple, professional-grade issue tracker designed for teams who want to
                        ship better software without the complexity of bloated tools.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/register" className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-sm text-base font-bold flex items-center justify-center gap-2 transition-all shadow-md">
                            Get started for free
                            <ChevronRight size={18} />
                        </Link>
                        <Link to="/login" className="w-full sm:w-auto px-8 py-3 text-text-muted hover:text-text border border-border rounded-sm text-base font-medium transition-all">
                            Sign in to your account
                        </Link>
                    </div>
                </div>

                {/* Simple Mockup/Detail area */}
                <div className="mt-16 w-full max-w-4xl border border-border rounded-sm bg-surface shadow-lg overflow-hidden flex flex-col">
                    <div className="bg-background/50 border-b border-border p-2 flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-border"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-border"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-border"></div>
                    </div>
                    <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-left space-y-2">
                            <h3 className="font-bold text-text text-sm uppercase tracking-wider">Kanban Boards</h3>
                            <p className="text-xs text-text-muted leading-relaxed">Visualize your workflow and drag items across statuses effortlessly.</p>
                        </div>
                        <div className="text-left space-y-2">
                            <h3 className="font-bold text-text text-sm uppercase tracking-wider">Real-time Collab</h3>
                            <p className="text-xs text-text-muted leading-relaxed">Collaborate with your team using threaded comments and instant updates.</p>
                        </div>
                        <div className="text-left space-y-2">
                            <h3 className="font-bold text-text text-sm uppercase tracking-wider">Simple Permissions</h3>
                            <p className="text-xs text-text-muted leading-relaxed">Role-based access to keep your project data secure and organized.</p>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="py-10 border-t border-border mt-auto">
                <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-center">
                    <p className="text-text-muted text-xs mx-auto">
                        © 2026 Bug Tracker. All rights reserved. Professional Issue Tracking.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
