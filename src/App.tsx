import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  LayoutDashboard, 
  Calendar, 
  Settings, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  Trash2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Mood, Habit, DayLog, AppState } from './types';
import { MoodSelector } from './components/MoodSelector';
import { HabitList } from './components/HabitList';
import { StatsDashboard } from './components/StatsDashboard';
import { AddHabitModal } from './components/AddHabitModal';
import { cn } from './utils';

const DEFAULT_HABITS: Habit[] = [
  { id: '1', name: 'Meditation', icon: '🧘', color: 'rose' },
  { id: '2', name: 'Exercise', icon: '🏃', color: 'emerald' },
  { id: '3', name: 'Reading', icon: '📚', color: 'blue' },
  { id: '4', name: 'Hydration', icon: '💧', color: 'cyan' },
];

const STORAGE_KEY = 'mindfultrack_data_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<'today' | 'stats' | 'history'>('today');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    return {
      habits: DEFAULT_HABITS,
      logs: {},
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const dateKey = format(selectedDate, 'yyyy-MM-dd');
  const currentLog = state.logs[dateKey] || {
    date: dateKey,
    mood: null,
    habits: [],
    note: '',
  };

  const updateLog = (updates: Partial<DayLog>) => {
    setState(prev => ({
      ...prev,
      logs: {
        ...prev.logs,
        [dateKey]: { ...currentLog, ...updates },
      },
    }));
  };

  const toggleHabit = (habitId: string) => {
    const newHabits = currentLog.habits.includes(habitId)
      ? currentLog.habits.filter(id => id !== habitId)
      : [...currentLog.habits, habitId];
    updateLog({ habits: newHabits });
  };

  const addHabit = (name: string, icon: string) => {
    const newHabit: Habit = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      icon,
      color: 'warm-accent',
    };
    setState(prev => ({
      ...prev,
      habits: [...prev.habits, newHabit],
    }));
    setIsAddModalOpen(false);
  };

  const moveHabit = (habitId: string, direction: 'up' | 'down') => {
    setState(prev => {
      const index = prev.habits.findIndex(h => h.id === habitId);
      if (index === -1) return prev;
      
      const newHabits = [...prev.habits];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      
      if (targetIndex < 0 || targetIndex >= newHabits.length) return prev;
      
      [newHabits[index], newHabits[targetIndex]] = [newHabits[targetIndex], newHabits[index]];
      
      return { ...prev, habits: newHabits };
    });
  };

  const [habitToDelete, setHabitToDelete] = useState<string | null>(null);

  const confirmDelete = () => {
    if (!habitToDelete) return;
    const habitId = habitToDelete;
    
    setState(prev => {
      const newLogs: Record<string, DayLog> = {};
      Object.keys(prev.logs).forEach(date => {
        const log = prev.logs[date];
        newLogs[date] = {
          ...log,
          habits: log.habits.filter(id => id !== habitId)
        };
      });

      return {
        ...prev,
        habits: prev.habits.filter(h => h.id !== habitId),
        logs: newLogs
      };
    });
    setHabitToDelete(null);
  };

  const deleteHabit = (habitId: string) => {
    if (window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
    setHabitToDelete(habitId);
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  return (
    <div className="w-full max-w-md mx-auto min-h-screen bg-warm-bg flex flex-col pb-32 selection:bg-warm-accent/20">
      {/* Header */}
      <header className="p-8 pt-14 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-warm-ink mb-1">
            {activeTab === 'today' ? 'Daily Ritual' : activeTab === 'stats' ? 'Your Journey' : 'Reflections'}
          </h1>
          {activeTab !== 'history' && (
            <p className="text-warm-ink/40 font-medium tracking-wide text-sm uppercase">
              {format(selectedDate, 'EEEE, do MMMM yyyy')}
            </p>
          )}
        </div>
        {activeTab === 'today' && (
          <div className="flex gap-2">
            <button 
              onClick={() => changeDate(-1)}
              className="p-2.5 bg-white rounded-2xl border border-warm-cream shadow-sm hover:bg-warm-cream transition-all active:scale-90"
            >
              <ChevronLeft size={20} className="text-warm-ink/60" />
            </button>
            <button 
              onClick={() => changeDate(1)}
              className="p-2.5 bg-white rounded-2xl border border-warm-cream shadow-sm hover:bg-warm-cream transition-all active:scale-90"
            >
              <ChevronRight size={20} className="text-warm-ink/60" />
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 px-8">
        <AnimatePresence mode="wait">
          {activeTab === 'today' && (
            <motion.div
              key="today"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-10"
            >
              <section>
                <h3 className="text-[10px] font-bold text-warm-ink/40 uppercase tracking-[0.2em] mb-5">How is your heart today?</h3>
                <MoodSelector 
                  selected={currentLog.mood} 
                  onSelect={(mood) => updateLog({ mood })} 
                />
              </section>

              <HabitList 
                habits={state.habits} 
                completedIds={currentLog.habits} 
                onToggle={toggleHabit}
                onDelete={deleteHabit}
                onMove={moveHabit}
                onAdd={() => setIsAddModalOpen(true)}
              />

              <section>
                <h3 className="text-[10px] font-bold text-warm-ink/40 uppercase tracking-[0.2em] mb-5">A quiet reflection</h3>
                <textarea
                  value={currentLog.note}
                  onChange={(e) => updateLog({ note: e.target.value })}
                  placeholder="Whisper your thoughts here..."
                  className="w-full h-40 p-6 rounded-[2rem] bg-white border border-warm-cream focus:ring-2 focus:ring-warm-accent focus:border-transparent outline-none transition-all resize-none placeholder:text-warm-ink/20 font-serif text-lg leading-relaxed"
                />
              </section>
            </motion.div>
          )}

          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <StatsDashboard logs={state.logs} />
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {Object.values(state.logs).filter(l => (l as DayLog).note?.trim()).length === 0 ? (
                <div className="bg-white p-10 rounded-[2.5rem] border border-warm-cream text-center space-y-4 shadow-sm">
                  <div className="w-16 h-16 bg-warm-cream rounded-3xl flex items-center justify-center mx-auto text-warm-accent">
                    <Sparkles size={32} />
                  </div>
                  <h3 className="text-2xl font-serif font-bold">The Memory Book</h3>
                  <p className="text-warm-ink/50 leading-relaxed">Your quiet reflections will appear here. Start writing today.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(Object.values(state.logs) as DayLog[])
                    .filter(log => log.note?.trim())
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((log) => (
                      <div key={log.date} className="bg-white p-6 rounded-[2rem] border border-warm-cream shadow-sm space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-warm-ink/30 uppercase tracking-widest">
                            {format(new Date(log.date + 'T12:00:00'), 'do MMMM yyyy')}
                          </span>
                        </div>
                        <p className="text-warm-ink/80 font-serif text-lg italic leading-relaxed">
                          "{log.note}"
                        </p>
                      </div>
                    ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Navigation Bar */}
      <nav className="fixed bottom-8 left-8 right-8 max-w-md mx-auto">
        <div className="bg-warm-ink text-warm-bg rounded-[2.5rem] p-2.5 flex justify-between items-center shadow-2xl shadow-warm-ink/20 border border-white/10">
          <button
            onClick={() => setActiveTab('today')}
            className={cn(
              "flex items-center gap-2 px-6 py-4 rounded-full transition-all duration-500",
              activeTab === 'today' ? "bg-warm-bg text-warm-ink shadow-lg" : "text-warm-bg/40 hover:text-warm-bg/70"
            )}
          >
            <Sparkles size={22} />
            {activeTab === 'today' && <span className="font-bold text-sm tracking-tight">Today</span>}
          </button>
          
          <button
            onClick={() => setActiveTab('stats')}
            className={cn(
              "flex items-center gap-2 px-6 py-4 rounded-full transition-all duration-500",
              activeTab === 'stats' ? "bg-warm-bg text-warm-ink shadow-lg" : "text-warm-bg/40 hover:text-warm-bg/70"
            )}
          >
            <LayoutDashboard size={22} />
            {activeTab === 'stats' && <span className="font-bold text-sm tracking-tight">Journey</span>}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              "flex items-center gap-2 px-6 py-4 rounded-full transition-all duration-500",
              activeTab === 'history' ? "bg-warm-bg text-warm-ink shadow-lg" : "text-warm-bg/40 hover:text-warm-bg/70"
            )}
          >
            <Calendar size={22} />
            {activeTab === 'history' && <span className="font-bold text-sm tracking-tight">Log</span>}
          </button>
        </div>
      </nav>

      {/* Modals */}
      {isAddModalOpen && (
        <AddHabitModal 
          onClose={() => setIsAddModalOpen(false)} 
          onAdd={addHabit} 
        />
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {habitToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setHabitToDelete(null)}
              className="absolute inset-0 bg-warm-ink/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-start">
                <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl">
                  <Trash2 size={24} />
                </div>
                <button 
                  onClick={() => setHabitToDelete(null)}
                  className="p-2 hover:bg-warm-cream rounded-full transition-colors text-warm-ink/20"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-serif font-bold text-warm-ink">Remove Habit?</h3>
                <p className="text-warm-ink/50 leading-relaxed">
                  Are you sure you want to remove <span className="font-bold text-warm-ink">"{state.habits.find(h => h.id === habitToDelete)?.name}"</span>? 
                  This will also clear it from your history.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setHabitToDelete(null)}
                  className="flex-1 py-4 rounded-2xl font-bold text-warm-ink/40 hover:bg-warm-cream transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (window.navigator.vibrate) window.navigator.vibrate([50, 50, 50]);
                    confirmDelete();
                  }}
                  className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-bold shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
                >
                  Remove
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
