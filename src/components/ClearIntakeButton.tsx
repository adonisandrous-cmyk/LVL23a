import React from 'react';
import { useIntakeReset } from '../hooks/useIntakeReset';

export interface ClearIntakeButtonProps {
  onReset: () => void;
  className?: string;
  label?: string;
  confirmPrompt?: string;
}

export const ClearIntakeButton: React.FC<ClearIntakeButtonProps> = ({
  onReset,
  className,
  label = '🗑️ Erase Data / New Intake',
  confirmPrompt = 'Are you sure you want to erase current client data and start a fresh intake?'
}) => {
  const { handleEraseAndReset } = useIntakeReset(onReset, () => {});

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(confirmPrompt)) {
      handleEraseAndReset();
    }
  };

  return (
    <button
      type="button"
      id="btn-phoenix-erase-intake-data"
      onClick={handleClick}
      className={
        className ||
        'px-3.5 py-2 bg-[#d9534f] hover:bg-[#c9302c] text-white text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5 border border-red-400/30'
      }
      style={{
        backgroundColor: '#d9534f',
        color: '#fff',
        padding: '8px 16px',
        border: 'none',
        borderRadius: '6px',
        fontWeight: 'bold',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px'
      }}
      title="Erase all active client data and cache to start a clean, unbled intake session"
    >
      <span>{label}</span>
    </button>
  );
};

export default ClearIntakeButton;
