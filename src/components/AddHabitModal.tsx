import React, { useState } from 'react';
import { X } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../utils';

interface AddHabitModalProps {
  onClose: () => void;
  onAdd: (name: string, icon: string) => void;
}

const EMOJIS = ['🧘', '🏃', '📚', '💧', '🍎', '💤', '✍️', '🌱', '🎹', '🚶', '💻', '🎨'];

export const AddHabitModal: React.FC<AddHabitModalProps> = ({ onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(EMOJIS[0]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-warm-ink/20 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-warm-bg w-full max-w-sm rounded-[3rem] p-10 shadow-2xl border border-white"
      >
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-bold font-serif">新增習慣</h3>
          <button onClick={onClose} className="p-2 hover:bg-warm-cream rounded-full text-warm-ink/40">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-8">
          <div>
            <label className="text-[10px] font-bold text-warm-ink/40 uppercase tracking-widest mb-3 block">習慣名稱</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：晨間瑜珈"
              className="w-full p-5 rounded-[1.5rem] bg-white border border-warm-cream focus:ring-2 focus:ring-warm-accent focus:border-transparent outline-none transition-all font-serif text-lg"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-warm-ink/40 uppercase tracking-widest mb-3 block">選擇圖示</label>
            <div className="grid grid-cols-4 gap-3">
              {EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => setIcon(emoji)}
                  className={cn(
                    "text-3xl p-3 rounded-2xl transition-all duration-300",
                    icon === emoji ? 'bg-warm-accent text-white scale-110 shadow-lg shadow-warm-accent/20' : 'bg-white border border-warm-cream hover:bg-warm-cream'
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <button
            disabled={!name.trim()}
            onClick={() => onAdd(name, icon)}
            className="w-full py-5 bg-warm-ink text-warm-bg rounded-[1.5rem] font-bold text-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-warm-ink/90 transition-all active:scale-95 shadow-xl shadow-warm-ink/10"
          >
            開始習慣
          </button>
        </div>
      </motion.div>
    </div>
  );
};
