import React, { useState } from 'react';
import { Task } from '../../types';
import { PriorityBadge, StatusBadge } from '../common/Badge';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface TaskCalendarViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export const TaskCalendarView: React.FC<TaskCalendarViewProps> = ({ tasks, onTaskClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Build calendar matrix
  const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

  // Padding days
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push({ dateStr: '', dayNum: 0, isCurrentMonth: false });
  }

  // Days in current month
  for (let d = 1; d <= daysInMonth; d++) {
    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(d).padStart(2, '0');
    days.push({
      dateStr: `${year}-${monthStr}-${dayStr}`,
      dayNum: d,
      isCurrentMonth: true,
    });
  }

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Month Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">
            {monthNames[month]} {year}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Today
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50 text-center py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
        <span>Sun</span>
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 border-b border-slate-100">
        {days.map((item, index) => {
          if (!item.isCurrentMonth) {
            return <div key={index} className="min-h-[110px] bg-slate-50/50 p-2" />;
          }

          const dayTasks = tasks.filter(t => t.dueDate === item.dateStr);
          const isToday = item.dateStr === todayStr;

          return (
            <div
              key={index}
              className={`min-h-[110px] p-2 flex flex-col transition-colors ${
                isToday ? 'bg-indigo-50/30' : 'bg-white hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-xs font-semibold tabular-nums ${
                    isToday
                      ? 'w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center'
                      : 'text-slate-700'
                  }`}
                >
                  {item.dayNum}
                </span>
                {dayTasks.length > 0 && (
                  <span className="text-[10px] text-slate-400 font-medium">
                    {dayTasks.length} task{dayTasks.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Task list inside day */}
              <div className="flex-1 space-y-1 overflow-y-auto max-h-24">
                {dayTasks.map(task => (
                  <div
                    key={task._id}
                    onClick={() => onTaskClick(task)}
                    className="p-1.5 rounded-lg bg-white border border-slate-200/80 shadow-2xs hover:border-indigo-300 transition-all cursor-pointer text-[11px]"
                  >
                    <p className="font-semibold text-slate-800 truncate">{task.title}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[9px] text-slate-400 uppercase font-mono">{task.priority}</span>
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          task.status === 'COMPLETED' ? 'bg-emerald-500' : task.status === 'BLOCKED' ? 'bg-rose-500' : 'bg-blue-500'
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
