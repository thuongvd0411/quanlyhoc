import React, { useState, useMemo } from 'react';
import { Student } from '../types';
import { calculateMonthlyStats, formatCurrency } from '../utils/helpers';

interface Props {
    students: Student[];
    hideValues: boolean;
}

const RevenueBreakdown: React.FC<Props> = ({ students, hideValues }) => {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [isExpanded, setIsExpanded] = useState(false);

    const statsBreakdown = useMemo(() => {
        let total = 0;
        const details: { name: string; className: string; amount: number; sessions: number }[] = [];

        students.forEach(student => {
            if (!student) return;
            const stats = calculateMonthlyStats(student.history, student.schedules, selectedMonth, selectedYear, student.baseSalary);
            const studentTotal = stats.totalSalary || 0;

            if (studentTotal > 0 || stats.totalSessions > 0) { // Show if they had potential revenue or actual revenue
                details.push({
                    name: student.fullName,
                    className: student.className,
                    amount: studentTotal,
                    sessions: stats.attendedCount + stats.makeupCount
                });
                total += studentTotal;
            }
        });

        details.sort((a, b) => b.amount - a.amount); // Sort by highest revenue

        return { total, details };
    }, [students, selectedMonth, selectedYear]);

    return (
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden">
            {/* Header / Summary */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className={`p-6 md:p-8 cursor-pointer transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${isExpanded ? 'bg-indigo-50 border-b border-indigo-100' : 'hover:bg-slate-50'}`}
            >
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                        </div>
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Doanh Thu Tạm Tính</h2>
                    </div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-13">Tháng {selectedMonth + 1} / {selectedYear}</p>
                </div>

                <div className="flex flex-col items-end gap-1">
                    <div className="text-3xl md:text-4xl font-black text-emerald-600 tracking-tighter">
                        {hideValues ? '•••••••• ₫' : formatCurrency(statsBreakdown.total)}
                    </div>
                    <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1">
                        {isExpanded ? 'Bấm để Thu Gọn' : 'Bấm để Mở Rộng Báo Cáo'}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9" /></svg>
                    </div>
                </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="p-6 md:p-8 animate-in fade-in slide-in-from-top-4 duration-300 bg-slate-50/50">
                    <div className="flex flex-wrap items-center gap-3 mb-6 bg-white p-3 rounded-2xl border border-slate-200 w-fit">
                        <span className="font-black text-slate-700 text-[10px] md:text-xs uppercase ml-2">Lọc theo:</span>
                        <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="px-4 py-2 border-2 border-slate-100 rounded-xl font-black text-xs outline-none bg-slate-50 focus:border-indigo-500">
                            {Array.from({ length: 12 }).map((_, i) => <option key={i} value={i}>Tháng {i + 1}</option>)}
                        </select>
                        <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="px-4 py-2 border-2 border-slate-100 rounded-xl font-black text-xs outline-none bg-slate-50 focus:border-indigo-500">
                            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>

                    <div className="space-y-3">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2 mb-4">Chi tiết từng học sinh</h3>
                        {statsBreakdown.details.length === 0 ? (
                            <div className="text-center p-8 text-slate-400 font-bold italic text-sm bg-white rounded-2xl border border-slate-100">Không có dữ liệu doanh thu cho kỳ này.</div>
                        ) : (
                            statsBreakdown.details.map((item, idx) => (
                                <div key={idx} className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center justify-between hover:border-emerald-200 transition group shadow-sm">
                                    <div className="flex flex-col gap-1">
                                        <span className="font-black text-slate-800 text-sm md:text-base">{item.name}</span>
                                        <div className="flex gap-2">
                                            <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase">{item.className}</span>
                                            <span className="text-[9px] font-black bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full uppercase">{item.sessions} ca thực tế</span>
                                        </div>
                                    </div>
                                    <div className="font-black text-emerald-600 text-base md:text-lg group-hover:scale-105 transition-transform">
                                        {hideValues ? '•••• ₫' : formatCurrency(item.amount)}
                                    </div>
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
