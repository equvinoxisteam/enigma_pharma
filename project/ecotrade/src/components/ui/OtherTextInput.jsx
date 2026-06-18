import React from 'react';

const OtherTextInput = ({
  show,
  value,
  onChange,
  placeholder = 'Please specify...',
  className = '',
  required = true,
}) => {
  if (!show) return null;

  return (
    <input
      type="text"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required && show}
      className={className}
    />
  );
};

export default OtherTextInput;
