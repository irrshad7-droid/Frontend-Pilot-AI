import React, { useState } from 'react';
import { TodoItem } from './components/TodoItem';
import { mockApi } from './api/mockApi';
import type { Todo } from './types';
import { CheckSquare } from 'lucide-react';

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // DEFECT: Validation bug. Allows empty strings and doesn't trim. 
    // The error state is set but never displayed in the UI correctly if we try to block it.
    if (inputValue.length > 100) {
      setError("Todo is too long");
      // Bug: Doesn't return here! Continues adding it anyway.
    }

    setIsLoading(true);
    setInputValue('');

    // DEFECT: Async race condition & stale state.
    // mockApi adds a random delay. If the user submits multiple todos quickly, 
    // the closure captures the stale `todos` array. They will overwrite each other.
    const newTodo = await mockApi.addTodo(inputValue);
    
    setTodos([...todos, newTodo]); // Should be setTodos(prev => [...prev, newTodo])
    setIsLoading(false);
  };

  const handleToggle = async (id: string, currentCompleted: boolean) => {
    // Optimistic update
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    
    // Server sync
    await mockApi.toggleTodo(id, currentCompleted);
  };

  const handleDelete = (id: string) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  const activeCount = todos.filter(t => !t.completed).length;

  return (
    <div className="min-h-screen w-full flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 flex items-center justify-center gap-3">
            <CheckSquare size={36} className="text-blue-500" />
            Todo App
          </h1>
          <p className="text-gray-500 mt-2">Hackathon Demo Target</p>
        </div>

        <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100">
          <form onSubmit={handleAddTodo} className="p-4 border-b border-gray-100 bg-gray-50">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="What needs to be done?"
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Add
              </button>
            </div>
            {/* DEFECT: Error message is conditionally rendered but using a buggy check or styled poorly so it's invisible */}
            <div className="text-red-500 text-sm mt-2 h-5">
               {error && <span>{error}</span>}
            </div>
          </form>

          <div className="max-h-[60vh] overflow-y-auto">
            {todos.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                No todos yet. Add one above!
              </div>
            ) : (
              todos.map((todo, index) => (
                /* DEFECT: Incorrect list keys. Using index as key causes UI sync issues when deleting */
                <TodoItem 
                  key={index} 
                  todo={todo} 
                  onToggle={handleToggle} 
                  onDelete={handleDelete} 
                />
              ))
            )}
          </div>

          <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
            <span>{activeCount} item{activeCount !== 1 ? 's' : ''} left</span>
            
            {/* DEFECT: Missing event handler. No onClick provided to actually clear completed items */}
            <button className="hover:underline hover:text-gray-800 transition-colors">
              Clear completed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
