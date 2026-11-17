import { DAYS_OF_WEEK } from '../data/mockCampusData';
import {
  AcademicBlock,
  Classroom,
  ConflictWarning,
  DayOfWeek,
  FacultyAvailabilityResult,
  FacultyMember,
  ResolvedScheduleSlot,
  ScheduleChange,
  TimetableEntry,
} from '../types/campus';

export function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export function formatTimeDisplay(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${period}`;
}

export function getDayOfWeekFromDateStr(dateStr: string): DayOfWeek {
  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dayIdx = dateObj.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
  if (dayIdx === 0) return 'Monday'; // Sunday shows Monday as next academic day or empty
  return DAYS_OF_WEEK[dayIdx - 1] || 'Monday';
}

export function isSundayDate(dateStr: string): boolean {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).getDay() === 0;
}

export function resolveEffectiveScheduleForDate(
  timetables: TimetableEntry[],
  scheduleChanges: ScheduleChange[],
  targetDateStr: string
): ResolvedScheduleSlot[] {
  if (isSundayDate(targetDateStr)) {
    return [];
  }

  const targetDay = getDayOfWeekFromDateStr(targetDateStr);
  const dayEntries = timetables.filter((entry) => entry.dayOfWeek === targetDay);

  return dayEntries.map((entry) => {
    // Check permanent changes effective on or before targetDateStr (latest one wins)
    const permanentChanges = scheduleChanges
      .filter(
        (c) =>
          c.timetableId === entry.id &&
          c.modificationScope === 'permanent' &&
          c.affectedDate <= targetDateStr
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    // Check one-time changes strictly for targetDateStr (latest one wins)
    const oneTimeChanges = scheduleChanges
      .filter(
        (c) =>
          c.timetableId === entry.id &&
          c.modificationScope === 'one_time' &&
          c.affectedDate === targetDateStr
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const effectivePermanent = permanentChanges[0];
    const effectiveOneTime = oneTimeChanges[0];

    // Base after permanent change (if any)
    let startTime = effectivePermanent?.newStartTime || entry.startTime;
    let endTime = effectivePermanent?.newEndTime || entry.endTime;
    let blockId = effectivePermanent?.newBlockId || entry.blockId;
    let classroomId = effectivePermanent?.newClassroomId || entry.classroomId;
    let isCancelled = effectivePermanent?.modificationType === 'cancel';
    let activeChange: ScheduleChange | undefined = effectivePermanent;

    // One-time change overrides permanent for that specific date without overwriting recurring data
    if (effectiveOneTime) {
      activeChange = effectiveOneTime;
      if (effectiveOneTime.modificationType === 'cancel') {
        isCancelled = true;
      } else {
        isCancelled = false;
        if (effectiveOneTime.newStartTime) startTime = effectiveOneTime.newStartTime;
        if (effectiveOneTime.newEndTime) endTime = effectiveOneTime.newEndTime;
        if (effectiveOneTime.newBlockId) blockId = effectiveOneTime.newBlockId;
        if (effectiveOneTime.newClassroomId) classroomId = effectiveOneTime.newClassroomId;
      }
    }

    return {
      timetableId: entry.id,
      facultyId: entry.facultyId,
      departmentId: entry.departmentId,
      subjectName: entry.subjectName,
      subjectCode: entry.subjectCode,
      sectionName: entry.sectionName,
      dayOfWeek: entry.dayOfWeek,
      startTime,
      endTime,
      blockId,
      classroomId,
      isCancelled,
      activeChange,
      originalStartTime: entry.startTime,
      originalEndTime: entry.endTime,
      originalBlockId: entry.blockId,
      originalClassroomId: entry.classroomId,
    };
  });
}

export function getFacultyAvailability(
  facultyId: string,
  timetables: TimetableEntry[],
  scheduleChanges: ScheduleChange[],
  referenceDateStr: string,
  referenceTimeStr: string
): FacultyAvailabilityResult {
  const nowMinutes = timeToMinutes(referenceTimeStr);
  const todayResolved = resolveEffectiveScheduleForDate(
    timetables,
    scheduleChanges,
    referenceDateStr
  )
    .filter((slot) => slot.facultyId === facultyId)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  // Check if there is an active slot right now
  const activeSlotNow = todayResolved.find((slot) => {
    const start = timeToMinutes(slot.startTime);
    const end = timeToMinutes(slot.endTime);
    return nowMinutes >= start && nowMinutes < end;
  });

  if (activeSlotNow) {
    if (activeSlotNow.isCancelled) {
      // Find next non-cancelled class today or later this week
      const nextToday = todayResolved.find(
        (slot) => !slot.isCancelled && timeToMinutes(slot.startTime) > nowMinutes
      );
      if (nextToday) {
        return {
          status: 'cancelled_now',
          currentSlot: activeSlotNow,
          nextSlot: nextToday,
          nextSlotDayLabel: 'Later Today',
          todaySlots: todayResolved,
        };
      }
      const nextWeekSlot = findNextUpcomingDaySlot(
        facultyId,
        timetables,
        scheduleChanges,
        referenceDateStr
      );
      return {
        status: 'cancelled_now',
        currentSlot: activeSlotNow,
        nextSlot: nextWeekSlot.slot,
        nextSlotDayLabel: nextWeekSlot.dayLabel,
        todaySlots: todayResolved,
      };
    }

    return {
      status: 'in_class',
      currentSlot: activeSlotNow,
      nextSlot:
        todayResolved.find(
          (slot) =>
            !slot.isCancelled &&
            slot.timetableId !== activeSlotNow.timetableId &&
            timeToMinutes(slot.startTime) >= timeToMinutes(activeSlotNow.endTime)
        ) || null,
      nextSlotDayLabel: 'Later Today',
      todaySlots: todayResolved,
    };
  }

  // No scheduled class right now -> find next upcoming non-cancelled class today
  const nextToday = todayResolved.find(
    (slot) => !slot.isCancelled && timeToMinutes(slot.startTime) > nowMinutes
  );

  if (nextToday) {
    return {
      status: 'free',
      currentSlot: null,
      nextSlot: nextToday,
      nextSlotDayLabel: 'Later Today',
      todaySlots: todayResolved,
    };
  }

  const nextWeekSlot = findNextUpcomingDaySlot(
    facultyId,
    timetables,
    scheduleChanges,
    referenceDateStr
  );

  return {
    status: 'free',
    currentSlot: null,
    nextSlot: nextWeekSlot.slot,
    nextSlotDayLabel: nextWeekSlot.dayLabel,
    todaySlots: todayResolved,
  };
}

function findNextUpcomingDaySlot(
  facultyId: string,
  timetables: TimetableEntry[],
  scheduleChanges: ScheduleChange[],
  referenceDateStr: string
): { slot: ResolvedScheduleSlot | null; dayLabel: string | null } {
  const [y, m, d] = referenceDateStr.split('-').map(Number);
  const baseDate = new Date(y, m - 1, d);

  for (let offset = 1; offset <= 7; offset++) {
    const nextDate = new Date(baseDate);
    nextDate.setDate(baseDate.getDate() + offset);
    const yyyy = nextDate.getFullYear();
    const mm = String(nextDate.getMonth() + 1).padStart(2, '0');
    const dd = String(nextDate.getDate()).padStart(2, '0');
    const nextStr = `${yyyy}-${mm}-${dd}`;
    if (isSundayDate(nextStr)) continue;

    const slots = resolveEffectiveScheduleForDate(timetables, scheduleChanges, nextStr)
      .filter((s) => s.facultyId === facultyId && !s.isCancelled)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

    if (slots.length > 0) {
      const label = offset === 1 ? `Tomorrow (${slots[0].dayOfWeek})` : slots[0].dayOfWeek;
      return { slot: slots[0], dayLabel: label };
    }
  }

  return { slot: null, dayLabel: null };
}

export function detectTimetableConflicts(
  candidate: Omit<TimetableEntry, 'id'>,
  existingEntries: TimetableEntry[],
  facultyList: FacultyMember[],
  blocks: AcademicBlock[],
  classrooms: Classroom[],
  ignoreEntryId?: string
): ConflictWarning[] {
  const warnings: ConflictWarning[] = [];

  const candStart = timeToMinutes(candidate.startTime);
  const candEnd = timeToMinutes(candidate.endTime);

  if (Number.isNaN(candStart) || Number.isNaN(candEnd) || candEnd <= candStart) {
    warnings.push({
      type: 'validation',
      title: 'Invalid Time Range',
      message: 'Class end time must be later than start time.',
    });
    return warnings;
  }

  const sameDayEntries = existingEntries.filter(
    (e) => e.dayOfWeek === candidate.dayOfWeek && e.id !== ignoreEntryId
  );

  for (const existing of sameDayEntries) {
    const exStart = timeToMinutes(existing.startTime);
    const exEnd = timeToMinutes(existing.endTime);

    const overlaps = candStart < exEnd && candEnd > exStart;
    if (!overlaps) continue;

    const existingFaculty = facultyList.find((f) => f.id === existing.facultyId);
    const existingRoom = classrooms.find((c) => c.id === existing.classroomId);
    const existingBlock = blocks.find((b) => b.id === existing.blockId);

    // 1. Faculty conflict
    if (existing.facultyId === candidate.facultyId) {
      warnings.push({
        type: 'faculty',
        title: 'Faculty Conflict',
        message: `${existingFaculty?.name || 'This faculty member'} is already scheduled for ${existing.subjectName} (${existing.sectionName}) on ${existing.dayOfWeek} from ${formatTimeDisplay(existing.startTime)} to ${formatTimeDisplay(existing.endTime)}.`,
        conflictingEntryId: existing.id,
      });
    }

    // 2. Classroom conflict
    if (existing.classroomId === candidate.classroomId) {
      warnings.push({
        type: 'classroom',
        title: 'Classroom Conflict',
        message: `${existingBlock?.code || ''} Room ${existingRoom?.roomNumber || ''} is already occupied on ${existing.dayOfWeek} (${formatTimeDisplay(existing.startTime)}–${formatTimeDisplay(existing.endTime)}) by ${existingFaculty?.name || 'another class'} (${existing.sectionName}).`,
        conflictingEntryId: existing.id,
      });
    }

    // 3. Section conflict
    if (existing.sectionName === candidate.sectionName) {
      warnings.push({
        type: 'section',
        title: 'Section Conflict',
        message: `Section ${existing.sectionName} already has ${existing.subjectName} scheduled on ${existing.dayOfWeek} (${formatTimeDisplay(existing.startTime)}–${formatTimeDisplay(existing.endTime)}) with ${existingFaculty?.name || 'another faculty'}.`,
        conflictingEntryId: existing.id,
      });
    }
  }

  return warnings;
}
