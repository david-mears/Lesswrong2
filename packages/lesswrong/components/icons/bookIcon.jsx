import React from 'react';

export const BookIcon = ({ width=28, height=28, className }) => {
  return <img width={28} height={28} className={className}
    src="data:image/png;base64,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"
  />
}
