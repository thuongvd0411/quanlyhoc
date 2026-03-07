import React, { useMemo, useState } from 'react';
import { Student } from '../types';
import { getWeekday, toLocalDateString, formatDate } from '../utils/helpers';

interface Props {
    students: Student[];
    onSelectStudent: (id: string, date?: string) => void;
    onAddRecord: () => void;
}

const MissingReminders: React.FC<Props> = ({ students, onSelectStudent, onAddRecord }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const missingReminders = useMemo(() => {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // We only check up to yesterday
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        yesterday.setHours(23, 59, 59, 999); // End of yesterday

        const missing: { studentId: string; studentName: string; session: string; dateStr: string; dateObj: Date; weekday: number }[] = [];

        // If today is the 1st of the month, yesterday was last month, so we don't check.
        if (today.getDate() === 1) return missing;

        // Loop through each day from start of month to yesterday
        for (let d = new Date(startOfMonth); d <= yesterday; d.setDate(d.getDate() + 1)) {
            const dateStr = toLocalDateString(d);
            const wday = getWeekday(dateStr);

            students.forEach(student => {
                // Find classes scheduled for this weekday
                const scheduledForDay = student.schedules.filter(s => s.weekday === wday);

                if (scheduledForDay.length > 0) {
                    // Check if there is already a record for this past date
                    const hasRecordForDay = student.history.some(r => r.date === dateStr);

                    if (!hasRecordForDay) {
                        scheduledForDay.forEach(sch => {
                            missing.push({
                                studentId: student.id,
                                studentName: student.fullName,
                                session: sch.session,
                                dateStr: dateStr,
                                dateObj: new Date(d), // Clone the date object
                                weekday: wday
                            });
                        });
                    }
                }
            });
        }

        // Sort descending by date (newest missing first), then by student name
        missing.sort((a, b) => {
            if (b.dateObj.getTime() !== a.dateObj.getTime()) {
                return b.dateObj.getTime() - a.dateObj.getTime();
            }
            return a.studentName.localeCompare(b.studentName);
        });

        return missing;
    }, [students]);

    if (missingReminders.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex items-center gap-3 text-slate-500 text-sm">
                <span className="text-green-500">✅</span>
                <span>Tuyệt vời! Không có nhắc việc nào bị bỏ lỡ từ đầu tháng. (Đã nạp bản cập nhật mới)</span>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[32px] shadow-sm border border-rose-200 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-2 h-full bg-rose-500"></div>

            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className={`p-6 md:p-8 cursor-pointer transition flex flex-col md:flex-row md:items-center justify-between gap-4 pl-8 ${isExpanded ? 'bg-rose-50 border-b border-rose-100' : 'hover:bg-rose-50/50'}`}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600 font-black shrink-0 shadow-sm animate-pulse shadow-rose-200">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2h4" /><path d="m11.5 10 .5-6" /><path d="M22 12A10 10 0 1 1 12 2a10 10 0 0 1 10 10Z" /><path d="m11.5 14.5.5-4" /></svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-rose-900 uppercase tracking-tight flex items-center gap-2">
                            Nhắc Việc Bị Bỏ Lỡ
                        </h2>
                        <p className="text-xs font-bold text-rose-700 mt-1 flex flex-wrap gap-1">
                            Có báo cáo điểm danh từ đầu tháng chưa hoàn thành!
                        </p>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                    <div className="text-2xl md:text-3xl font-black text-rose-600 tracking-tighter">
                        {missingReminders.length} <span className="text-sm">buổi thiếu</span>
                    </div>
                    <div className="text-[10px] font-black uppercase text-rose-600 tracking-widest flex items-center gap-1">
                        {isExpanded ? 'Bấm để Thu Gọn' : 'Bấm để Mở Chi Tiết'}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9" /></svg>
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className="p-6 md:p-8 animate-in fade-in slide-in-from-top-4 duration-300 bg-rose-50/50 pl-8">
                    <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {missingReminders.map((r, i) => (
                            <div
                                key={`${r.studentId}-${r.dateStr}-${r.session}-${i}`}
                                onClick={() => {
                                    // Optionally pass the date to pre-fill the form if you update StudentDetails/DailyEntryForm
                                    // For now, it just selects the student
                                    onSelectStudent(r.studentId, r.dateStr);
                                    setTimeout(() => onAddRecord(), 100); // Wait for transition
                                }}
                                className="bg-white border border-rose-200 p-4 rounded-2xl flex justify-between items-center cursor-pointer hover:bg-rose-100 hover:border-rose-300 transition active:scale-[0.98] group shadow-sm"
                            >
                                <div className="flex flex-col gap-1">
                                    <div className="font-black text-slate-800 text-sm md:text-base flex items-center gap-2">
                                        <span className="text-rose-500">❌</span>
                                        {r.studentName}
                                        <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full uppercase">Ca {r.session}</span>
                                    </div>
                                    <div className="text-xs font-bold text-rose-700 ml-6 flex items-center gap-1">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                        Ngày {formatDate(r.dateStr)}
                                    </div>
                                </div>
                                <div className="text-[10px] font-black text-rose-600 bg-rose-100/50 px-4 py-2 rounded-xl group-hover:bg-rose-600 group-hover:text-white transition uppercase tracking-widest border border-rose-200 group-hover:border-transparent whitespace-nowrap ml-2">
                                    Bổ sung
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MissingReminders;
