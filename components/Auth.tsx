
import React, { useState } from 'react';
import { User } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [name, setName] = useState('');

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
          <div className="w-20 h-20 bg-[#00966d] rounded-3xl flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-emerald-100">IE</div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">IEPH Manager</h1>
            <p className="text-[10px] text-[#00966d] font-black uppercase tracking-[4px] mt-2">Private Home Control</p>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-black mb-2 text-slate-800">Teacher Access</h2>
            <p className="text-sm text-slate-400 font-medium px-4">Enter your name to access your student management dashboard.</p>
          </div>

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

            <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 w-full mt-4">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                 Offline First: Your data is saved locally on this device. Use "Settings" to export backups.
               </p>
            </div>
          </form>
        </div>

        <p className="mt-12 text-slate-300 text-[8px] font-black uppercase tracking-[3px]">
          Authorized Access Only • IEPH Education
        </p>
      </div>
    </div>
  );
};

export default Auth;
