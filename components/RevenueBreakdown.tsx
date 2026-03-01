import React, { useState, useMemo } from 'react';
import { Student, StudyRecord, Schedule } from '../types';
import { calculateMonthlyStats, formatCurrency, formatDate } from '../utils/helpers';

interface Props {
    students: Student[];
    hideValues: boolean;
}

const RevenueBreakdown: React.FC<Props> = ({ students, hideValues }) => {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [isExpanded, setIsExpanded] = useState(false);
    const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

    const statsBreakdown = useMemo(() => {
        let total = 0;
        const details: { id: string; name: string; className: string; amount: number; sessions: number; history: StudyRecord[]; schedules: Schedule[] }[] = [];

        students.forEach(student => {
            if (!student) return;
            const stats = calculateMonthlyStats(student.history, student.schedules, selectedMonth, selectedYear, student.baseSalary);
            const studentTotal = stats.totalSalary || 0;

            const monthHistory = (student.history || []).filter(h => {
                if (!h || !h.date) return false;
                const dateObj = new Date(h.date);
                return dateObj.getMonth() === selectedMonth && dateObj.getFullYear() === selectedYear;
            }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            if (studentTotal > 0 || stats.totalSessions > 0) { // Show if they had potential revenue or actual revenue
                details.push({
                    id: student.id,
                    name: student.fullName,
                    className: student.className,
                    amount: studentTotal,
                    sessions: stats.attendedCount + stats.makeupCount,
                    history: monthHistory,
                    schedules: student.schedules
                });
                total += studentTotal;
            }
        });

        details.sort((a, b) => b.amount - a.amount); // Sort by highest revenue

        return { total, details };
    }, [students, selectedMonth, selectedYear]);

    const getStartDayIndex = (m: number, y: number) => {
        const d = new Date(y, m, 1).getDay();
        return d === 0 ? 6 : d - 1; // 0 for Monday, 6 for Sunday
    };

    return (
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden">
            {/* Header / Summary */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className={`p-6 md:p-8 cursor-pointer transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${isExpanded ? 'bg-indigo-50 border-b border-indigo-100' : 'hover:bg-slate-50'}`}
            >
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                        </div>
                        <h2 className="text-lg md:text-xl font-black text-slate-800 uppercase tracking-tight">Doanh Thu Tạm Tính</h2>
                    </div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-13">Tháng {selectedMonth + 1} / {selectedYear}</p>
                </div>

                <div className="flex flex-col items-end gap-1">
                    <div className="text-3xl md:text-4xl font-black text-emerald-600 tracking-tighter">
                        {hideValues ? '•••••••• ₫' : formatCurrency(statsBreakdown.total)}
                    </div>
                    <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1">
                        {isExpanded ? 'Bấm để Thu Gọn' : 'Bấm để Mở Rộng'}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9" /></svg>
                    </div>
                </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="p-6 md:p-8 animate-in fade-in slide-in-from-top-4 duration-300 bg-slate-50/50">
                    <div className="flex flex-wrap items-center gap-3 mb-6 bg-white p-3 rounded-2xl border border-slate-200 w-fit shadow-sm">
                        <span className="font-black text-slate-700 text-[10px] md:text-xs uppercase ml-2">Lọc theo:</span>
                        <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="px-4 py-2 border-2 border-slate-100 rounded-xl font-black text-xs outline-none bg-slate-50 focus:border-indigo-500 cursor-pointer">
                            {Array.from({ length: 12 }).map((_, i) => <option key={i} value={i}>Tháng {i + 1}</option>)}
                        </select>
                        <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="px-4 py-2 border-2 border-slate-100 rounded-xl font-black text-xs outline-none bg-slate-50 focus:border-indigo-500 cursor-pointer">
                            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>

                    <div className="space-y-3">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2 mb-4">Chi tiết từng học sinh (Bấm để xem lịch học)</h3>
                        {statsBreakdown.details.length === 0 ? (
                            <div className="text-center p-8 text-slate-400 font-bold italic text-sm bg-white rounded-2xl border border-slate-100">Không có dữ liệu doanh thu cho kỳ này.</div>
                        ) : (
                            statsBreakdown.details.map((item, idx) => (
                                <div key={item.id} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm transition">
                                    <div
                                        onClick={() => setExpandedStudentId(expandedStudentId === item.id ? null : item.id)}
                                        className={`p-4 md:p-5 flex items-center justify-between cursor-pointer transition group ${expandedStudentId === item.id ? 'bg-emerald-50/50' : 'hover:border-emerald-200'}`}
                                    >
                                        <div className="flex flex-col gap-1">
                                            <span className="font-black text-slate-800 text-sm md:text-base flex items-center gap-2">
                                                {item.name}
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`text-slate-300 transition-transform duration-300 ${expandedStudentId === item.id ? 'rotate-180 text-emerald-500' : ''}`}><polyline points="6 9 12 15 18 9" /></svg>
                                            </span>
                                            <div className="flex flex-wrap gap-2 mt-0.5">
                                                <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase">{item.className}</span>
                                                <span className="text-[9px] font-black bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full uppercase">{item.sessions} ca</span>
                                            </div>
                                        </div>
                                        <div className="font-black text-emerald-600 text-base md:text-lg group-hover:scale-105 transition-transform">
                                            {hideValues ? '•••• ₫' : formatCurrency(item.amount)}
                                        </div>
                                    </div>

                                    {expandedStudentId === item.id && (
                                        <div className="p-4 md:p-6 border-t border-slate-100 bg-slate-50/50 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="bg-white rounded-[24px] border border-slate-200 p-5 md:p-6 shadow-sm max-w-sm mx-auto">
                                                <div className="flex items-center justify-between mb-5 px-1">
                                                    <div className="text-xs font-black text-slate-800 tracking-widest uppercase">Tháng {selectedMonth + 1} / {selectedYear}</div>
                                                </div>

                                                <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
                                                    {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
                                                        <div key={d} className="text-[10px] font-black text-slate-400 text-center uppercase">{d}</div>
                                                    ))}
                                                </div>
                                                <div className="grid grid-cols-7 gap-1 md:gap-2">
                                                    {/* padding */}
                                                    {Array.from({ length: getStartDayIndex(selectedMonth, selectedYear) }).map((_, i) => (
                                                        <div key={`empty-${i}`} className="h-10 md:h-12"></div>
                                                    ))}

                                                    {/* days */}
                                                    {Array.from({ length: new Date(selectedYear, selectedMonth + 1, 0).getDate() }).map((_, i) => {
                                                        const day = i + 1;
                                                        const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                                        const record = item.history.find(r => r.date === dateStr);
                                                        const dateObj = new Date(selectedYear, selectedMonth, day);
                                                        const dayOfWeek = dateObj.getDay() === 0 ? 6 : dateObj.getDay() - 1; // 0-6

                                                        const isScheduled = item.schedules.some(s => s.weekday === dayOfWeek);

                                                        let bgClass = "bg-slate-50 text-slate-500 font-bold hover:bg-slate-100";
                                                        let dotClass = "";

                                                        if (record) {
                                                            if (record.status === 'attended') {
                                                                bgClass = "bg-emerald-500 text-white font-black shadow-md transform hover:scale-110 active:scale-95";
                                                                dotClass = "bg-emerald-200";
                                                            } else if (record.status === 'makeup') {
                                                                bgClass = "bg-amber-400 text-white font-black shadow-md transform hover:scale-110 active:scale-95";
                                                                dotClass = "bg-amber-100";
                                                            } else if (record.status === 'absent') {
                                                                bgClass = "bg-red-500 text-white font-black shadow-md transform hover:scale-110 active:scale-95";
                                                                dotClass = "bg-red-200";
                                                            }
                                                        } else if (isScheduled) {
                                                            bgClass = "bg-white text-indigo-600 font-black border-2 border-indigo-100 shadow-sm";
                                                        }

                                                        return (
                                                            <div key={day} className={`h-10 md:h-12 rounded-xl flex flex-col items-center justify-center text-[10px] md:text-sm transition cursor-default ${bgClass}`} title={record?.absentReason || ''}>
                                                                {day}
                                                                {(record || isScheduled) && (
                                                                    <div className={`w-1 h-1 rounded-full mt-0.5 ${dotClass || (isScheduled ? 'bg-indigo-300' : '')}`}></div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                <div className="flex items-center justify-center gap-3 md:gap-5 mt-6 text-[9px] font-black uppercase tracking-widest text-slate-500 pt-5 border-t border-slate-100">
                                                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm"></div> Học</div>
                                                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm"></div> Bù</div>
                                                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm"></div> Nghỉ</div>
                                                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full border-2 border-indigo-200 bg-white"></div> Lịch</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RevenueBreakdown;
