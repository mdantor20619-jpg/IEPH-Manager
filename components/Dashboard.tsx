
import React, { useState, useEffect, useRef } from 'react';
import { Batch, Student, PresentationHistoryEntry } from '../types';

interface DashboardProps {
  batches: Batch[];
  onSelectBatch: (id: string) => void;
  setBatches: React.Dispatch<React.SetStateAction<Batch[]>>;
  globalFee: number;
}

const Dashboard: React.FC<DashboardProps> = ({ batches, onSelectBatch, setBatches, globalFee }) => {
  const [isAddingBatch, setIsAddingBatch] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [showDueModal, setShowDueModal] = useState(false);
  const [showPresentationAlert, setShowPresentationAlert] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedPresentationBatch, setSelectedPresentationBatch] = useState<Batch | null>(null);
  
  // Postpone States
  const [isPostponing, setIsPostponing] = useState(false);
  const [postponeDate, setPostponeDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [newBatch, setNewBatch] = useState({ name: '', className: '', time: '16:00', days: [] as string[], presentation: '' });
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Visibility States
  const [showClockPicker, setShowClockPicker] = useState(false);
  const [showPresCalendar, setShowPresCalendar] = useState(false);
  const [showPresClock, setShowPresClock] = useState(false);

  // Picker Modes
  const [clockMode, setClockMode] = useState<'hours' | 'minutes'>('hours');
  const [tempHour, setTempHour] = useState(4);
  const [tempMinute, setTempMinute] = useState(0);
  const [tempPeriod, setTempPeriod] = useState<'PM' | 'AM'>('PM');

  // Presentation Planner Advanced States
  const [viewDate, setViewDate] = useState(new Date());
  const [presDate, setPresDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [presTempHour, setPresTempHour] = useState(3);
  const [presTempMinute, setPresTempMinute] = useState(30);
  const [presTempPeriod, setPresTempPeriod] = useState<'PM' | 'AM'>('PM');
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);
  const [pickerTab, setPickerTab] = useState<'MONTH' | 'YEAR'>('MONTH');

  const clockRef = useRef<HTMLDivElement>(null);
  const presClockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (editingBatch) {
      const [h24, m] = editingBatch.time.split(':').map(Number);
      setTempHour(h24 % 12 || 12);
      setTempMinute(m || 0);
      setTempPeriod(h24 >= 12 ? 'PM' : 'AM');

      if (editingBatch.presentationDateTime) {
        const [d, t] = editingBatch.presentationDateTime.split('T');
        setPresDate(d);
        const [ph24, pm] = t.split(':').map(Number);
        setPresTempHour(ph24 % 12 || 12);
        setPresTempMinute(pm || 0);
        setPresTempPeriod(ph24 >= 12 ? 'PM' : 'AM');
        setViewDate(new Date(d));
      }
    }
  }, [editingBatch?.id]);

  const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
  const years = Array.from({ length: 31 }, (_, i) => 2020 + i);
  const currentMonthIndex = new Date().getMonth();
  const currentMonthName = months[currentMonthIndex];
  const todayDayShort = new Date().toLocaleString('en-US', { weekday: 'short' }).toUpperCase();
  const availableDays = ['SAT', 'SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI'];

  const handleClockInteraction = (e: React.MouseEvent | React.TouchEvent, type: 'create' | 'pres') => {
    let ref = type === 'create' ? clockRef : presClockRef;
    if (!ref.current) return;
    
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    const x = clientX - centerX;
    const y = clientY - centerY;
    let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;

    const mode = clockMode;
    
    if (mode === 'hours') {
      let h = Math.round(angle / 30);
      if (h === 0) h = 12;
      type === 'create' ? setTempHour(h) : setPresTempHour(h);
    } else {
      let m = Math.round(angle / 6);
      if (m === 60) m = 0;
      type === 'create' ? setTempMinute(m) : setPresTempMinute(m);
    }
  };

  const finalizeTime = (h: number, m: number, p: 'AM' | 'PM') => {
    let h24 = h % 12;
    if (p === 'PM') h24 += 12;
    return `${h24.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const timeStr = finalizeTime(tempHour, tempMinute, tempPeriod);
    if (editingBatch) {
      setEditingBatch(prev => prev ? ({ ...prev, time: timeStr }) : null);
    } else {
      setNewBatch(prev => ({ ...prev, time: timeStr }));
    }
  }, [tempHour, tempMinute, tempPeriod]);

  useEffect(() => {
    if (editingBatch) {
      const timeStr = finalizeTime(presTempHour, presTempMinute, presTempPeriod);
      setEditingBatch(prev => prev ? ({ ...prev, presentationDateTime: `${presDate}T${timeStr}` }) : null);
    }
  }, [presDate, presTempHour, presTempMinute, presTempPeriod]);

  const isAlertActive = (batch: Batch) => {
    if (!batch.presentation || !batch.presentationDateTime || batch.presentationViewed || batch.status === 'OFFLINE') return false;
    return new Date(batch.presentationDateTime) <= currentTime;
  };

  const formatDisplayTime = (time24: string) => {
    if (!time24) return "00:00";
    const [hrs, mins] = time24.split(':').map(Number);
    const suffix = hrs >= 12 ? 'PM' : 'AM';
    const h12 = hrs % 12 || 12;
    return `${h12}:${mins.toString().padStart(2, '0')} ${suffix}`;
  };

  const handleUpdateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBatch) return;
    setBatches(prev => prev.map(b => b.id === editingBatch.id ? editingBatch : b));
    setEditingBatch(null);
  };

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    const batch: Batch = {
      id: Math.random().toString(36).substr(2, 9),
      name: newBatch.name,
      className: newBatch.className,
      time: newBatch.time,
      days: newBatch.days,
      presentation: newBatch.presentation,
      monthlyFee: globalFee,
      students: [],
      status: 'ACTIVE'
    };
    setBatches([...batches, batch]);
    setIsAddingBatch(false);
    setNewBatch({ name: '', className: '', time: '16:00', days: [], presentation: '' });
  };

  const getCalendarDays = (refDate: Date = viewDate) => {
    const year = refDate.getFullYear();
    const month = refDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  };

  const changeMonth = (offset: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  };

  // Filter out OFFLINE batches for metrics
  const activeBatchesForMetrics = batches.filter(b => b.status === 'ACTIVE');
  
  const todayBatchesSorted = batches
    .filter(b => b.days.includes(todayDayShort))
    .sort((a, b) => {
      const [ha, ma] = a.time.split(':').map(Number);
      const [hb, mb] = b.time.split(':').map(Number);
      return (ha * 60 + ma) - (hb * 60 + mb);
    });

  const studentsWithDue = activeBatchesForMetrics.flatMap(b => 
    b.students.filter(s => s.status === 'ACTIVE').map(s => {
      const startIdx = months.indexOf(s.admissionMonth || 'JANUARY');
      const unpaid = months.slice(startIdx, currentMonthIndex + 1).filter(m => !s.fees[m]);
      
      // Calculate presence count
      const presenceCount = Object.values(s.attendance || {}).filter(v => v === 'PRESENT').length;

      return { 
        ...s, 
        batchName: b.name, 
        unpaidMonths: unpaid, 
        dueAmount: unpaid.length * globalFee,
        presenceCount
      };
    })
  ).filter(s => s.dueAmount > 0);

  const handleManualTimeChange = (val: string, type: 'hour' | 'minute', context: 'create' | 'pres') => {
    const num = parseInt(val);
    if (isNaN(num)) return;
    if (type === 'hour') {
      const capped = Math.min(12, Math.max(1, num));
      context === 'create' ? setTempHour(capped) : setPresTempHour(capped);
    } else {
      const capped = Math.min(59, Math.max(0, num));
      context === 'create' ? setTempMinute(capped) : setPresTempMinute(capped);
    }
  };

  const addSessionGoal = () => {
    if (!editingBatch) return;
    const currentText = editingBatch.presentation || "";
    setEditingBatch({ ...editingBatch, presentation: currentText + (currentText ? "\n" : "") + "• New Goal" });
  };

  const toggleSessionCompletion = () => {
    if (!selectedPresentationBatch) return;
    const isCompleted = selectedPresentationBatch.presentationViewed;
    const now = new Date();
    
    setBatches(prev => prev.map(b => {
      if (b.id !== selectedPresentationBatch.id) return b;
      
      const nextViewed = !isCompleted;
      const history = b.presentationHistory || [];
      const updatedHistory = nextViewed 
        ? [...history, { 
            dateCompleted: now.toISOString().split('T')[0], 
            completedAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            noteContent: b.presentation 
          }] 
        : history;

      return { ...b, presentationViewed: nextViewed, presentationHistory: updatedHistory };
    }));
    
    setShowPresentationAlert(false);
  };

  const confirmPostpone = () => {
    if (!selectedPresentationBatch) return;
    const timeStr = finalizeTime(presTempHour, presTempMinute, presTempPeriod);
    const newDateTime = `${postponeDate}T${timeStr}`;
    
    setBatches(prev => prev.map(b => 
      b.id === selectedPresentationBatch.id 
      ? { ...b, presentationDateTime: newDateTime, presentationViewed: false } 
      : b
    ));
    
    setIsPostponing(false);
    setShowPresentationAlert(false);
  };

  const handleDueSms = (student: any) => {
    let template = localStorage.getItem('ieph_due_sms_template') || "Reminder: {name}, your total due is {due_amount}৳ for {months}. Please clear it soon.";
    let message = template
      .replace(/{name}/g, student.name)
      .replace(/{due_amount}/g, student.dueAmount.toString())
      .replace(/{months}/g, student.unpaidMonths.join(', '));
    
    window.open(`sms:${student.phone}?body=${encodeURIComponent(message)}`);
  };

  return (
    <div className="animate-in fade-in duration-700 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-black tracking-tight">Imran's Dashboard</h2>
          <p className="text-black text-[10px] font-black uppercase tracking-[3px] mt-2 opacity-50">
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} • {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <button onClick={() => { setIsAddingBatch(true); setClockMode('hours'); setShowClockPicker(false); }} className="w-full md:w-auto bg-[#00966d] text-white px-8 py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-50 hover:scale-105 active:scale-95 transition-all">New Batch</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {[
          { label: 'ACTIVE BATCHES', value: activeBatchesForMetrics.length, color: '#6366f1', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
          { label: 'TOTAL STUDENTS', value: activeBatchesForMetrics.reduce((acc, b) => acc + b.students.filter(s => s.status === 'ACTIVE').length, 0), color: '#f43f5e', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
          { label: 'HONORIUM EARN', value: `${activeBatchesForMetrics.reduce((acc, b) => acc + (b.students.filter(s => s.status === 'ACTIVE' && s.fees[currentMonthName]).length * globalFee), 0)}৳`, color: '#10b981', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
          { label: 'TOTAL DUE', value: `${studentsWithDue.reduce((acc, s) => acc + s.dueAmount, 0)}৳`, color: '#f59e0b', action: () => setShowDueModal(true), icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
        ].map((stat, i) => (
          <div key={i} onClick={stat.action} className={`bg-white p-8 rounded-[40px] shadow-sm flex items-center gap-6 border-b-8 ${stat.action ? 'cursor-pointer hover:shadow-xl transition-all' : ''}`} style={{ borderBottomColor: stat.color }}>
            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400"><svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={stat.icon} /></svg></div>
            <div><p className="text-[10px] font-black text-black tracking-[3px] uppercase opacity-40">{stat.label}</p><p className="text-3xl font-black text-black">{stat.value}</p></div>
          </div>
        ))}
      </div>

      {/* Schedule */}
      <div className="mb-12">
        <h3 className="text-2xl font-black text-black uppercase tracking-widest mb-8 flex items-center gap-4">
          <div className="w-2 h-10 bg-[#00966d] rounded-full"></div> Today's Schedule
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {todayBatchesSorted.map((batch) => {
            const hasAlert = isAlertActive(batch);
            const hasHistory = batch.presentationHistory && batch.presentationHistory.length > 0;
            const isOffline = batch.status === 'OFFLINE';
            return (
              <div key={batch.id} onClick={() => onSelectBatch(batch.id)} className={`bg-white p-10 rounded-[48px] border-2 shadow-xl shadow-emerald-50 cursor-pointer relative group transition-opacity ${isOffline ? 'opacity-50 grayscale border-slate-200' : 'border-[#00966d]'}`}>
                <div className="absolute top-0 right-0 flex">
                  <button onClick={(e) => { e.stopPropagation(); setEditingBatch(batch); setClockMode('hours'); setShowClockPicker(false); }} className="bg-slate-50 text-slate-400 hover:text-black p-3 rounded-bl-2xl transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
                  </button>
                  {hasHistory && (
                    <div onClick={(e) => { e.stopPropagation(); setSelectedPresentationBatch(batch); setShowHistoryModal(true); }} className="bg-slate-100 text-slate-500 px-3 py-1 flex items-center justify-center hover:bg-slate-200 transition-colors">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>
                    </div>
                  )}
                  {hasAlert && !isOffline && (
                    <div onClick={(e) => { e.stopPropagation(); setSelectedPresentationBatch(batch); setShowPresentationAlert(true); setIsPostponing(false); }} className="bg-indigo-500 text-white px-3 py-1 flex items-center justify-center animate-pulse">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
                    </div>
                  )}
                  {!isOffline && <div className="bg-[#00966d] text-white px-4 py-1 text-[7px] font-black uppercase tracking-widest rounded-bl-2xl">LIVE</div>}
                </div>
                <div className="flex items-center gap-5 mb-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl ${isOffline ? 'bg-slate-100 text-slate-400' : 'bg-emerald-50 text-[#00966d]'}`}>{batch.name.charAt(0)}</div>
                  <div><h4 className="font-black text-xl text-black">{batch.name}</h4><p className="text-[10px] font-bold text-black opacity-40 uppercase tracking-widest">{batch.students.length} Students</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter ${isOffline ? 'bg-slate-200 text-slate-500' : 'bg-emerald-600 text-white'}`}>{formatDisplayTime(batch.time)}</span>
                  <span className="text-[10px] font-black text-black opacity-40 uppercase">{batch.className} {isOffline && '• OFFLINE'}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* All Batches */}
        <h3 className="text-2xl font-black text-black uppercase tracking-widest mb-8 flex items-center gap-4">
          <div className="w-2 h-10 bg-slate-300 rounded-full"></div> All Batches
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {batches.map(batch => (
            <div key={batch.id} onClick={() => onSelectBatch(batch.id)} className={`bg-white p-5 rounded-[32px] border shadow-sm transition-all cursor-pointer hover:shadow-md flex items-center gap-4 ${batch.status === 'OFFLINE' ? 'opacity-50 grayscale border-slate-100' : 'border-slate-100'}`}>
              <div className={`w-11 h-11 font-black rounded-xl flex items-center justify-center text-lg ${batch.status === 'OFFLINE' ? 'bg-slate-100 text-slate-400' : 'bg-slate-50 text-black'}`}>{batch.name.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5"><h4 className="font-black text-black text-sm truncate">{batch.name}</h4>{isAlertActive(batch) && <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping" />}</div>
                <p className="text-[8px] font-bold text-black opacity-40 uppercase tracking-widest truncate">{batch.className} {batch.status === 'OFFLINE' && '(OFFLINE)'}</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setEditingBatch(batch); setClockMode('hours'); setShowClockPicker(false); setShowPresCalendar(false); setShowPresClock(false); }} className="p-2 text-slate-300 hover:text-black transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg></button>
            </div>
          ))}
        </div>
      </div>

      {/* NEW BATCH MODAL */}
      {isAddingBatch && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[60] p-4 overflow-y-auto">
          <div className="bg-white rounded-[48px] w-full max-w-lg p-10 shadow-2xl animate-in zoom-in duration-300 my-8">
            <h3 className="text-3xl font-black text-black mb-8">New Batch</h3>
            <form onSubmit={handleCreateBatch} className="space-y-6">
              <input required value={newBatch.name} onChange={e => setNewBatch({...newBatch, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-black" placeholder="Batch Name" />
              <input required value={newBatch.className} onChange={e => setNewBatch({...newBatch, className: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-black" placeholder="Class" />
              
              <div className="space-y-4">
                <div className="flex justify-between items-center px-4">
                  <label className="text-[10px] font-black text-black uppercase tracking-[3px]">Class Time: {formatDisplayTime(newBatch.time)}</label>
                  <button type="button" aria-label="Open clock" onClick={() => setShowClockPicker(!showClockPicker)} className={`p-2 rounded-lg transition-colors ${showClockPicker ? 'bg-emerald-100 text-[#00966d]' : 'bg-slate-100 text-slate-400'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0" /></svg>
                  </button>
                </div>

                {showClockPicker && (
                   <div className="bg-slate-50 rounded-[40px] border border-slate-200 p-8 animate-in slide-in-from-top-2 duration-300">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                           <div className="flex justify-between items-center px-4">
                             <label className="text-[8px] font-black uppercase text-black">Hour</label>
                             <input 
                              type="number" 
                              className="w-12 text-xl font-black text-center bg-transparent text-black border-b border-slate-300 outline-none focus:border-[#00966d]"
                              value={tempHour}
                              onChange={(e) => handleManualTimeChange(e.target.value, 'hour', 'create')}
                             />
                           </div>
                           <div ref={clockRef} onMouseDown={(e) => { setClockMode('hours'); handleClockInteraction(e, 'create'); }} onMouseMove={(e) => e.buttons === 1 && handleClockInteraction(e, 'create')} onTouchMove={(e) => handleClockInteraction(e, 'create')} className="relative w-32 h-32 bg-white rounded-full mx-auto border-2 border-slate-100 flex items-center justify-center cursor-crosshair">
                              <div className="absolute w-1 bg-[#00966d] origin-bottom" style={{ height: '40%', bottom: '50%', transform: `rotate(${tempHour * 30}deg)` }} />
                              {[12,3,6,9].map(h => <div key={h} className="absolute text-[8px] font-black text-black" style={{ transform: `translate(${Math.sin(h*30*Math.PI/180)*50}px, ${-Math.cos(h*30*Math.PI/180)*50}px)` }}>{h}</div>)}
                           </div>
                        </div>
                        <div className="space-y-3">
                           <div className="flex justify-between items-center px-4">
                             <label className="text-[8px] font-black uppercase text-black">Minute</label>
                             <input 
                              type="number" 
                              className="w-12 text-xl font-black text-center bg-transparent text-black border-b border-slate-300 outline-none focus:border-[#00966d]"
                              value={tempMinute}
                              onChange={(e) => handleManualTimeChange(e.target.value, 'minute', 'create')}
                             />
                           </div>
                           <div onMouseDown={(e) => { setClockMode('minutes'); handleClockInteraction(e, 'create'); }} onMouseMove={(e) => e.buttons === 1 && handleClockInteraction(e, 'create')} onTouchMove={(e) => handleClockInteraction(e, 'create')} className="relative w-32 h-32 bg-white rounded-full mx-auto border-2 border-slate-100 flex items-center justify-center cursor-crosshair">
                              <div className="absolute w-1 bg-[#00966d] origin-bottom" style={{ height: '40%', bottom: '50%', transform: `rotate(${tempMinute * 6}deg)` }} />
                              {/* Fix: use 'm' as loop variable instead of undefined 'h' */}
                              {[0,15,30,45].map(m => <div key={m} className="absolute text-[8px] font-black text-black" style={{ transform: `translate(${Math.sin(m*6*Math.PI/180)*50}px, ${-Math.cos(m*6*Math.PI/180)*50}px)` }}>{m}</div>)}
                           </div>
                        </div>
                      </div>
                      <div className="mt-8 flex justify-center gap-2">
                        <button type="button" onClick={() => setTempPeriod('AM')} className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all ${tempPeriod === 'AM' ? 'bg-[#00966d] text-white shadow-lg' : 'bg-white border border-slate-200 text-black'}`}>AM</button>
                        <button type="button" onClick={() => setTempPeriod('PM')} className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all ${tempPeriod === 'PM' ? 'bg-[#00966d] text-white shadow-lg' : 'bg-white border border-slate-200 text-black'}`}>PM</button>
                      </div>
                   </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {availableDays.map(day => (
                  <button key={day} type="button" onClick={() => setNewBatch(p => ({...p, days: p.days.includes(day) ? p.days.filter(d => d !== day) : [...p.days, day]}))} className={`px-4 py-2 rounded-xl text-[10px] font-black ${newBatch.days.includes(day) ? 'bg-[#00966d] text-white shadow-lg' : 'bg-slate-50 border border-slate-200 text-black'}`}>{day}</button>
                ))}
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-black uppercase tracking-[3px] ml-4">Presentation / Notes</label>
                <textarea rows={3} value={newBatch.presentation} onChange={e => setNewBatch({...newBatch, presentation: e.target.value})} className="w-full px-8 py-6 bg-slate-50 border border-slate-200 rounded-[32px] outline-none font-black text-black placeholder:opacity-20" placeholder="Session objectives or topics..." />
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsAddingBatch(false)} className="flex-1 py-5 bg-slate-100 text-black rounded-3xl font-black uppercase text-[10px]">Back</button>
                <button type="submit" className="flex-2 py-5 bg-[#00966d] text-white rounded-3xl font-black uppercase text-[10px] shadow-xl">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT BATCH MODAL */}
      {editingBatch && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[60] p-4 overflow-y-auto">
          <div className="bg-white rounded-[48px] w-full max-w-xl p-10 shadow-2xl my-8">
            <h3 className="text-3xl font-black text-black mb-10">Batch Configuration</h3>
            <form onSubmit={handleUpdateBatch} className="space-y-8">
              <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
                <button 
                  type="button" 
                  onClick={() => setEditingBatch({...editingBatch, status: 'ACTIVE'})}
                  className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${editingBatch.status !== 'OFFLINE' ? 'bg-[#00966d] text-white shadow-md' : 'text-slate-400'}`}
                >Online Mode</button>
                <button 
                  type="button" 
                  onClick={() => setEditingBatch({...editingBatch, status: 'OFFLINE'})}
                  className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${editingBatch.status === 'OFFLINE' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-400'}`}
                >Offline Mode</button>
              </div>

              <div className="space-y-4">
                <input required value={editingBatch.name} onChange={e => setEditingBatch({...editingBatch, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-black" placeholder="Batch Name" />
                <input required value={editingBatch.className} onChange={e => setEditingBatch({...editingBatch, className: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-black" placeholder="Class" />
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-4">
                    <label className="text-[10px] font-black text-black uppercase tracking-[3px]">Class Time: {formatDisplayTime(editingBatch.time)}</label>
                    <button type="button" aria-label="Open clock" onClick={() => setShowClockPicker(!showClockPicker)} className={`p-2 rounded-lg transition-colors ${showClockPicker ? 'bg-emerald-100 text-[#00966d]' : 'bg-slate-100 text-slate-400'}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0" /></svg>
                    </button>
                  </div>
                  {showClockPicker && (
                    <div className="bg-slate-50 rounded-[40px] border border-slate-200 p-8 animate-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-3">
                             <div className="flex justify-between items-center px-4">
                               <label className="text-[8px] font-black uppercase text-black">Hour</label>
                               <input 
                                type="number" 
                                className="w-12 text-xl font-black text-center bg-transparent text-black border-b border-slate-300 outline-none focus:border-[#00966d]"
                                value={tempHour}
                                onChange={(e) => handleManualTimeChange(e.target.value, 'hour', 'create')}
                               />
                             </div>
                             <div ref={clockRef} onMouseDown={(e) => { setClockMode('hours'); handleClockInteraction(e, 'create'); }} onMouseMove={(e) => e.buttons === 1 && handleClockInteraction(e, 'create')} onTouchMove={(e) => handleClockInteraction(e, 'create')} className="relative w-32 h-32 bg-white rounded-full mx-auto border-2 border-slate-100 flex items-center justify-center cursor-crosshair">
                                <div className="absolute w-1 bg-[#00966d] origin-bottom" style={{ height: '40%', bottom: '50%', transform: `rotate(${tempHour * 30}deg)` }} />
                                {[12,3,6,9].map(h => <div key={h} className="absolute text-[8px] font-black text-black" style={{ transform: `translate(${Math.sin(h*30*Math.PI/180)*50}px, ${-Math.cos(h*30*Math.PI/180)*50}px)` }}>{h}</div>)}
                             </div>
                          </div>
                          <div className="space-y-3">
                             <div className="flex justify-between items-center px-4">
                               <label className="text-[8px] font-black uppercase text-black">Minute</label>
                               <input 
                                type="number" 
                                className="w-12 text-xl font-black text-center bg-transparent text-black border-b border-slate-300 outline-none focus:border-[#00966d]"
                                value={tempMinute}
                                onChange={(e) => handleManualTimeChange(e.target.value, 'minute', 'create')}
                               />
                             </div>
                             <div onMouseDown={(e) => { setClockMode('minutes'); handleClockInteraction(e, 'create'); }} onMouseMove={(e) => e.buttons === 1 && handleClockInteraction(e, 'create')} onTouchMove={(e) => handleClockInteraction(e, 'create')} className="relative w-32 h-32 bg-white rounded-full mx-auto border-2 border-slate-100 flex items-center justify-center cursor-crosshair">
                                <div className="absolute w-1 bg-[#00966d] origin-bottom" style={{ height: '40%', bottom: '50%', transform: `rotate(${tempMinute * 6}deg)` }} />
                                {/* Fix: use 'm' as loop variable instead of undefined 'h' */}
                                {[0,15,30,45].map(m => <div key={m} className="absolute text-[8px] font-black text-black" style={{ transform: `translate(${Math.sin(m*6*Math.PI/180)*50}px, ${-Math.cos(m*6*Math.PI/180)*50}px)` }}>{m}</div>)}
                             </div>
                          </div>
                        </div>
                        <div className="mt-8 flex justify-center gap-2">
                          <button type="button" onClick={() => setTempPeriod('AM')} className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all ${tempPeriod === 'AM' ? 'bg-[#00966d] text-white shadow-lg' : 'bg-white border border-slate-200 text-black'}`}>AM</button>
                          <button type="button" onClick={() => setTempPeriod('PM')} className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all ${tempPeriod === 'PM' ? 'bg-[#00966d] text-white shadow-lg' : 'bg-white border border-slate-200 text-black'}`}>PM</button>
                        </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {availableDays.map(day => (
                    <button key={day} type="button" onClick={() => setEditingBatch(p => p ? ({...p, days: p.days.includes(day) ? p.days.filter(d => d !== day) : [...p.days, day]}) : null)} className={`px-4 py-2 rounded-xl text-[10px] font-black ${editingBatch.days.includes(day) ? 'bg-[#00966d] text-white' : 'bg-slate-50 border border-slate-200 text-black'}`}>{day}</button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center px-4">
                  <label className="text-[10px] font-black text-black uppercase tracking-[3px]">Presentation Planner</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={addSessionGoal} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[8px] font-black uppercase">+ Goal</button>
                    <button type="button" aria-label="Open calendar" onClick={() => setShowPresCalendar(!showPresCalendar)} className={`p-2 rounded-lg transition-colors ${showPresCalendar ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </button>
                    <button type="button" aria-label="Open clock" onClick={() => setShowPresClock(!showPresClock)} className={`p-2 rounded-lg transition-colors ${showPresClock ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0" /></svg>
                    </button>
                  </div>
                </div>
                <textarea rows={5} value={editingBatch.presentation || ''} onChange={e => setEditingBatch({...editingBatch, presentation: e.target.value, presentationViewed: false})} className="w-full px-8 py-6 bg-slate-50 border border-slate-200 rounded-[32px] outline-none font-black text-black placeholder:opacity-20 leading-relaxed" placeholder="• Item 1&#10;• Item 2..." />
                
                {/* Advanced Calendar Picker */}
                {showPresCalendar && (
                  <div className="bg-slate-50 rounded-[40px] border border-slate-200 p-8 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex justify-between items-center mb-6 relative px-2">
                        <button type="button" onClick={() => changeMonth(-1)} className="p-2 hover:bg-white rounded-xl transition-all text-black"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg></button>
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => { setPickerTab('MONTH'); setShowMonthYearPicker(!showMonthYearPicker); }} className={`text-sm font-black uppercase tracking-[2px] ${showMonthYearPicker && pickerTab === 'MONTH' ? 'text-indigo-600' : 'text-black'}`}>{months[viewDate.getMonth()]}</button>
                          <button type="button" onClick={() => { setPickerTab('YEAR'); setShowMonthYearPicker(!showMonthYearPicker); }} className={`text-sm font-black uppercase tracking-[2px] ${showMonthYearPicker && pickerTab === 'YEAR' ? 'text-indigo-600' : 'text-black'}`}>{viewDate.getFullYear()}</button>
                        </div>
                        <button type="button" onClick={() => changeMonth(1)} className="p-2 hover:bg-white rounded-xl transition-all text-black"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg></button>
                        
                        {showMonthYearPicker && (
                          <div className="absolute top-full left-1/2 -translate-x-1/2 bg-white p-4 rounded-3xl shadow-2xl border border-slate-100 z-50 w-full mt-2 animate-in zoom-in-95 duration-200">
                            {pickerTab === 'MONTH' ? (
                              <div className="grid grid-cols-3 gap-2">
                                {months.map((m, i) => (
                                  <button key={m} type="button" onClick={() => { setViewDate(new Date(viewDate.getFullYear(), i, 1)); setShowMonthYearPicker(false); }} className={`px-2 py-3 rounded-xl text-[10px] font-black ${viewDate.getMonth() === i ? 'bg-indigo-500 text-white' : 'hover:bg-slate-50 text-black'}`}>{m.substring(0,3)}</button>
                                ))}
                              </div>
                            ) : (
                              <div className="grid grid-cols-4 gap-2 h-48 overflow-y-auto no-scrollbar py-2">
                                {years.map(y => (
                                  <button key={y} type="button" onClick={() => { setViewDate(new Date(y, viewDate.getMonth(), 1)); setShowMonthYearPicker(false); }} className={`px-2 py-3 rounded-xl text-[10px] font-black ${viewDate.getFullYear() === y ? 'bg-black text-white' : 'hover:bg-slate-50 text-black'}`}>{y}</button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                    <div className="grid grid-cols-7 gap-1 mb-4">
                        {['S','M','T','W','T','F','S'].map(d => <div key={d} className="text-center text-[8px] font-black text-black">{d}</div>)}
                        {getCalendarDays().map((d, i) => {
                          const dateStr = d ? d.toISOString().split('T')[0] : '';
                          const isSel = d && presDate === dateStr;
                          return (
                            <button key={i} type="button" disabled={!d} onClick={() => d && setPresDate(dateStr)} className={`w-9 h-9 rounded-xl text-[10px] font-black flex items-center justify-center transition-all ${isSel ? 'bg-indigo-500 text-white shadow-lg' : d ? 'hover:bg-white text-black' : 'opacity-0'}`}>
                              {d ? d.getDate() : ''}
                            </button>
                          );
                        })}
                    </div>
                    <p className="text-center mt-6 text-[9px] font-black text-black uppercase tracking-widest">Scheduled: {new Date(presDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                )}

                {/* Dual Dial Clock Pickers for Presentation */}
                {showPresClock && (
                  <div className="bg-slate-50 rounded-[40px] border border-slate-200 p-8 animate-in slide-in-from-top-2 duration-300 mt-4">
                    <div className="grid grid-cols-2 gap-6 mt-4">
                        <div className="space-y-3">
                           <div className="flex justify-between items-center px-4">
                            <label className="text-[8px] font-black uppercase text-black">Hour</label>
                            <input 
                              type="number" 
                              className="w-12 text-xl font-black text-center bg-transparent text-black border-b border-slate-300 outline-none focus:border-indigo-600"
                              value={presTempHour}
                              onChange={(e) => handleManualTimeChange(e.target.value, 'hour', 'pres')}
                             />
                           </div>
                           <div ref={presClockRef} onMouseDown={(e) => { setClockMode('hours'); handleClockInteraction(e, 'pres'); }} onMouseMove={(e) => e.buttons === 1 && handleClockInteraction(e, 'pres')} onTouchMove={(e) => handleClockInteraction(e, 'pres')} className="relative w-32 h-32 bg-white rounded-full mx-auto border-2 border-slate-100 flex items-center justify-center cursor-crosshair">
                              <div className="absolute w-1 bg-indigo-500 origin-bottom" style={{ height: '40%', bottom: '50%', transform: `rotate(${presTempHour * 30}deg)` }} />
                              {[12,3,6,9].map(h => <div key={h} className="absolute text-[8px] font-black text-black" style={{ transform: `translate(${Math.sin(h*30*Math.PI/180)*50}px, ${-Math.cos(h*30*Math.PI/180)*50}px)` }}>{h}</div>)}
                           </div>
                        </div>
                        <div className="space-y-3">
                           <div className="flex justify-between items-center px-4">
                            <label className="text-[8px] font-black uppercase text-black">Minute</label>
                            <input 
                              type="number" 
                              className="w-12 text-xl font-black text-center bg-transparent text-black border-b border-slate-300 outline-none focus:border-indigo-600"
                              value={presTempMinute}
                              onChange={(e) => handleManualTimeChange(e.target.value, 'minute', 'pres')}
                             />
                           </div>
                           <div onMouseDown={(e) => { setClockMode('minutes'); handleClockInteraction(e, 'pres'); }} onMouseMove={(e) => e.buttons === 1 && handleClockInteraction(e, 'pres')} onTouchMove={(e) => handleClockInteraction(e, 'pres')} className="relative w-32 h-32 bg-white rounded-full mx-auto border-2 border-slate-100 flex items-center justify-center cursor-crosshair">
                              <div className="absolute w-1 bg-indigo-500 origin-bottom" style={{ height: '40%', bottom: '50%', transform: `rotate(${presTempMinute * 6}deg)` }} />
                              {/* Fix: use 'm' as loop variable instead of undefined 'h' */}
                              {[0,15,30,45].map(m => <div key={m} className="absolute text-[8px] font-black text-black" style={{ transform: `translate(${Math.sin(m*6*Math.PI/180)*50}px, ${-Math.cos(m*6*Math.PI/180)*50}px)` }}>{m}</div>)}
                           </div>
                        </div>
                    </div>
                    <div className="mt-8 flex justify-center gap-2">
                        <button type="button" onClick={() => setPresTempPeriod('AM')} className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all ${presTempPeriod === 'AM' ? 'bg-indigo-500 text-white shadow-lg' : 'bg-white border border-slate-200 text-black'}`}>AM</button>
                        <button type="button" onClick={() => setPresTempPeriod('PM')} className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all ${presTempPeriod === 'PM' ? 'bg-indigo-500 text-white shadow-lg' : 'bg-white border border-slate-200 text-black'}`}>PM</button>
                    </div>
                    <p className="text-center mt-6 text-[9px] font-black text-black uppercase tracking-widest">At {presTempHour}:{presTempMinute.toString().padStart(2,'0')} {presTempPeriod}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setEditingBatch(null)} className="flex-1 py-5 bg-slate-100 text-black rounded-3xl font-black uppercase text-[10px]">Close</button>
                <button type="submit" className="flex-2 py-5 bg-[#00966d] text-white rounded-3xl font-black uppercase text-[10px] shadow-xl">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ALERT MODAL */}
      {showPresentationAlert && selectedPresentationBatch && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
           <div className="bg-white rounded-[40px] w-full max-w-xl p-10 shadow-2xl animate-in zoom-in duration-300">
              {isPostponing ? (
                <div className="space-y-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-black text-black uppercase">Postpone Session</h3>
                    <button onClick={() => setIsPostponing(false)} className="p-2 bg-slate-50 rounded-full"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
                  </div>
                  
                  <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-200">
                    <p className="text-[9px] font-black text-black uppercase tracking-widest mb-4 opacity-40">Select New Date</p>
                    <div className="grid grid-cols-7 gap-1">
                      {getCalendarDays(viewDate).map((d, i) => {
                        const dateStr = d ? d.toISOString().split('T')[0] : '';
                        return (
                          <button 
                            key={i} 
                            disabled={!d}
                            onClick={() => d && setPostponeDate(dateStr)}
                            className={`w-8 h-8 rounded-lg text-[9px] font-black flex items-center justify-center ${d && postponeDate === dateStr ? 'bg-indigo-500 text-white' : d ? 'hover:bg-white text-black' : 'opacity-0'}`}
                          >
                            {d ? d.getDate() : ''}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-200">
                    <p className="text-[9px] font-black text-black uppercase tracking-widest mb-4 opacity-40">Select New Time</p>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[8px] font-black uppercase text-center block">Hour: {presTempHour}</label>
                          <div ref={presClockRef} onMouseDown={(e) => { setClockMode('hours'); handleClockInteraction(e, 'pres'); }} className="relative w-24 h-24 bg-white rounded-full mx-auto border-2 border-slate-100 cursor-crosshair">
                             <div className="absolute w-1 bg-indigo-500 origin-bottom" style={{ height: '40%', bottom: '50%', transform: `rotate(${presTempHour * 30}deg)`, left: 'calc(50% - 2px)' }} />
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[8px] font-black uppercase text-center block">Min: {presTempMinute}</label>
                          <div onMouseDown={(e) => { setClockMode('minutes'); handleClockInteraction(e, 'pres'); }} className="relative w-24 h-24 bg-white rounded-full mx-auto border-2 border-slate-100 cursor-crosshair">
                             <div className="absolute w-1 bg-indigo-500 origin-bottom" style={{ height: '40%', bottom: '50%', transform: `rotate(${presTempMinute * 6}deg)`, left: 'calc(50% - 2px)' }} />
                          </div>
                       </div>
                    </div>
                    <div className="flex justify-center gap-2 mt-4">
                      {['AM','PM'].map(p => (
                        <button key={p} onClick={() => setPresTempPeriod(p as any)} className={`px-4 py-2 rounded-xl text-[9px] font-black ${presTempPeriod === p ? 'bg-indigo-500 text-white' : 'bg-white border border-slate-200 text-black'}`}>{p}</button>
                      ))}
                    </div>
                  </div>

                  <button onClick={confirmPostpone} className="w-full py-5 bg-[#00966d] text-white rounded-3xl font-black uppercase text-[10px] shadow-xl">Confirm Postpone</button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4 mb-8">
                     <div className="w-14 h-14 bg-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-lg"><svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg></div>
                     <div>
                       <h3 className="text-2xl font-black text-black uppercase">Session Goals</h3>
                       <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                         {selectedPresentationBatch.name} • {selectedPresentationBatch.presentationViewed ? 'COMPLETED' : 'PENDING'}
                       </p>
                     </div>
                  </div>
                  
                  <div className="bg-slate-50 rounded-[32px] p-8 mb-8 max-h-[40vh] overflow-y-auto space-y-4">
                    {selectedPresentationBatch.presentation?.split('\n').map((goal, i) => (
                      <div key={i} className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-slate-100">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mt-1 flex-shrink-0">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
                        </div>
                        <p className="text-black text-lg font-black leading-relaxed">{goal}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                     <button onClick={toggleSessionCompletion} className={`py-5 text-white rounded-3xl font-black uppercase text-[9px] shadow-xl transition-all ${selectedPresentationBatch.presentationViewed ? 'bg-orange-500' : 'bg-[#00966d]'}`}>
                        {selectedPresentationBatch.presentationViewed ? 'Uncomplete' : 'Complete'}
                     </button>
                     <button onClick={() => setIsPostponing(true)} className="py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase text-[9px] shadow-xl">Postpone</button>
                     <button onClick={() => setShowPresentationAlert(false)} className="py-5 bg-slate-100 text-black rounded-3xl font-black uppercase text-[9px]">Close</button>
                  </div>
                </>
              )}
           </div>
        </div>
      )}

      {/* HISTORY MODAL */}
      {showHistoryModal && selectedPresentationBatch && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
           <div className="bg-white rounded-[40px] w-full max-w-2xl p-10 shadow-2xl animate-in zoom-in duration-300 border border-slate-100 flex flex-col max-h-[85vh]">
              <div className="flex justify-between items-start mb-10">
                 <div><h3 className="text-3xl font-black text-black uppercase tracking-tight">Batch History</h3><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{selectedPresentationBatch.name} • {selectedPresentationBatch.presentationHistory?.length || 0} Records</p></div>
                 <button onClick={() => setShowHistoryModal(false)} className="p-3 bg-slate-50 rounded-full text-black"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                 {selectedPresentationBatch.presentationHistory?.slice().reverse().map((entry, idx) => (
                   <div key={idx} className="p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                      <div className="flex items-center gap-3 mb-4">
                         <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg></div>
                         <p className="text-[9px] font-black text-black uppercase tracking-widest">Completed on {new Date(entry.dateCompleted).toLocaleDateString()} at {entry.completedAt}</p>
                      </div>
                      <p className="text-black font-black text-sm whitespace-pre-wrap italic">"{entry.noteContent}"</p>
                   </div>
                 ))}
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="mt-8 w-full py-5 bg-black text-white rounded-[32px] font-black uppercase text-[10px] tracking-widest">Done Viewing</button>
           </div>
        </div>
      )}

      {/* DUE MODAL - Optimized List Layout */}
      {showDueModal && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl flex items-end md:items-center justify-center z-[100] p-0 md:p-6">
          <div className="bg-white rounded-t-[48px] md:rounded-[48px] w-full max-w-2xl h-[94vh] md:h-auto md:max-h-[88vh] p-8 md:p-12 shadow-2xl flex flex-col border border-slate-100 animate-in slide-in-from-bottom duration-500">
            <div className="flex justify-between items-start mb-10">
              <div>
                <h3 className="text-3xl font-black text-black leading-none">Collection Center</h3>
                <p className="text-[10px] font-black text-rose-500 uppercase tracking-[3px] mt-3 bg-rose-50 inline-block px-3 py-1 rounded-full border border-rose-100">Pending Dues Detected</p>
              </div>
              <button onClick={() => setShowDueModal(false)} className="p-4 bg-slate-50 rounded-2xl text-black hover:bg-slate-100 transition-all active:scale-90 shadow-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 space-y-4 pr-3 custom-scrollbar">
              {studentsWithDue.length === 0 ? (
                <div className="py-24 text-center">
                  <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-[32px] flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                  </div>
                  <p className="text-black text-xl font-black uppercase tracking-widest opacity-20">All accounts cleared!</p>
                </div>
              ) : (
                studentsWithDue.map(s => (
                  <div key={s.id} className="p-6 md:p-8 bg-[#fdfdfd] rounded-[36px] border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group hover:bg-white hover:shadow-xl hover:border-emerald-100 transition-all duration-300">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-black group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">{s.name.charAt(0)}</div>
                        <h4 className="font-black text-xl text-black truncate leading-none">{s.name}</h4>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-xl text-[8px] font-black uppercase tracking-widest">{s.batchName}</span>
                        <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-xl text-[8px] font-black uppercase tracking-widest">R: {s.roll}</span>
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-xl text-[8px] font-black uppercase tracking-widest border border-emerald-100">{s.presenceCount} Present</span>
                      </div>
                      <div className="p-3 bg-rose-50/50 rounded-2xl border border-rose-100/50">
                        <p className="text-[9px] font-bold text-rose-500 uppercase tracking-widest leading-relaxed">Due: {s.unpaidMonths.join(', ')}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between md:justify-end gap-5 w-full md:w-auto border-t md:border-t-0 pt-6 md:pt-0">
                      <div className="text-left md:text-right">
                        <p className="text-3xl font-black text-rose-600 leading-none">{s.dueAmount}৳</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">{s.unpaidMonths.length} Months Total</p>
                      </div>
                      <div className="flex gap-3">
                        <a href={`tel:${s.phone}`} className="w-14 h-14 bg-emerald-500 text-white rounded-[24px] flex items-center justify-center shadow-lg shadow-emerald-100 hover:scale-110 active:scale-90 transition-all">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        </a>
                        <button onClick={() => handleDueSms(s)} className="w-14 h-14 bg-indigo-600 text-white rounded-[24px] flex items-center justify-center shadow-lg shadow-indigo-100 hover:scale-110 active:scale-90 transition-all">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <button onClick={() => setShowDueModal(false)} className="mt-10 w-full py-6 bg-black text-white rounded-[32px] font-black uppercase text-xs tracking-[4px] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all">Close Collection Board</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
