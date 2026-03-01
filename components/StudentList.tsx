
import React, { useState } from 'react';
import { Student, Schedule, SessionType } from '../types';
import { formatCurrency } from '../utils/helpers';

interface Props {
  students: Student[];
  onAdd: (name: string, className: string, baseSalary: number, schedules: Schedule[]) => void;
  onUpdate: (id: string, name: string, className: string, baseSalary: number, schedules: Schedule[]) => void;
  onDelete: (id: string) => void;
  onSelect: (student: Student) => void;
  hideValues?: boolean;
}

const StudentList: React.FC<Props> = ({ students, onAdd, onUpdate, onDelete, onSelect, hideValues = false }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [cls, setCls] = useState('Lớp 1');
  const [salary, setSalary] = useState<string>('140000');
  const [isSalaryVisible, setIsSalaryVisible] = useState(false);
  const [tempSchedules, setTempSchedules] = useState<Omit<Schedule, 'id'>[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [newDay, setNewDay] = useState<number>(0);
  const [newSession, setNewSession] = useState<SessionType>('Chiều');

  const adjustSalary = (amount: number) => {
    setIsSalaryVisible(true);
    const current = parseInt(salary) || 0;
    const next = Math.max(0, current + amount);
    setSalary(next.toString());
  };

  const startEdit = (student: Student) => {
    setEditingId(student.id);
    setName(student.fullName);
    setCls(student.className);
    setSalary(student.baseSalary.toString());
    setTempSchedules(student.schedules.map(({ id, ...rest }) => rest));
    setIsSalaryVisible(false);
    setIsFormOpen(true);

    // Cuộn xuống form chỉnh sửa
    setTimeout(() => {
      window.scrollTo({
        top: document.getElementById('student-form')?.offsetTop ? document.getElementById('student-form')!.offsetTop - 100 : 0,
        behavior: 'smooth'
      });
    }, 100);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName('');
    setCls('Lớp 1');
    setSalary('140000');
    setTempSchedules([]);
    setIsSalaryVisible(false);
    setIsFormOpen(false);
  };

  const addScheduleToTemp = () => {
    if (tempSchedules.some(s => s.weekday === newDay && s.session === newSession)) return;
    setTempSchedules([...tempSchedules, { weekday: newDay, session: newSession }]);
  };

  const removeTempSchedule = (index: number) => {
    setTempSchedules(tempSchedules.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name?.trim()) return;

    const schedulesWithIds: Schedule[] = tempSchedules.map(s => ({
      ...s,
      id: "sch_" + Math.random().toString(36).substr(2, 9)
    }));

    if (editingId) {
      onUpdate(editingId, name, cls, parseInt(salary) || 0, schedulesWithIds);
    } else {
      onAdd(name, cls, parseInt(salary) || 0, schedulesWithIds);
    }

    cancelEdit();
  };

  const getDayName = (day: number) => {
    const names = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
    return names[day] || 'N/A';
  };

  return (
    <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 md:p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
        <h2 className="text-lg md:text-xl font-black text-slate-800 uppercase tracking-tight">Hồ Sơ Học Sinh ({students.length})</h2>
        <button
          onClick={() => {
            if (editingId) cancelEdit();
            else setIsFormOpen(!isFormOpen);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition shadow-md active:scale-95 flex items-center gap-2"
        >
          {isFormOpen && !editingId ? 'Đóng' : '+ Thêm Mới'}
        </button>
      </div>

      {isFormOpen && (
        <div id="student-form" className={`p-4 md:p-8 border-b border-slate-200 ${editingId ? 'bg-indigo-50/50' : 'bg-slate-50/50'} animate-in slide-in-from-top-4 duration-300`}>
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">
              {editingId ? 'Chỉnh Sửa Hồ Sơ' : 'Tạo Hồ Sơ Mới'}
            </h3>
            {editingId && (
              <button onClick={cancelEdit} className="text-[10px] font-black text-red-500 uppercase hover:underline bg-red-50 px-3 py-1 rounded-lg">
                Hủy chỉnh sửa
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Họ và tên</label>
                <input
                  type="text" placeholder="Nguyễn Văn A..."
                  className="w-full px-4 py-3 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none font-bold text-sm md:text-base bg-white"
                  value={name} onChange={(e) => setName(e.target.value)} required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Lớp / Nhóm</label>
                <select
                  className="w-full px-4 py-3 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none font-bold text-sm md:text-base appearance-none bg-white"
                  value={cls} onChange={(e) => setCls(e.target.value)}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                    <option key={num} value={`Lớp ${num}`}>Lớp {num}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Giá tiền mỗi ca (VNĐ)</label>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => adjustSalary(-10000)} className="p-3 bg-white rounded-xl hover:bg-slate-100 text-slate-600 transition active:scale-90 flex-shrink-0 border-2 border-slate-100">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  </button>
                  <div className="relative flex-1">
                    <input
                      type={isSalaryVisible ? "number" : "text"}
                      className="w-full px-2 py-3 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none font-bold text-green-600 text-sm md:text-base text-center bg-white"
                      value={isSalaryVisible ? salary : "••••••••"}
                      onFocus={() => setIsSalaryVisible(true)}
                      onChange={(e) => isSalaryVisible && setSalary(e.target.value)}
                    />
                  </div>
                  <button type="button" onClick={() => adjustSalary(10000)} className="p-3 bg-white rounded-xl hover:bg-slate-100 text-slate-600 transition active:scale-90 flex-shrink-0 border-2 border-slate-100">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-200">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Lịch học cố định</label>
              <div className="flex flex-wrap gap-2 mb-4 hover:shadow-sm transition p-2 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <select className="flex-1 text-xs md:text-sm font-bold border-2 border-slate-100 rounded-xl px-2 py-2 md:py-3 bg-white outline-none focus:border-indigo-300" value={newDay} onChange={(e) => setNewDay(parseInt(e.target.value))}>
                  {[0, 1, 2, 3, 4, 5, 6].map(d => <option key={d} value={d}>{getDayName(d)}</option>)}
                </select>
                <select className="flex-1 text-xs md:text-sm font-bold border-2 border-slate-100 rounded-xl px-2 py-2 md:py-3 bg-white outline-none focus:border-indigo-300" value={newSession} onChange={(e) => setNewSession(e.target.value as SessionType)}>
                  <option value="Sáng">Sáng</option>
                  <option value="Chiều">Chiều</option>
                  <option value="Tối">Tối</option>
                </select>
                <button type="button" onClick={addScheduleToTemp} className="w-full md:w-auto bg-slate-800 hover:bg-slate-900 text-white px-6 py-2 md:py-3 rounded-xl text-xs font-black uppercase transition active:scale-95 shadow-md">+ THÊM</button>
              </div>
              <div className="flex flex-wrap gap-2 min-h-8">
                {tempSchedules.length === 0 ? <span className="text-[10px] text-slate-400 font-bold italic w-full text-center my-auto">Chưa có lịch cố định nào đc thêm</span> :
                  tempSchedules.map((s, i) => (
                    <div key={i} className="bg-white text-slate-700 px-3 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-2 border-2 border-slate-100 shadow-sm">
                      {getDayName(s.weekday)} ({s.session})
                      <button type="button" onClick={() => removeTempSchedule(i)} className="text-slate-300 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded-full w-5 h-5 flex items-center justify-center transition">×</button>
                    </div>
                  ))}
              </div>
            </div>

            <button type="submit" className={`w-full text-white px-8 py-4 rounded-2xl transition font-black text-xs md:text-sm uppercase tracking-widest shadow-xl active:scale-[0.98] ${editingId ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
              {editingId ? 'CẬP NHẬT HỒ SƠ' : 'LƯU HỒ SƠ MỚI'}
            </button>
          </form>
        </div>
      )}

      <div className="divide-y divide-slate-100 max-h-[50dvh] overflow-y-auto bg-white">
        {(!students || students.length === 0) ? (
          <div className="p-10 text-center text-slate-300 italic font-medium">Chưa có hồ sơ học sinh nào.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-slate-50/30">
            {students.map(s => (
              <div
                key={s.id}
                className={`p-4 bg-white rounded-2xl border flex items-center justify-between transition cursor-pointer shadow-sm hover:shadow-md ${editingId === s.id ? 'border-indigo-400 bg-indigo-50/30' : 'border-slate-200 hover:border-indigo-200 active:scale-[0.98]'}`}
                onClick={() => onSelect(s)}
              >
                <div className="flex-1 min-w-0 pr-2">
                  <h3 className="font-black text-slate-800 text-sm md:text-base truncate mb-1.5">{s.fullName}</h3>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[9px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-black uppercase border border-slate-200">{s.className || 'N/A'}</span>
                    <span className="text-[9px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md font-black uppercase border border-emerald-100">
                      {hideValues ? '•••• ₫' : `${formatCurrency(s.baseSalary)}/ca`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); startEdit(s); }}
                    className="text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition p-2 rounded-xl flex items-center justify-center border border-transparent" title="Sửa hồ sơ"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                  </button>
                  <div className="w-px h-6 bg-slate-100"></div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(s.id); }}
                    className="text-red-300 hover:text-red-500 hover:bg-red-50 transition p-2 rounded-xl flex items-center justify-center border border-transparent" title="Xóa hồ sơ"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentList;
