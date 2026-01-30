import React from 'react';

export default function CardGroup({children, cols = 2}) {
  return (
    <div style={{display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '1rem'}}>
      {children}
    </div>
  );
}
