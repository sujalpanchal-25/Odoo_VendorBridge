import React from 'react';

export default function Table({ headers = [], children, className = '' }) {
  return (
    <div className={`table-container ${className}`}>
      <table className="custom-table">
        <thead>
          <tr>
            {headers.map((h, i) => {
              const style = typeof h === 'object' ? h.style : {};
              const label = typeof h === 'object' ? h.label : h;
              return (
                <th key={i} style={style}>
                  {label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {children}
        </tbody>
      </table>
    </div>
  );
}
