import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
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
  { id: '1', name: '冥想', icon: '🧘', color: 'rose' },
  { id: '2', name: '運動', icon: '🏃', color: 'emerald' },
  { id: '3', name: '閱讀', icon: '📚', color: 'blue' },
  { id: '4', name: '喝水', icon: '💧', color: 'cyan' },
];

const STORAGE_KEY = 'mindfultrack_data_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<'today' | 'stats' | 'history'>('today');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.habits)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load state:', e);
    }
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
      <header className="p-8 pt-14 flex justify-between items-end relative">
        <img src="snoopy.png" alt="Snoopy Theme" className="absolute top-2 right-4 w-28 opacity-90 object-contain pointer-events-none drop-shadow-md" style={{ transform: 'scaleX(-1)' }} />
        <div className="z-10">
          <h1 className="text-4xl font-bold tracking-tight text-warm-ink mb-1">
            {activeTab === 'today' ? '今日儀式' : activeTab === 'stats' ? '成長軌跡' : '反思回顧'}
          </h1>
          {activeTab !== 'history' && (
            <p className="text-warm-ink/40 font-medium tracking-wide text-sm uppercase">
              {format(selectedDate, 'yyyy年MM月dd日 EEEE', { locale: zhTW })}
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
                <h3 className="text-[10px] font-bold text-warm-ink/40 uppercase tracking-[0.2em] mb-5">今天的心情如何？</h3>
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
                <h3 className="text-[10px] font-bold text-warm-ink/40 uppercase tracking-[0.2em] mb-5">靜心反思</h3>
                <textarea
                  value={currentLog.note}
                  onChange={(e) => updateLog({ note: e.target.value })}
                  placeholder="在這裡寫下你的思緒..."
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
              <StatsDashboard logs={state.logs} habitsCount={state.habits.length} habits={state.habits} />
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
                <div className="bg-white p-10 rounded-[2.5rem] border border-warm-cream text-center space-y-4 shadow-sm relative overflow-hidden">
                  <div className="w-20 h-20 bg-warm-cream rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <img src="woodstock.png" alt="Woodstock" className="w-14 h-14 object-contain" />
                  </div>
                  <h3 className="text-2xl font-serif font-bold">記憶相冊</h3>
                  <p className="text-warm-ink/50 leading-relaxed">你的反思將呈現在此處。今天就開始記錄吧。</p>
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
                            {format(new Date(log.date + 'T12:00:00'), 'yyyy年MM月dd日', { locale: zhTW })}
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
      <nav className="fixed bottom-6 left-0 right-0 z-40 px-6 pointer-events-none flex justify-center">
        <div className="bg-warm-ink/95 backdrop-blur-xl rounded-full text-warm-bg p-2 flex justify-between items-center shadow-[0_20px_40px_rgba(74,63,53,0.25)] border border-white/10 pointer-events-auto w-full max-w-sm">
          <button
            onClick={() => setActiveTab('today')}
            className={cn(
              "flex items-center justify-center gap-2 px-5 py-3.5 rounded-full transition-all duration-500 flex-1",
              activeTab === 'today' ? "bg-warm-bg text-warm-ink shadow-xl scale-100" : "text-warm-bg/50 hover:text-warm-bg/80 hover:bg-white/10 mx-1 scale-95"
            )}
          >
            <Sparkles size={20} className={activeTab === 'today' ? "animate-pulse" : ""} />
            {activeTab === 'today' && <span className="font-bold text-sm tracking-tight">今日</span>}
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={cn(
              "flex items-center justify-center gap-2 px-5 py-3.5 rounded-full transition-all duration-500 flex-1",
              activeTab === 'stats' ? "bg-warm-bg text-warm-ink shadow-xl scale-100" : "text-warm-bg/50 hover:text-warm-bg/80 hover:bg-white/10 mx-1 scale-95"
            )}
          >
            <LayoutDashboard size={20} />
            {activeTab === 'stats' && <span className="font-bold text-sm tracking-tight">軌跡</span>}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              "flex items-center justify-center gap-2 px-5 py-3.5 rounded-full transition-all duration-500 flex-1",
              activeTab === 'history' ? "bg-warm-bg text-warm-ink shadow-xl scale-100" : "text-warm-bg/50 hover:text-warm-bg/80 hover:bg-white/10 mx-1 scale-95"
            )}
          >
            <Calendar size={20} />
            {activeTab === 'history' && <span className="font-bold text-sm tracking-tight">日誌</span>}
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
                <h3 className="text-2xl font-serif font-bold text-warm-ink">移除習慣？</h3>
                <p className="text-warm-ink/50 leading-relaxed">
                  確定要移除 <span className="font-bold text-warm-ink">"{state.habits.find(h => h.id === habitToDelete)?.name}"</span> 嗎？這也會將其從歷史紀錄中清除。
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setHabitToDelete(null)}
                  className="flex-1 py-4 rounded-2xl font-bold text-warm-ink/40 hover:bg-warm-cream transition-all"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    if (window.navigator.vibrate) window.navigator.vibrate([50, 50, 50]);
                    confirmDelete();
                  }}
                  className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-bold shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
                >
                  移除
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
