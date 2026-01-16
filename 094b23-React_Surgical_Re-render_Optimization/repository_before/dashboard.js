import React, { useState, useEffect } from 'react';

const Item = ({ item, onUpdate }) => {
  console.log(`Rendering Item: ${item.id}`);
  return (
    <div>
      <span>{item.name}: </span>
      <input
        value={item.value}
        onChange={(e) => onUpdate(item.id, e.target.value)}
      />
    </div>
  );
};

export default function Dashboard() {
  const [items, setItems] = useState([
    { id: 1, name: 'Metric A', value: '' },
    { id: 2, name: 'Metric B', value: '' },
    { id: 3, name: 'Metric C', value: '' },
    { id: 4, name: 'Metric D', value: '' },
    { id: 5, name: 'Metric E', value: '' },
  ]);
  const [search, setSearch] = useState('');

  const handleUpdate = (id, newValue) => {
    const newItems = items.map(item =>
      item.id === id ? { ...item, value: newValue } : item
    );
    setItems(newItems);
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

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