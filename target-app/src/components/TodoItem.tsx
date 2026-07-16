import React from 'react';
import { Trash2, Check } from 'lucide-react';
import type { Todo } from '../types';

interface Props {
  todo: Todo;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
}

export const TodoItem: React.FC<Props> = ({ todo, onToggle, onDelete }) => {
  return (
    <div className="flex items-center justify-between p-4 bg-white border-b last:border-b-0 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-3">
        {/* DEFECT: Accessibility regression. Missing role="checkbox", aria-checked, tabIndex */}
        <div 
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer ${todo.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}
          onClick={() => onToggle(todo.id, todo.completed)}
        >
          {todo.completed && <Check size={14} className="text-white" />}
        </div>
        <span className={`text-lg ${todo.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
          {todo.text}
        </span>
      </div>
      <button 
        onClick={() => onDelete(todo.id)}
        className="text-gray-400 hover:text-red-500 transition-colors"
        aria-label="Delete todo"
      >
        <Trash2 size={20} />
      </button>
    </div>
  );
};
