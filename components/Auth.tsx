import React, { useState, useEffect } from 'react';
import { User } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [loginMode, setLoginMode] = useState<'simple' | 'google'>('simple');
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);

  // Initialize Google SDK
  useEffect(() => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: '1234567890-YOUR_CLIENT_ID.apps.googleusercontent.com', // Replace with your Google OAuth Client ID
        callback: handleGoogleSignIn
      });
    } else {
      // Load Google SDK if not already loaded
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = () => {
        if (window.google) {
          window.google.accounts.id.initialize({
            client_id: '1234567890-YOUR_CLIENT_ID.apps.googleusercontent.com',
            callback: handleGoogleSignIn
          });
        }
      };
      document.head.appendChild(script);
    }
  }, []);

  const handleGoogleSignIn = async (response: any) => {
    try {
      setIsLoadingGoogle(true);
      // Decode JWT token
      const token = response.credential;
      const decodedToken = parseJwt(token);
      
      const email = decodedToken.email;
      const name = decodedToken.name || email.split('@')[0];

      const user: User = {
        name: name,
        gmailConnected: email
      };

      // Store authentication info
      localStorage.setItem('ieph_auth_status', 'true');
      localStorage.setItem('ieph_current_user', JSON.stringify(user));
      localStorage.setItem('ieph_gmail_address', email);
      localStorage.setItem('ieph_auth_token', token);

      onLogin(user);
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      alert('Failed to sign in with Google. Please try again.');
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  const parseJwt = (token: string) => {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return;

    const user: User = {
      name: name.trim(),
      gmailConnected: null
    };

    localStorage.setItem('ieph_auth_status', 'true');
    localStorage.setItem('ieph_current_user', JSON.stringify(user));
    onLogin(user);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 text-slate-900">
      <div className="bg-white rounded-[48px] w-full max-w-md p-10 shadow-2xl border border-slate-100 text-center animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center gap-6 mb-12">
          <div className="w-20 h-20 bg-[#00966d] rounded-3xl flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-emerald-100">
            IE
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">IEPH Manager</h1>
            <p className="text-[10px] text-[#00966d] font-black uppercase tracking-[4px] mt-2">Private Home Control</p>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-black mb-2 text-slate-800">
              {loginMode === 'simple' ? 'Teacher Access' : 'Secure Gmail Login'}
            </h2>
            <p className="text-sm text-slate-400 font-medium px-4">
              {loginMode === 'simple'
                ? 'Enter your name to access your student management dashboard.'
                : 'Sign in with your Google Account for secure access and data protection.'}
            </p>
          </div>

          {loginMode === 'simple' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                required
                type="text"
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[24px] outline-none font-black text-black text-center focus:border-[#00966d] transition-colors"
              />

              <button
                type="submit"
                className="w-full py-5 bg-[#00966d] text-white rounded-[24px] font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-100 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Enter Dashboard
              </button>

              <button
                type="button"
                onClick={() => setLoginMode('google')}
                className="w-full py-3 mt-4 border-2 border-[#00966d] text-[#00966d] rounded-[24px] font-black uppercase tracking-widest text-xs hover:bg-emerald-50 transition-all"
              >
                Or: Sign in with Google
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div
                id="google-signin-button"
                className="flex justify-center"
              />

              <button
                type="button"
                onClick={() => setLoginMode('simple')}
                className="w-full py-3 border-2 border-slate-300 text-slate-600 rounded-[24px] font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-all"
              >
                Back to Simple Login
              </button>

              {isLoadingGoogle && (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin">
                    <div className="w-6 h-6 border-3 border-[#00966d] border-t-transparent rounded-full"></div>
                  </div>
                  <p className="text-sm text-slate-500 mt-2 font-semibold">Signing you in...</p>
                </div>
              )}
            </div>
          )}

          <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 w-full mt-4">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
              {loginMode === 'google'
                ? '🔒 Google Sign-In: Your data will be protected and linked to your Gmail account.'
                : 'Offline First: Your data is saved locally on this device. Use "Settings" to export backups.'}
            </p>
          </div>
        </div>

        <p className="mt-12 text-slate-300 text-[8px] font-black uppercase tracking-[3px]">
          Authorized Access Only • IEPH Education
        </p>
      </div>
    </div>
  );
};

declare global {
  interface Window {
    google: any;
  }
}

export default Auth;
