'use client';

import React from 'react';
import { triggerFooterModal, FooterModalEvent } from '@/lib/utils/footerModalEvents';

export interface FooterModalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  modalEvent: FooterModalEvent;
  children: React.ReactNode;
}

export const FooterModalButton: React.FC<FooterModalButtonProps> = ({
  modalEvent,
  children,
  className,
  ...props
}) => {
  return (
    <button
      type="button"
      onClick={() => triggerFooterModal(modalEvent)}
      className={className}
      {...props}
    >
      {children}
    </button>
  );
};
