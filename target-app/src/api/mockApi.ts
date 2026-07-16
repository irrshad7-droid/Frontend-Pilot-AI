export const mockApi = {
  addTodo: async (text: string) => {
    // Random delay between 100ms and 2000ms
    const delay = Math.floor(Math.random() * 1900) + 100;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return { id: crypto.randomUUID(), text, completed: false };
  },
  toggleTodo: async (_id: string, _currentCompleted: boolean) => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    return !_currentCompleted;
  }
};
