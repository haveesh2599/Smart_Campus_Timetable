import { useState } from 'react';
import {
  ACADEMIC_BLOCKS,
  CLASSROOMS,
  DEPARTMENTS,
  FACULTY_MEMBERS,
  INITIAL_SCHEDULE_CHANGES,
  INITIAL_TIMETABLES,
} from './data/mockCampusData';
import {
  FacultyMember,
  ScheduleChange,
  TimetableEntry,
  WorkspaceView,
} from './types/campus';
import { TopBar } from './components/TopBar';
import { StudentLocatorView } from './components/StudentLocatorView';
import { CampusBlocksView } from './components/CampusBlocksView';
import { DailyScheduleView } from './components/DailyScheduleView';
import { TimetableManagerView } from './components/TimetableManagerView';
import { FacultyLoginModal } from './components/FacultyLoginModal';

export default function App() {
  const [activeView, setActiveView] = useState<WorkspaceView>('locator');
  const [loggedInFaculty, setLoggedInFaculty] = useState<FacultyMember | null>(
    null
  );
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // Reference date/time defaults to Tuesday 2026-11-17 10:30 AM so active classes & modifications are immediately visible
  const [referenceDate, setReferenceDate] = useState<string>('2026-11-17');
  const [referenceTime, setReferenceTime] = useState<string>('10:30');

  const [selectedFacultyId, setSelectedFacultyId] = useState<string>(
    FACULTY_MEMBERS[0].id
  );
  const [selectedBlockId, setSelectedBlockId] = useState<string | undefined>(
    undefined
  );

  // Client-side UI prototype state
  const [timetables, setTimetables] =
    useState<TimetableEntry[]>(INITIAL_TIMETABLES);
  const [scheduleChanges, setScheduleChanges] = useState<ScheduleChange[]>(
    INITIAL_SCHEDULE_CHANGES
  );

  const handleAddTimetable = (entry: Omit<TimetableEntry, 'id'>) => {
    const newEntry: TimetableEntry = {
      ...entry,
      id: `tt-${Date.now()}`,
    };
    setTimetables((prev) => [...prev, newEntry]);
  };

  const handleUpdateTimetable = (
    id: string,
    updated: Omit<TimetableEntry, 'id'>
  ) => {
    setTimetables((prev) =>
      prev.map((item) => (item.id === id ? { ...updated, id } : item))
    );
  };

  const handleDeleteTimetable = (id: string) => {
    setTimetables((prev) => prev.filter((item) => item.id !== id));
    setScheduleChanges((prev) => prev.filter((chg) => chg.timetableId !== id));
  };

  const handleAddScheduleChange = (
    change: Omit<ScheduleChange, 'id' | 'createdAt'>
  ) => {
    const newChange: ScheduleChange = {
      ...change,
      id: `chg-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    // If permanent modification, also update recurring entry if timing/room changed
    if (change.modificationScope === 'permanent') {
      if (change.modificationType !== 'cancel') {
        setTimetables((prev) =>
          prev.map((item) => {
            if (item.id !== change.timetableId) return item;
            return {
              ...item,
              startTime: change.newStartTime || item.startTime,
              endTime: change.newEndTime || item.endTime,
              blockId: change.newBlockId || item.blockId,
              classroomId: change.newClassroomId || item.classroomId,
            };
          })
        );
      }
    }

    setScheduleChanges((prev) => [newChange, ...prev]);
  };

  const handleRemoveScheduleChange = (changeId: string) => {
    setScheduleChanges((prev) => prev.filter((c) => c.id !== changeId));
  };

  const handleResetDemoData = () => {
    setTimetables(INITIAL_TIMETABLES);
    setScheduleChanges(INITIAL_SCHEDULE_CHANGES);
  };

  const handleLoginSuccess = (faculty: FacultyMember) => {
    setLoggedInFaculty(faculty);
    setLoginModalOpen(false);
    setActiveView('manager');
  };

  const handleSignOut = () => {
    setLoggedInFaculty(null);
    if (activeView === 'manager') {
      setActiveView('locator');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <TopBar
        activeView={activeView}
        onNavigate={(view) => {
          if (view === 'blocks') setSelectedBlockId(undefined);
          setActiveView(view);
        }}
        loggedInFaculty={loggedInFaculty}
        onOpenLogin={() => setLoginModalOpen(true)}
        onSignOut={handleSignOut}
      />

      <main className="flex-1">
        {activeView === 'locator' && (
          <StudentLocatorView
            facultyList={FACULTY_MEMBERS}
            departments={DEPARTMENTS}
            blocks={ACADEMIC_BLOCKS}
            classrooms={CLASSROOMS}
            timetables={timetables}
            scheduleChanges={scheduleChanges}
            referenceDate={referenceDate}
            referenceTime={referenceTime}
            onChangeReferenceDate={setReferenceDate}
            onChangeReferenceTime={setReferenceTime}
            selectedFacultyId={selectedFacultyId}
            onSelectFaculty={setSelectedFacultyId}
            onOpenBlockDirectory={(blockId) => {
              setSelectedBlockId(blockId);
              setActiveView('blocks');
            }}
          />
        )}

        {activeView === 'blocks' && (
          <CampusBlocksView
            blocks={ACADEMIC_BLOCKS}
            classrooms={CLASSROOMS}
            facultyList={FACULTY_MEMBERS}
            timetables={timetables}
            scheduleChanges={scheduleChanges}
            referenceDate={referenceDate}
            referenceTime={referenceTime}
            initialBlockId={selectedBlockId}
            onSelectFacultyFromRoom={(facId) => {
              setSelectedFacultyId(facId);
              setActiveView('locator');
            }}
          />
        )}

        {activeView === 'daily' && (
          <DailyScheduleView
            facultyList={FACULTY_MEMBERS}
            departments={DEPARTMENTS}
            blocks={ACADEMIC_BLOCKS}
            classrooms={CLASSROOMS}
            timetables={timetables}
            scheduleChanges={scheduleChanges}
            referenceDate={referenceDate}
            onChangeReferenceDate={setReferenceDate}
            onInspectFaculty={(facId) => {
              setSelectedFacultyId(facId);
              setActiveView('locator');
            }}
          />
        )}

        {activeView === 'manager' && loggedInFaculty && (
          <TimetableManagerView
            loggedInFaculty={loggedInFaculty}
            facultyList={FACULTY_MEMBERS}
            departments={DEPARTMENTS}
            blocks={ACADEMIC_BLOCKS}
            classrooms={CLASSROOMS}
            timetables={timetables}
            scheduleChanges={scheduleChanges}
            referenceDate={referenceDate}
            onAddTimetable={handleAddTimetable}
            onUpdateTimetable={handleUpdateTimetable}
            onDeleteTimetable={handleDeleteTimetable}
            onAddScheduleChange={handleAddScheduleChange}
            onRemoveScheduleChange={handleRemoveScheduleChange}
            onResetDemoData={handleResetDemoData}
          />
        )}
      </main>

      <footer className="mt-12 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>
            Smart Campus · Faculty Availability &amp; Classroom Locator System
          </p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveView('locator')}
              className="hover:text-slate-800"
            >
              Faculty Search
            </button>
            <button
              type="button"
              onClick={() => setActiveView('blocks')}
              className="hover:text-slate-800"
            >
              Academic Blocks
            </button>
            <button
              type="button"
              onClick={() => {
                if (loggedInFaculty) {
                  setActiveView('manager');
                } else {
                  setLoginModalOpen(true);
                }
              }}
              className="hover:text-slate-800"
            >
              Faculty Portal
            </button>
          </div>
        </div>
      </footer>

      <FacultyLoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        facultyList={FACULTY_MEMBERS}
        departments={DEPARTMENTS}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
