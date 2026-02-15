
import React, { useState, useEffect } from 'react';
import { StudyRecord, SessionType, HomeworkStatus, Student, AttendanceStatus, RegularHomeworkResult, TriStateResult, YesNoNAResult } from '../types';
import { getWeekday, toLocalDateString } from '../utils/helpers';

// Helper functions for calendar rendering
const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const startDayOfMonth = (year: number, month: number) => {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1; // 0 is Monday, 6 is Sunday
};

interface Props {
  onSave: (record: Omit<StudyRecord, 'id'> | StudyRecord) => void;
  onClose: () => void;
  student: Student;
  initialRecord?: StudyRecord;
}

const DailyEntryForm: React.FC<Props> = ({ onSave, onClose, student, initialRecord }) => {
  if (!student) return null;

  const [selectedDate, setSelectedDate] = useState(initialRecord ? new Date(initialRecord.date) : new Date());
  const [session, setSession] = useState<SessionType>(initialRecord?.session || 'Chiều');
  const [status, setStatus] = useState<AttendanceStatus>(initialRecord?.status || 'attended');
  const [absentReason, setAbsentReason] = useState(initialRecord?.absentReason || '');
  
  // 1. Đầu buổi
  const [homework, setHomework] = useState<HomeworkStatus>(initialRecord?.homework || 'N/A');
  const [formulaTest, setFormulaTest] = useState<TriStateResult>(initialRecord?.formulaTest || 'N/A');
  const [oldLessonTest, setOldLessonTest] = useState<TriStateResult>(initialRecord?.oldLessonTest || 'N/A');
  const [regularHomeworkResult, setRegularHomeworkResult] = useState<RegularHomeworkResult>(initialRecord?.regularHomeworkResult || 'N/A');
  const [ignoreEarlyStats, setIgnoreEarlyStats] = useState(initialRecord?.ignoreEarlyStats || false);

  // 2. Trong buổi
  const [evalNewKnowledge, setEvalNewKnowledge] = useState<number | 'N/A'>(initialRecord?.evalNewKnowledge || 'N/A');
  const [evalQuantity, setEvalQuantity] = useState<number | 'N/A'>(initialRecord?.evalQuantity || 'N/A');
  const [ignoreMidStats, setIgnoreMidStats] = useState(initialRecord?.ignoreMidStats || false);
  
  // 3. Ngoài buổi
  const [hasRegularHomework, setHasRegularHomework] = useState<YesNoNAResult>(initialRecord?.hasRegularHomework || 'N/A');
  const [ignoreOutsideStats, setIgnoreOutsideStats] = useState(initialRecord ? initialRecord.ignoreOutsideStats : true);

  // 4. Điểm định kỳ
  const [testScore, setTestScore] = useState<number | undefined>(initialRecord?.testScore);
  const [ignoreTestStats, setIgnoreTestStats] = useState(initialRecord ? initialRecord.ignoreTestStats : true);

  // 5. Cuối buổi
  const [assignedHomework, setAssignedHomework] = useState<YesNoNAResult>(initialRecord?.assignedHomework || 'N/A');
  const [ignoreLateStats, setIgnoreLateStats] = useState(initialRecord?.ignoreLateStats || false);

  const [viewDate, setViewDate] = useState(initialRecord ? new Date(initialRecord.date) : new Date());

  useEffect(() => {
    if (!initialRecord && student?.schedules) {
      const dateStr = toLocalDateString(selectedDate);
      const wd = getWeekday(dateStr);
      const schedule = student.schedules.find(s => s.weekday === wd);
      if (schedule) setSession(schedule.session);
    }
  }, [selectedDate, student?.schedules, initialRecord]);

  const handleSave = () => {
    const dateStr = toLocalDateString(selectedDate);
    const data = {
      date: dateStr,
      weekday: getWeekday(dateStr),
      session,
      status,
      absentReason: status === 'absent' ? absentReason : undefined,
      homework: status === 'absent' ? 'N/A' : homework,
      formulaTest: status === 'absent' ? 'N/A' : formulaTest,
      oldLessonTest: status === 'absent' ? 'N/A' : oldLessonTest,
      regularHomeworkResult: status === 'absent' ? 'N/A' : regularHomeworkResult,
      ignoreEarlyStats: status === 'absent' ? false : ignoreEarlyStats,
      evalNewKnowledge: status === 'absent' ? 'N/A' : evalNewKnowledge,
      evalQuantity: status === 'absent' ? 'N/A' : evalQuantity,
      ignoreMidStats: status === 'absent' ? false : ignoreMidStats,
      assignedHomework: status === 'absent' ? 'N/A' : assignedHomework,
      ignoreLateStats: status === 'absent' ? false : ignoreLateStats,
      hasRegularHomework: status === 'absent' ? 'N/A' : hasRegularHomework,
      ignoreOutsideStats: status === 'absent' ? true : ignoreOutsideStats,
      testScore: (status !== 'absent' && testScore !== undefined) ? testScore : undefined,
      ignoreTestStats: status === 'absent' ? false : ignoreTestStats,
      mockTests: initialRecord?.mockTests || []
    };
    onSave(initialRecord ? { ...data, id: initialRecord.id } : data);
  };

  const IgnoreToggle = ({ value, onChange, label }: { value: boolean, onChange: (v: boolean) => void, label: string }) => (
    <div className="flex items-center gap-2 mb-2">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} id={label} className="w-4 h-4 accent-indigo-600" />
      <label htmlFor={label} className="text-[9px] font-black text-slate-400 uppercase tracking-tighter cursor-pointer">Bỏ qua thống kê</label>
    </div>
  );

  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const firstDay = startDayOfMonth(year, month);
    const days = [];

    // Empty spaces for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8 md:w-9 md:h-9"></div>);
    }

    for (let d = 1; d <= totalDays; d++) {
      const curDate = new Date(year, month, d);
      const curDateStr = toLocalDateString(curDate);
      const wd = getWeekday(curDateStr);
      
      const isSelected = selectedDate.getDate() === d && 
                         selectedDate.getMonth() === month && 
                         selectedDate.getFullYear() === year;
      
      const isScheduled = student?.schedules?.some(s => s.weekday === wd);
      const existingRecord = student?.history?.find(r => r.date === curDateStr && r.id !== initialRecord?.id);

      let bgColor = 'bg-white text-slate-700 hover:bg-slate-100';
      let textColor = 'text-slate-700';
      let ringColor = '';

      if (isSelected) {
        bgColor = 'bg-indigo-600 shadow-md scale-110 z-10';
        textColor = 'text-white';
      } else if (existingRecord) {
        if (existingRecord.status === 'attended') {
          bgColor = 'bg-green-500';
          textColor = 'text-white';
        } else if (existingRecord.status === 'absent') {
          bgColor = 'bg-red-500';
          textColor = 'text-white';
        } else if (existingRecord.status === 'makeup') {
          bgColor = 'bg-amber-400';
          textColor = 'text-white';
        }
      }

      if (isScheduled && !existingRecord && !isSelected) {
        ringColor = 'ring-2 ring-indigo-300 ring-offset-1';
      }

      days.push(
        <button
          key={d}
          type="button"
          onClick={() => setSelectedDate(new Date(year, month, d))}
          className={`w-8 h-8 md:w-9 md:h-9 rounded-xl flex flex-col items-center justify-center text-[10px] md:text-xs transition relative font-black ${bgColor} ${textColor} ${ringColor}`}
        >
          {d}
          {isScheduled && (
            <div className={`absolute bottom-1 w-1 h-1 rounded-full ${isSelected || existingRecord ? 'bg-white/60' : 'bg-indigo-500'}`}></div>
          )}
        </button>
      );
    }
    return days;
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden my-auto border border-slate-200">
        <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex justify-between items-center shrink-0">
          <div className="flex flex-col">
            <h2 className="text-lg font-black">{initialRecord ? 'Sửa' : 'Thêm'} Tiến Độ</h2>
            <span className="text-[10px] font-bold opacity-80 uppercase tracking-widest">{student.fullName} • {student.className}</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-full transition font-black text-xl">×</button>
        </div>

        <div className="p-4 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 max-h-[75dvh] overflow-y-auto scroll-smooth">
          {/* Calendar Side */}
          <div className="md:col-span-5 space-y-6">
            <div className="border border-slate-200 rounded-3xl p-4 bg-slate-50 shadow-inner">
              <div className="flex justify-between items-center mb-4">
                <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="p-1 hover:bg-white rounded-lg transition"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="15 18 9 12 15 6"/></svg></button>
                <span className="text-xs font-black text-slate-800 uppercase tracking-tighter">Tháng {viewDate.getMonth() + 1} / {viewDate.getFullYear()}</span>
                <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="p-1 hover:bg-white rounded-lg transition"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="9 18 15 12 9 6"/></svg></button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['T2','T3','T4','T5','T6','T7','CN'].map(d => <span key={d} className="text-[9px] font-black text-slate-400 uppercase">{d}</span>)}
              </div>
              <div className="grid grid-cols-7 gap-1 place-items-center">
                {renderCalendar()}
              </div>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div><span className="text-[8px] font-bold text-slate-400 uppercase">Học</span></div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400"></div><span className="text-[8px] font-bold text-slate-400 uppercase">Bù</span></div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div><span className="text-[8px] font-bold text-slate-400 uppercase">Nghỉ</span></div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-white ring-1 ring-indigo-300"></div><span className="text-[8px] font-bold text-slate-400 uppercase">Lịch</span></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Ca học thực tế</label>
              <div className="grid grid-cols-3 gap-2">
                {(['Sáng', 'Chiều', 'Tối'] as SessionType[]).map(s => (
                  <button key={s} type="button" onClick={() => setSession(s)} className={`py-2 rounded-xl text-xs font-black border-2 transition ${session === s ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-100'}`}>{s}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Form Side */}
          <div className="md:col-span-7 space-y-8 pb-4">
            <div className="flex gap-2">
              {(['attended', 'makeup', 'absent'] as AttendanceStatus[]).map(st => (
                <button key={st} type="button" onClick={() => setStatus(st)} className={`flex-1 py-3 rounded-2xl font-black text-[10px] border-2 uppercase transition ${status === st ? (st === 'absent' ? 'bg-red-600 border-red-600 text-white shadow-md' : st === 'makeup' ? 'bg-amber-500 border-amber-500 text-white shadow-md' : 'bg-green-600 border-green-600 text-white shadow-md') : 'bg-white border-slate-100 text-slate-400'}`}>{st === 'attended' ? 'ĐI HỌC' : st === 'makeup' ? 'HỌC BÙ' : 'VẮNG MẶT'}</button>
              ))}
            </div>

            {status === 'absent' ? (
              <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lý do vắng mặt</label>
                <textarea placeholder="Nhập lý do vắng mặt..." className="w-full px-4 py-3 border-2 border-slate-100 rounded-3xl h-32 text-sm font-medium outline-none focus:border-red-400" value={absentReason} onChange={(e) => setAbsentReason(e.target.value)} />
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in duration-500">
                {/* 1. Đầu buổi */}
                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-l-4 border-indigo-600 pl-3">1. ĐẦU BUỔI: BÀI CŨ</h4>
                    <IgnoreToggle value={ignoreEarlyStats} onChange={setIgnoreEarlyStats} label="e" />
                  </div>
                  <div className={`space-y-4 transition-opacity ${ignoreEarlyStats ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block">Bài tập về nhà</label>
                      <div className="flex gap-1">
                        {(['Không làm', 'Làm thiếu', 'Đạt yêu cầu', 'N/A'] as HomeworkStatus[]).map(st => (
                          <button key={st} type="button" onClick={() => setHomework(st)} className={`flex-1 py-2 text-[9px] rounded-xl font-black border-2 transition ${homework === st ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-100 text-slate-400'}`}>{st}</button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase">Công thức</label>
                        <div className="flex gap-1">
                          {(['Đạt', 'Chưa đạt', 'N/A'] as TriStateResult[]).map(r => (
                            <button key={r} type="button" onClick={() => setFormulaTest(r)} className={`flex-1 py-2 text-[8px] rounded-lg font-black border-2 transition ${formulaTest === r ? 'bg-green-600 text-white border-green-600' : 'bg-white border-slate-100 text-slate-400'}`}>{r}</button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase">Bài cũ</label>
                        <div className="flex gap-1">
                          {(['Đạt', 'Chưa đạt', 'N/A'] as TriStateResult[]).map(r => (
                            <button key={r} type="button" onClick={() => setOldLessonTest(r)} className={`flex-1 py-2 text-[8px] rounded-lg font-black border-2 transition ${oldLessonTest === r ? 'bg-green-600 text-white border-green-600' : 'bg-white border-slate-100 text-slate-400'}`}>{r}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Trong buổi */}
                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest border-l-4 border-emerald-600 pl-3">2. TRONG BUỔI: TIẾN ĐỘ</h4>
                    <IgnoreToggle value={ignoreMidStats} onChange={setIgnoreMidStats} label="m" />
                  </div>
                  <div className={`grid grid-cols-2 gap-4 transition-opacity ${ignoreMidStats ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase">Kiến thức mới</label>
                      <select value={evalNewKnowledge} onChange={(e) => setEvalNewKnowledge(e.target.value === 'N/A' ? 'N/A' : parseInt(e.target.value))} className="w-full p-3 border-2 border-slate-100 rounded-2xl text-xs font-black bg-white outline-none focus:border-emerald-500 appearance-none">
                        <option value="N/A">N/A</option>
                        {Array.from({length: 10}, (_, i) => <option key={i+1} value={i+1}>{i+1} / 10</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase">Số lượng bài</label>
                      <select value={evalQuantity} onChange={(e) => setEvalQuantity(e.target.value === 'N/A' ? 'N/A' : parseInt(e.target.value))} className="w-full p-3 border-2 border-slate-100 rounded-2xl text-xs font-black bg-white outline-none focus:border-emerald-500 appearance-none">
                        <option value="N/A">N/A</option>
                        {Array.from({length: 10}, (_, i) => <option key={i+1} value={i+1}>{i+1} / 10</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3. Ngoài buổi */}
                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-[10px] font-black text-purple-600 uppercase tracking-widest border-l-4 border-purple-600 pl-3">3. NGOÀI BUỔI</h4>
                    <IgnoreToggle value={ignoreOutsideStats} onChange={setIgnoreOutsideStats} label="o" />
                  </div>
                  <div className={`space-y-3 transition-opacity ${ignoreOutsideStats ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                    <label className="text-[9px] font-black text-slate-400 uppercase block">Bài tập thường xuyên</label>
                    <div className="flex gap-1">
                      {(['Có', 'Không', 'N/A'] as YesNoNAResult[]).map(r => (
                        <button key={r} type="button" onClick={() => setHasRegularHomework(r)} className={`flex-1 py-3 rounded-xl font-black text-[9px] border-2 transition ${hasRegularHomework === r ? 'bg-purple-600 text-white border-purple-600 shadow-sm' : 'bg-white border-slate-100 text-slate-400'}`}>{r}</button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4. Điểm định kỳ */}
                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-l-4 border-blue-600 pl-3">4. ĐIỂM ĐỊNH KỲ</h4>
                    <IgnoreToggle value={ignoreTestStats} onChange={setIgnoreTestStats} label="t" />
                  </div>
                  <div className={`flex items-center gap-3 transition-opacity ${ignoreTestStats ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                    <button type="button" onClick={() => setTestScore(Math.max(0, (testScore || 5) - 0.25))} className="w-12 h-12 flex items-center justify-center bg-white border-2 border-slate-100 rounded-2xl text-slate-600 font-black hover:border-blue-300 transition active:scale-90">-</button>
                    <div className="flex-1 relative">
                      <input type="number" step="0.25" value={testScore ?? ''} onChange={(e) => setTestScore(e.target.value === '' ? undefined : parseFloat(e.target.value))} className="w-full text-center font-black p-3 rounded-2xl border-2 border-slate-100 text-blue-600 outline-none focus:border-blue-500" placeholder="---" />
                    </div>
                    <button type="button" onClick={() => setTestScore(Math.min(10, (testScore || 5) + 0.25))} className="w-12 h-12 flex items-center justify-center bg-white border-2 border-slate-100 rounded-2xl text-slate-600 font-black hover:border-blue-300 transition active:scale-90">+</button>
                  </div>
                </div>

                {/* 5. Cuối buổi */}
                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest border-l-4 border-amber-600 pl-3">5. CUỐI BUỔI: GIAO BÀI</h4>
                    <IgnoreToggle value={ignoreLateStats} onChange={setIgnoreLateStats} label="l" />
                  </div>
                  <div className={`space-y-3 transition-opacity ${ignoreLateStats ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                    <label className="text-[9px] font-black text-slate-400 uppercase block">Giao bài tập mới</label>
                    <div className="flex gap-1">
                      {(['Có', 'Không', 'N/A'] as YesNoNAResult[]).map(r => (
                        <button key={r} type="button" onClick={() => setAssignedHomework(r)} className={`flex-1 py-3 rounded-xl font-black text-[9px] border-2 transition ${assignedHomework === r ? 'bg-amber-600 text-white border-amber-600 shadow-sm' : 'bg-white border-slate-100 text-slate-400'}`}>{r}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 md:p-6 border-t bg-slate-50 flex gap-4 shrink-0">
          <button onClick={onClose} className="px-6 py-3 text-slate-500 font-black border-2 border-slate-100 rounded-2xl hover:bg-white transition text-[10px] uppercase tracking-widest">Hủy</button>
          <button onClick={handleSave} className="flex-1 py-3 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition text-[10px] uppercase tracking-widest shadow-xl active:scale-95">Lưu kết quả</button>
        </div>
      </div>
    </div>
  );
};

export default DailyEntryForm;
