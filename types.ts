
export type SessionType = 'Sáng' | 'Chiều' | 'Tối';
export type HomeworkStatus = 'Không làm' | 'Làm thiếu' | 'Đạt yêu cầu' | 'N/A';
export type RegularHomeworkResult = 'Hoàn thành' | 'Không hoàn thành' | 'N/A';
export type AttendanceStatus = 'attended' | 'absent' | 'makeup';

export type TriStateResult = 'Đạt' | 'Chưa đạt' | 'N/A';
export type YesNoNAResult = 'Có' | 'Không' | 'N/A';

export interface Schedule {
  id: string;
  weekday: number; // 0 (T2) -> 6 (CN)
  session: SessionType;
}

export interface MockTest {
  id: string;
  date: string;
  score: number;
}

export interface StudyRecord {
  id: string;
  date: string; // YYYY-MM-DD
  weekday: number; // 0 -> 6
  session: SessionType;
  status: AttendanceStatus;
  absentReason?: string;
  
  // Đầu buổi
  homework: HomeworkStatus;
  formulaTest: TriStateResult;
  oldLessonTest: TriStateResult;
  regularHomeworkResult: RegularHomeworkResult;
  ignoreEarlyStats: boolean; 

  // Trong buổi
  evalNewKnowledge: number | 'N/A';
  evalQuantity: number | 'N/A';
  ignoreMidStats: boolean; 
  
  // Cuối buổi
  assignedHomework: YesNoNAResult;
  ignoreLateStats: boolean; 
  
  // Ngoài buổi
  hasRegularHomework: YesNoNAResult;
  ignoreOutsideStats: boolean;

  // Điểm kiểm tra định kỳ
  testScore?: number;
  ignoreTestStats: boolean; 
  
  mockTests: MockTest[];
}

export interface Student {
  id: string;
  fullName: string;
  className: string;
  baseSalary: number;
  schedules: Schedule[];
  history: StudyRecord[];
}

export interface MonthlyStats {
  month: number;
  year: number;
  totalSessions: number;
  attendedCount: number;
  absentCount: number;
  makeupCount: number;
  totalSalary: number;
  avgScores: {
    knowledge: number;
    quantity: number;
    test: number;
  };
  homeworkCounts: {
    none: number;
    incomplete: number;
    satisfactory: number;
  };
  formulaPassCount: number;
  oldLessonPassCount: number;
  assignedHomeworkCount: number;
  noHomeworkCount: number; // Đếm số buổi không giao bài tập
  regularHomeworkPassCount: number;
  hasRegularHomeworkCount: number;
  activeCount: number;
  validHomeworkCount: number;
  validKnowledgeCount: number;
  validTestCount: number;
  validAssignedCount: number;
  validOutsideCount: number;
}
