import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardRoute } from '../utils/permissions';
import { Mail, Lock, Sparkles, TrendingUp, Users, Zap } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (result.success && result.user) {
        // Redirect based on user role
        const dashboardRoute = getDashboardRoute(result.user);
        navigate(dashboardRoute);
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Branding */}
          <div className="hidden lg:block text-white space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-white/20 backdrop-blur-lg rounded-2xl">
                  <Sparkles className="text-white" size={32} />
                </div>
                <h1 className="text-5xl font-bold">Pulse Education</h1>
              </div>
              <p className="text-2xl text-white/90">Transform Your Business Growth</p>
              <p className="text-lg text-white/70">Manage leads, track performance, and scale your business with our powerful CRM platform.</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20">
                <div className="p-3 bg-white/20 rounded-lg">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Increase Sales by 40%</h3>
                  <p className="text-white/70 text-sm">Track and convert more leads efficiently</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20">
                <div className="p-3 bg-white/20 rounded-lg">
                  <Users size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Team Collaboration</h3>
                  <p className="text-white/70 text-sm">Work together seamlessly with your team</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20">
                <div className="p-3 bg-white/20 rounded-lg">
                  <Zap size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Lightning Fast</h3>
                  <p className="text-white/70 text-sm">Built for speed and performance</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-10 border border-white/20">
              {/* Mobile Logo */}
              <div className="lg:hidden text-center mb-8">
                <div className="inline-flex items-center gap-3 mb-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl">
                    <Sparkles className="text-white" size={28} />
                  </div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Pulse Education</h1>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back!</h2>
                <p className="text-gray-600">Sign in to continue to your dashboard</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2 animate-shake">
                    <span className="font-medium">{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="text-gray-400" size={20} />
                    </div>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all bg-gray-50 focus:bg-white"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="text-gray-400" size={20} />
                    </div>
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all bg-gray-50 focus:bg-white"
                      placeholder="••••••••••"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                    <span className="text-gray-600">Remember me</span>
                  </label>
                  <a href="#" className="text-purple-600 hover:text-purple-700 font-medium">Forgot password?</a>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Signing in...
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  Don't have an account? <a href="#" className="text-purple-600 hover:text-purple-700 font-semibold">Contact admin</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
