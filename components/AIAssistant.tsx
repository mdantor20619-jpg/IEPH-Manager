
import React from 'react';

const AIAssistant: React.FC = () => {
  return (
    <div className="flex flex-col h-full min-h-[600px] bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-8 border-b border-slate-100">
        <h2 className="text-2xl font-bold text-slate-800">AI Assistant</h2>
        <p className="text-slate-400 text-sm">How can I help you today, Imran?</p>
      </div>
      
      <div className="flex-1 p-8 flex flex-col justify-center items-center text-center space-y-6">
        <div className="w-24 h-24 bg-emerald-50 rounded-3xl flex items-center justify-center text-[#00966d]">
           <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
           </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Ask about your students</h3>
          <p className="text-slate-400 max-w-md mx-auto">I can help you track attendance, calculate fees, or analyze student performance using Gemini AI.</p>
        </div>
        <div className="w-full max-w-2xl bg-slate-50 rounded-[32px] p-2 flex gap-2">
           <input 
            type="text" 
            placeholder="e.g., 'Who hasn't paid January fees in Batch A?'" 
            className="flex-1 bg-transparent px-6 py-4 outline-none text-slate-600"
           />
           <button className="p-4 bg-[#00966d] text-white rounded-3xl shadow-lg shadow-emerald-100">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
           </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
