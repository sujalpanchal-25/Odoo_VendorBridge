import React from 'react';

export default function Skeleton({ variant = 'text', width, height, className = '', style = {} }) {
  const styles = {
    width: width || (variant === 'circle' ? '40px' : '100%'),
    height: height || (variant === 'circle' ? '40px' : variant === 'title' ? '28px' : '16px'),
    borderRadius: variant === 'circle' ? '50%' : variant === 'rect' ? '6px' : '4px',
    display: 'block',
    ...style
  };

  return (
    <div 
      className={`skeleton ${className}`} 
      style={styles}
    ></div>
  );
}
