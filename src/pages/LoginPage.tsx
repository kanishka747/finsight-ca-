import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Building2,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  FileText,
  Sparkles,
  Bot,
} from 'lucide-react';
import { usePractice } from '../context/PracticeContext';

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { login, registerUser, loginWithGoogle, settings } = usePractice();
  const [googleLoading, setGoogleLoading] = React.useState(false);

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Signup fields
  const [name, setName] = useState('');
  const [firmName, setFirmName] = useState(settings?.firmName || 'A Y & COMPANY');
  const [signupRole, setSignupRole] = useState<'partner' | 'staff' | 'client'>('partner');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Forgot password modal
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim()) {
      setErrorMsg('Please enter your work email address.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(email, password, rememberMe);
      if (res.success) {
        if (onLoginSuccess) onLoginSuccess();
      } else {
        setErrorMsg(res.error || 'Invalid email or password.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid work email.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await registerUser({
        name,
        email,
        password,
        role: signupRole,
        firmName,
      });
      if (res.success) {
        if (onLoginSuccess) onLoginSuccess();
      } else {
        setErrorMsg(res.error || 'Registration failed.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (fillEmail: string, fillPass: string) => {
    setEmail(fillEmail);
    setPassword(fillPass);
    setErrorMsg(null);
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setGoogleLoading(true);
    try {
      const res = await loginWithGoogle();
      if (!res.success && res.error && res.error !== 'Sign-in cancelled.') {
        setErrorMsg(res.error);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Google sign-in failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.includes('@')) return;
    setForgotSent(true);
  };

  return (
    <div className="min-h-screen bg-[#050A14] flex flex-col lg:flex-row text-slate-100">
      {/* Left Column: Brand Hero & Practice Overview */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#071126] via-[#0A1733] to-[#040914] border-r border-[#15233E] p-12 flex-col justify-between relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-10">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-tr from-teal-600 to-teal-400 text-white font-display font-bold text-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
              FS
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-white font-display">FinSight</h1>
                <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  Enterprise
                </span>
              </div>
              <p className="text-xs text-slate-400">CA Practice &amp; Statutory Compliance Suite</p>
            </div>
          </div>

          <div className="space-y-4 max-w-lg">
            <h2 className="text-3xl font-extrabold text-white tracking-tight leading-snug">
              Autonomous Intelligence &amp; Statutory Operations for Chartered Accountants.
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Designed for Indian auditing, taxation, and statutory filing practices. Centralize GST, Income Tax, ROC compliance, document vaults, and client communication under one secure roof.
            </p>
          </div>

          <div className="mt-10 space-y-3.5 max-w-md">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-[#0E1B38]/60 border border-[#1C2E52]/80">
              <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-slate-100">Executive Partner Dashboard</h4>
                <p className="text-[11px] text-slate-400">Firm-wide billing, unbilled WIP, overdue filings, and client health analytics.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-[#0E1B38]/60 border border-[#1C2E52]/80">
              <Sparkles className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-slate-100">Dual-Engine AI Scanner &amp; Copilot</h4>
                <p className="text-[11px] text-slate-400">Auto-extract PAN, GSTIN, line-items from Form 16, invoices &amp; bank statements.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-[#0E1B38]/60 border border-[#1C2E52]/80">
              <FileText className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-slate-100">Statutory Filing Matrix</h4>
                <p className="text-[11px] text-slate-400">Automated deadline tracking for GSTR-1, GSTR-3B, Advance Tax, TDS Q3, and ROC.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-8 border-t border-[#15233E]/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>ICAI Compliant Audit Trail · 256-bit Encryption</span>
          </div>
          <span>v2.5 Enterprise</span>
        </div>
      </div>

      {/* Right Column: Authentication Card */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center gap-3 mb-4">
            <span className="w-10 h-10 rounded-xl bg-teal-600 text-white font-display font-bold text-lg flex items-center justify-center">
              FS
            </span>
            <div>
              <h1 className="text-xl font-bold text-white font-display">FinSight</h1>
              <p className="text-xs text-slate-400">CA Practice &amp; Compliance Management</p>
            </div>
          </div>

          {/* Form Header */}
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white font-display">
              {mode === 'signin' ? 'Sign In to Your Workspace' : 'Create Firm Account'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {mode === 'signin'
                ? 'Enter your credentials to access the CA Command Centre and client records.'
                : 'Register your CA practice or client account to begin.'}
            </p>
          </div>

          {/* Google Sign-In */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white hover:bg-gray-100 text-gray-800 text-sm font-medium rounded-lg border border-gray-200 shadow-sm transition-all duration-150 disabled:opacity-60 cursor-pointer"
            >
              {googleLoading ? (
                <svg className="w-4 h-4 animate-spin text-gray-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              <span className="font-semibold text-gray-800">
                {googleLoading ? 'Signing in with Google...' : 'Continue with Google'}
              </span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[#182642]" />
              <span className="text-[11px] text-slate-400 font-medium">or continue with email</span>
              <div className="flex-1 h-px bg-[#182642]" />
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-[#091122] border border-[#182642] rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
              }}
              className={`py-2 text-center rounded-md transition-all ${
                mode === 'signin'
                  ? 'bg-teal-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg(null);
              }}
              className={`py-2 text-center rounded-md transition-all ${
                mode === 'signup'
                  ? 'bg-teal-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              New Registration
            </button>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="p-3 bg-red-950/50 border border-red-800/80 rounded-lg text-xs text-red-300 flex items-start gap-2.5">
              <span className="font-bold">Error:</span> {errorMsg}
            </div>
          )}

          {/* Form */}
          {mode === 'signin' ? (
            <form onSubmit={handleSignIn} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="partner@aycompany.in"
                    required
                    className="w-full bg-[#081224] border border-[#1D2C4A] rounded-lg pl-10 pr-3.5 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500 text-xs transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-slate-300 font-medium">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotSent(false);
                      setForgotModalOpen(true);
                    }}
                    className="text-[11px] text-teal-400 hover:text-teal-300 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full bg-[#081224] border border-[#1D2C4A] rounded-lg pl-10 pr-10 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500 text-xs transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded bg-[#081224] border-[#1D2C4A] text-teal-600 focus:ring-0 focus:ring-offset-0"
                  />
                  <span className="text-[11px]">Remember this browser session</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-lg shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-xs"
              >
                {loading ? 'Authenticating...' : 'Sign In to FinSight Workspace'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="CA Kanishka Gianchandani"
                    required
                    className="w-full bg-[#081224] border border-[#1D2C4A] rounded-lg pl-10 pr-3.5 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Work Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="kanishka@aycompany.in"
                    required
                    className="w-full bg-[#081224] border border-[#1D2C4A] rounded-lg pl-10 pr-3.5 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Role / Designation</label>
                  <select
                    value={signupRole}
                    onChange={(e) => setSignupRole(e.target.value as any)}
                    className="w-full bg-[#081224] border border-[#1D2C4A] rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500"
                  >
                    <option value="partner">Senior CA Partner</option>
                    <option value="staff">Audit Senior / Staff</option>
                    <option value="client">Client Representative</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Firm Name</label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={firmName}
                      onChange={(e) => setFirmName(e.target.value)}
                      placeholder="A Y & COMPANY"
                      className="w-full bg-[#081224] border border-[#1D2C4A] rounded-lg pl-9 pr-2.5 py-2 text-slate-100 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-[#081224] border border-[#1D2C4A] rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Confirm</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-[#081224] border border-[#1D2C4A] rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-lg shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-xs"
              >
                {loading ? 'Creating Account...' : 'Complete Registration & Access Workspace'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          )}

          {/* Quick Access Profiles */}
          <div className="pt-4 border-t border-[#15233E]/90 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-medium text-slate-300">Quick Login Profiles</span>
              <span className="text-[10px] text-slate-500">Click to prefill credentials</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickFill('aditya.yadav@aycompany.in', 'Partner@2026')}
                className="p-2.5 bg-[#081224] border border-[#1B2A48] rounded-lg hover:border-teal-500 text-left transition-colors group"
              >
                <div className="font-semibold text-slate-200 group-hover:text-teal-400">CA Partner</div>
                <div className="text-[10px] text-slate-400 truncate">Aditya Yadav</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('neha.sharma@aycompany.in', 'Staff@2026')}
                className="p-2.5 bg-[#081224] border border-[#1B2A48] rounded-lg hover:border-teal-500 text-left transition-colors group"
              >
                <div className="font-semibold text-slate-200 group-hover:text-teal-400">CA Staff</div>
                <div className="text-[10px] text-slate-400 truncate">Neha Sharma</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('accounts@heritagehosp.in', 'Client@2026')}
                className="p-2.5 bg-[#081224] border border-[#1B2A48] rounded-lg hover:border-teal-500 text-left transition-colors group"
              >
                <div className="font-semibold text-slate-200 group-hover:text-teal-400">Client Portal</div>
                <div className="text-[10px] text-slate-400 truncate">Heritage Hosp</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#0B1426] border border-[#1E2E4E] rounded-xl p-5 space-y-4 shadow-2xl">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Reset Your Password</h3>
              <p className="text-xs text-slate-400 mt-1">
                Enter your registered work email to receive password reset instructions.
              </p>
            </div>

            {forgotSent ? (
              <div className="p-3 bg-teal-950/40 border border-teal-800 rounded-lg text-xs text-teal-300 space-y-2">
                <p>Password reset link has been dispatched to <strong>{forgotEmail}</strong>.</p>
                <button
                  type="button"
                  onClick={() => {
                    setForgotModalOpen(false);
                    setForgotSent(false);
                  }}
                  className="w-full py-1.5 text-center bg-teal-600 hover:bg-teal-500 text-white rounded font-medium mt-2"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Registered Email</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="partner@aycompany.in"
                    required
                    className="w-full bg-[#081224] border border-[#1D2C4A] rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div className="flex gap-2 justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg border border-[#1E2E4E] text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
