import React, { useMemo, useState } from 'react';
import {
  CalendarClock,
  Check,
  Edit3,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import {
  AcademicBlock,
  Classroom,
  Department,
  FacultyMember,
  ScheduleChange,
  TimetableEntry,
} from '../types/campus';
import { DAYS_OF_WEEK } from '../data/mockCampusData';
import { formatTimeDisplay, timeToMinutes } from '../utils/scheduleEngine';
import { FacultyAvatar } from './FacultyAvatar';
import { TimetableEntryModal } from './TimetableEntryModal';
import { ScheduleModificationModal } from './ScheduleModificationModal';

interface TimetableManagerViewProps {
  loggedInFaculty: FacultyMember;
  facultyList: FacultyMember[];
  departments: Department[];
  blocks: AcademicBlock[];
  classrooms: Classroom[];
  timetables: TimetableEntry[];
  scheduleChanges: ScheduleChange[];
  referenceDate: string;
  onAddTimetable: (entry: Omit<TimetableEntry, 'id'>) => void;
  onUpdateTimetable: (id: string, entry: Omit<TimetableEntry, 'id'>) => void;
  onDeleteTimetable: (id: string) => void;
  onAddScheduleChange: (
    change: Omit<ScheduleChange, 'id' | 'createdAt'>
  ) => void;
  onRemoveScheduleChange: (changeId: string) => void;
  onResetDemoData: () => void;
}

export const TimetableManagerView: React.FC<TimetableManagerViewProps> = ({
  loggedInFaculty,
  facultyList,
  departments,
  blocks,
  classrooms,
  timetables,
  scheduleChanges,
  referenceDate,
  onAddTimetable,
  onUpdateTimetable,
  onDeleteTimetable,
  onAddScheduleChange,
  onRemoveScheduleChange,
  onResetDemoData,
}) => {
  const [scopeFilter, setScopeFilter] = useState<'mine' | 'all'>('mine');
  const [activeTab, setActiveTab] = useState<'weekly' | 'list' | 'changes'>(
    'weekly'
  );
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [modifyTargetEntry, setModifyTargetEntry] =
    useState<TimetableEntry | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  const visibleEntries = useMemo(() => {
    const filtered =
      scopeFilter === 'mine'
        ? timetables.filter((t) => t.facultyId === loggedInFaculty.id)
        : timetables;

    return [...filtered].sort((a, b) => {
      const dayDiff =
        DAYS_OF_WEEK.indexOf(a.dayOfWeek) - DAYS_OF_WEEK.indexOf(b.dayOfWeek);
      if (dayDiff !== 0) return dayDiff;
      return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
    });
  }, [timetables, scopeFilter, loggedInFaculty.id]);

  const myDepartment = departments.find(
    (d) => d.id === loggedInFaculty.departmentId
  );

  const activeOneTimeCount = scheduleChanges.filter(
    (c) => c.modificationScope === 'one_time'
  ).length;
  const activePermanentCount = scheduleChanges.filter(
    (c) => c.modificationScope === 'permanent'
  ).length;

  const showToast = (msg: string) => {
    setBannerNotice(msg);
    setTimeout(() => {
      setBannerNotice((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  const handleSaveEntry = (
    data: Omit<TimetableEntry, 'id'>,
    existingId?: string
  ) => {
    if (existingId) {
      onUpdateTimetable(existingId, data);
      showToast(`Updated timetable entry for ${data.subjectName}.`);
    } else {
      onAddTimetable(data);
      showToast(`Created new timetable entry for ${data.subjectName}.`);
    }
    setEntryModalOpen(false);
    setEditingEntry(null);
  };

  const handleSaveModification = (
    change: Omit<ScheduleChange, 'id' | 'createdAt'>
  ) => {
    onAddScheduleChange(change);
    setModifyTargetEntry(null);
    showToast(
      change.modificationScope === 'one_time'
        ? `One-time modification saved for ${change.affectedDate}. Recurring timetable preserved.`
        : `Permanent modification applied effective ${change.affectedDate}.`
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Console Header */}
      <div className="flex flex-col gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <FacultyAvatar
            name={loggedInFaculty.name}
            avatarUrl={loggedInFaculty.avatarUrl}
            size="md"
          />
          <div>
            <p className="text-xs font-semibold tracking-wide text-blue-700">
              Authorized Faculty Workspace
            </p>
            <h1 className="font-display text-2xl font-bold text-slate-900">
              Timetable &amp; Schedule Management
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Signed in as {loggedInFaculty.name} · {myDepartment?.name} ·{' '}
              {loggedInFaculty.cabinLocation}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onResetDemoData}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Sample Data</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingEntry(null);
              setEntryModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Create Timetable Entry</span>
          </button>
        </div>
      </div>

      {/* Confirmation Notice */}
      {bannerNotice && (
        <div
          role="status"
          className="mt-5 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-900"
        >
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-700" />
            <span>{bannerNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setBannerNotice(null)}
            className="text-emerald-800 underline hover:text-emerald-950"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Clean Single-Row Summary Bar (No nested card sandwiches) */}
      <div className="mt-6 grid grid-cols-1 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="px-5 py-4">
          <p className="text-xs font-medium text-slate-500">
            {scopeFilter === 'mine'
              ? 'My Weekly Classes'
              : 'Total College Classes'}
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums">
            {visibleEntries.length}
          </p>
        </div>
        <div className="px-5 py-4">
          <p className="text-xs font-medium text-slate-500">
            One-Time Modifications
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums">
            {activeOneTimeCount}
          </p>
        </div>
        <div className="px-5 py-4">
          <p className="text-xs font-medium text-slate-500">
            Permanent Schedule Updates
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums">
            {activePermanentCount}
          </p>
        </div>
      </div>

      {/* Toolbar: Scope & View Mode */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-200/70 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('weekly')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'weekly'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Weekly Timetable
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'list'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Entries Table
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('changes')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'changes'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Schedule Modifications ({scheduleChanges.length})
          </button>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-slate-200/70 p-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setScopeFilter('mine')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              scopeFilter === 'mine'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            My Schedule
          </button>
          <button
            type="button"
            onClick={() => setScopeFilter('all')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              scopeFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Faculty Timetables
          </button>
        </div>
      </div>

      {/* Tab 1: Weekly Grid View */}
      {activeTab === 'weekly' && (
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {DAYS_OF_WEEK.map((day) => {
            const dayEntries = visibleEntries.filter(
              (e) => e.dayOfWeek === day
            );

            return (
              <div
                key={day}
                className="flex flex-col rounded-xl border border-slate-200 bg-white"
              >
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                  <h2 className="font-display text-sm font-bold text-slate-900">
                    {day}
                  </h2>
                  <span className="font-mono text-xs text-slate-500 tabular-nums">
                    {dayEntries.length}{' '}
                    {dayEntries.length === 1 ? 'class' : 'classes'}
                  </span>
                </div>

                {dayEntries.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center px-4 py-8 text-xs text-slate-400">
                    No classes scheduled
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {dayEntries.map((entry) => {
                      const fac = facultyList.find(
                        (f) => f.id === entry.facultyId
                      );
                      const block = blocks.find((b) => b.id === entry.blockId);
                      const room = classrooms.find(
                        (r) => r.id === entry.classroomId
                      );
                      const activeMods = scheduleChanges.filter(
                        (c) => c.timetableId === entry.id
                      );

                      return (
                        <li key={entry.id} className="p-4">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="font-mono text-xs font-semibold text-blue-800 tabular-nums">
                              {formatTimeDisplay(entry.startTime)} –{' '}
                              {formatTimeDisplay(entry.endTime)}
                            </span>
                            <span className="font-mono text-xs text-slate-500">
                              {entry.sectionName}
                            </span>
                          </div>

                          <p className="mt-1 font-display text-sm font-semibold text-slate-900">
                            {entry.subjectName}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-600">
                            {block?.code} · Room {room?.roomNumber}
                            {scopeFilter === 'all' && fac
                              ? ` · ${fac.name}`
                              : ''}
                          </p>

                          {activeMods.length > 0 && (
                            <p className="mt-1.5 text-xs font-medium text-amber-800">
                              {activeMods.length}{' '}
                              {activeMods.length === 1
                                ? 'modification'
                                : 'modifications'}{' '}
                              recorded
                            </p>
                          )}

                          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-2.5 text-xs">
                            <button
                              type="button"
                              onClick={() => setModifyTargetEntry(entry)}
                              className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-800"
                            >
                              <CalendarClock className="h-3.5 w-3.5" />
                              <span>Modify</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingEntry(entry);
                                setEntryModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 font-medium text-slate-600 hover:text-slate-900"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              <span>Edit</span>
                            </button>

                            {confirmDeleteId === entry.id ? (
                              <div className="ml-auto flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    onDeleteTimetable(entry.id);
                                    setConfirmDeleteId(null);
                                    showToast(
                                      `Deleted ${entry.subjectName} (${entry.dayOfWeek}).`
                                    );
                                  }}
                                  className="font-semibold text-red-700 hover:text-red-800"
                                >
                                  Confirm Delete
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="text-slate-500 hover:text-slate-800"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(entry.id)}
                                className="ml-auto inline-flex items-center gap-1 font-medium text-slate-500 hover:text-red-700"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Delete</span>
                              </button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Compact High-Density Entries Table */}
      {activeTab === 'list' && (
        <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
                  <th className="px-4 py-3">Day &amp; Time</th>
                  <th className="px-4 py-3">Faculty</th>
                  <th className="px-4 py-3">Subject &amp; Section</th>
                  <th className="px-4 py-3">Block &amp; Room</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleEntries.map((entry) => {
                  const fac = facultyList.find((f) => f.id === entry.facultyId);
                  const block = blocks.find((b) => b.id === entry.blockId);
                  const room = classrooms.find(
                    (r) => r.id === entry.classroomId
                  );

                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="font-semibold text-slate-900">
                          {entry.dayOfWeek}
                        </p>
                        <p className="font-mono text-xs text-slate-500 tabular-nums">
                          {entry.startTime}–{entry.endTime}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-800 whitespace-nowrap">
                        {fac?.name}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">
                          {entry.subjectName}
                        </p>
                        <p className="font-mono text-xs text-slate-500">
                          {entry.subjectCode} · {entry.sectionName}
                        </p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                        {block?.code} ·{' '}
                        <span className="font-mono">{room?.roomNumber}</span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-3 text-xs">
                          <button
                            type="button"
                            onClick={() => setModifyTargetEntry(entry)}
                            className="font-semibold text-blue-700 hover:text-blue-800"
                          >
                            Modify
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingEntry(entry);
                              setEntryModalOpen(true);
                            }}
                            className="font-medium text-slate-600 hover:text-slate-900"
                          >
                            Edit
                          </button>
                          {confirmDeleteId === entry.id ? (
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteTimetable(entry.id);
                                setConfirmDeleteId(null);
                              }}
                              className="font-semibold text-red-700 hover:text-red-800"
                            >
                              Confirm
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(entry.id)}
                              className="font-medium text-slate-500 hover:text-red-700"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Schedule Modifications Log */}
      {activeTab === 'changes' && (
        <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {scheduleChanges.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-semibold text-slate-800">
                No active schedule modifications
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Use &ldquo;Modify&rdquo; on any timetable entry to cancel,
                postpone, or relocate a class.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {scheduleChanges.map((chg) => {
                const entry = timetables.find((t) => t.id === chg.timetableId);
                const fac = entry
                  ? facultyList.find((f) => f.id === entry.facultyId)
                  : null;
                const newBlock = chg.newBlockId
                  ? blocks.find((b) => b.id === chg.newBlockId)
                  : null;
                const newRoom = chg.newClassroomId
                  ? classrooms.find((c) => c.id === chg.newClassroomId)
                  : null;

                return (
                  <div
                    key={chg.id}
                    className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span
                          className={`font-semibold ${
                            chg.modificationType === 'cancel'
                              ? 'text-red-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {chg.modificationType === 'cancel'
                            ? 'Class Cancelled'
                            : chg.modificationType === 'postpone'
                              ? 'Postponed'
                              : chg.modificationType === 'change_classroom'
                                ? 'Classroom Relocated'
                                : 'Timing Changed'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-medium text-slate-700">
                          {chg.modificationScope === 'one_time'
                            ? `One-time on ${chg.affectedDate}`
                            : `Permanent effective ${chg.affectedDate}`}
                        </span>
                      </div>

                      <p className="mt-1 font-display text-sm font-semibold text-slate-900">
                        {entry
                          ? `${entry.subjectName} (${entry.sectionName}) — ${fac?.name}`
                          : 'Deleted Timetable Entry'}
                      </p>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                        {chg.newStartTime && chg.newEndTime && (
                          <span className="font-mono tabular-nums">
                            New Time: {formatTimeDisplay(chg.newStartTime)}–
                            {formatTimeDisplay(chg.newEndTime)}
                          </span>
                        )}
                        {newBlock && newRoom && (
                          <span>
                            New Location: {newBlock.code} Room{' '}
                            <span className="font-mono">
                              {newRoom.roomNumber}
                            </span>
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        Note: {chg.reason}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onRemoveScheduleChange(chg.id);
                        showToast('Schedule modification reverted.');
                      }}
                      className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0 self-start sm:self-center"
                    >
                      Revert Change
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {entryModalOpen && (
        <TimetableEntryModal
          isOpen={entryModalOpen}
          onClose={() => {
            setEntryModalOpen(false);
            setEditingEntry(null);
          }}
          editingEntry={editingEntry}
          defaultFacultyId={loggedInFaculty.id}
          facultyList={facultyList}
          departments={departments}
          blocks={blocks}
          classrooms={classrooms}
          existingEntries={timetables}
          onSave={handleSaveEntry}
        />
      )}

      {modifyTargetEntry && (
        <ScheduleModificationModal
          isOpen={Boolean(modifyTargetEntry)}
          onClose={() => setModifyTargetEntry(null)}
          entry={modifyTargetEntry}
          facultyList={facultyList}
          blocks={blocks}
          classrooms={classrooms}
          defaultDate={referenceDate}
          loggedInFacultyId={loggedInFaculty.id}
          onSaveModification={handleSaveModification}
        />
      )}
    </div>
  );
};
