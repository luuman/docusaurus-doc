import React from 'react';

export default function Steps({children}) {
  return (
    <div style={{marginLeft: '1rem'}}>
      {React.Children.map(children, (child, index) => React.cloneElement(child, { index: index + 1 }))}
    </div>
  );
}
