import React from 'react';
import Button from './Button.jsx';
import { HelpCircle } from 'lucide-react';

export default function EmptyState({ 
  icon: Icon = HelpCircle, 
  title = 'No Data Found', 
  description = 'There is no data to show in this view.', 
  actionLabel, 
  onAction,
  className = ''
}) {
  return (
    <div className={`empty-state ${className}`}>
      <div className="empty-state-icon">
        <Icon size={48} strokeWidth={1.5} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
