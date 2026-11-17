import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Building2,
  Calendar,
  Clock,
  Compass,
  MapPin,
  Search,
  UserCheck,
  X,
} from 'lucide-react';
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
  getFacultyAvailability,
  isSundayDate,
  timeToMinutes,
} from '../utils/scheduleEngine';
import { FacultyAvatar } from './FacultyAvatar';
import { DAYS_OF_WEEK } from '../data/mockCampusData';

interface StudentLocatorViewProps {
  facultyList: FacultyMember[];
  departments: Department[];
  blocks: AcademicBlock[];
  classrooms: Classroom[];
  timetables: TimetableEntry[];
  scheduleChanges: ScheduleChange[];
  referenceDate: string;
  referenceTime: string;
  onChangeReferenceDate: (date: string) => void;
  onChangeReferenceTime: (time: string) => void;
  selectedFacultyId: string;
  onSelectFaculty: (id: string) => void;
  onOpenBlockDirectory: (blockId?: string) => void;
}

export const StudentLocatorView: React.FC<StudentLocatorViewProps> = ({
  facultyList,
  departments,
  blocks,
  classrooms,
  timetables,
  scheduleChanges,
  referenceDate,
  referenceTime,
  onChangeReferenceDate,
  onChangeReferenceTime,
  selectedFacultyId,
  onSelectFaculty,
  onOpenBlockDirectory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [scheduleTab, setScheduleTab] = useState<'today' | 'weekly'>('today');

  const filteredFaculty = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return facultyList.filter((fac) => {
      const dept = departments.find((d) => d.id === fac.departmentId);
      const matchesDept =
        departmentFilter === 'all' || fac.departmentId === departmentFilter;
      if (!matchesDept) return false;
      if (!q) return true;
      return (
        fac.name.toLowerCase().includes(q) ||
        fac.specialization.toLowerCase().includes(q) ||
        (dept?.name.toLowerCase().includes(q) ?? false) ||
        (dept?.code.toLowerCase().includes(q) ?? false)
      );
    });
  }, [facultyList, departments, searchQuery, departmentFilter]);

  const activeFaculty = useMemo(() => {
    const found = filteredFaculty.find((f) => f.id === selectedFacultyId);
    return found || filteredFaculty[0] || facultyList[0];
  }, [filteredFaculty, selectedFacultyId, facultyList]);

  const activeDepartment = departments.find(
    (d) => d.id === activeFaculty?.departmentId
  );

  const activeAvailability = useMemo(() => {
    if (!activeFaculty) return null;
    return getFacultyAvailability(
      activeFaculty.id,
      timetables,
      scheduleChanges,
      referenceDate,
      referenceTime
    );
  }, [activeFaculty, timetables, scheduleChanges, referenceDate, referenceTime]);

  const activeWeeklyEntries = useMemo(() => {
    if (!activeFaculty) return [];
    return timetables
      .filter((t) => t.facultyId === activeFaculty.id)
      .sort((a, b) => {
        const dayDiff =
          DAYS_OF_WEEK.indexOf(a.dayOfWeek) - DAYS_OF_WEEK.indexOf(b.dayOfWeek);
        if (dayDiff !== 0) return dayDiff;
        return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
      });
  }, [activeFaculty, timetables]);

  const applyTimePreset = (date: string, time: string) => {
    onChangeReferenceDate(date);
    onChangeReferenceTime(time);
  };

  const applyLiveClock = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    onChangeReferenceDate(`${yyyy}-${mm}-${dd}`);
    onChangeReferenceTime(`${hh}:${min}`);
  };

  const renderRoomDetails = (blockId: string, classroomId: string) => {
    const block = blocks.find((b) => b.id === blockId);
    const room = classrooms.find((c) => c.id === classroomId);
    return {
      blockCode: block?.code || 'Block',
      blockName: block?.name || '',
      wingDescription: block?.wingDescription || '',
      landmark: block?.landmark || '',
      roomNumber: room?.roomNumber || 'Room',
      floor: room?.floor || '',
      roomType: room?.roomType || '',
    };
  };

  const referenceDayName = isSundayDate(referenceDate)
    ? 'Sunday (Campus Closed)'
    : getDayOfWeekFromDateStr(referenceDate);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero Split Section */}
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-stretch">
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 sm:p-8 lg:col-span-7">
          <div>
            <p className="text-xs font-semibold tracking-wide text-blue-700">
              Student &amp; Visitor Campus Directory
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl [text-wrap:balance]">
              Find faculty schedules and classroom locations
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600">
              Search any faculty member by name or department to check their
              current scheduled availability, exact academic block, and classroom
              number.
            </p>
          </div>

          <div className="mt-6 space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                aria-label="Search faculty by name or department"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search faculty by name, subject, or department (e.g. Sharma, Meera, CSE)..."
                className="w-full rounded-lg border border-slate-300 bg-slate-50/50 py-3 pl-11 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-200/70 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Interactive Department Filter Tabs */}
            <div
              role="group"
              aria-label="Filter by department"
              className="flex flex-wrap items-center gap-1.5 rounded-lg bg-slate-100 p-1"
            >
              <button
                type="button"
                onClick={() => setDepartmentFilter('all')}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  departmentFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Departments
              </button>
              {departments.map((dept) => (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => setDepartmentFilter(dept.id)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    departmentFilter === dept.id
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {dept.code}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Architectural Campus Visual */}
        <div className="relative min-h-[240px] overflow-hidden rounded-xl border border-slate-200 bg-slate-200 lg:col-span-5">
          <img
            src="/src/assets/images/campus_academic_block_1794910792453.jpg"
            alt="Smart Campus central academic courtyard connecting Blocks A through D"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/25 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 text-white">
            <p className="font-display text-base font-semibold">
              Multi-Block Campus Wayfinding
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-200">
              <span>{blocks.length} Academic Blocks</span>
              <span aria-hidden="true">·</span>
              <span>{classrooms.length} Classrooms &amp; Labs</span>
              <span aria-hidden="true">·</span>
              <span>{facultyList.length} Faculty Profiles</span>
            </div>
          </div>
        </div>
      </section>

      {/* Reference Date & Time Control Strip */}
      <section
        aria-label="Schedule Reference Date and Time"
        className="mt-6 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3.5 lg:flex-row lg:items-center lg:justify-between"
      >
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2 font-medium text-slate-800">
            <Clock className="h-4 w-4 text-blue-700" />
            <span>Checking schedule for:</span>
            <span className="font-semibold text-slate-900">
              {referenceDayName}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              aria-label="Reference date"
              value={referenceDate}
              onChange={(e) => onChangeReferenceDate(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-2.5 py-1 font-mono text-xs text-slate-800 tabular-nums focus:border-blue-600 focus:outline-none"
            />
            <input
              type="time"
              aria-label="Reference time"
              value={referenceTime}
              onChange={(e) => onChangeReferenceTime(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-2.5 py-1 font-mono text-xs text-slate-800 tabular-nums focus:border-blue-600 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-medium text-slate-500">
            Quick presets:
          </span>
          <button
            type="button"
            onClick={() => applyTimePreset('2026-11-17', '10:30')}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              referenceDate === '2026-11-17' && referenceTime === '10:30'
                ? 'bg-blue-50 text-blue-800 font-semibold border border-blue-200'
                : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Tue 10:30 AM
          </button>
          <button
            type="button"
            onClick={() => applyTimePreset('2026-11-17', '12:15')}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              referenceDate === '2026-11-17' && referenceTime === '12:15'
                ? 'bg-blue-50 text-blue-800 font-semibold border border-blue-200'
                : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Tue 12:15 PM
          </button>
          <button
            type="button"
            onClick={() => applyTimePreset('2026-11-17', '14:30')}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              referenceDate === '2026-11-17' && referenceTime === '14:30'
                ? 'bg-blue-50 text-blue-800 font-semibold border border-blue-200'
                : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Tue 02:30 PM
          </button>
          <button
            type="button"
            onClick={applyLiveClock}
            className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
          >
            Live Clock
          </button>
        </div>
      </section>

      {/* Main Master-Detail Locator Grid */}
      <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        {/* Left: Matching Faculty List */}
        <div className="rounded-xl border border-slate-200 bg-white lg:col-span-5">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="font-display text-base font-semibold text-slate-900">
              Faculty Directory
            </h2>
            <span className="font-mono text-xs text-slate-500 tabular-nums">
              {filteredFaculty.length}{' '}
              {filteredFaculty.length === 1 ? 'result' : 'results'}
            </span>
          </div>

          {filteredFaculty.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-semibold text-slate-800">
                No matching faculty members found
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Try searching with a partial name or reset the department filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setDepartmentFilter('all');
                }}
                className="mt-4 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Reset Search &amp; Filters
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filteredFaculty.map((faculty) => {
                const dept = departments.find(
                  (d) => d.id === faculty.departmentId
                );
                const availability = getFacultyAvailability(
                  faculty.id,
                  timetables,
                  scheduleChanges,
                  referenceDate,
                  referenceTime
                );
                const isSelected = activeFaculty?.id === faculty.id;
                const roomInfo = availability.currentSlot
                  ? renderRoomDetails(
                      availability.currentSlot.blockId,
                      availability.currentSlot.classroomId
                    )
                  : null;

                return (
                  <li key={faculty.id}>
                    <button
                      type="button"
                      onClick={() => onSelectFaculty(faculty.id)}
                      className={`flex w-full items-start gap-3.5 px-5 py-4 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600 ${
                        isSelected
                          ? 'bg-blue-50/70'
                          : 'bg-white hover:bg-slate-50'
                      }`}
                    >
                      <FacultyAvatar
                        name={faculty.name}
                        avatarUrl={faculty.avatarUrl}
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p
                            className={`truncate font-display text-sm font-semibold ${
                              isSelected ? 'text-blue-900' : 'text-slate-900'
                            }`}
                          >
                            {faculty.name}
                          </p>
                          <span className="shrink-0 font-mono text-xs text-slate-500">
                            {dept?.code}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {faculty.designation} · {dept?.name}
                        </p>

                        {/* Clean unboxed scheduled status line (Zero-Pill Discipline) */}
                        <div className="mt-2 text-xs">
                          {availability.status === 'in_class' &&
                          availability.currentSlot &&
                          roomInfo ? (
                            <p className="font-medium text-emerald-700">
                              Scheduled Now · {roomInfo.blockCode}, Room{' '}
                              <span className="font-mono font-semibold tabular-nums">
                                {roomInfo.roomNumber}
                              </span>
                            </p>
                          ) : availability.status === 'cancelled_now' ? (
                            <p className="font-medium text-red-700">
                              Class Cancelled Today ·{' '}
                              {availability.nextSlot
                                ? `Next at ${formatTimeDisplay(availability.nextSlot.startTime)}`
                                : 'No further classes'}
                            </p>
                          ) : (
                            <p className="text-slate-600">
                              No scheduled class right now
                              {availability.nextSlot
                                ? ` · Next: ${formatTimeDisplay(availability.nextSlot.startTime)}`
                                : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Right: Selected Faculty Availability & Classroom Wayfinding */}
        {activeFaculty && activeAvailability && (
          <div className="rounded-xl border border-slate-200 bg-white lg:col-span-7">
            {/* Faculty Identity Header */}
            <div className="flex flex-col gap-4 border-b border-slate-200 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <FacultyAvatar
                  name={activeFaculty.name}
                  avatarUrl={activeFaculty.avatarUrl}
                  size="lg"
                />
                <div>
                  <h2 className="font-display text-xl font-bold text-slate-900">
                    {activeFaculty.name}
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-600">
                    {activeFaculty.designation} · {activeDepartment?.name}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>Faculty Cabin: {activeFaculty.cabinLocation}</span>
                    <span aria-hidden="true">·</span>
                    <span>{activeFaculty.specialization}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Scheduled Availability Notice */}
            <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-2.5 text-xs text-slate-600">
              Showing <strong className="font-semibold text-slate-800">scheduled availability</strong> for{' '}
              <span className="font-mono tabular-nums">{referenceDate}</span> at{' '}
              <span className="font-mono tabular-nums">
                {formatTimeDisplay(referenceTime)}
              </span>{' '}
              — reflects timetable records and approved modifications, not verified physical presence.
            </div>

            {/* Primary Current Availability Block */}
            <div className="p-6">
              {activeAvailability.status === 'in_class' &&
                activeAvailability.currentSlot &&
                (() => {
                  const slot = activeAvailability.currentSlot;
                  const loc = renderRoomDetails(slot.blockId, slot.classroomId);
                  return (
                    <div className="space-y-5">
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                            <UserCheck className="h-4 w-4 shrink-0" />
                            <span>Scheduled Class In Progress</span>
                          </div>
                          <span className="font-mono text-sm font-semibold text-emerald-900 tabular-nums">
                            {formatTimeDisplay(slot.startTime)} –{' '}
                            {formatTimeDisplay(slot.endTime)}
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-4 border-t border-emerald-200/70 pt-4 sm:grid-cols-2">
                          <div>
                            <p className="text-xs font-medium text-slate-500">
                              Subject &amp; Section
                            </p>
                            <p className="mt-1 font-display text-lg font-bold text-slate-900">
                              {slot.subjectName}
                            </p>
                            <p className="mt-0.5 text-sm text-slate-700">
                              {slot.subjectCode} · Section{' '}
                              <span className="font-mono font-semibold">
                                {slot.sectionName}
                              </span>
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-medium text-slate-500">
                              Classroom Location
                            </p>
                            <p className="mt-1 font-display text-lg font-bold text-slate-900">
                              {loc.blockCode} · Room{' '}
                              <span className="font-mono text-blue-800">
                                {loc.roomNumber}
                              </span>
                            </p>
                            <p className="mt-0.5 text-sm text-slate-700">
                              {loc.blockName} · {loc.floor} ({loc.roomType})
                            </p>
                          </div>
                        </div>

                        {/* Wayfinding Direction Row */}
                        <div className="mt-4 flex flex-col gap-2 border-t border-emerald-200/70 pt-3.5 text-xs text-slate-700 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-2">
                            <Compass className="h-4 w-4 shrink-0 text-emerald-700" />
                            <span>
                              Wayfinding: {loc.wingDescription} ({loc.landmark})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => onOpenBlockDirectory(slot.blockId)}
                            className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-800 whitespace-nowrap shrink-0"
                          >
                            <Building2 className="h-3.5 w-3.5" />
                            <span>View {loc.blockCode} Floor Rooms</span>
                          </button>
                        </div>
                      </div>

                      {/* Modification Notice if temporary or permanent change is active */}
                      {slot.activeChange && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-950">
                          <div className="flex items-start gap-2.5">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                            <div>
                              <p className="font-semibold">
                                Schedule Modification Applied (
                                {slot.activeChange.modificationScope === 'one_time'
                                  ? `One-time for ${slot.activeChange.affectedDate}`
                                  : `Permanent effective ${slot.activeChange.affectedDate}`}
                                )
                              </p>
                              <p className="mt-1 text-amber-900">
                                {slot.activeChange.reason}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

              {activeAvailability.status === 'cancelled_now' &&
                activeAvailability.currentSlot && (
                  <div className="rounded-xl border border-red-200 bg-red-50/50 p-5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-red-800">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>
                        No scheduled class right now (Session Cancelled)
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-700">
                      The scheduled{' '}
                      <span className="font-semibold">
                        {activeAvailability.currentSlot.subjectName}
                      </span>{' '}
                      class ({activeAvailability.currentSlot.sectionName},{' '}
                      <span className="font-mono tabular-nums">
                        {formatTimeDisplay(
                          activeAvailability.currentSlot.startTime
                        )}
                        –
                        {formatTimeDisplay(
                          activeAvailability.currentSlot.endTime
                        )}
                      </span>
                      ) was cancelled for{' '}
                      <span className="font-mono tabular-nums">
                        {referenceDate}
                      </span>
                      .
                    </p>
                    {activeAvailability.currentSlot.activeChange?.reason && (
                      <p className="mt-1.5 text-xs text-red-900">
                        Note: {activeAvailability.currentSlot.activeChange.reason}
                      </p>
                    )}
                  </div>
                )}

              {activeAvailability.status === 'free' && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <Clock className="h-4 w-4 shrink-0 text-slate-500" />
                    <span>No scheduled class right now</span>
                  </div>
                  <p className="mt-1.5 text-sm text-slate-600">
                    {activeFaculty.name} does not have a lecture or lab
                    scheduled at{' '}
                    <span className="font-mono tabular-nums">
                      {formatTimeDisplay(referenceTime)}
                    </span>
                    . Faculty cabin reference:{' '}
                    <span className="font-medium text-slate-800">
                      {activeFaculty.cabinLocation}
                    </span>
                    .
                  </p>
                </div>
              )}

              {/* Next Scheduled Class Callout */}
              {activeAvailability.nextSlot ? (
                (() => {
                  const next = activeAvailability.nextSlot;
                  const loc = renderRoomDetails(next.blockId, next.classroomId);
                  return (
                    <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Next Scheduled Class ·{' '}
                          {activeAvailability.nextSlotDayLabel}
                        </p>
                        <span className="font-mono text-xs font-semibold text-slate-800 tabular-nums">
                          {formatTimeDisplay(next.startTime)} –{' '}
                          {formatTimeDisplay(next.endTime)}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-display text-base font-semibold text-slate-900">
                            {next.subjectName}{' '}
                            <span className="text-sm font-normal text-slate-500">
                              ({next.subjectCode} · {next.sectionName})
                            </span>
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm font-medium text-blue-800">
                          <MapPin className="h-4 w-4 shrink-0 text-blue-700" />
                          <span>
                            {loc.blockCode}, Room{' '}
                            <span className="font-mono font-semibold">
                              {loc.roomNumber}
                            </span>
                          </span>
                        </div>
                      </div>
                      {next.activeChange && (
                        <p className="mt-2 text-xs text-amber-800">
                          Updated:{' '}
                          {next.activeChange.modificationScope === 'one_time'
                            ? `One-time change on ${next.activeChange.affectedDate}`
                            : 'Permanent schedule update'}{' '}
                          — {next.activeChange.reason}
                        </p>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500">
                  No upcoming classes found in the current weekly timetable for{' '}
                  {activeFaculty.name}.
                </div>
              )}

              {/* Selected Date vs Weekly Timetable Tabs */}
              <div className="mt-6 border-t border-slate-200 pt-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-500" />
                    <h3 className="font-display text-sm font-semibold text-slate-900">
                      Faculty Class Schedule
                    </h3>
                  </div>
                  <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
                    <button
                      type="button"
                      onClick={() => setScheduleTab('today')}
                      className={`rounded-md px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                        scheduleTab === 'today'
                          ? 'bg-white text-slate-900 shadow-xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {referenceDayName.split(' ')[0]} ({referenceDate})
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleTab('weekly')}
                      className={`rounded-md px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                        scheduleTab === 'weekly'
                          ? 'bg-white text-slate-900 shadow-xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Weekly Timetable
                    </button>
                  </div>
                </div>

                {scheduleTab === 'today' ? (
                  activeAvailability.todaySlots.length === 0 ? (
                    <p className="mt-4 rounded-lg border border-slate-100 bg-slate-50 px-4 py-5 text-center text-xs text-slate-500">
                      No classes scheduled on {referenceDayName}.
                    </p>
                  ) : (
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500">
                            <th className="py-2 pr-3 font-medium">Time</th>
                            <th className="py-2 pr-3 font-medium">Subject</th>
                            <th className="py-2 pr-3 font-medium">Section</th>
                            <th className="py-2 font-medium">Location</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {activeAvailability.todaySlots.map((slot) => {
                            const loc = renderRoomDetails(
                              slot.blockId,
                              slot.classroomId
                            );
                            const isCurrent =
                              activeAvailability.currentSlot?.timetableId ===
                              slot.timetableId;
                            return (
                              <tr
                                key={slot.timetableId}
                                className={
                                  slot.isCancelled
                                    ? 'bg-red-50/40 text-slate-400'
                                    : isCurrent
                                      ? 'bg-emerald-50/50 text-slate-900'
                                      : 'text-slate-700'
                                }
                              >
                                <td className="py-2.5 pr-3 font-mono whitespace-nowrap tabular-nums">
                                  {slot.startTime}–{slot.endTime}
                                </td>
                                <td className="py-2.5 pr-3">
                                  <span
                                    className={`font-medium ${
                                      slot.isCancelled
                                        ? 'line-through text-slate-500'
                                        : 'text-slate-900'
                                    }`}
                                  >
                                    {slot.subjectName}
                                  </span>
                                  {slot.isCancelled && (
                                    <span className="ml-2 font-medium text-red-700">
                                      Cancelled
                                    </span>
                                  )}
                                  {!slot.isCancelled && slot.activeChange && (
                                    <span className="ml-2 font-medium text-amber-700">
                                      Modified
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 pr-3 font-mono whitespace-nowrap">
                                  {slot.sectionName}
                                </td>
                                <td className="py-2.5 whitespace-nowrap">
                                  {slot.isCancelled
                                    ? '—'
                                    : `${loc.blockCode} · ${loc.roomNumber}`}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                          <th className="py-2 pr-3 font-medium">Day</th>
                          <th className="py-2 pr-3 font-medium">Time</th>
                          <th className="py-2 pr-3 font-medium">Subject</th>
                          <th className="py-2 pr-3 font-medium">Section</th>
                          <th className="py-2 font-medium">Location</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activeWeeklyEntries.map((entry) => {
                          const loc = renderRoomDetails(
                            entry.blockId,
                            entry.classroomId
                          );
                          return (
                            <tr key={entry.id} className="text-slate-700">
                              <td className="py-2.5 pr-3 font-medium text-slate-900 whitespace-nowrap">
                                {entry.dayOfWeek}
                              </td>
                              <td className="py-2.5 pr-3 font-mono whitespace-nowrap tabular-nums">
                                {entry.startTime}–{entry.endTime}
                              </td>
                              <td className="py-2.5 pr-3 text-slate-900">
                                {entry.subjectName}
                              </td>
                              <td className="py-2.5 pr-3 font-mono whitespace-nowrap">
                                {entry.sectionName}
                              </td>
                              <td className="py-2.5 whitespace-nowrap">
                                {loc.blockCode} · {loc.roomNumber}
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
          </div>
        )}
      </section>
    </div>
  );
};
