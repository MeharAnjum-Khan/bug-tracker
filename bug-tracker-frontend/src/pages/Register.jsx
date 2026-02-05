import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bug, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');


        setIsSubmitting(true);

        try {
            await register(name, email, password);
            setSuccess('Account created successfully! Redirecting to login...');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create account. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="max-w-md w-full bg-surface rounded-sm shadow-md border border-border p-6">
                <div className="flex flex-col items-center mb-5">
                    <div className="bg-primary p-3 rounded-md mb-3">
                        <Bug size={32} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-text">Create your account</h1>
                    <p className="text-text-muted mt-1 text-sm">Bug Tracker / Issue Tracker</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-sm flex items-start gap-2 text-sm">
                        <AlertCircle size={18} className="shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-sm flex items-start gap-2 text-sm">
                        <CheckCircle size={18} className="shrink-0 mt-0.5" />
                        <span>{success}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-text mb-1">Full Name</label>
                        <input
                            type="text"
                            required
                            className="w-full px-3 py-1.5 border border-border rounded-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary text-sm"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text mb-1">Email address</label>
                        <input
                            type="email"
                            required
                            className="w-full px-3 py-1.5 border border-border rounded-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary text-sm"
                            placeholder="name@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text mb-1">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                className="w-full px-3 py-1.5 border border-border rounded-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary text-sm pr-10"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>


                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-1.5 px-4 rounded-sm transition-colors disabled:opacity-70 mt-1"
                    >
                        {isSubmitting ? 'Creating account...' : 'Sign up'}
                    </button>
                </form>

                <div className="mt-6 pt-4 border-t border-border text-center">
                    <p className="text-text-muted text-sm">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary hover:underline font-medium">
                            Sign in instead
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
