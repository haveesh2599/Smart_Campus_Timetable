export type DayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday';

export type WorkspaceView =
  | 'locator'
  | 'blocks'
  | 'daily'
  | 'manager';

export interface Department {
  id: string;
  code: string;
  name: string;
  blockId: string;
}

export interface AcademicBlock {
  id: string;
  code: string;
  name: string;
  wingDescription: string;
  floors: number;
  landmark: string;
}

export interface Classroom {
  id: string;
  blockId: string;
  roomNumber: string;
  floor: string;
  capacity: number;
  roomType: 'Lecture Hall' | 'Seminar Room' | 'Computing Lab' | 'Engineering Lab';
}

export interface FacultyMember {
  id: string;
  name: string;
  designation: string;
  departmentId: string;
  email: string;
  cabinLocation: string;
  avatarUrl?: string;
  specialization: string;
}

export interface TimetableEntry {
  id: string;
  facultyId: string;
  departmentId: string;
  subjectName: string;
  subjectCode: string;
  sectionName: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // HH:MM 24h
  endTime: string; // HH:MM 24h
  blockId: string;
  classroomId: string;
}

export type ModificationType =
  | 'cancel'
  | 'postpone'
  | 'change_classroom'
  | 'change_timing';

export type ModificationScope = 'one_time' | 'permanent';

export interface ScheduleChange {
  id: string;
  timetableId: string;
  modificationType: ModificationType;
  modificationScope: ModificationScope;
  affectedDate: string; // YYYY-MM-DD (used for one_time date or permanent effectiveDate)
  newStartTime?: string;
  newEndTime?: string;
  newBlockId?: string;
  newClassroomId?: string;
  reason: string;
  createdByFacultyId: string;
  createdAt: string;
}

export interface ConflictWarning {
  type: 'faculty' | 'classroom' | 'section' | 'validation';
  title: string;
  message: string;
  conflictingEntryId?: string;
}

export interface ResolvedScheduleSlot {
  timetableId: string;
  facultyId: string;
  departmentId: string;
  subjectName: string;
  subjectCode: string;
  sectionName: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  blockId: string;
  classroomId: string;
  isCancelled: boolean;
  activeChange?: ScheduleChange;
  originalStartTime?: string;
  originalEndTime?: string;
  originalBlockId?: string;
  originalClassroomId?: string;
}

export interface FacultyAvailabilityResult {
  status: 'in_class' | 'cancelled_now' | 'free';
  currentSlot: ResolvedScheduleSlot | null;
  nextSlot: ResolvedScheduleSlot | null;
  nextSlotDayLabel: string | null;
  todaySlots: ResolvedScheduleSlot[];
}
