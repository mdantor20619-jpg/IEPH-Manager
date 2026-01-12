
import React, { useState } from 'react';
import { Batch, Student } from '../types';

interface BatchManagerProps {
  batches: Batch[];
  batchId: string | null;
  setBatches: React.Dispatch<React.SetStateAction<Batch[]>>;
  onSelectStudent: (id: string) => void;
  onBack: () => void;
  globalFee: number;
  activeTab: 'FEES' | 'ATTENDANCE' | 'FINES';
  setActiveTab: (tab: 'FEES' | 'ATTENDANCE' | 'FINES') => void;
}

const BatchManager: React.FC<BatchManagerProps> = ({ batches, batchId, setBatches, onSelectStudent, onBack, globalFee, activeTab, setActiveTab }) => {
  const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
  const years = Array.from({ length: 31 }, (_, i) => 2020 + i);
  
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showSuspended, setShowSuspended] = useState(false);
  const [newStudent, setNewStudent] = useState({ 
    name: '', 
    roll: '', 
    phone: '', 
    admissionDate: new Date().toISOString().split('T')[0],
    admissionMonth: months[new Date().getMonth()] 
  });
  
  const [showAdmissionCalendar, setShowAdmissionCalendar] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);
  const [pickerTab, setPickerTab] = useState<'MONTH' | 'YEAR'>('MONTH');

  const [fineModal, setFineModal] = useState<{ studentId: string; studentName: string } | null>(null);
  const [manageFineModal, setManageFineModal] = useState<{ studentId: string; studentName: string; amount: number; isPaid: boolean } | null>(null);
  const [customFine, setCustomFine] = useState<string>('10');
  
  const batch = batches.find(b => b.id === batchId);
  if (!batch) return null;

  const activeStudents = batch.students.filter(s => s.status === 'ACTIVE');
  const suspendedStudents = batch.students.filter(s => s.status === 'SUSPENDED');
  
  const todayDate = new Date().toISOString().split('T')[0];
  const currentMonthIndex = new Date().getMonth();
  const todayDayShort = new Date().toLocaleString('en-US', { weekday: 'short' }).toUpperCase();

  const isClassToday = batch.days.includes(todayDayShort);

  const updateStudents = (updater: (s: Student) => Student) => {
    setBatches(prev => prev.map(b => b.id === batchId ? { ...b, students: b.students.map(updater) } : b));
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const student: Student = {
      id: Math.random().toString(36).substr(2, 9),
      name: newStudent.name,
      roll: newStudent.roll,
      phone: newStudent.phone,
      admissionDate: newStudent.admissionDate,
      admissionMonth: months[new Date(newStudent.admissionDate).getMonth()],
      status: 'ACTIVE',
      fees: {},
      attendance: {},
      fines: {}
    };
    setBatches(prev => prev.map(b => b.id === batchId ? { ...b, students: [...b.students, student] } : b));
    setIsAddingStudent(false);
    setNewStudent({ name: '', roll: '', phone: '', admissionDate: new Date().toISOString().split('T')[0], admissionMonth: months[new Date().getMonth()] });
  };

  const handleUpdateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    const updatedStudent = {
      ...editingStudent,
      admissionMonth: months[new Date(editingStudent.admissionDate).getMonth()]
    };
    updateStudents(s => s.id === editingStudent.id ? updatedStudent : s);
    setEditingStudent(null);
  };

  const toggleStudentStatus = (studentId: string, current: string) => {
    const next = current === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    updateStudents(s => s.id === studentId ? { ...s, status: next as any } : s);
    setEditingStudent(null);
  };

  const setAttendanceStatus = (e: React.MouseEvent, studentId: string, status: 'PRESENT' | 'ABSENT') => {
    e.stopPropagation();
    if (!isClassToday) return;
    
    updateStudents(s => {
      if (s.id !== studentId) return s;
      const currentAtt = s.attendance?.[todayDate];
      const nextAtt = currentAtt === status ? undefined : status;
      return { ...s, attendance: { ...(s.attendance || {}), [todayDate]: nextAtt as any } };
    });

    if (status === 'ABSENT') {
      const target = batch.students.find(st => st.id === studentId);
      if (target && target.attendance?.[todayDate] !== 'ABSENT') {
        setFineModal({ studentId: target.id, studentName: target.name });
      }
    }
  };

  const applyFine = () => {
    if (!fineModal) return;
    const amount = parseInt(customFine) || 0;
    updateStudents(s => s.id === fineModal.studentId ? { ...s, fines: { ...(s.fines || {}), [todayDate]: amount } } : s);
    setFineModal(null);
    setCustomFine('10');
  };

  const toggleFinePaid = (studentId: string) => {
    updateStudents(s => {
      if (s.id !== studentId) return s;
      const currentVal = s.fines?.[todayDate] || 0;
      const nextVal = currentVal > 0 ? -currentVal : Math.abs(currentVal);
      return { ...s, fines: { ...(s.fines || {}), [todayDate]: nextVal } };
    });
    setManageFineModal(null);
  };

  const removeFine = (studentId: string) => {
    updateStudents(s => {
      if (s.id !== studentId) return s;
      const newFines = { ...(s.fines || {}) };
      delete newFines[todayDate];
      return { ...s, fines: newFines };
    });
    setManageFineModal(null);
  };

  const getAttendanceSummary = (student: Student) => {
    const values = Object.values(student.attendance || {});
    return { 
      present: values.filter(v => v === 'PRESENT').length, 
      absent: values.filter(v => v === 'ABSENT').length 
    };
  };

  const getHonoriumSummary = (student: Student) => {
    const admMonthIdx = months.indexOf(student.admissionMonth || 'JANUARY');
    if (admMonthIdx === -1) return { collected: 0, due: 0 };
    const relevantMonths = months.slice(admMonthIdx, currentMonthIndex + 1);
    const collected = relevantMonths.filter(m => student.fees[m]).length;
    const due = relevantMonths.length - collected;
    return { collected, due };
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

  const finedStudents = activeStudents.filter(s => s.fines?.[todayDate] !== undefined);
  const totalPaidCount = finedStudents.filter(s => (s.fines?.[todayDate] || 0) < 0).length;
  const totalUnpaidCount = finedStudents.length - totalPaidCount;
  const totalCollectedAmount = finedStudents.reduce((acc, s) => {
    const val = s.fines?.[todayDate] || 0;
    return val < 0 ? acc + Math.abs(val) : acc;
  }, 0);

  const baseList = showSuspended ? suspendedStudents : activeStudents;
  const displayedStudents = baseList.filter(student => {
    if (activeTab === 'FINES') return student.fines?.[todayDate] !== undefined;
    return true;
  }).sort((a, b) => {
    if (activeTab !== 'FINES') return 0;
    const valA = a.fines?.[todayDate] || 0;
    const valB = b.fines?.[todayDate] || 0;
    const isPaidA = valA < 0;
    const isPaidB = valB < 0;
    return (isPaidA === isPaidB) ? 0 : isPaidA ? 1 : -1;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2.5 bg-white rounded-xl border border-slate-100 text-black">←</button>
          <div className="overflow-hidden">
            <h2 className="text-xl md:text-2xl font-black text-black truncate">{batch.name}</h2>
            <p className="text-[8px] md:text-[10px] font-bold text-black uppercase tracking-widest opacity-60">
              {batch.className}
            </p>
          </div>
        </div>
        <button onClick={() => setIsAddingStudent(true)} className="p-3 bg-[#00966d] text-white rounded-xl shadow-lg">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
        </button>
      </div>

      <div className="bg-white rounded-2xl md:rounded-[32px] p-1.5 flex gap-1 border border-slate-100 mb-4 overflow-x-auto no-scrollbar shadow-sm">
        <button onClick={() => setActiveTab('ATTENDANCE')} className={`flex-1 min-w-[100px] px-4 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${activeTab === 'ATTENDANCE' ? 'bg-[#00966d] text-white shadow-md' : 'text-black opacity-40'}`}>Presence</button>
        <button onClick={() => setActiveTab('FEES')} className={`flex-1 min-w-[100px] px-4 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${activeTab === 'FEES' ? 'bg-[#00966d] text-white shadow-md' : 'text-black opacity-40'}`}>Honorium</button>
        <button onClick={() => setActiveTab('FINES')} className={`flex-1 min-w-[100px] px-4 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${activeTab === 'FINES' ? 'bg-orange-500 text-white shadow-md' : 'text-black opacity-40'}`}>Fines</button>
      </div>

      <div className="flex justify-end mb-4 px-2">
        {suspendedStudents.length > 0 && (
          <button 
            onClick={() => setShowSuspended(!showSuspended)}
            className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-colors"
          >
            {showSuspended ? '← Back to Active' : `View Offline Students (${suspendedStudents.length})`}
          </button>
        )}
      </div>

      {activeTab === 'FINES' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-100">
            <p className="text-[8px] font-black text-black opacity-30 uppercase tracking-widest">Total Fined</p>
            <p className="text-lg font-black text-black">{finedStudents.length}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100">
            <p className="text-[8px] font-black text-emerald-600 opacity-60 uppercase tracking-widest">Paid</p>
            <p className="text-lg font-black text-emerald-600">{totalPaidCount}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100">
            <p className="text-[8px] font-black text-rose-600 opacity-60 uppercase tracking-widest">Pending</p>
            <p className="text-lg font-black text-rose-600">{totalUnpaidCount}</p>
          </div>
          <div className="bg-orange-500 p-4 rounded-2xl shadow-lg shadow-orange-100">
            <p className="text-[8px] font-black text-white opacity-80 uppercase tracking-widest">Collected</p>
            <p className="text-lg font-black text-white">{totalCollectedAmount}৳</p>
          </div>
        </div>
      )}

      <div className="space-y-3 pb-12">
        {displayedStudents.map(student => {
          const att = student.attendance?.[todayDate];
          const rawFine = student.fines?.[todayDate] || 0;
          const isPaid = rawFine < 0;
          const fineAmount = Math.abs(rawFine);
          const { present, absent } = getAttendanceSummary(student);
          const { collected, due } = getHonoriumSummary(student);
          
          const handleStudentClick = () => {
            if (activeTab === 'FINES') {
              setManageFineModal({ studentId: student.id, studentName: student.name, amount: fineAmount, isPaid });
            } else if (activeTab === 'FEES') {
              onSelectStudent(student.id);
            }
          };

          return (
            <div 
              key={student.id} 
              onClick={handleStudentClick} 
              className={`p-4 md:p-6 bg-white border border-slate-100 rounded-[24px] md:rounded-[32px] flex items-center gap-4 cursor-pointer hover:shadow-lg transition-all active:scale-[0.98] ${student.status === 'SUSPENDED' ? 'opacity-40 grayscale' : ''} ${activeTab === 'FINES' && isPaid ? 'opacity-60 grayscale-[0.5]' : ''}`}
            >
              <div className={`w-11 h-11 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-lg transition-colors ${activeTab === 'ATTENDANCE' ? (att === 'PRESENT' ? 'bg-emerald-500 text-white' : att === 'ABSENT' ? 'bg-rose-500 text-white' : 'bg-slate-100 text-black') : 'bg-slate-100 text-black'}`}>{student.name.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h4 className="font-black text-black text-sm md:text-base truncate">{student.name}</h4>
                  {student.status === 'SUSPENDED' && <span className="text-[6px] font-black uppercase text-rose-500 border border-rose-100 bg-rose-50 px-1 py-0.5 rounded ml-2">Offline</span>}
                </div>
                <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-1">
                  <span className="text-[8px] text-black font-black uppercase opacity-30">R: {student.roll}</span>
                  {activeTab !== 'FEES' ? (
                    <>
                      <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">P: {present}</span>
                      <span className="text-[8px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">A: {absent}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Collected: {collected}</span>
                      <span className="text-[8px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">Due: {due}</span>
                    </>
                  )}
                  {fineAmount > 0 && (
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                      {isPaid ? 'Paid: ' : 'Fine: '}{fineAmount}৳
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {activeTab === 'ATTENDANCE' && student.status === 'ACTIVE' && (
                  <div className={`flex gap-1.5 ${!isClassToday ? 'opacity-20 cursor-not-allowed' : ''}`}>
                    <button 
                      disabled={!isClassToday}
                      onClick={(e) => setAttendanceStatus(e, student.id, 'PRESENT')} 
                      className={`w-10 h-10 rounded-xl font-black text-xs transition-all flex items-center justify-center ${att === 'PRESENT' ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-50 text-black active:bg-emerald-100'}`}
                    >P</button>
                    <button 
                      disabled={!isClassToday}
                      onClick={(e) => setAttendanceStatus(e, student.id, 'ABSENT')} 
                      className={`w-10 h-10 rounded-xl font-black text-xs transition-all flex items-center justify-center ${att === 'ABSENT' ? 'bg-rose-500 text-white shadow-md' : 'bg-slate-50 text-black active:bg-rose-100'}`}
                    >A</button>
                  </div>
                )}
                
                {activeTab === 'FEES' && (
                  <button onClick={(e) => { e.stopPropagation(); onSelectStudent(student.id); }} className="p-2.5 bg-emerald-50 text-[#00966d] rounded-xl hover:bg-emerald-100 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                  </button>
                )}

                {activeTab === 'ATTENDANCE' && (
                   <button onClick={(e) => { e.stopPropagation(); setEditingStudent(student); setViewDate(new Date(student.admissionDate)); }} className="p-2.5 text-black opacity-20 hover:opacity-100">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                   </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isAddingStudent && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-end md:items-center justify-center z-[70] p-0 md:p-4">
          <div className="bg-white rounded-t-[40px] md:rounded-[40px] w-full max-w-md p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <h3 className="text-2xl font-black text-black mb-6">New Student</h3>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <input required placeholder="Full Name" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-black font-black" />
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="Roll" value={newStudent.roll} onChange={e => setNewStudent({...newStudent, roll: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-black font-black" />
                <input required placeholder="Phone" value={newStudent.phone} onChange={e => setNewStudent({...newStudent, phone: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-black font-black" />
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center px-4">
                  <label className="text-[10px] font-black text-black uppercase tracking-[3px]">Start Date: {newStudent.admissionDate}</label>
                  <button type="button" aria-label="Open calendar" onClick={() => setShowAdmissionCalendar(!showAdmissionCalendar)} className={`p-2 rounded-lg transition-colors ${showAdmissionCalendar ? 'bg-[#e6f4f0] text-[#00966d]' : 'bg-slate-100 text-slate-400'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </button>
                </div>
                
                {showAdmissionCalendar && (
                  <div className="bg-slate-50 rounded-[40px] border border-slate-200 p-8 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex justify-between items-center mb-6 relative px-2">
                        <button type="button" onClick={() => changeMonth(-1)} className="p-2 hover:bg-white rounded-xl transition-all text-black"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg></button>
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => { setPickerTab('MONTH'); setShowMonthYearPicker(!showMonthYearPicker); }} className={`text-sm font-black uppercase tracking-[2px] ${showMonthYearPicker && pickerTab === 'MONTH' ? 'text-[#00966d]' : 'text-black'}`}>{months[viewDate.getMonth()]}</button>
                          <button type="button" onClick={() => { setPickerTab('YEAR'); setShowMonthYearPicker(!showMonthYearPicker); }} className={`text-sm font-black uppercase tracking-[2px] ${showMonthYearPicker && pickerTab === 'YEAR' ? 'text-[#00966d]' : 'text-black'}`}>{viewDate.getFullYear()}</button>
                        </div>
                        <button type="button" onClick={() => changeMonth(1)} className="p-2 hover:bg-white rounded-xl transition-all text-black"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg></button>
                        
                        {showMonthYearPicker && (
                          <div className="absolute top-full left-1/2 -translate-x-1/2 bg-white p-4 rounded-3xl shadow-2xl border border-slate-100 z-50 w-full mt-2 animate-in zoom-in-95 duration-200">
                            {pickerTab === 'MONTH' ? (
                              <div className="grid grid-cols-3 gap-2">
                                {months.map((m, i) => (
                                  <button key={m} type="button" onClick={() => { setViewDate(new Date(viewDate.getFullYear(), i, 1)); setShowMonthYearPicker(false); }} className={`px-2 py-3 rounded-xl text-[10px] font-black ${viewDate.getMonth() === i ? 'bg-[#00966d] text-white' : 'hover:bg-slate-50 text-black'}`}>{m.substring(0,3)}</button>
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
                          const isSel = d && newStudent.admissionDate === dateStr;
                          return (
                            <button key={i} type="button" disabled={!d} onClick={() => d && setNewStudent({...newStudent, admissionDate: dateStr})} className={`w-9 h-9 rounded-xl text-[10px] font-black flex items-center justify-center transition-all ${isSel ? 'bg-[#00966d] text-white shadow-lg' : d ? 'hover:bg-white text-black' : 'opacity-0'}`}>
                              {d ? d.getDate() : ''}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsAddingStudent(false)} className="flex-1 py-4 bg-slate-100 text-black rounded-2xl font-black uppercase text-[10px]">Cancel</button>
                <button type="submit" className="flex-2 py-4 bg-[#00966d] text-white rounded-2xl font-black uppercase text-[10px] shadow-lg">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {manageFineModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
          <div className="bg-white rounded-[40px] w-full max-sm p-8 shadow-2xl border border-slate-200 animate-in zoom-in duration-300">
            <div className="flex justify-between items-start mb-6">
              <div className="text-left">
                <h3 className="text-2xl font-black text-black">Manage Fine</h3>
                <p className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest">{manageFineModal.studentName}</p>
              </div>
              <button onClick={() => setManageFineModal(null)} className="p-2 bg-slate-100 rounded-full text-black">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="bg-slate-50 p-6 rounded-3xl text-center mb-6">
              <p className="text-[10px] font-black text-black opacity-30 uppercase mb-1">Fine Amount</p>
              <p className="text-4xl font-black text-black">{manageFineModal.amount}৳</p>
              <div className={`mt-4 inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase ${manageFineModal.isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {manageFineModal.isPaid ? 'Status: Paid' : 'Status: Unpaid'}
              </div>
            </div>
            <div className="space-y-3">
              <button onClick={() => toggleFinePaid(manageFineModal.studentId)} className={`w-full py-4 rounded-2xl font-black uppercase text-[10px] shadow-md transition-all active:scale-95 ${manageFineModal.isPaid ? 'bg-rose-50 text-rose-600' : 'bg-emerald-500 text-white'}`}>
                {manageFineModal.isPaid ? 'Mark as Unpaid' : 'Mark as Paid'}
              </button>
              <button onClick={() => removeFine(manageFineModal.studentId)} className="w-full py-4 bg-white text-rose-500 border border-rose-100 rounded-2xl font-black uppercase text-[10px] hover:bg-rose-50 transition-all">Remove Fine Record</button>
            </div>
          </div>
        </div>
      )}

      {fineModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
          <div className="bg-white rounded-[40px] w-full max-sm p-8 shadow-2xl border border-slate-200 text-center animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-rose-100">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h3 className="text-2xl font-black text-black mb-2">Absent Record</h3>
            <p className="text-black text-[10px] mb-8 uppercase tracking-widest font-black opacity-40">{fineModal.studentName} is Marked Absent</p>
            <div className="mb-8">
              <label className="text-[10px] font-black text-black uppercase tracking-widest mb-4 block opacity-60">Apply Fine? (৳)</label>
              <input type="number" autoFocus value={customFine} onChange={e => setCustomFine(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-5 px-6 text-center text-4xl font-black text-black outline-none focus:border-[#00966d]" />
            </div>
            <div className="flex gap-4">
              <button onClick={() => setFineModal(null)} className="flex-1 py-4 bg-slate-100 text-black rounded-2xl font-black uppercase text-[10px]">Ignore</button>
              <button onClick={applyFine} className="flex-2 py-4 bg-orange-500 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg active:scale-95">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {editingStudent && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-[48px] w-full max-w-lg p-10 shadow-2xl animate-in zoom-in duration-300 border border-slate-200 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-start mb-8">
              <h3 className="text-3xl font-black text-black">Edit Student</h3>
              <button type="button" onClick={() => toggleStudentStatus(editingStudent.id, editingStudent.status)} className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${editingStudent.status === 'ACTIVE' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'}`}>{editingStudent.status === 'ACTIVE' ? 'Archive (Offline)' : 'Restore (Active)'}</button>
            </div>
            <form onSubmit={handleUpdateStudent} className="space-y-5">
              <input required value={editingStudent.name} onChange={e => setEditingStudent({...editingStudent, name: e.target.value})} className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none text-black font-black" />
              <div className="grid grid-cols-2 gap-4">
                <input required value={editingStudent.roll} onChange={e => setEditingStudent({...editingStudent, roll: e.target.value})} className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none text-black font-black" />
                <input required value={editingStudent.phone} onChange={e => setEditingStudent({...editingStudent, phone: e.target.value})} className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none text-black font-black" />
              </div>
              <div className="flex gap-4 mt-6">
                <button type="button" onClick={() => setEditingStudent(null)} className="flex-1 py-5 bg-slate-100 text-black rounded-3xl font-black uppercase text-[10px]">Cancel</button>
                <button type="submit" className="flex-2 py-5 bg-black text-white rounded-3xl font-black uppercase text-[10px] shadow-xl">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchManager;
