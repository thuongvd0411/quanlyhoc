
import React, { useState, useMemo } from 'react';
import { Student, StudyRecord } from '../types';
import { calculateMonthlyStats, formatDate, formatCurrency } from '../utils/helpers';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';

interface Props {
  student: Student;
  onBack: () => void;
  onAddRecord: () => void;
  onEditRecord: (record: StudyRecord) => void;
  onDeleteRecord: (recordId: string) => void;
  hideValues?: boolean;
}

const StudentDetails: React.FC<Props> = ({ student, onBack, onAddRecord, onEditRecord, onDeleteRecord, hideValues = false }) => {
  const [viewMode, setViewMode] = useState<'history' | 'stats'>('stats');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const stats = useMemo(() => 
    calculateMonthlyStats(student?.history, student?.schedules, selectedMonth, selectedYear, student?.baseSalary),
    [student?.history, student?.schedules, selectedMonth, selectedYear, student?.baseSalary]
  );

  const historyByDateDesc = useMemo(() => 
    [...(student?.history || [])].sort((a, b) => b.date.localeCompare(a.date)),
    [student?.history]
  );

  const lastRecord = historyByDateDesc[0];
  const noHomeworkAssignedLastTime = lastRecord && lastRecord.assignedHomework === 'Không' && lastRecord.status !== 'absent' && !lastRecord.ignoreLateStats;
  
  // Cảnh báo nếu tháng này có 3 buổi trở lên không giao bài tập
  const monthHomeworkWarning = stats.noHomeworkCount >= 3;

  const chartData = useMemo(() => {
    return (student?.history || [])
      .filter(r => {
        if (!r?.date) return false;
        const d = new Date(r.date);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear && (r.status === 'attended' || r.status === 'makeup');
      })
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(r => ({
        date: r.date.split('-')[2],
        knowledge: (r.ignoreMidStats || r.evalNewKnowledge === 'N/A') ? null : r.evalNewKnowledge,
        quantity: (r.ignoreMidStats || r.evalQuantity === 'N/A') ? null : r.evalQuantity,
        test: (r.ignoreTestStats || r.testScore === undefined) ? null : r.testScore
      }));
  }, [student?.history, selectedMonth, selectedYear]);

  // Pie Charts Data
  const hwPieData = [
    { name: 'Hoàn thành', value: stats.homeworkCounts.satisfactory },
    { name: 'Chưa đạt', value: stats.homeworkCounts.incomplete },
    { name: 'Không làm', value: stats.homeworkCounts.none }
  ].filter(d => d.value > 0);

  const formulaPieData = [
    { name: 'Đạt công thức', value: stats.formulaPassCount },
    { name: 'Chưa đạt', value: Math.max(0, stats.validHomeworkCount - stats.formulaPassCount) }
  ].filter(d => d.value > 0);

  const regHwPieData = [
    { name: 'Hoàn thành', value: stats.regularHomeworkPassCount },
    { name: 'Chưa xong', value: Math.max(0, stats.validHomeworkCount - stats.regularHomeworkPassCount) }
  ].filter(d => d.value > 0);

  const assignedHwPieData = [
    { name: 'Có giao', value: stats.assignedHomeworkCount },
    { name: 'Không giao', value: Math.max(0, stats.validAssignedCount - stats.assignedHomeworkCount) }
  ].filter(d => d.value > 0);

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1', '#a855f7', '#94a3b8'];

  const getDayName = (day: number) => day === 6 ? 'Chủ Nhật' : `Thứ ${day + 2}`;

  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={8} fontWeight="bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-10">
      {/* Cảnh báo gắt nếu tháng này lười giao bài */}
      {monthHomeworkWarning && (
        <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top duration-500">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 font-black shrink-0">!</div>
          <div className="min-w-0">
            <h4 className="text-xs font-black text-amber-800 uppercase tracking-widest">Cảnh báo đào tạo hàng tháng</h4>
            <p className="text-xs font-bold text-amber-600">Tháng này đã có {stats.noHomeworkCount} buổi không giao bài tập mới. Cần chú ý đảm bảo lộ trình!</p>
          </div>
        </div>
      )}

      {noHomeworkAssignedLastTime && (
        <div className="bg-red-50 border-2 border-red-200 p-4 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top duration-500">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-black shrink-0">!</div>
          <div className="min-w-0">
            <h4 className="text-xs font-black text-red-800 uppercase tracking-widest">Cảnh báo buổi học gần nhất</h4>
            <p className="text-xs font-bold text-red-600">Buổi học ngày {formatDate(lastRecord.date)} đã được ghi nhận là KHÔNG giao bài tập về nhà.</p>
          </div>
        </div>
      )}

      <div className="bg-white p-4 md:p-8 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 md:gap-6">
            <button onClick={onBack} className="p-3 md:p-4 hover:bg-slate-50 rounded-2xl transition border border-slate-100 shadow-sm"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg></button>
            <div className="min-w-0">
              <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter truncate">{student?.fullName}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="bg-indigo-600 text-white text-[8px] md:text-[10px] px-2 py-0.5 md:py-1 rounded-full font-black uppercase tracking-widest">{student?.className}</span>
                <span className="bg-green-100 text-green-700 text-[8px] md:text-[10px] px-2 py-0.5 md:py-1 rounded-full font-black uppercase tracking-widest">{hideValues ? '•••• ₫' : `${formatCurrency(student?.baseSalary)} / Ca`}</span>
              </div>
            </div>
          </div>
          <button onClick={onAddRecord} className="w-full md:w-auto bg-indigo-600 text-white px-6 md:px-10 py-3 md:py-4 rounded-2xl font-black hover:bg-indigo-700 transition flex items-center justify-center gap-3 shadow-xl active:scale-95 text-xs md:text-sm uppercase tracking-widest">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Cập nhật tiến độ
          </button>
        </div>
      </div>

      <div className="flex p-1.5 bg-slate-200/50 rounded-2xl w-fit mx-auto md:mx-0">
        <button onClick={() => setViewMode('stats')} className={`px-6 md:px-10 py-2.5 md:py-3.5 rounded-xl font-black text-xs md:text-sm transition ${viewMode === 'stats' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}>THỐNG KÊ CHI TIẾT</button>
        <button onClick={() => setViewMode('history')} className={`px-6 md:px-10 py-2.5 md:py-3.5 rounded-xl font-black text-xs md:text-sm transition ${viewMode === 'history' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}>LỊCH SỬ CHI TIẾT</button>
      </div>

      {viewMode === 'stats' ? (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
          <div className="flex flex-wrap items-center gap-3 bg-white p-4 md:p-6 rounded-3xl border border-slate-200 shadow-sm">
            <span className="font-black text-slate-700 text-[10px] md:text-xs uppercase">Thời gian:</span>
            <div className="flex gap-2">
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="px-3 md:px-5 py-2 border-2 border-slate-100 rounded-xl font-black text-xs md:text-sm outline-none">
                {Array.from({length: 12}).map((_, i) => <option key={i} value={i}>Tháng {i + 1}</option>)}
              </select>
              <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="px-3 md:px-5 py-2 border-2 border-slate-100 rounded-xl font-black text-xs md:text-sm outline-none">
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-indigo-600 p-6 md:p-8 rounded-[32px] md:rounded-[40px] shadow-xl shadow-indigo-100 text-white">
              <p className="text-indigo-200 text-[10px] font-black uppercase mb-3 tracking-widest">Tiền lương tháng {selectedMonth + 1}</p>
              <div className="text-2xl md:text-3xl font-black">{hideValues ? '•••• ₫' : formatCurrency(stats.totalSalary)}</div>
              <p className="text-[10px] text-indigo-200 font-bold mt-2 uppercase">Dựa trên: {stats.attendedCount + stats.makeupCount} buổi học</p>
            </div>
            <div className="bg-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-slate-200 shadow-sm">
              <p className="text-slate-400 text-[10px] font-black uppercase mb-3 tracking-widest">Chuyên cần</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl md:text-4xl font-black text-slate-800">{stats.attendedCount}</span>
                <span className="text-slate-300 font-bold">/ {stats.totalSessions} ca học</span>
              </div>
              <div className="flex gap-3 mt-2 text-[10px] font-black">
                <span className="text-amber-500">Bù: {stats.makeupCount}</span>
                <span className="text-red-500">Nghỉ: {stats.absentCount}</span>
              </div>
            </div>
            <div className="bg-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-slate-200 shadow-sm col-span-1 md:col-span-2">
              <p className="text-slate-400 text-[10px] font-black uppercase mb-3 tracking-widest">Tổng kết báo cáo tháng {selectedMonth + 1}</p>
              <div className="text-xs md:text-sm font-medium text-slate-600 leading-relaxed">
                Tháng <span className="font-black text-slate-800">{selectedMonth + 1}</span>, học sinh có <span className="font-black text-slate-800">{stats.totalSessions}</span> ca học cố định. 
                Ghi nhận <span className="font-black text-green-600">{stats.attendedCount + stats.makeupCount}</span> buổi đi học.
                Có <span className="font-black text-amber-600">{stats.noHomeworkCount}</span> buổi giáo viên không giao bài tập mới.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center">
              <h3 className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Bài tập về nhà (%)</h3>
              <div className="h-40 w-full">
                {hwPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={hwPieData} cx="50%" cy="50%" labelLine={false} label={renderLabel} innerRadius={35} outerRadius={50} paddingAngle={5} dataKey="value">
                        {hwPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: '9px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="h-full flex items-center justify-center italic text-slate-300 text-[10px]">Trống</div>}
              </div>
            </div>
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center">
              <h3 className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Đạt công thức (%)</h3>
              <div className="h-40 w-full">
                {formulaPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={formulaPieData} cx="50%" cy="50%" labelLine={false} label={renderLabel} innerRadius={35} outerRadius={50} paddingAngle={5} dataKey="value">
                        {formulaPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.name === 'Đạt công thức' ? '#10b981' : '#f43f5e'} />)}
                      </Pie>
                      <Tooltip />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: '9px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="h-full flex items-center justify-center italic text-slate-300 text-[10px]">Trống</div>}
              </div>
            </div>
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center">
              <h3 className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Bài tập TX (%)</h3>
              <div className="h-40 w-full">
                {regHwPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={regHwPieData} cx="50%" cy="50%" labelLine={false} label={renderLabel} innerRadius={35} outerRadius={50} paddingAngle={5} dataKey="value">
                        {regHwPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.name === 'Hoàn thành' ? '#a855f7' : '#94a3b8'} />)}
                      </Pie>
                      <Tooltip />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: '9px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="h-full flex items-center justify-center italic text-slate-300 text-[10px]">Trống</div>}
              </div>
            </div>
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center">
              <h3 className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Giao bài mới (%)</h3>
              <div className="h-40 w-full">
                {assignedHwPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={assignedHwPieData} cx="50%" cy="50%" labelLine={false} label={renderLabel} innerRadius={35} outerRadius={50} paddingAngle={5} dataKey="value">
                        {assignedHwPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.name === 'Có giao' ? '#6366f1' : '#cbd5e1'} />)}
                      </Pie>
                      <Tooltip />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: '9px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="h-full flex items-center justify-center italic text-slate-300 text-[10px]">Trống</div>}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 mb-6 uppercase tracking-tighter">Biểu đồ Điểm kiểm tra định kỳ</h3>
            <div className="h-64 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.filter(d => d.test !== null)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                  <YAxis domain={[0, 10]} stroke="#94a3b8" fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="test" name="Điểm kiểm tra" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Điểm trung bình định kỳ</span>
              <div className="text-3xl font-black text-emerald-600">{stats.avgScores.test.toFixed(2)}</div>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 mb-6 uppercase tracking-tighter">Tiến độ Trong buổi (Tiến độ & Số lượng bài)</h3>
            <div className="h-64 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                  <YAxis domain={[0, 10]} stroke="#94a3b8" fontSize={10} />
                  <Tooltip />
                  <Legend verticalAlign="top" height={36} iconSize={10} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                  <Line type="monotone" name="Kiến thức mới" dataKey="knowledge" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} connectNulls={false} />
                  <Line type="monotone" name="Số lượng bài" dataKey="quantity" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} connectNulls={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-4 md:p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[120px]">Ngày học</th>
                  <th className="p-4 md:p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Trạng thái</th>
                  <th className="p-4 md:p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tiến độ / Điểm</th>
                  <th className="p-4 md:p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyByDateDesc.length === 0 ? (
                  <tr><td colSpan={4} className="p-20 text-center text-slate-300 italic font-medium">Chưa có dữ liệu</td></tr>
                ) : (
                  historyByDateDesc.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50 transition group">
                      <td className="p-4 md:p-6">
                        <div className="font-black text-slate-800 text-sm">{formatDate(r.date)}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">{getDayName(r.weekday)} — {r.session}</div>
                      </td>
                      <td className="p-4 md:p-6 text-center">
                        <span className={`px-3 md:px-5 py-1.5 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest ${
                          r.status === 'attended' ? 'bg-green-100 text-green-700' : 
                          r.status === 'makeup' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {r.status === 'attended' ? 'ĐI HỌC' : r.status === 'makeup' ? 'HỌC BÙ' : 'VẮNG MẶT'}
                        </span>
                      </td>
                      <td className="p-4 md:p-6">
                        {r.status !== 'absent' ? (
                          <div className="flex flex-col gap-1">
                            {!r.ignoreMidStats ? (
                              <>
                                <div className="flex justify-between items-center w-32"><span className="text-[9px] text-slate-400 font-bold uppercase">KIẾN THỨC</span><span className="text-[10px] font-black text-indigo-600">{r.evalNewKnowledge}</span></div>
                                <div className="flex justify-between items-center w-32"><span className="text-[9px] text-slate-400 font-bold uppercase">SỐ LƯỢNG</span><span className="text-[10px] font-black text-indigo-600">{r.evalQuantity}</span></div>
                              </>
                            ) : (
                              <div className="text-[9px] text-slate-300 italic font-bold uppercase">Bỏ qua thống kê tiến độ</div>
                            )}
                            {r.testScore !== undefined && !r.ignoreTestStats ? (
                              <div className="flex justify-between items-center w-32 border-t border-slate-100 mt-1 pt-1"><span className="text-[9px] text-emerald-600 font-black uppercase">ĐIỂM ĐỊNH KỲ</span><span className="text-[10px] font-black text-emerald-700">{r.testScore.toFixed(2)}</span></div>
                            ) : r.testScore !== undefined && (
                              <div className="text-[9px] text-slate-300 italic font-bold uppercase mt-1">Điểm: {r.testScore.toFixed(2)} (Bỏ qua TK)</div>
                            )}
                          </div>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="p-4 md:p-6 text-right space-x-2">
                        <button onClick={() => onEditRecord(r)} className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                        <button onClick={() => { if(window.confirm('Xóa bản ghi này?')) onDeleteRecord(r.id); }} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDetails;
