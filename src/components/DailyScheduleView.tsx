import React, { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import {
  AcademicBlock,
  Classroom,
  Department,
  FacultyMember,
  ScheduleChange,
  TimetableEntry,
} from '../types/campus';
import {
  formatTimeDisplay,
  getDayOfWeekFromDateStr,
  resolveEffectiveScheduleForDate,
  timeToMinutes,
} from '../utils/scheduleEngine';

interface DailyScheduleViewProps {
  facultyList: FacultyMember[];
  departments: Department[];
  blocks: AcademicBlock[];
  classrooms: Classroom[];
  timetables: TimetableEntry[];
  scheduleChanges: ScheduleChange[];
  referenceDate: string;
  onChangeReferenceDate: (date: string) => void;
  onInspectFaculty: (facultyId: string) => void;
}

export const DailyScheduleView: React.FC<DailyScheduleViewProps> = ({
  facultyList,
  departments,
  blocks,
  classrooms,
  timetables,
  scheduleChanges,
  referenceDate,
  onChangeReferenceDate,
  onInspectFaculty,
}) => {
  const [blockFilter, setBlockFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');

  const resolvedSlots = useMemo(() => {
    return resolveEffectiveScheduleForDate(
      timetables,
      scheduleChanges,
      referenceDate
    )
      .filter((slot) => {
        if (blockFilter !== 'all' && slot.blockId !== blockFilter) return false;
        if (deptFilter !== 'all' && slot.departmentId !== deptFilter)
          return false;
        return true;
      })
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  }, [timetables, scheduleChanges, referenceDate, blockFilter, deptFilter]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wide text-blue-700">
            Read-Only College Timetable
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold text-slate-900 sm:text-3xl">
            Daily Master Class Schedule
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Effective schedule for{' '}
            <span className="font-semibold text-slate-900">
              {getDayOfWeekFromDateStr(referenceDate)} ({referenceDate})
            </span>{' '}
            including all approved one-time and permanent modifications.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <input
            type="date"
            aria-label="Schedule date"
            value={referenceDate}
            onChange={(e) => onChangeReferenceDate(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-800 tabular-nums focus:border-blue-600 focus:outline-none"
          />
          <select
            aria-label="Filter by academic block"
            value={blockFilter}
            onChange={(e) => setBlockFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-600 focus:outline-none"
          >
            <option value="all">All Blocks</option>
            {blocks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.code} · {b.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by department"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-600 focus:outline-none"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.code} · {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {resolvedSlots.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-semibold text-slate-800">
              No classes scheduled for this filter selection
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Try selecting another weekday or resetting the block/department
              filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
                  <th className="px-5 py-3.5">Timing</th>
                  <th className="px-5 py-3.5">Faculty Member</th>
                  <th className="px-5 py-3.5">Subject &amp; Section</th>
                  <th className="px-5 py-3.5">Block &amp; Classroom</th>
                  <th className="px-5 py-3.5">Schedule Status</th>
                  <th className="px-5 py-3.5 text-right">Locate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {resolvedSlots.map((slot) => {
                  const fac = facultyList.find((f) => f.id === slot.facultyId);
                  const dept = departments.find(
                    (d) => d.id === slot.departmentId
                  );
                  const block = blocks.find((b) => b.id === slot.blockId);
                  const room = classrooms.find((r) => r.id === slot.classroomId);

                  return (
                    <tr
                      key={slot.timetableId}
                      className={`transition-colors ${
                        slot.isCancelled
                          ? 'bg-red-50/30 text-slate-500'
                          : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td className="px-5 py-3.5 font-mono text-xs font-medium text-slate-800 whitespace-nowrap tabular-nums">
                        {formatTimeDisplay(slot.startTime)} –{' '}
                        {formatTimeDisplay(slot.endTime)}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-slate-900">
                          {fac?.name}
                        </p>
                        <p className="text-xs text-slate-500">{dept?.code}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p
                          className={`font-medium ${
                            slot.isCancelled
                              ? 'line-through text-slate-500'
                              : 'text-slate-900'
                          }`}
                        >
                          {slot.subjectName}
                        </p>
                        <p className="text-xs text-slate-500 font-mono">
                          {slot.subjectCode} · {slot.sectionName}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {slot.isCancelled ? (
                          <span className="text-xs text-slate-400">—</span>
                        ) : (
                          <div>
                            <p className="font-medium text-slate-900">
                              {block?.code} ·{' '}
                              <span className="font-mono">
                                {room?.roomNumber}
                              </span>
                            </p>
                            <p className="text-xs text-slate-500">
                              {room?.floor}
                            </p>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {slot.isCancelled ? (
                          <span className="text-xs font-semibold text-red-700">
                            Cancelled (
                            {slot.activeChange?.modificationScope === 'one_time'
                              ? 'One-time'
                              : 'Permanent'}
                            )
                          </span>
                        ) : slot.activeChange ? (
                          <span className="text-xs font-semibold text-amber-700">
                            {slot.activeChange.modificationType === 'postpone'
                              ? 'Postponed'
                              : slot.activeChange.modificationType ===
                                  'change_classroom'
                                ? 'Room Changed'
                                : 'Time Updated'}{' '}
                            (
                            {slot.activeChange.modificationScope === 'one_time'
                              ? 'One-time'
                              : 'Permanent'}
                            )
                          </span>
                        ) : (
                          <span className="text-xs text-slate-600">
                            Regular Schedule
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {fac && (
                          <button
                            type="button"
                            onClick={() => onInspectFaculty(fac.id)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800 whitespace-nowrap"
                          >
                            <span>Locate</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
