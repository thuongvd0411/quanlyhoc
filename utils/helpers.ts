
import { Student, StudyRecord, MonthlyStats, Schedule } from '../types';

export const getWeekday = (dateStr: string): number => {
  if (!dateStr) return 0;
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const d = date.getDay(); 
  return d === 0 ? 6 : d - 1; 
};

export const toLocalDateString = (date: Date): string => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const calculateMonthlyStats = (
  history: StudyRecord[] | undefined, 
  schedules: Schedule[] = [],
  month: number, 
  year: number, 
  baseSalary: number = 0
): MonthlyStats => {
  const records = (history || []).filter(r => {
    if (!r?.date) return false;
    const d = new Date(r.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  let totalScheduledSessions = 0;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const scheduledWeekdays = schedules.map(s => s.weekday);

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const wd = date.getDay() === 0 ? 6 : date.getDay() - 1;
    if (scheduledWeekdays.includes(wd)) {
      const sessionsCountOnThisDay = schedules.filter(s => s.weekday === wd).length;
      totalScheduledSessions += sessionsCountOnThisDay;
    }
  }

  const activeRecords = records.filter(r => r.status === 'attended' || r.status === 'makeup');
  const attendedCount = records.filter(r => r.status === 'attended').length;
  const makeupCount = records.filter(r => r.status === 'makeup').length;
  const absentCount = records.filter(r => r.status === 'absent').length;

  const totalSalary = (attendedCount + makeupCount) * baseSalary;

  // Lọc bản ghi hợp lệ (không phải N/A và không bị ignore)
  const knowledgeRecords = activeRecords.filter(r => !r.ignoreMidStats && r.evalNewKnowledge !== 'N/A');
  const quantityRecords = activeRecords.filter(r => !r.ignoreMidStats && r.evalQuantity !== 'N/A');
  const homeworkRecords = activeRecords.filter(r => !r.ignoreEarlyStats && r.homework !== 'N/A');
  const formulaRecords = activeRecords.filter(r => !r.ignoreEarlyStats && r.formulaTest !== 'N/A');
  const oldLessonRecords = activeRecords.filter(r => !r.ignoreEarlyStats && r.oldLessonTest !== 'N/A');
  const regHwRecords = activeRecords.filter(r => !r.ignoreEarlyStats && r.regularHomeworkResult !== 'N/A');
  const testRecords = activeRecords.filter(r => !r.ignoreTestStats && r.testScore !== undefined);
  const assignedRecords = activeRecords.filter(r => !r.ignoreLateStats && r.assignedHomework !== 'N/A');
  const outsideRecords = activeRecords.filter(r => !r.ignoreOutsideStats && r.hasRegularHomework !== 'N/A');

  const avgScores = {
    knowledge: knowledgeRecords.length > 0 ? knowledgeRecords.reduce((s, r) => s + (Number(r.evalNewKnowledge) || 0), 0) / knowledgeRecords.length : 0,
    quantity: quantityRecords.length > 0 ? quantityRecords.reduce((s, r) => s + (Number(r.evalQuantity) || 0), 0) / quantityRecords.length : 0,
    test: testRecords.length > 0 ? testRecords.reduce((s, r) => s + (r.testScore || 0), 0) / testRecords.length : 0,
  };

  const homeworkCounts = {
    none: homeworkRecords.filter(r => r.homework === 'Không làm').length,
    incomplete: homeworkRecords.filter(r => r.homework === 'Làm thiếu').length,
    satisfactory: homeworkRecords.filter(r => r.homework === 'Đạt yêu cầu').length,
  };

  return {
    month, 
    year, 
    totalSessions: totalScheduledSessions, 
    attendedCount, 
    absentCount, 
    makeupCount, 
    totalSalary, 
    avgScores, 
    homeworkCounts,
    formulaPassCount: formulaRecords.filter(r => r.formulaTest === 'Đạt').length,
    oldLessonPassCount: oldLessonRecords.filter(r => r.oldLessonTest === 'Đạt').length,
    regularHomeworkPassCount: regHwRecords.filter(r => r.regularHomeworkResult === 'Hoàn thành').length,
    assignedHomeworkCount: assignedRecords.filter(r => r.assignedHomework === 'Có').length,
    noHomeworkCount: assignedRecords.filter(r => r.assignedHomework === 'Không').length,
    hasRegularHomeworkCount: outsideRecords.filter(r => r.hasRegularHomework === 'Có').length,
    activeCount: activeRecords.length,
    validHomeworkCount: homeworkRecords.length,
    validKnowledgeCount: knowledgeRecords.length,
    validTestCount: testRecords.length,
    validAssignedCount: assignedRecords.length,
    validOutsideCount: outsideRecords.length
  };
};

export const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('vi-VN');
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
};
