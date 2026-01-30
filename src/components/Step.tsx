import React from 'react';

export default function Step({children, title, index}) {
  return (
    <div>
      <h4>{index}. {title}</h4>
      {children}
    </div>
  );
}
