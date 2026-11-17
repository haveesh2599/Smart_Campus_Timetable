import React, { useMemo, useState } from 'react';
import { ArrowRight, Building2, Compass, Users } from 'lucide-react';
import {
  AcademicBlock,
  Classroom,
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

interface CampusBlocksViewProps {
  blocks: AcademicBlock[];
  classrooms: Classroom[];
  facultyList: FacultyMember[];
  timetables: TimetableEntry[];
  scheduleChanges: ScheduleChange[];
  referenceDate: string;
  referenceTime: string;
  initialBlockId?: string;
  onSelectFacultyFromRoom: (facultyId: string) => void;
}

export const CampusBlocksView: React.FC<CampusBlocksViewProps> = ({
  blocks,
  classrooms,
  facultyList,
  timetables,
  scheduleChanges,
  referenceDate,
  referenceTime,
  initialBlockId,
  onSelectFacultyFromRoom,
}) => {
  const [selectedBlockId, setSelectedBlockId] = useState<string>(
    initialBlockId || blocks[0]?.id || 'blk-a'
  );

  const effectiveSlots = useMemo(
    () =>
      resolveEffectiveScheduleForDate(timetables, scheduleChanges, referenceDate),
    [timetables, scheduleChanges, referenceDate]
  );

  const nowMinutes = timeToMinutes(referenceTime);
  const selectedBlock =
    blocks.find((b) => b.id === selectedBlockId) || blocks[0];
  const blockRooms = classrooms.filter((r) => r.blockId === selectedBlock?.id);

  const getRoomOccupancy = (classroomId: string) => {
    const activeSlot = effectiveSlots.find(
      (slot) =>
        !slot.isCancelled &&
        slot.classroomId === classroomId &&
        nowMinutes >= timeToMinutes(slot.startTime) &&
        nowMinutes < timeToMinutes(slot.endTime)
    );
    const nextSlot = effectiveSlots
      .filter(
        (slot) =>
          !slot.isCancelled &&
          slot.classroomId === classroomId &&
          timeToMinutes(slot.startTime) > nowMinutes
      )
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))[0];

    return { activeSlot, nextSlot };
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wide text-blue-700">
            Campus Wayfinding Directory
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold text-slate-900 sm:text-3xl">
            Academic Blocks &amp; Classroom Locator
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Inspect classrooms across every academic block and check scheduled
            sessions for{' '}
            <span className="font-medium text-slate-800">
              {getDayOfWeekFromDateStr(referenceDate)}
            </span>{' '}
            at{' '}
            <span className="font-mono tabular-nums">
              {formatTimeDisplay(referenceTime)}
            </span>
            .
          </p>
        </div>
      </div>

      {/* Block Selector Tabs */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {blocks.map((block) => {
          const roomsInBlock = classrooms.filter((r) => r.blockId === block.id);
          const occupiedCount = roomsInBlock.filter(
            (r) => getRoomOccupancy(r.id).activeSlot !== undefined
          ).length;
          const isSelected = block.id === selectedBlock?.id;

          return (
            <button
              key={block.id}
              type="button"
              onClick={() => setSelectedBlockId(block.id)}
              className={`rounded-xl border p-4 text-left transition-colors ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/50'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`font-mono text-xs font-semibold ${
                    isSelected ? 'text-blue-700' : 'text-slate-500'
                  }`}
                >
                  {block.code}
                </span>
                <span className="font-mono text-xs text-slate-500 tabular-nums">
                  {occupiedCount}/{roomsInBlock.length} in use
                </span>
              </div>
              <p className="mt-1.5 font-display text-base font-semibold text-slate-900">
                {block.name}
              </p>
              <p className="mt-1 text-xs text-slate-500">{block.landmark}</p>
            </button>
          );
        })}
      </div>

      {/* Selected Block Classroom Matrix */}
      {selectedBlock && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-col gap-2 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-700" />
                <h2 className="font-display text-lg font-bold text-slate-900">
                  {selectedBlock.code} — {selectedBlock.name}
                </h2>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <Compass className="h-3.5 w-3.5 text-slate-400" />
                <span>{selectedBlock.wingDescription}</span>
                <span aria-hidden="true">·</span>
                <span>{selectedBlock.floors} Floors</span>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {blockRooms.map((room) => {
              const { activeSlot, nextSlot } = getRoomOccupancy(room.id);
              const activeFaculty = activeSlot
                ? facultyList.find((f) => f.id === activeSlot.facultyId)
                : null;
              const nextFaculty = nextSlot
                ? facultyList.find((f) => f.id === nextSlot.facultyId)
                : null;

              return (
                <div
                  key={room.id}
                  className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-2.5">
                      <span className="font-mono text-base font-bold text-slate-900 tabular-nums">
                        Room {room.roomNumber}
                      </span>
                      <span className="text-xs text-slate-500">
                        {room.floor} · {room.roomType} ·{' '}
                        <span className="inline-flex items-center gap-1 tabular-nums">
                          <Users className="h-3 w-3" />
                          {room.capacity} seats
                        </span>
                      </span>
                    </div>

                    {activeSlot && activeFaculty ? (
                      <div className="mt-1.5 text-sm">
                        <span className="font-semibold text-emerald-700">
                          Occupied Now
                        </span>{' '}
                        <span className="text-slate-700">
                          · {activeSlot.subjectName} ({activeSlot.sectionName})
                          with{' '}
                          <span className="font-medium text-slate-900">
                            {activeFaculty.name}
                          </span>{' '}
                          ·{' '}
                          <span className="font-mono text-xs tabular-nums">
                            {formatTimeDisplay(activeSlot.startTime)}–
                            {formatTimeDisplay(activeSlot.endTime)}
                          </span>
                        </span>
                      </div>
                    ) : (
                      <div className="mt-1.5 text-sm text-slate-600">
                        <span>No class scheduled right now</span>
                        {nextSlot && nextFaculty && (
                          <span className="text-slate-500">
                            {' '}
                            · Next at{' '}
                            <span className="font-mono text-xs tabular-nums">
                              {formatTimeDisplay(nextSlot.startTime)}
                            </span>
                            : {nextSlot.subjectName} ({nextFaculty.name})
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {activeFaculty && (
                    <button
                      type="button"
                      onClick={() => onSelectFacultyFromRoom(activeFaculty.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 self-start sm:self-center"
                    >
                      <span>View Faculty</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
