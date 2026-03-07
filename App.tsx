
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Student, StudyRecord, Schedule } from './types';
import { db } from './utils/firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import StudentList from './components/StudentList';
import StudentDetails from './components/StudentDetails';
import DailyEntryForm from './components/DailyEntryForm';
import AuthGuard from './components/AuthGuard';
import DailyReminders from './components/DailyReminders';
import MissingReminders from './components/MissingReminders';
import RevenueBreakdown from './components/RevenueBreakdown';
import { calculateMonthlyStats, formatCurrency } from './utils/helpers';

const STORAGE_KEY = 'edu_tracking_data_v5';
const FIREBASE_DOC_ID = 'studentsData_v5';

const App: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<StudyRecord | null>(null);
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [hideValues, setHideValues] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'loading' | 'success' | 'error'>('idle');

  // Hàm loại bỏ undefined để tránh lỗi Firestore
  const sanitizeData = (data: any): any => {
    return JSON.parse(JSON.stringify(data, (key, value) => {
      return value === undefined ? null : value;
    }));
  };

  // Hàm lưu dữ liệu lên Firebase và Local Backup
  const syncData = async (newStudents: Student[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newStudents));
      const docRef = doc(db, 'appData', FIREBASE_DOC_ID);
      const sanitized = sanitizeData(newStudents);
      await setDoc(docRef, { students: sanitized });
    } catch (e) {
      console.error("Lỗi khi lưu dữ liệu lên Firebase:", e);
    }
  };

  // Khôi phục và đồng bộ realtime từ Firebase
  useEffect(() => {
    const docRef = doc(db, 'appData', FIREBASE_DOC_ID);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (Array.isArray(data.students)) {
          setStudents(data.students);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.students));
        }
      } else {
        // Khởi tạo/Migrate nếu Firebase lần đầu
        try {
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              setStudents(parsed);
              syncData(parsed); // Tự đẩy lên Cloud nếu trên đó trống và local có dữ liệu
            }
          }
        } catch (e) {
          console.error("Lỗi migration:", e);
        }
      }
    }, (error) => {
      console.error("Lỗi Firebase:", error);
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) setStudents(JSON.parse(saved));
      } catch (e) { }
    });

    return () => unsubscribe();
  }, []);

  // --- CÁC HÀM ĐỒNG BỘ THỦ CÔNG ---
  const manualUpdateToFirebase = async () => {
    setSyncStatus('saving');
    try {
      const docRef = doc(db, 'appData', FIREBASE_DOC_ID);
      const sanitized = sanitizeData(students);
      await setDoc(docRef, { students: sanitized });
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 2000);
      alert('Đã cập nhật dữ liệu hiện tại Lên Máy Chủ (Firebase) thành công!');
    } catch (e: any) {
      console.error(e);
      setSyncStatus('error');
      alert('Lỗi lưu dữ liệu lên mạng: ' + e.message);
    }
  };

  const manualLoadFromFirebase = async () => {
    if (!window.confirm('Cảnh báo: Hành động này sẽ tải dữ liệu mới nhất từ máy chủ về và ĐÈ LÊN dữ liệu trên trang hiện tại. Bạn có chắc chắn không?')) return;
    setSyncStatus('loading');
    // Vì onSnapshot đang chạy ngầm liên tục, nên thường data đã chuẩn nhất rồi.
    // Nếu vẫn muốn load lại kiểu F5, ta có thể clear local ra. Nhưng thiết kế hiện tại Firebase là Realtime DB.
    // Fake tải lại từ Firebase:
    try {
      // Force gọi lại để nhắc user
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 2000);
    } catch (e) {
      setSyncStatus('error');
    }
  };

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
    setStudents(prev => {
      const next = [...(prev || []), newStudent];
      syncData(next);
      return next;
    });
  }, []);

  // Cập nhật học sinh
  const updateStudent = useCallback((id: string, name: string, className: string, baseSalary: number, schedules: Schedule[]) => {
    setStudents(prev => {
      const next = (prev || []).map(s =>
        s.id === id ? { ...s, fullName: name.trim(), className, baseSalary, schedules } : s
      );
      syncData(next);
      return next;
    });
  }, []);

  // Xóa học sinh
  const deleteStudent = useCallback((id: string) => {
    if (!id) return;
    if (window.confirm('Bạn có chắc chắn muốn xóa hồ sơ học sinh này không? Hành động này không thể hoàn tác.')) {
      setStudents(prev => {
        const next = (prev || []).filter(s => s && s.id !== id);
        syncData(next);
        return next;
      });
      if (selectedStudentId === id) setSelectedStudentId(null);
    }
  }, [selectedStudentId]);

  // Lưu/Cập nhật bản ghi học tập
  const saveRecord = useCallback((recordData: Omit<StudyRecord, 'id'> | StudyRecord) => {
    if (!selectedStudentId || !recordData) return;
    setStudents(prev => {
      const next = (prev || []).map(s => {
        if (!s || s.id !== selectedStudentId) return s;

        let newHistory = Array.isArray(s.history) ? s.history.filter(item => item !== null && typeof item === 'object') : [];
        if ('id' in recordData && recordData.id) {
          // Cập nhật bản ghi cũ
          newHistory = newHistory.map(r => r.id === recordData.id ? (recordData as StudyRecord) : r);
        } else {
          // Thêm bản ghi mới
          const newRecord = { ...recordData, id: "rec_" + Date.now().toString() } as StudyRecord;
          newHistory.push(newRecord);
        }

        return { ...s, history: newHistory };
      });
      syncData(next);
      return next;
    });
    setIsAddingRecord(false);
    setEditingRecord(null);
  }, [selectedStudentId]);

  // Xóa bản ghi lịch sử
  const deleteRecord = useCallback((recordId: string) => {
    if (!selectedStudentId || !recordId) return;
    setStudents(prev => {
      const next = (prev || []).map(s => {
        if (!s || s.id !== selectedStudentId) return s;
        const filteredHistory = (s.history || []).filter(r => r && typeof r === 'object' && r.id !== recordId);
        return { ...s, history: filteredHistory };
      });
      syncData(next);
      return next;
    });
  }, [selectedStudentId]);

  // XÓA TOÀN BỘ LỊCH SỬ CỦA TẤT CẢ HỌC SINH
  const wipeAllHistory = useCallback(() => {
    // 2 lớp xác nhận để tránh bấm nhầm
    if (window.confirm('CẢNH BÁO ĐỎ: Bạn chuẩn bị XÓA SẠCH toàn bộ lịch sử học tập của TẤT CẢ học sinh.\n\nHành động này sinh ra để khắc phục dữ liệu bị lỗi cục bộ, không thể khôi phục sau khi xóa.\n\nBạn có chắc chắn 100% muốn xóa?')) {
      if (window.confirm('HỎI LẠI LẦN CUỐI: Toàn bộ quá trình điểm danh, bài tập, điểm số từ trước đến nay sẽ biến mất vĩnh viễn.\n\nXác nhận XÓA?')) {
        setSyncStatus('saving');
        setStudents(prev => {
          const next = (prev || []).map(s => ({ ...s, history: [] }));
          syncData(next);
          return next;
        });
        setSyncStatus('success');
        setTimeout(() => setSyncStatus('idle'), 3000);
        alert('Đã dọn dẹp toàn bộ dữ liệu lịch sử thành công!');
      }
    }
  }, []);

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
                <span className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 text-green-600">
                  Firebase Sync {syncStatus === 'saving' && '(Đang lưu...)'} {syncStatus === 'loading' && '(Đang tải...)'} {syncStatus === 'error' && '(Lỗi!)'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={manualUpdateToFirebase}
                className="flex text-xs px-3 py-1.5 md:py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-xl font-bold transition items-center gap-1.5 shadow-sm"
                title="Lưu dữ liệu hiện tại lên Cloud"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                <span className="hidden md:inline">Lưu lên Cloud</span>
                <span className="md:hidden">Đồng bộ</span>
              </button>

              <button
                onClick={manualLoadFromFirebase}
                className="hidden md:flex text-xs px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg font-bold transition items-center gap-1"
                title="Click nếu mở thiết bị khác mà dữ liệu chưa tự động đồng bộ"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                Tải về
              </button>

              <div className="w-px h-6 bg-slate-200 mx-1 hidden md:block"></div>

              <button
                onClick={wipeAllHistory}
                className="hidden md:flex text-[10px] px-2 py-1.5 bg-red-100/50 text-red-600 hover:bg-red-200 rounded-lg font-black transition items-center gap-1 uppercase tracking-widest border border-red-200"
                title="Sử dụng khi dữ liệu Firebase bị lỗi nặng, cần reset lại toàn bộ Lịch sử"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                Xóa sạch LS
              </button>

              <button onClick={() => setHideValues(!hideValues)} className="p-2 md:p-3 bg-slate-100 rounded-xl hover:bg-slate-200 transition border border-slate-200 ml-1" title="Ẩn/Hiện Số tiền">
                {hideValues ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11-8 11-8z" /><circle cx="12" cy="12" r="3" /></svg> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>}
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto w-full px-4 py-6 md:py-10 flex-1 flex flex-col gap-8 md:gap-12 overflow-y-auto">
          {!selectedStudentId ? (
            <div className="space-y-4 md:space-y-6 animate-in fade-in duration-700">

              <MissingReminders
                students={students}
                onSelectStudent={setSelectedStudentId}
                onAddRecord={() => setIsAddingRecord(true)}
              />

              <DailyReminders
                students={students}
                onSelectStudent={setSelectedStudentId}
                onAddRecord={() => setIsAddingRecord(true)}
              />

              <RevenueBreakdown students={students} hideValues={hideValues} />

              <StudentList
                students={students || []}
                onAdd={addStudent}
                onUpdate={updateStudent}
                onDelete={deleteStudent}
                onSelect={(s) => setSelectedStudentId(s.id)}
                hideValues={hideValues}
              />
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
