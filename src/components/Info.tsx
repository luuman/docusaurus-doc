import React from 'react';

export default function Info({children}) {
  return (
    <div style={{backgroundColor: 'var(--ifm-color-primary-lightest)', borderLeft: '8px solid var(--ifm-color-primary)', padding: '1rem', marginBottom: '1rem'}}>
      {children}
    </div>
  );
}
