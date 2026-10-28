import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Workflow, Eye, EyeOff, Lock, Mail, ArrowRight, Sparkles, Building2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, exploreDemo } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      showToast('Successfully authenticated', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
      showToast(err.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExploreDemo = async () => {
    setDemoLoading(true);
    try {
      await exploreDemo();
      showToast('Loaded Demo Workspace with sample team & data', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to load demo workspace');
      showToast(err.message || 'Failed to load demo', 'error');
    } finally {
      setDemoLoading(false);
    }
  };

  const handleQuickLogin = (quickEmail: string) => {
    setEmail(quickEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient accents */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white shadow-lg mb-4">
          <Workflow className="w-6 h-6 stroke-[2]" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          TechNova Workspace
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          AI-Powered Employee Workflow &amp; Productivity Management System
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl shadow-2xl border border-slate-200/80">
          {/* Explore Demo Workspace Banner Button */}
          <div className="mb-6 p-3.5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/10 flex items-center justify-center text-indigo-600">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Want to test sample data?</p>
                <p className="text-[11px] text-slate-500">Explore populated demo workspace</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleExploreDemo}
              disabled={demoLoading}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1"
            >
              {demoLoading ? 'Loading...' : 'Explore Demo'}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Corporate Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@technova.io"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="remember-me" className="ml-2 block text-xs text-slate-600 font-medium">
                Remember my login on this device
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Preset Buttons */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
              One-Click Demo Roles
            </p>
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('ananya.sharma@technova.io')}
                className="p-1.5 sm:p-2 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 text-center transition-all group"
              >
                <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600">Admin</p>
                <p className="text-[10px] text-slate-400 truncate">Ananya S.</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('sneha.rao@technova.io')}
                className="p-1.5 sm:p-2 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 text-center transition-all group"
              >
                <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600">Manager</p>
                <p className="text-[10px] text-slate-400 truncate">Sneha R.</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('priya.nair@technova.io')}
                className="p-1.5 sm:p-2 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 text-center transition-all group"
              >
                <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600">Lead</p>
                <p className="text-[10px] text-slate-400 truncate">Priya N.</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('rahul.kumar@technova.io')}
                className="p-1.5 sm:p-2 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 text-center transition-all group"
              >
                <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600">Employee</p>
                <p className="text-[10px] text-slate-400 truncate">Rahul K.</p>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-2">
              Password for all demo accounts: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">password123</code>
            </p>
          </div>

          {/* Register Link */}
          <div className="mt-5 text-center text-xs text-slate-500">
            New organization or team?{' '}
            <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-800">
              Create new workspace
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
