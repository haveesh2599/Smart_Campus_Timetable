import React, { useMemo, useState } from 'react';
import { CalendarClock, Info, X } from 'lucide-react';
import {
  AcademicBlock,
  Classroom,
  FacultyMember,
  ModificationScope,
  ModificationType,
  ScheduleChange,
  TimetableEntry,
} from '../types/campus';
import { formatTimeDisplay } from '../utils/scheduleEngine';

interface ScheduleModificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: TimetableEntry | null;
  facultyList: FacultyMember[];
  blocks: AcademicBlock[];
  classrooms: Classroom[];
  defaultDate: string;
  loggedInFacultyId: string;
  onSaveModification: (change: Omit<ScheduleChange, 'id' | 'createdAt'>) => void;
}

export const ScheduleModificationModal: React.FC<
  ScheduleModificationModalProps
> = ({
  isOpen,
  onClose,
  entry,
  facultyList,
  blocks,
  classrooms,
  defaultDate,
  loggedInFacultyId,
  onSaveModification,
}) => {
  const [modificationType, setModificationType] =
    useState<ModificationType>('change_classroom');
  const [modificationScope, setModificationScope] =
    useState<ModificationScope>('one_time');
  const [affectedDate, setAffectedDate] = useState<string>(defaultDate);
  const [newStartTime, setNewStartTime] = useState<string>(
    entry?.startTime || '12:00'
  );
  const [newEndTime, setNewEndTime] = useState<string>(
    entry?.endTime || '13:00'
  );
  const [newBlockId, setNewBlockId] = useState<string>(
    entry?.blockId || blocks[0].id
  );
  const [newClassroomId, setNewClassroomId] = useState<string>(
    entry?.classroomId || classrooms[0].id
  );
  const [reason, setReason] = useState<string>('');

  const availableRooms = useMemo(
    () => classrooms.filter((c) => c.blockId === newBlockId),
    [classrooms, newBlockId]
  );

  if (!isOpen || !entry) return null;

  const entryFaculty = facultyList.find((f) => f.id === entry.facultyId);
  const origBlock = blocks.find((b) => b.id === entry.blockId);
  const origRoom = classrooms.find((c) => c.id === entry.classroomId);

  const needsTimingFields =
    modificationType === 'postpone' || modificationType === 'change_timing';
  const needsRoomFields =
    modificationType === 'change_classroom' || modificationType === 'postpone';

  const handleBlockSelect = (blkId: string) => {
    setNewBlockId(blkId);
    const first = classrooms.find((c) => c.blockId === blkId);
    if (first) setNewClassroomId(first.id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveModification({
      timetableId: entry.id,
      modificationType,
      modificationScope,
      affectedDate,
      newStartTime: needsTimingFields ? newStartTime : undefined,
      newEndTime: needsTimingFields ? newEndTime : undefined,
      newBlockId: needsRoomFields ? newBlockId : undefined,
      newClassroomId: needsRoomFields ? newClassroomId : undefined,
      reason:
        reason.trim() ||
        (modificationType === 'cancel'
          ? 'Class cancelled by faculty.'
          : modificationType === 'postpone'
            ? 'Class postponed to updated timing.'
            : modificationType === 'change_classroom'
              ? 'Classroom relocated for this session.'
              : 'Class timing updated.'),
      createdByFacultyId: loggedInFacultyId,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modify-schedule-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs overflow-y-auto"
    >
      <div className="my-8 w-full max-w-xl rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <div className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-blue-700" />
              <h2
                id="modify-schedule-title"
                className="font-display text-lg font-bold text-slate-900"
              >
                Modify Class Schedule
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {entry.subjectName} ({entry.sectionName}) · {entryFaculty?.name} ·{' '}
              {entry.dayOfWeek} {formatTimeDisplay(entry.startTime)}–
              {formatTimeDisplay(entry.endTime)} ({origBlock?.code} Room{' '}
              {origRoom?.roomNumber})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modify schedule dialog"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          {/* Modification Type Selector */}
          <div>
            <span className="block text-xs font-semibold text-slate-700">
              Modification Action
            </span>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(
                [
                  { id: 'change_classroom', label: 'Change Classroom' },
                  { id: 'postpone', label: 'Postpone Class' },
                  { id: 'change_timing', label: 'Change Timing' },
                  { id: 'cancel', label: 'Cancel Class' },
                ] as { id: ModificationType; label: string }[]
              ).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setModificationType(option.id)}
                  className={`rounded-lg border px-3 py-2.5 text-left text-xs font-semibold transition-colors ${
                    modificationType === option.id
                      ? option.id === 'cancel'
                        ? 'border-red-600 bg-red-50 text-red-900'
                        : 'border-blue-600 bg-blue-50 text-blue-900'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Modification Duration Scope (FR-06) */}
          <div>
            <span className="block text-xs font-semibold text-slate-700">
              Modification Duration
            </span>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setModificationScope('one_time')}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  modificationScope === 'one_time'
                    ? 'border-blue-600 bg-blue-50/70'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <p className="text-xs font-bold text-slate-900">
                  One-time modification
                </p>
                <p className="mt-0.5 text-xs text-slate-600">
                  Applies only to the selected date. Weekly timetable remains
                  unchanged.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setModificationScope('permanent')}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  modificationScope === 'permanent'
                    ? 'border-blue-600 bg-blue-50/70'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <p className="text-xs font-bold text-slate-900">
                  Permanent modification
                </p>
                <p className="mt-0.5 text-xs text-slate-600">
                  Updates the recurring weekly timetable from the effective date.
                </p>
              </button>
            </div>
          </div>

          {/* Affected / Effective Date */}
          <div>
            <label
              htmlFor="mod-date"
              className="block text-xs font-semibold text-slate-700"
            >
              {modificationScope === 'one_time'
                ? 'Affected Date'
                : 'Effective From Date'}
            </label>
            <input
              id="mod-date"
              type="date"
              required
              value={affectedDate}
              onChange={(e) => setAffectedDate(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 tabular-nums focus:border-blue-600 focus:outline-none"
            />
          </div>

          {/* Conditional Timing Fields */}
          {needsTimingFields && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="mod-start"
                  className="block text-xs font-semibold text-slate-700"
                >
                  New Start Time
                </label>
                <input
                  id="mod-start"
                  type="time"
                  required
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 tabular-nums focus:border-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="mod-end"
                  className="block text-xs font-semibold text-slate-700"
                >
                  New End Time
                </label>
                <input
                  id="mod-end"
                  type="time"
                  required
                  value={newEndTime}
                  onChange={(e) => setNewEndTime(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 tabular-nums focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Conditional Classroom Fields */}
          {needsRoomFields && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="mod-block"
                  className="block text-xs font-semibold text-slate-700"
                >
                  New Academic Block
                </label>
                <select
                  id="mod-block"
                  value={newBlockId}
                  onChange={(e) => handleBlockSelect(e.target.value)}
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
                  htmlFor="mod-room"
                  className="block text-xs font-semibold text-slate-700"
                >
                  New Classroom
                </label>
                <select
                  id="mod-room"
                  value={newClassroomId}
                  onChange={(e) => setNewClassroomId(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                >
                  {availableRooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.roomNumber} ({r.floor})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Reason / Public Notice */}
          <div>
            <label
              htmlFor="mod-reason"
              className="block text-xs font-semibold text-slate-700"
            >
              Reason / Note for Students
            </label>
            <textarea
              id="mod-reason"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Lab maintenance in Block A; shifted to Block D Lecture Hall."
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
            <span>
              Approved modifications immediately reflect in the public Student
              Faculty Search for the affected date.
            </span>
          </div>

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
              className={`rounded-lg px-4 py-2 text-xs font-semibold text-white transition-colors ${
                modificationType === 'cancel'
                  ? 'bg-red-700 hover:bg-red-800'
                  : 'bg-blue-700 hover:bg-blue-800'
              }`}
            >
              Apply Modification
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
