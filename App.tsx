
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Student, StudyRecord, Schedule } from './types';
import StudentList from './components/StudentList';
import StudentDetails from './components/StudentDetails';
import DailyEntryForm from './components/DailyEntryForm';
import AuthGuard from './components/AuthGuard';
import { calculateMonthlyStats, formatCurrency } from './utils/helpers';

const STORAGE_KEY = 'edu_tracking_data_v5';

const App: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<StudyRecord | null>(null);
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [hideValues, setHideValues] = useState(true);

  // Khôi phục dữ liệu từ LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setStudents(parsed);
        }
      }
    } catch (e) {
      console.error("Lỗi khi đọc dữ liệu từ LocalStorage:", e);
    }
  }, []);

  // Lưu dữ liệu vào LocalStorage khi state thay đổi
  useEffect(() => {
    try {
      if (students) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
      }
    } catch (e) {
      console.error("Lỗi khi lưu dữ liệu vào LocalStorage:", e);
    }
  }, [students]);

  // Thêm học sinh mới
  const addStudent = useCallback((name: string, className: string, baseSalary: number, schedules: Schedule[]) => {
    if (!name?.trim()) return;
    const newStudent: Student = { 
      id: "std_" + Date.now().toString(), 
      fullName: name.trim(), 
      className: className || 'Lớp 1', 
      baseSalary: baseSalary || 0, 
      schedules: Array.isArray(schedules) ? schedules : [], 
      history: [] 
    };
    setStudents(prev => [...(prev || []), newStudent]);
  }, []);

  // Cập nhật học sinh
  const updateStudent = useCallback((id: string, name: string, className: string, baseSalary: number, schedules: Schedule[]) => {
    setStudents(prev => (prev || []).map(s => 
      s.id === id ? { ...s, fullName: name.trim(), className, baseSalary, schedules } : s
    ));
  }, []);

  // Xóa học sinh
  const deleteStudent = useCallback((id: string) => {
    if (!id) return;
    if (window.confirm('Bạn có chắc chắn muốn xóa hồ sơ học sinh này không? Hành động này không thể hoàn tác.')) {
      setStudents(prev => (prev || []).filter(s => s && s.id !== id));
      if (selectedStudentId === id) setSelectedStudentId(null);
    }
  }, [selectedStudentId]);

  // Lưu/Cập nhật bản ghi học tập
  const saveRecord = useCallback((recordData: Omit<StudyRecord, 'id'> | StudyRecord) => {
    if (!selectedStudentId || !recordData) return;
    setStudents(prev => (prev || []).map(s => {
      if (!s || s.id !== selectedStudentId) return s;
      
      let newHistory = Array.isArray(s.history) ? [...s.history] : [];
      if ('id' in recordData && recordData.id) {
        // Cập nhật bản ghi cũ
        newHistory = newHistory.map(r => r.id === recordData.id ? (recordData as StudyRecord) : r);
      } else {
        // Thêm bản ghi mới
        const newRecord = { ...recordData, id: "rec_" + Date.now().toString() } as StudyRecord;
        newHistory.push(newRecord);
      }
      
      return { ...s, history: newHistory };
    }));
    setIsAddingRecord(false);
    setEditingRecord(null);
  }, [selectedStudentId]);

  // Xóa bản ghi lịch sử
  const deleteRecord = useCallback((recordId: string) => {
    if (!selectedStudentId || !recordId) return;
    setStudents(prev => (prev || []).map(s => {
      if (!s || s.id !== selectedStudentId) return s;
      const filteredHistory = (s.history || []).filter(r => r && r.id !== recordId);
      return { ...s, history: filteredHistory };
    }));
  }, [selectedStudentId]);

  const selectedStudent = useMemo(() => 
    (students || []).find(s => s && s.id === selectedStudentId), 
    [students, selectedStudentId]
  );

  const globalMonthlySalary = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    return (students || []).reduce((total, student) => {
      if (!student) return total;
      const stats = calculateMonthlyStats(student.history, student.schedules, month, year, student.baseSalary);
      return total + (stats.totalSalary || 0);
    }, 0);
  }, [students]);

  return (
    <AuthGuard>
      <div className="min-h-[100dvh] bg-slate-50 flex flex-col text-slate-900 overflow-x-hidden">
        <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shrink-0">
          <div className="max-w-7xl mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg">E</div>
              <div className="flex flex-col">
                <span className="font-black text-slate-900 text-sm md:text-lg tracking-tight leading-none">SmartEducation</span>
                <span className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Management v5</span>
              </div>
            </div>
            <button onClick={() => setHideValues(!hideValues)} className="p-2 md:p-3 bg-slate-100 rounded-xl hover:bg-slate-200 transition border border-slate-200">
              {hideValues ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11-8 11-8z"/><circle cx="12" cy="12" r="3"/></svg> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>}
            </button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto w-full px-4 py-6 md:py-10 flex-1 flex flex-col gap-8 md:gap-12 overflow-y-auto">
          {!selectedStudentId ? (
            <div className="space-y-12 animate-in fade-in duration-700">
              <StudentList 
                students={students || []} 
                onAdd={addStudent} 
                onUpdate={updateStudent}
                onDelete={deleteStudent} 
                onSelect={(s) => setSelectedStudentId(s.id)} 
                hideValues={hideValues} 
              />

              <div className="bg-white p-6 md:p-10 rounded-[40px] border-2 border-slate-100 shadow-xl text-center">
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Doanh thu dự kiến tháng {new Date().getMonth() + 1}</h2>
                <div className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">
                  {hideValues ? '•••••••• ₫' : formatCurrency(globalMonthlySalary)}
                </div>
              </div>
            </div>
          ) : (
            <StudentDetails 
              student={selectedStudent!} 
              onBack={() => setSelectedStudentId(null)}
              onAddRecord={() => setIsAddingRecord(true)}
              onEditRecord={(r) => setEditingRecord(r)}
              onDeleteRecord={deleteRecord}
              hideValues={hideValues}
            />
          )}
        </main>

        {(isAddingRecord || editingRecord) && selectedStudent && (
          <DailyEntryForm 
            student={selectedStudent}
            initialRecord={editingRecord || undefined}
            onSave={recordData => saveRecord(recordData)}
            onClose={() => { setIsAddingRecord(false); setEditingRecord(null); }}
          />
        )}
      </div>
    </AuthGuard>
  );
};

export default App;
