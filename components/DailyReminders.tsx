import React, { useMemo, useState } from 'react';
import { Student } from '../types';
import { getWeekday, toLocalDateString, formatDate } from '../utils/helpers';

interface Props {
    students: Student[];
    onSelectStudent: (id: string) => void;
    onAddRecord: () => void;
}

const DailyReminders: React.FC<Props> = ({ students, onSelectStudent, onAddRecord }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const reminders = useMemo(() => {
        const today = new Date();
        const dateStr = toLocalDateString(today);
        const todayWeekday = getWeekday(dateStr);

        const needed: { studentId: string; studentName: string; session: string }[] = [];

        students.forEach(student => {
            // Find classes for today
            const todaySchedules = student.schedules.filter(s => s.weekday === todayWeekday);

            if (todaySchedules.length > 0) {
                // Check if there is already a record for today
                const hasRecordToday = student.history.some(r => r.date === dateStr);

                if (!hasRecordToday) {
                    todaySchedules.forEach(sch => {
                        needed.push({
                            studentId: student.id,
                            studentName: student.fullName,
                            session: sch.session
                        });
                    });
                }
            }
        });

        return needed;
    }, [students]);

    if (reminders.length === 0) return null;

    return (
        <div className="bg-white rounded-[32px] shadow-sm border border-amber-200 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-2 h-full bg-amber-400"></div>

            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className={`p-6 md:p-8 cursor-pointer transition flex flex-col md:flex-row md:items-center justify-between gap-4 pl-8 ${isExpanded ? 'bg-amber-50 border-b border-amber-100' : 'hover:bg-amber-50/50'}`}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 font-black shrink-0 shadow-sm">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2h4" /><path d="m11.5 10 .5-6" /><path d="M22 12A10 10 0 1 1 12 2a10 10 0 0 1 10 10Z" /><path d="m11.5 14.5.5-4" /></svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-amber-900 uppercase tracking-tight flex items-center gap-2">
                            Nhắc Việc Hôm Nay
                        </h2>
                        <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mt-1">({formatDate(toLocalDateString(new Date()))})</p>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                    <div className="text-2xl md:text-3xl font-black text-amber-600 tracking-tighter">
                        {reminders.length} <span className="text-sm">chưa xong</span>
                    </div>
                    <div className="text-[10px] font-black uppercase text-amber-600 tracking-widest flex items-center gap-1">
                        {isExpanded ? 'Bấm để Thu Gọn' : 'Bấm để Mở Rộng Cảnh Báo'}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9" /></svg>
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className="p-6 md:p-8 animate-in fade-in slide-in-from-top-4 duration-300 bg-amber-50/50 pl-8">
                    <div className="flex flex-col gap-3">
                        {reminders.map((r, i) => (
                            <div
                                key={`${r.studentId}-${i}`}
                                onClick={() => {
                                    onSelectStudent(r.studentId);
                                    setTimeout(() => onAddRecord(), 100); // Wait for transition
                                }}
                                className="bg-white border border-amber-200 p-4 rounded-2xl flex justify-between items-center cursor-pointer hover:bg-amber-100 hover:border-amber-300 transition active:scale-[0.98] group shadow-sm"
                            >
                                <div className="font-black text-slate-800 text-sm md:text-base">
                                    <span className="text-amber-500 mr-2">⚠️</span>
                                    {r.studentName} <span className="text-[10px] bg-amber-100 text-amber-800 px-3 py-1 rounded-full ml-2 uppercase">Ca {r.session}</span>
                                </div>
                                <div className="text-[10px] font-black text-amber-600 bg-amber-100/50 px-4 py-2 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition uppercase tracking-widest border border-amber-200 group-hover:border-transparent">
                                    Bổ sung ngay
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DailyReminders;
