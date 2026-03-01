import React, { useMemo } from 'react';
import { Student } from '../types';
import { getWeekday, toLocalDateString, formatDate } from '../utils/helpers';

interface Props {
    students: Student[];
    onSelectStudent: (id: string) => void;
    onAddRecord: () => void;
}

const DailyReminders: React.FC<Props> = ({ students, onSelectStudent, onAddRecord }) => {
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
        <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-3xl mb-4 animate-in fade-in slide-in-from-top duration-500 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-amber-400"></div>
            <div className="flex items-start gap-4 pl-2">
                <div className="w-10 h-10 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 font-black shrink-0 shadow-sm mt-1">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2h4" /><path d="m11.5 10 .5-6" /><path d="M22 12A10 10 0 1 1 12 2a10 10 0 0 1 10 10Z" /><path d="m11.5 14.5.5-4" /></svg>
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-black text-amber-900 uppercase tracking-tight flex items-center gap-2">
                        Nhắc Việc Hôm Nay ({formatDate(toLocalDateString(new Date()))})
                    </h3>
                    <p className="text-xs font-bold text-amber-700 mt-1 mb-3">Có {reminders.length} điểm danh chưa được thực hiện.</p>

                    <div className="flex flex-col gap-2">
                        {reminders.map((r, i) => (
                            <div
                                key={`${r.studentId}-${i}`}
                                onClick={() => {
                                    onSelectStudent(r.studentId);
                                    setTimeout(() => onAddRecord(), 100); // Wait for transition
                                }}
                                className="bg-white border border-amber-100 p-3 rounded-xl flex justify-between items-center cursor-pointer hover:bg-amber-100/50 hover:border-amber-300 transition active:scale-[0.98] group shadow-sm"
                            >
                                <div className="font-black text-slate-800 text-sm">
                                    <span className="text-amber-500 mr-2">⚠️</span>
                                    {r.studentName} <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full ml-2 uppercase">Ca {r.session}</span>
                                </div>
                                <div className="text-[10px] font-black text-amber-600 bg-amber-100 px-3 py-1.5 rounded-lg group-hover:bg-amber-500 group-hover:text-white transition uppercase tracking-widest">
                                    Bổ sung ngay
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DailyReminders;
