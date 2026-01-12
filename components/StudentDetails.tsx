
import React, { useState } from 'react';
import { Batch, Student } from '../types';

interface StudentDetailsProps {
  batches: Batch[];
  batchId: string | null;
  studentId: string | null;
  setBatches: React.Dispatch<React.SetStateAction<Batch[]>>;
  onBack: () => void;
  globalFee: number;
}

const StudentDetails: React.FC<StudentDetailsProps> = ({ batches, batchId, studentId, setBatches, onBack, globalFee }) => {
  const [showConfirmTerminate, setShowConfirmTerminate] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showYearPicker, setShowYearPicker] = useState(false);
  
  const batch = batches.find(b => b.id === batchId);
  const student = batch?.students.find(s => s.id === studentId);
  
  if (!batch || !student) return null;

  const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
  const currentYear = new Date().getFullYear();
  const currentMonthIdx = new Date().getMonth();
  const currentMonthName = months[currentMonthIdx];

  const calculateDetailedMetrics = () => {
    let totalCollectedCount = 0;
    let totalDueCount = 0;
    let dueMonthNames: string[] = [];
    
    const admissionDate = new Date(student.admissionDate);
    const admYear = admissionDate.getFullYear();
    const admMonth = admissionDate.getMonth();

    for (let y = 2020; y <= currentYear; y++) {
      for (let m = 0; m < 12; m++) {
        if (y === currentYear && m > currentMonthIdx) break;
        const feeKey = `${months[m]}_${y}`;
        const isAfterAdmission = (y > admYear || (y === admYear && m >= admMonth));
        if (isAfterAdmission) {
          if (student.fees[feeKey]) {
            totalCollectedCount++;
          } else {
            totalDueCount++;
            dueMonthNames.push(`${months[m].substring(0,3)} ${y}`);
          }
        }
      }
    }

    // Future advances
    for (const key in student.fees) {
      if (student.fees[key]) {
        const [mStr, yStr] = key.split('_');
        const yVal = parseInt(yStr);
        const mIdx = months.indexOf(mStr);
        if (yVal > currentYear || (yVal === currentYear && mIdx > currentMonthIdx)) {
          totalCollectedCount++;
        }
      }
    }

    return { totalCollectedCount, totalDueCount, dueMonthNames };
  };

  const { totalCollectedCount, totalDueCount, dueMonthNames } = calculateDetailedMetrics();

  const getAttendanceSummary = () => {
    const attendance = student.attendance || {};
    const dates = Object.keys(attendance);
    const currentMonthPrefix = `${currentYear}-${(currentMonthIdx + 1).toString().padStart(2, '0')}`;
    let present = 0; let absent = 0;
    dates.forEach(date => {
      if (date.startsWith(currentMonthPrefix)) {
        if (attendance[date] === 'PRESENT') present++;
        else if (attendance[date] === 'ABSENT') absent++;
      }
    });
    return { present, absent };
  };

  const sendSMS = (templateKey: string, replacements: { [key: string]: any }) => {
    let template = localStorage.getItem(templateKey);
    if (!template) {
       // Fallbacks if not in localStorage
       if (templateKey.includes('payment')) template = "IEPH: Payment of {amount}৳ received for {month} for student {name}. Thank you!";
       else if (templateKey.includes('due')) template = "Reminder: {name}, your total due is {due_amount}৳ for {months}. Please clear it soon.";
       else template = "IEPH Summary ({name}):\n- Paid: {paid_months} Months\n- Due: {due_months} Months ({due_amount}৳)\n- Attendance ({current_month}): {present} Present, {absent} Absent.";
    }

    let message = template;
    Object.keys(replacements).forEach(key => {
      message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), replacements[key]);
    });
    window.open(`sms:${student.phone}?body=${encodeURIComponent(message)}`);
  };

  const sendPaymentSMS = (month: string, amount: number) => {
    sendSMS('ieph_payment_sms_template', { amount, month, name: student.name });
  };

  const sendDueSMS = () => {
    sendSMS('ieph_due_sms_template', {
      name: student.name,
      due_amount: totalDueCount * globalFee,
      months: dueMonthNames.join(', ')
    });
  };

  const sendSummarySMS = () => {
    const { present, absent } = getAttendanceSummary();
    sendSMS('ieph_summary_sms_template', {
      name: student.name,
      paid_months: totalCollectedCount,
      due_months: totalDueCount,
      due_amount: totalDueCount * globalFee,
      current_month: currentMonthName,
      present,
      absent
    });
  };

  const toggleFee = (month: string, year: number) => {
    const feeKey = `${month}_${year}`;
    let justMarkedAsPaid = false;
    setBatches(prev => prev.map(b => {
      if (b.id !== batchId) return b;
      return {
        ...b,
        students: b.students.map(s => {
          if (s.id !== studentId) return s;
          const willBePaid = !s.fees[feeKey];
          if (willBePaid) justMarkedAsPaid = true;
          return { ...s, fees: { ...s.fees, [feeKey]: willBePaid } };
        })
      };
    }));
    if (justMarkedAsPaid) {
      setTimeout(() => sendPaymentSMS(month, globalFee), 100);
    }
  };

  const getStatus = (monthIdx: number, year: number) => {
    const feeKey = `${months[monthIdx]}_${year}`;
    if (student.fees[feeKey]) return 'PAID';
    if (year > currentYear || (year === currentYear && monthIdx > currentMonthIdx)) return 'ADVANCE';
    const admissionDate = new Date(student.admissionDate);
    if (year < admissionDate.getFullYear() || (year === admissionDate.getFullYear() && monthIdx < admissionDate.getMonth())) return 'BEFORE_ADMISSION';
    return 'DUE';
  };

  return (
    <div className="animate-in fade-in duration-500 pb-24 px-1">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2.5 bg-white border border-slate-100 rounded-xl text-black">←</button>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl bg-emerald-50 text-[#00966d]">{student.name.charAt(0)}</div>
        <div className="min-w-0">
           <h2 className="text-xl font-black text-black truncate">{student.name}</h2>
           <p className="text-[9px] text-black font-bold uppercase tracking-widest opacity-40 truncate">R:{student.roll} • Adm: {new Date(student.admissionDate).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-[#1a1c1e] text-white p-6 rounded-[32px] border border-slate-800 shadow-xl">
          <p className="text-slate-500 text-[8px] font-black uppercase tracking-[2px] mb-1">Total Collected</p>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-black text-emerald-400">{totalCollectedCount * globalFee}৳</p>
            <p className="text-slate-500 text-[9px] font-bold mb-1 opacity-60">({totalCollectedCount} MO)</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm cursor-pointer" onClick={sendDueSMS}>
          <p className="text-black opacity-30 text-[8px] font-black uppercase tracking-[2px] mb-1">Total Due (Send SMS)</p>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-black text-rose-500">{totalDueCount * globalFee}৳</p>
            <p className="text-black opacity-20 text-[9px] font-bold mb-1">({totalDueCount} MO)</p>
          </div>
        </div>
      </div>

      <div className="relative mb-4">
        <button onClick={() => setShowYearPicker(!showYearPicker)} className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2">
          <span>Selected Year: {selectedYear}</span>
          <svg className={`w-4 h-4 transition-transform ${showYearPicker ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
        </button>
        {showYearPicker && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-3xl shadow-2xl z-50 p-4 max-h-64 overflow-y-auto grid grid-cols-3 gap-2">
            {Array.from({ length: 31 }, (_, i) => 2020 + i).map(y => (
              <button key={y} onClick={() => { setSelectedYear(y); setShowYearPicker(false); }} className={`py-3 rounded-xl text-[10px] font-black uppercase ${selectedYear === y ? 'bg-[#00966d] text-white' : 'hover:bg-slate-50 text-slate-400'}`}>{y}</button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {months.map((m, idx) => {
          const status = getStatus(idx, selectedYear);
          const feeKey = `${m}_${selectedYear}`;
          const isPaid = student.fees[feeKey];
          return (
            <button key={m} disabled={status === 'BEFORE_ADMISSION'} onClick={() => toggleFee(m, selectedYear)} className={`p-5 rounded-[28px] border transition-all text-center flex flex-col items-center justify-center gap-1 active:scale-95 ${status === 'BEFORE_ADMISSION' ? 'opacity-20 cursor-not-allowed' : isPaid ? 'bg-emerald-50 border-emerald-200 text-[#00966d]' : 'bg-white border-slate-200 text-black shadow-sm'}`}>
              <span className={`text-[8px] font-black uppercase tracking-tighter ${isPaid ? 'text-[#00966d]' : 'opacity-40'}`}>{m}</span>
              <span className="text-base font-black">{globalFee}৳</span>
              <div className={`text-[7px] font-black uppercase px-2 py-0.5 rounded mt-1 ${isPaid ? 'bg-emerald-100 text-emerald-700' : status === 'DUE' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 opacity-60'}`}>{isPaid ? 'Paid' : status === 'ADVANCE' ? 'Advance' : 'Due'}</div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <button onClick={sendSummarySMS} className="py-5 bg-indigo-600 text-white rounded-[28px] font-black uppercase tracking-widest text-[10px] shadow-lg">Send Summary SMS</button>
        <div className="grid grid-cols-2 gap-3">
          <a href={`tel:${student.phone}`} className="py-5 bg-[#00966d] text-white rounded-[28px] font-black uppercase tracking-widest text-center text-[10px] shadow-lg">Call Student</a>
          <button onClick={() => setShowConfirmTerminate(true)} className="py-5 bg-slate-50 text-slate-400 rounded-[28px] font-black uppercase tracking-widest text-center text-[10px] border border-slate-100">Archive Record</button>
        </div>
      </div>

      {showConfirmTerminate && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[40px] w-full max-w-sm p-10 shadow-2xl text-center">
            <h3 className="text-2xl font-black text-black mb-2">Archive Student?</h3>
            <p className="text-sm font-medium text-slate-400 mb-8">This student will be moved to the offline section of the batch.</p>
            <div className="flex gap-4">
              <button onClick={() => setShowConfirmTerminate(false)} className="flex-1 py-4 bg-slate-100 text-black rounded-2xl font-black uppercase text-[10px]">Cancel</button>
              <button onClick={() => { setBatches(prev => prev.map(b => b.id === batchId ? { ...b, students: b.students.map(s => s.id === studentId ? { ...s, status: 'SUSPENDED' } : s) } : b)); onBack(); }} className="flex-2 py-4 bg-rose-500 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg">Archive Now</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDetails;
