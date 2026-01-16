import React from 'react';

// Memoized Item component - only re-renders when its props change
const Item = React.memo(({ item, onUpdate }) => {
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
});

Item.displayName = 'Item';

export default Item;
