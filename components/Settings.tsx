
import React, { useState, useEffect } from 'react';
import { User, Batch } from '../types';

interface SettingsProps {
  globalFee: number;
  setGlobalFee: (fee: number) => void;
  currentUser: User | null;
  setCurrentUser: (user: User) => void;
  batches: Batch[];
  setBatches: (batches: Batch[]) => void;
}

const Settings: React.FC<SettingsProps> = ({ globalFee, setGlobalFee, currentUser, batches, setBatches }) => {
  const [paymentSmsTemplate, setPaymentSmsTemplate] = useState(() => localStorage.getItem('ieph_payment_sms_template') || "IEPH: Payment of {amount}৳ received for {month} for student {name}. Thank you!");
  const [dueSmsTemplate, setDueSmsTemplate] = useState(() => localStorage.getItem('ieph_due_sms_template') || "Reminder: {name}, your total due is {due_amount}৳ for {months}. Please clear it soon.");
  const [summarySmsTemplate, setSummarySmsTemplate] = useState(() => localStorage.getItem('ieph_summary_sms_template') || "IEPH Summary ({name}):\n- Paid: {paid_months} Months\n- Due: {due_months} Months ({due_amount}৳)\n- Attendance ({current_month}): {present} Present, {absent} Absent.");

  useEffect(() => { localStorage.setItem('ieph_payment_sms_template', paymentSmsTemplate); }, [paymentSmsTemplate]);
  useEffect(() => { localStorage.setItem('ieph_due_sms_template', dueSmsTemplate); }, [dueSmsTemplate]);
  useEffect(() => { localStorage.setItem('ieph_summary_sms_template', summarySmsTemplate); }, [summarySmsTemplate]);

  const handleExport = () => {
    const dataStr = JSON.stringify(batches, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ieph_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  return (
    <div className="max-w-3xl space-y-8 pb-10">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Teacher Settings</h2>
        <p className="text-slate-400 text-sm">Welcome, {currentUser?.name}. Manage your preferences here.</p>
      </div>

      <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-6 uppercase text-xs tracking-widest">Backup & Export</h3>
        <div className="p-6 bg-[#e6f4f0] rounded-[32px] border border-emerald-100">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#00966d] text-white flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              </div>
              <div>
                <p className="font-black text-[#00966d] text-[10px] uppercase tracking-widest">Data Safety</p>
                <p className="text-sm font-bold text-slate-800">Export your local database</p>
              </div>
            </div>
            <button onClick={handleExport} className="w-full md:w-auto px-8 py-4 bg-[#00966d] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-100 hover:scale-105 active:scale-95 transition-all">
              Download JSON
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-6 uppercase text-xs tracking-widest">Accounting Configuration</h3>
        <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-200">
           <div className="flex-1">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] block mb-4">Standard Monthly Fee (৳)</label>
             <div className="flex flex-col md:flex-row items-center gap-6">
                <input type="range" min="0" max="5000" step="50" value={globalFee} onChange={(e) => setGlobalFee(parseInt(e.target.value))} className="flex-1 w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#00966d]" />
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <input type="number" value={globalFee === 0 ? '' : globalFee} onChange={(e) => setGlobalFee(e.target.value === '' ? 0 : parseInt(e.target.value))} className="w-full md:w-32 px-5 py-3 bg-white rounded-2xl border border-slate-200 font-bold text-[#00966d] text-center focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  <span className="font-bold text-slate-400 text-xl">৳</span>
                </div>
             </div>
           </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-6 uppercase text-xs tracking-widest">Message Templates</h3>
        <div className="space-y-4">
           <div>
             <label className="text-[8px] font-black text-slate-400 uppercase mb-2 block">Payment Receipt</label>
             <textarea value={paymentSmsTemplate} onChange={(e) => setPaymentSmsTemplate(e.target.value)} rows={2} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-[#00966d] text-slate-700 text-sm" />
           </div>
           <div>
             <label className="text-[8px] font-black text-slate-400 uppercase mb-2 block">Due Reminder</label>
             <textarea value={dueSmsTemplate} onChange={(e) => setDueSmsTemplate(e.target.value)} rows={2} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-[#00966d] text-slate-700 text-sm" />
           </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
