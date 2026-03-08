import React from 'react';
import { Mood } from '../types';
import { cn } from '../utils';
import { MoodFace } from './MoodFace';

interface MoodSelectorProps {
  selected: Mood | null;
  onSelect: (mood: Mood) => void;
}

const moods: { type: Mood; label: string; color: string }[] = [
  { type: 'great', label: '極佳', color: 'text-mood-great bg-mood-great/10' },
  { type: 'good', label: '不錯', color: 'text-mood-good bg-mood-good/10' },
  { type: 'neutral', label: '平靜', color: 'text-mood-neutral bg-mood-neutral/10' },
  { type: 'bad', label: '不好', color: 'text-mood-bad bg-mood-bad/10' },
  { type: 'terrible', label: '極差', color: 'text-mood-terrible bg-mood-terrible/10' },
];

export const MoodSelector: React.FC<MoodSelectorProps> = ({ selected, onSelect }) => {
  return (
    <div className="flex justify-between items-center gap-2">
      {moods.map(({ type, label, color }) => (
        <button
          key={type}
          onClick={() => onSelect(type)}
          className={cn(
            "flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-300 flex-1",
            selected === type
              ? cn(color, "ring-2 ring-offset-2 ring-current scale-105 shadow-sm")
              : "bg-white/50 hover:bg-white text-warm-ink/40"
          )}
        >
          <div className={cn("transition-all duration-300",
            selected === type ? color.split(' ')[0] : "opacity-60 grayscale"
          )}>
            <MoodFace mood={type} size={32} />
          </div>
          <span className="text-[9px] font-bold uppercase tracking-widest">{label}</span>
        </button>
      ))}
    </div>
  );
};
