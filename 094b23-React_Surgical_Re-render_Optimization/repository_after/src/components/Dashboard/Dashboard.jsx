import React, { useState, useCallback, useReducer, useMemo } from 'react';
import Item from './Item';

// Initialize items as a normalized Map for O(1) lookups and updates
const initialItems = [
  { id: 1, name: 'Metric A', value: '' },
  { id: 2, name: 'Metric B', value: '' },
  { id: 3, name: 'Metric C', value: '' },
  { id: 4, name: 'Metric D', value: '' },
  { id: 5, name: 'Metric E', value: '' },
];

const initialState = {
  itemsMap: new Map(initialItems.map(item => [item.id, item])),
};

// Reducer with O(1) update complexity using Map
const reducer = (state, action) => {
  switch (action.type) {
    case 'UPDATE_ITEM': {
      const { id, value } = action.payload;
      const newMap = new Map(state.itemsMap);
      const existingItem = newMap.get(id);
      if (existingItem) {
        // Only update the specific item - O(1) operation
        newMap.set(id, { ...existingItem, value });
      }
      return { ...state, itemsMap: newMap };
    }
    default:
      return state;
  }
};

export default function Dashboard() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [search, setSearch] = useState('');

  // Stable reference for update handler - prevents unnecessary re-renders
  const handleUpdate = useCallback((id, newValue) => {
    dispatch({ type: 'UPDATE_ITEM', payload: { id, value: newValue } });
  }, []);

  // Convert Map to array and filter based on search
  const filteredItems = useMemo(() => {
    const itemsArray = Array.from(state.itemsMap.values());
    return itemsArray.filter(item =>
      item.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [state.itemsMap, search]);

  return (
    <div>
      <input
        placeholder="Global Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {filteredItems.map(item => (
        <Item key={item.id} item={item} onUpdate={handleUpdate} />
      ))}
    </div>
  );
}

/**
 * EXPLANATION: Why React.memo alone isn't enough
 * 
 * React.memo performs a shallow comparison of props. If we don't use useCallback
 * for the onUpdate function, a new function reference is created on every render
 * of the Dashboard component. Even though the function does the same thing, the
 * reference changes, causing React.memo to think the props have changed, triggering
 * a re-render of ALL Item components.
 * 
 * With useCallback, the function reference remains stable across renders (unless
 * dependencies change), so React.memo can properly prevent unnecessary re-renders.
 * 
 * Additionally, using a normalized Map structure ensures O(1) update complexity
 * instead of O(N), and only the updated item gets a new object reference, allowing
 * React.memo to work effectively - only the changed Item re-renders.
 */
