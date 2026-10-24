import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[100] flex items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500">
        <WifiOff size={16} className="text-white" />
      </div>
      <div>
        <p className="leading-none">Offline Mode</p>
        <p className="text-[10px] text-slate-400 font-medium">Viewing cached data</p>
      </div>
    </div>
  );
};
