
import React, { useState, useEffect } from 'react';
import { View, Batch, Student, User } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import BatchManager from './components/BatchManager';
import StudentDetails from './components/StudentDetails';
import AIAssistant from './components/AIAssistant';
import Settings from './components/Settings';
import Auth from './components/Auth';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [batchActiveTab, setBatchActiveTab] = useState<'FEES' | 'ATTENDANCE' | 'FINES'>('ATTENDANCE');
  
  const [globalFee, setGlobalFee] = useState<number>(() => {
    const saved = localStorage.getItem('ieph_global_fee');
    return saved ? parseInt(saved) : 500;
  });

  const [batches, setBatches] = useState<Batch[]>([]);

  // Automatic Login Check
  useEffect(() => {
    const authStatus = localStorage.getItem('ieph_auth_status');
    const userData = localStorage.getItem('ieph_current_user');
    if (authStatus === 'true' && userData) {
      setCurrentUser(JSON.parse(userData));
      setIsAuthenticated(true);
    }
  }, []);

  // Load data
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      const storageKey = `ieph_batches_${currentUser.name}`;
      const localSaved = localStorage.getItem(storageKey);
      
      const parsed = localSaved ? JSON.parse(localSaved) : null;
      
      if (!parsed || parsed.length === 0) {
        setBatches([
          {
            id: 'default-1',
            name: 'Morning Batch',
            className: 'Class 10',
            time: '08:00',
            days: ['SUN', 'TUE', 'THU'],
            monthlyFee: globalFee,
            students: [],
            status: 'ACTIVE'
          }
        ]);
      } else {
        setBatches(parsed);
      }
    }
  }, [isAuthenticated, currentUser]);

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      localStorage.setItem(`ieph_batches_${currentUser.name}`, JSON.stringify(batches));
    }
    localStorage.setItem('ieph_global_fee', globalFee.toString());
  }, [batches, globalFee, isAuthenticated, currentUser]);

  const handleLogout = () => {
    localStorage.removeItem('ieph_auth_status');
    localStorage.removeItem('ieph_current_user');
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  const renderView = () => {
    switch (currentView) {
      case View.DASHBOARD:
        return <Dashboard batches={batches} setBatches={setBatches} globalFee={globalFee} onSelectBatch={(id) => { setSelectedBatchId(id); setCurrentView(View.BATCH_MANAGER); }} />;
      case View.BATCH_MANAGER:
        return (
          <BatchManager 
            batches={batches} 
            batchId={selectedBatchId} 
            setBatches={setBatches} 
            globalFee={globalFee} 
            activeTab={batchActiveTab}
            setActiveTab={setBatchActiveTab}
            onSelectStudent={(sId) => { setSelectedStudentId(sId); setCurrentView(View.STUDENT_DETAILS); }} 
            onBack={() => setCurrentView(View.DASHBOARD)} 
          />
        );
      case View.STUDENT_DETAILS:
        return <StudentDetails batches={batches} batchId={selectedBatchId} studentId={selectedStudentId} setBatches={setBatches} globalFee={globalFee} onBack={() => setCurrentView(View.BATCH_MANAGER)} />;
      case View.AI_ASSISTANT:
        return <AIAssistant />;
      case View.SETTINGS:
        return <Settings globalFee={globalFee} setGlobalFee={setGlobalFee} currentUser={currentUser} setCurrentUser={setCurrentUser} batches={batches} setBatches={setBatches} />;
      default:
        return <Dashboard batches={batches} setBatches={setBatches} globalFee={globalFee} onSelectBatch={() => {}} />;
    }
  };

  if (!isAuthenticated) {
    return <Auth onLogin={(user) => { setCurrentUser(user); setIsAuthenticated(true); }} />;
  }

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden flex-col md:flex-row">
      <Sidebar currentView={currentView} setView={setCurrentView} onLogout={handleLogout} />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto">{renderView()}</div>
      </main>
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-around items-center z-50">
        {[
          { id: View.DASHBOARD, label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
          { id: View.AI_ASSISTANT, label: 'AI', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
          { id: View.SETTINGS, label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
        ].map(item => (
          <button key={item.id} onClick={() => setCurrentView(item.id)} className={`flex flex-col items-center gap-1 p-2 transition-all ${currentView === item.id ? 'text-[#00966d]' : 'text-slate-400'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={item.icon} /></svg>
            <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default App;
