import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { DayLog, Mood, Habit } from '../types';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, subMonths, addMonths } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { cn } from '../utils';
import { Calendar, TrendingUp, Zap, Heart, Activity, Info, ChevronRight, ChevronLeft, Shield, Download } from 'lucide-react';
import { MoodFace } from './MoodFace';

interface StatsDashboardProps {
  logs: Record<string, DayLog>;
  habitsCount: number;
  habits: Habit[];
}

const moodValues: Record<Mood, number> = {
  'great': 5,
  'good': 4,
  'neutral': 3,
  'bad': 2,
  'terrible': 1
};

const moodLabels: Record<number, string> = {
  5: '極佳',
  4: '不錯',
  3: '平靜',
  2: '不好',
  1: '極差'
};

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ logs, habitsCount, habits }) => {
  const [view, setView] = useState<'week' | 'month'>('week');
  const [activeDetail, setActiveDetail] = useState<'mood' | 'habits' | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const scrollRefMood = useRef<HTMLDivElement>(null);
  const scrollRefHabit = useRef<HTMLDivElement>(null);

  // Use a stable reference for "today" to ensure alignment
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getChartData = () => {
    const days = view === 'week' ? 7 : 30;
    return Array.from({ length: days }).map((_, i) => {
      // Calculate date from today backwards
      const date = subDays(today, (days - 1) - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const log = logs[dateStr];

      return {
        name: format(date, 'MMM do', { locale: zhTW }),
        shortName: view === 'week' ? format(date, 'EEE', { locale: zhTW }) : format(date, 'd'),
        fullDate: dateStr,
        mood: log?.mood ? moodValues[log.mood] : null,
        habits: log?.habits?.length || 0,
      };
    });
  };

  const chartData = getChartData();

  // Auto-scroll to end on mount or view change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (scrollRefMood.current) {
        scrollRefMood.current.scrollTo({ left: scrollRefMood.current.scrollWidth, behavior: 'auto' });
      }
      if (scrollRefHabit.current) {
        scrollRefHabit.current.scrollTo({ left: scrollRefHabit.current.scrollWidth, behavior: 'auto' });
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [view, logs]);

  const calculateStats = () => {
    const last30DaysDates = Array.from({ length: 30 }).map((_, i) => format(subDays(today, i), 'yyyy-MM-dd'));
    const last30DaysLogs = last30DaysDates.map(d => logs[d]).filter(Boolean);

    const avgMoodValue = last30DaysLogs.reduce((acc, log) => acc + (log.mood ? moodValues[log.mood] : 0), 0) / (last30DaysLogs.length || 1);

    // Calculate completion rate based on active logged days
    const activeDays = Math.max(last30DaysLogs.length, 1);
    const totalPossibleHabits = activeDays * (habitsCount || 1);
    const actualCompletedHabits = last30DaysLogs.reduce((acc, log) => acc + (log.habits?.length || 0), 0);
    const habitCompletionRate = (actualCompletedHabits / totalPossibleHabits) * 100;

    // Mood distribution for detail view
    const moodDistribution = last30DaysLogs.reduce((acc, log) => {
      if (log.mood) acc[log.mood] = (acc[log.mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Improved Volatility calculation (comparing consecutive recorded moods)
    const recordedMoods = last30DaysLogs.map(l => moodValues[l.mood!]).filter(v => v !== undefined);
    let totalDiff = 0;
    let comparisons = 0;
    for (let i = 0; i < recordedMoods.length - 1; i++) {
      totalDiff += Math.abs(recordedMoods[i] - recordedMoods[i + 1]);
      comparisons++;
    }
    const moodVolatility = comparisons > 0 ? totalDiff / comparisons : 0;

    // Best Day of Week
    const dayStats: Record<string, { sum: number, count: number }> = {};
    last30DaysLogs.forEach(log => {
      if (log.mood) {
        const day = format(parseISO(log.date), 'EEEE', { locale: zhTW });
        if (!dayStats[day]) dayStats[day] = { sum: 0, count: 0 };
        dayStats[day].sum += moodValues[log.mood];
        dayStats[day].count += 1;
      }
    });

    let bestDay = '無';
    let maxAvg = 0;
    Object.entries(dayStats).forEach(([day, stat]) => {
      const avg = stat.sum / stat.count;
      if (avg > maxAvg) {
        maxAvg = avg;
        bestDay = day;
      }
    });

    // Streak (General) - Consistent with HabitList logic
    let streak = 0;
    let checkDate = today;
    let checkDateStr = format(checkDate, 'yyyy-MM-dd');

    if (!(logs[checkDateStr]?.habits?.length > 0)) {
      checkDate = subDays(checkDate, 1);
      checkDateStr = format(checkDate, 'yyyy-MM-dd');
    }

    while (logs[checkDateStr]?.habits?.length > 0) {
      streak++;
      checkDate = subDays(checkDate, 1);
      checkDateStr = format(checkDate, 'yyyy-MM-dd');
    }

    // Total Reflections
    const totalReflections = last30DaysLogs.filter(l => l.note?.trim()).length;

    const habitRecords = habits.map(habit => {
      const count = last30DaysLogs.filter(log => log.habits?.includes(habit.id)).length;
      return {
        ...habit,
        count,
        completionRate: Math.round((count / Math.max(last30DaysLogs.length, 1)) * 100)
      };
    });

    return {
      avgMood: moodLabels[Math.round(avgMoodValue)] || '平靜',
      avgMoodValue: avgMoodValue.toFixed(1),
      moodDistribution,
      completion: Math.round(habitCompletionRate),
      stability: moodVolatility < 0.8 ? '穩定' : moodVolatility < 1.5 ? '平靜' : '多變',
      bestDay,
      streak,
      totalReflections,
      entriesCount: last30DaysLogs.length,
      habitRecords
    };
  };

  const stats = calculateStats();

  const CalendarCycle = () => {
    const monthStart = startOfMonth(calendarMonth);
    const monthEnd = endOfMonth(calendarMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDay = monthStart.getDay(); // 0 is Sunday
    const blanksCount = startDay === 0 ? 6 : startDay - 1;
    const blanks = Array(blanksCount).fill(null);

    const nextMonth = () => setCalendarMonth(addMonths(calendarMonth, 1));
    const prevMonth = () => setCalendarMonth(subMonths(calendarMonth, 1));

    return (
      <div className="bg-white p-6 rounded-[2.5rem] border border-warm-cream shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <button onClick={prevMonth} className="p-1 hover:bg-warm-cream rounded-lg transition-colors">
              <ChevronLeft size={16} className="text-warm-ink/40" />
            </button>
            <h4 className="text-sm font-bold text-warm-ink uppercase tracking-widest">{format(calendarMonth, 'yyyy年 MM月', { locale: zhTW })}</h4>
            <button onClick={nextMonth} className="p-1 hover:bg-warm-cream rounded-lg transition-colors">
              <ChevronRight size={16} className="text-warm-ink/40" />
            </button>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-mood-good"></div>
              <span className="text-[8px] font-bold text-warm-ink/40 uppercase">心情</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-warm-accent"></div>
              <span className="text-[8px] font-bold text-warm-ink/40 uppercase">習慣</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-y-4 text-center">
          {['一', '二', '三', '四', '五', '六', '日'].map((d, i) => (
            <div key={`${d}-${i}`} className="text-[10px] font-bold text-warm-ink/20">{d}</div>
          ))}

          {blanks.map((_, i) => <div key={`blank-${i}`}></div>)}

          {days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const log = logs[dateStr];
            const hasMood = !!log?.mood;
            const habitCount = log?.habits?.length || 0;
            const isToday = isSameDay(day, today);

            return (
              <div key={dateStr} className="relative flex flex-col items-center justify-start h-14 gap-1">
                <span className={cn(
                  "text-[10px] font-medium z-10",
                  isToday ? "text-warm-accent font-bold" : "text-warm-ink/40"
                )}>
                  {format(day, 'd')}
                </span>

                <div className="relative flex items-center justify-center w-8 h-8">
                  {hasMood ? (
                    <div className="flex items-center justify-center drop-shadow-sm transition-transform hover:scale-110">
                      <MoodFace
                        mood={log.mood}
                        size={32}
                        className={
                          log.mood === 'great' ? "text-mood-great" :
                            log.mood === 'good' ? "text-mood-good" :
                              log.mood === 'neutral' ? "text-mood-neutral" :
                                log.mood === 'bad' ? "text-mood-bad" :
                                  "text-mood-terrible"
                        }
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-warm-cream/50 border border-warm-cream shadow-sm"></div>
                  )}

                  {/* Habit Dots */}
                  {habitCount > 0 && (
                    <div className="absolute -bottom-1.5 flex gap-0.5">
                      {Array.from({ length: Math.min(habitCount, 3) }).map((_, i) => (
                        <div key={i} className="w-1 h-1 rounded-full bg-warm-accent"></div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const SummaryCard = ({ title, value, unit, icon: Icon, color, trend, onClick }: any) => (
    <button
      onClick={onClick}
      className="bg-white p-5 rounded-3xl border border-warm-cream shadow-sm flex flex-col justify-between h-36 transition-all duration-500 hover:shadow-md text-left w-full"
    >
      <div className="flex justify-between items-start">
        <div className={cn("p-2 rounded-xl bg-opacity-10", color.replace('text-', 'bg-'))}>
          <Icon size={18} className={color} />
        </div>
        <ChevronRight size={16} className="text-warm-ink/20" />
      </div>
      <div>
        <div className="text-[10px] font-bold text-warm-ink/40 uppercase tracking-widest mb-1">{title}</div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold font-serif text-warm-ink">{value}</span>
          {unit && <span className="text-xs font-medium text-warm-ink/40">{unit}</span>}
        </div>
        {trend && <div className="text-[10px] font-medium text-warm-sage mt-1">↑ {trend}</div>}
      </div>
    </button>
  );

  const exportData = () => {
    const data = localStorage.getItem('mindfultrack_data_v1');
    if (!data) return;
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindful-track-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* View Toggle - Health App Style */}
      <div className="flex p-1 bg-warm-cream/50 rounded-2xl w-full">
        <button
          onClick={() => setView('week')}
          className={cn(
            "flex-1 py-2 rounded-xl text-xs font-bold transition-all",
            view === 'week' ? "bg-white text-warm-ink shadow-sm" : "text-warm-ink/40"
          )}
        >
          週
        </button>
        <button
          onClick={() => setView('month')}
          className={cn(
            "flex-1 py-2 rounded-xl text-xs font-bold transition-all",
            view === 'month' ? "bg-white text-warm-ink shadow-sm" : "text-warm-ink/40"
          )}
        >
          月
        </button>
      </div>

      {/* Highlights Section */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold font-serif text-warm-ink">重點摘要</h3>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <SummaryCard
              title="平均心情"
              value={stats.avgMood}
              icon={Heart}
              color={
                Math.round(parseFloat(stats.avgMoodValue)) === 5 ? "text-mood-great" :
                  Math.round(parseFloat(stats.avgMoodValue)) === 4 ? "text-mood-good" :
                    Math.round(parseFloat(stats.avgMoodValue)) === 3 ? "text-mood-neutral" :
                      Math.round(parseFloat(stats.avgMoodValue)) === 2 ? "text-mood-bad" :
                        "text-mood-terrible"
              }
              trend="穩定"
              onClick={() => setActiveDetail(activeDetail === 'mood' ? null : 'mood')}
            />
            <SummaryCard
              title="習慣分數"
              value={stats.completion}
              unit="%"
              icon={Zap}
              color="text-warm-accent"
              trend="與上週相比 5%"
              onClick={() => setActiveDetail(activeDetail === 'habits' ? null : 'habits')}
            />
          </div>

          <AnimatePresence>
            {activeDetail === 'mood' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white p-6 rounded-[2.5rem] border border-warm-cream shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-warm-ink uppercase tracking-widest">心情分佈</h4>
                    <span className="text-[10px] text-warm-ink/40">過去 30 天</span>
                  </div>
                  <div className="space-y-3">
                    {(['great', 'good', 'neutral', 'bad', 'terrible'] as Mood[]).map((moodKey) => {
                      const count = stats.moodDistribution[moodKey] || 0;
                      const label = moodKey.charAt(0).toUpperCase() + moodKey.slice(1);
                      const percentage = (count / 30) * 100;
                      return (
                        <div key={moodKey} className="space-y-1">
                          <div className="flex justify-between text-[10px] font-medium">
                            <span>{label}</span>
                            <span>{count} days</span>
                          </div>
                          <div className="h-1.5 bg-warm-cream rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              className={cn(
                                "h-full",
                                moodKey === 'great' ? "bg-mood-great" :
                                  moodKey === 'good' ? "bg-mood-good" :
                                    moodKey === 'neutral' ? "bg-mood-neutral" :
                                      moodKey === 'bad' ? "bg-mood-bad" :
                                        "bg-mood-terrible"
                              )}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {activeDetail === 'habits' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white p-6 rounded-[2.5rem] border border-warm-cream shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-warm-ink uppercase tracking-widest">習慣堅持度分析</h4>
                    <span className="text-[10px] text-warm-ink/40">過去 30 天</span>
                  </div>

                  <div className="space-y-4 pt-2">
                    {stats.habitRecords.map((habit) => (
                      <div key={habit.id} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-bold text-warm-ink">
                          <div className="flex items-center gap-2">
                            <span>{habit.icon}</span>
                            <span>{habit.name}</span>
                          </div>
                          <span className="text-warm-ink/60">{habit.count} 天</span>
                        </div>
                        <div className="h-1.5 bg-warm-cream rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${habit.completionRate}%` }}
                            className="h-full bg-warm-accent"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="p-4 bg-warm-cream/30 rounded-2xl">
                      <div className="text-[10px] font-bold text-warm-ink/40 uppercase mb-1">穩定度</div>
                      <div className="text-lg font-serif font-bold text-warm-ink">{stats.stability}</div>
                    </div>
                    <div className="p-4 bg-warm-cream/30 rounded-2xl">
                      <div className="text-[10px] font-bold text-warm-ink/40 uppercase mb-1">最佳星期</div>
                      <div className="text-lg font-serif font-bold text-warm-ink">{stats.bestDay}</div>
                    </div>
                  </div>
                  <p className="text-[10px] text-warm-ink/50 leading-relaxed italic">
                    "你通常在{stats.bestDay}有最好的表現，試著在這些日子安排最重要的任務吧。"
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <CalendarCycle />

          <div className="grid grid-cols-2 gap-4">
            <SummaryCard
              title="最佳星期"
              value={stats.bestDay}
              icon={Calendar}
              color="text-warm-sage"
            />
            <SummaryCard
              title="連續天數"
              value={stats.streak}
              unit="天"
              icon={TrendingUp}
              color="text-warm-accent"
            />
            <div className="col-span-2">
              <div className="bg-white p-5 rounded-3xl border border-warm-cream shadow-sm flex items-center gap-4 relative overflow-hidden">
                <div className="p-3 rounded-2xl bg-warm-cream text-warm-accent z-10">
                  <Info size={20} />
                </div>
                <div className="z-10">
                  <div className="text-[10px] font-bold text-warm-ink/40 uppercase tracking-widest">反思總數</div>
                  <div className="text-xl font-bold font-serif text-warm-ink">已寫下 {stats.totalReflections} 則筆記</div>
                </div>
                <img src="woodstock.png" alt="Woodstock" className="absolute -right-2 -bottom-2 w-20 opacity-20 object-contain pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mood Flow - Scrollable */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold font-serif text-warm-ink">心情起伏</h3>
          <Info size={16} className="text-warm-ink/20" />
        </div>
        <div className="bg-white rounded-[2.5rem] border border-warm-cream shadow-sm overflow-hidden">
          <div className="p-6 pb-2">
            <div className="text-3xl font-bold font-serif text-warm-ink">{stats.avgMoodValue}</div>
            <div className="text-[10px] font-bold text-warm-ink/40 uppercase tracking-widest">平均分數</div>
          </div>
          <div
            ref={scrollRefMood}
            className="overflow-x-auto scrollbar-hide touch-pan-x"
          >
            <div style={{ width: view === 'month' ? '1200px' : '100%' }} className="h-64 p-6 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-mood-good)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--color-mood-good)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f2ed" />
                  <XAxis
                    dataKey="shortName"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#4a3f35', opacity: 0.4, fontWeight: 600 }}
                    interval={view === 'month' ? 4 : 0}
                  />
                  <YAxis
                    domain={[1, 5]}
                    ticks={[1, 2, 3, 4, 5]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#4a3f35', opacity: 0.2 }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-warm-ink text-warm-bg px-3 py-2 rounded-xl text-[10px] font-bold shadow-xl">
                            {payload[0].payload.name}: {moodLabels[payload[0].value as number]}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="mood"
                    stroke="var(--color-mood-good)"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorMood)"
                    connectNulls
                    animationDuration={1500}
                    dot={{ r: 4, fill: 'var(--color-mood-good)', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* Habit Rhythm - Scrollable */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold font-serif text-warm-ink">習慣節奏</h3>
          <Activity size={16} className="text-warm-ink/20" />
        </div>
        <div className="bg-white rounded-[2.5rem] border border-warm-cream shadow-sm overflow-hidden">
          <div className="p-6 pb-2">
            <div className="text-3xl font-bold font-serif text-warm-ink">{stats.completion}%</div>
            <div className="text-[10px] font-bold text-warm-ink/40 uppercase tracking-widest">完成率</div>
          </div>
          <div
            ref={scrollRefHabit}
            className="overflow-x-auto scrollbar-hide touch-pan-x"
          >
            <div style={{ width: view === 'month' ? '1200px' : '100%' }} className="h-64 p-6 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f2ed" />
                  <XAxis
                    dataKey="shortName"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#4a3f35', opacity: 0.4, fontWeight: 600 }}
                    interval={view === 'month' ? 4 : 0}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#4a3f35', opacity: 0.2 }}
                  />
                  <Tooltip
                    cursor={{ fill: '#fdfcf8', radius: 12 }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-warm-ink text-warm-bg px-3 py-2 rounded-xl text-[10px] font-bold shadow-xl">
                            {payload[0].payload.name}: {payload[0].value} habits
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="habits" radius={[8, 8, 8, 8]} barSize={view === 'month' ? 16 : 24}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.habits > 0 ? '#e8a87c' : '#f5f2ed'}
                        fillOpacity={entry.habits > 0 ? 1 : 0.5}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* Cycle Analysis Card */}
      <section>
        <div className="bg-gradient-to-br from-warm-rose/20 to-warm-accent/20 p-8 rounded-[2.5rem] border border-white shadow-inner">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white rounded-xl shadow-sm">
              <TrendingUp size={20} className="text-warm-ink" />
            </div>
            <h4 className="text-lg font-bold font-serif text-warm-ink">週期分析</h4>
          </div>
          <p className="text-sm text-warm-ink/70 leading-relaxed mb-6">
            根據你這個月的 {stats.entriesCount} 則紀錄，你的情緒狀態屬於 <span className="font-bold text-warm-ink">{stats.stability}</span>。
            {stats.completion > 50
              ? ` 你的習慣堅持度（${stats.completion}%）正幫助維持這份${stats.stability}的狀態。`
              : " 建立更穩定的日常習慣，有助於平穩你的情緒節奏。"}
          </p>
          <div className="flex gap-4">
            <div className="flex-1 bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-white/50">
              <div className="text-[10px] font-bold text-warm-ink/40 uppercase tracking-widest mb-1">穩定度</div>
              <div className="font-bold text-warm-ink">{stats.stability}</div>
            </div>
            <div className="flex-1 bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-white/50">
              <div className="text-[10px] font-bold text-warm-ink/40 uppercase tracking-widest mb-1">連續天數</div>
              <div className="font-bold text-warm-ink">{stats.streak} 天</div>
            </div>
          </div>
        </div>
      </section>
      <section className="pt-4">
        <div className="bg-warm-cream/30 p-6 rounded-[2.5rem] border border-warm-cream/50 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl text-warm-accent shadow-sm">
              <Shield size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-warm-ink">資料安全</h4>
              <p className="text-[10px] text-warm-ink/40">你的資料安全地儲存在你的設備上。</p>
            </div>
          </div>
          <button
            onClick={exportData}
            className="w-full py-3 bg-white border border-warm-cream rounded-2xl text-xs font-bold text-warm-ink shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Download size={14} />
            匯出備份
          </button>
        </div>
      </section>
    </div>
  );
};
