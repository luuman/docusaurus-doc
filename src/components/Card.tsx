import React from 'react';

export default function Card({children, title, icon, href}) {
  return (
    <div style={{border: '1px solid #eee', padding: '1rem', borderRadius: '8px', marginBottom: '1rem'}}>
      <h3><a href={href}>{title}</a></h3>
      {children}
    </div>
  );
}
