import { AlertTriangle, AlertCircle, ShieldCheck } from 'lucide-react';

export function getCommandSafetyLevel(cmdString) {
  if (!cmdString) return { level: 'safe', label: 'SAFE', icon: ShieldCheck, color: '#10b981', bg: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))', border: 'rgba(16,185,129,0.3)' };

  const isDestructive = (
    cmdString.includes('--force') || 
    cmdString.includes('reset --hard') || 
    cmdString.includes('clean -f') || 
    (cmdString.includes('branch -D') || cmdString.includes('branch -d'))
  );

  const isWarning = (
    cmdString.includes('rebase') || 
    cmdString.includes('reset --mixed') || 
    cmdString.includes('stash pop') ||
    cmdString.includes('merge') ||
    cmdString.includes('cherry-pick')
  );

  if (isDestructive) {
    return { level: 'danger', label: 'DESTRUCTIVE', icon: AlertTriangle, color: '#ef4444', bg: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))', border: 'rgba(239,68,68,0.3)' };
  }

  if (isWarning) {
    return { level: 'warning', label: 'HISTORY CHANGE', icon: AlertCircle, color: '#f59e0b', bg: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))', border: 'rgba(245,158,11,0.3)' };
  }

  return { level: 'safe', label: 'SAFE', icon: ShieldCheck, color: '#10b981', bg: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))', border: 'rgba(16,185,129,0.3)' };
}
