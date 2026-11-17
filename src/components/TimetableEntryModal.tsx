import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import {
  AcademicBlock,
  Classroom,
  DayOfWeek,
  Department,
  FacultyMember,
  TimetableEntry,
} from '../types/campus';
import { DAYS_OF_WEEK, SECTIONS } from '../data/mockCampusData';
import { detectTimetableConflicts } from '../utils/scheduleEngine';

interface TimetableEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingEntry: TimetableEntry | null;
  defaultFacultyId: string;
  facultyList: FacultyMember[];
  departments: Department[];
  blocks: AcademicBlock[];
  classrooms: Classroom[];
  existingEntries: TimetableEntry[];
  onSave: (entry: Omit<TimetableEntry, 'id'>, existingId?: string) => void;
}

export const TimetableEntryModal: React.FC<TimetableEntryModalProps> = ({
  isOpen,
  onClose,
  editingEntry,
  defaultFacultyId,
  facultyList,
  departments,
  blocks,
  classrooms,
  existingEntries,
  onSave,
}) => {
  const initialFaculty =
    facultyList.find(
      (f) => f.id === (editingEntry?.facultyId || defaultFacultyId)
    ) || facultyList[0];

  const [facultyId, setFacultyId] = useState<string>(
    editingEntry?.facultyId || initialFaculty.id
  );
  const [departmentId, setDepartmentId] = useState<string>(
    editingEntry?.departmentId || initialFaculty.departmentId
  );
  const [subjectName, setSubjectName] = useState<string>(
    editingEntry?.subjectName || ''
  );
  const [subjectCode, setSubjectCode] = useState<string>(
    editingEntry?.subjectCode || ''
  );
  const [sectionName, setSectionName] = useState<string>(
    editingEntry?.sectionName || SECTIONS[0]
  );
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>(
    editingEntry?.dayOfWeek || 'Tuesday'
  );
  const [startTime, setStartTime] = useState<string>(
    editingEntry?.startTime || '10:00'
  );
  const [endTime, setEndTime] = useState<string>(
    editingEntry?.endTime || '11:00'
  );
  const [blockId, setBlockId] = useState<string>(
    editingEntry?.blockId || blocks[0].id
  );
  const [classroomId, setClassroomId] = useState<string>(
    editingEntry?.classroomId ||
      classrooms.find((c) => c.blockId === (editingEntry?.blockId || blocks[0].id))
        ?.id ||
      classrooms[0].id
  );

  const availableRooms = useMemo(
    () => classrooms.filter((c) => c.blockId === blockId),
    [classrooms, blockId]
  );

  const handleFacultyChange = (newFacultyId: string) => {
    setFacultyId(newFacultyId);
    const matched = facultyList.find((f) => f.id === newFacultyId);
    if (matched) {
      setDepartmentId(matched.departmentId);
    }
  };

  const handleBlockChange = (newBlockId: string) => {
    setBlockId(newBlockId);
    const firstRoom = classrooms.find((c) => c.blockId === newBlockId);
    if (firstRoom) {
      setClassroomId(firstRoom.id);
    }
  };

  const conflicts = useMemo(() => {
    return detectTimetableConflicts(
      {
        facultyId,
        departmentId,
        subjectName: subjectName.trim() || 'Untitled Subject',
        subjectCode: subjectCode.trim() || 'SUB-101',
        sectionName,
        dayOfWeek,
        startTime,
        endTime,
        blockId,
        classroomId,
      },
      existingEntries,
      facultyList,
      blocks,
      classrooms,
      editingEntry?.id
    );
  }, [
    facultyId,
    departmentId,
    subjectName,
    subjectCode,
    sectionName,
    dayOfWeek,
    startTime,
    endTime,
    blockId,
    classroomId,
    existingEntries,
    facultyList,
    blocks,
    classrooms,
    editingEntry?.id,
  ]);

  if (!isOpen) return null;

  const canSave =
    conflicts.length === 0 &&
    subjectName.trim().length > 0 &&
    subjectCode.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    onSave(
      {
        facultyId,
        departmentId,
        subjectName: subjectName.trim(),
        subjectCode: subjectCode.trim().toUpperCase(),
        sectionName,
        dayOfWeek,
        startTime,
        endTime,
        blockId,
        classroomId,
      },
      editingEntry?.id
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="timetable-entry-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs overflow-y-auto"
    >
      <div className="my-8 w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2
              id="timetable-entry-modal-title"
              className="font-display text-lg font-bold text-slate-900"
            >
              {editingEntry ? 'Edit Timetable Entry' : 'Create Timetable Entry'}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Schedule a weekly recurring class. Conflicts across faculty,
              classrooms, and sections are checked automatically.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close timetable entry dialog"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="tt-faculty"
                className="block text-xs font-semibold text-slate-700"
              >
                Faculty Name
              </label>
              <select
                id="tt-faculty"
                value={facultyId}
                onChange={(e) => handleFacultyChange(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              >
                {facultyList.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="tt-department"
                className="block text-xs font-semibold text-slate-700"
              >
                Department
              </label>
              <select
                id="tt-department"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code} — {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="tt-subject"
                className="block text-xs font-semibold text-slate-700"
              >
                Subject Name
              </label>
              <input
                id="tt-subject"
                type="text"
                required
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="e.g. Computer Networks"
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="tt-code"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Subject Code
                </label>
                <input
                  id="tt-code"
                  type="text"
                  required
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value)}
                  placeholder="CS-402"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="tt-section"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Class / Section
                </label>
                <select
                  id="tt-section"
                  value={sectionName}
                  onChange={(e) => setSectionName(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                >
                  {SECTIONS.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="tt-day"
                className="block text-xs font-semibold text-slate-700"
              >
                Day of the Week
              </label>
              <select
                id="tt-day"
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value as DayOfWeek)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              >
                {DAYS_OF_WEEK.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="tt-start"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Start Time
                </label>
                <input
                  id="tt-start"
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 tabular-nums focus:border-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="tt-end"
                  className="block text-xs font-semibold text-slate-700"
                >
                  End Time
                </label>
                <input
                  id="tt-end"
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 tabular-nums focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="tt-block"
                className="block text-xs font-semibold text-slate-700"
              >
                Academic Block
              </label>
              <select
                id="tt-block"
                value={blockId}
                onChange={(e) => handleBlockChange(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              >
                {blocks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code} — {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="tt-room"
                className="block text-xs font-semibold text-slate-700"
              >
                Classroom Number
              </label>
              <select
                id="tt-room"
                value={classroomId}
                onChange={(e) => setClassroomId(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              >
                {availableRooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.roomNumber} ({r.floor} · {r.roomType})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* FR-05 Live Conflict Detection Feedback */}
          {conflicts.length > 0 ? (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50/80 p-4"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-red-900">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-700" />
                <span>
                  {conflicts.length} Scheduling{' '}
                  {conflicts.length === 1 ? 'Conflict' : 'Conflicts'} Detected
                </span>
              </div>
              <ul className="mt-2 space-y-1.5 text-xs text-red-800">
                {conflicts.map((conflict, idx) => (
                  <li key={`${conflict.type}-${idx}`}>
                    <strong className="font-semibold">{conflict.title}:</strong>{' '}
                    {conflict.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-xs font-medium text-emerald-900">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
              <span>
                No faculty, classroom, or section conflicts detected for this
                time slot.
              </span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSave}
              className={`rounded-lg px-4 py-2 text-xs font-semibold text-white transition-colors ${
                canSave
                  ? 'bg-blue-700 hover:bg-blue-800'
                  : 'cursor-not-allowed bg-slate-300 text-slate-500'
              }`}
            >
              {editingEntry ? 'Save Changes' : 'Save Timetable Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
