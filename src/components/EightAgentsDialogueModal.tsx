import React from 'react';

export interface EightAgentsDialogueModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialAgentId?: string;
  onOpenExecutiveHandOff?: (dispatcher: 'phoenix' | 'eve') => void;
}

/**
 * 8 Agents Dialogue Pop-Up removed completely per specification.
 * Replaced by silent, deterministic execution via Cloud Run PDF engine.
 */
export function EightAgentsDialogueModal(_props: EightAgentsDialogueModalProps) {
  return null;
}

export default EightAgentsDialogueModal;
