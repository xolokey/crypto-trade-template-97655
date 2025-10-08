import { useEffect, useState } from 'react';
import { ConnectionState } from '@/services/websocketService';
import { useToast } from '@/hooks/use-toast';

interface ConnectionStatusIndicatorProps {
  isConnected: boolean;
  isRealTime: boolean;
  connectionState: ConnectionState;
  lastUpdate: Date | null;
  latency?: number;
  performanceMetrics?: {
    messagesPerSecond: number;
    averageLatency: number;
    connectionUptime: number;
    reconnectCount: number;
  };
  showDetails?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function ConnectionStatusIndicator({
  isConnected,
  isRealTime,
  connectionState,
  lastUpdate,
  latency = 0,
  performanceMetrics,
  showDetails = true,
  position = 'top-right'
}: ConnectionStatusIndicatorProps) {
  const [showPulse, setShowPulse] = useState(false);
  const [previousState, setPreviousState] = useState<ConnectionState>(connectionState);
  const { toast } = useToast();

  // Trigger pulse animation on updates
  useEffect(() => {
    if (lastUpdate) {
      setShowPulse(true);
      const timer = setTimeout(() => setShowPulse(false), 500);
      return () => clearTimeout(timer);
    }
  }, [lastUpdate]);

  // Show toast notifications on state changes
  useEffect(() => {
    if (previousState !== connectionState) {
      if (connectionState === 'OPEN' && previousState !== 'CONNECTING') {
        toast({
          title: 'Connection Restored',
          description: 'Real-time data streaming active',
          duration: 3000,
        });
      } else if (connectionState === 'CLOSED' && previousState === 'OPEN') {
        toast({
          title: 'Connection Lost',
          description: 'Using delayed data (30s intervals)',
          variant: 'destructive',
          duration: 3000,
        });
      } else if (connectionState === 'RECONNECTING') {
        toast({
          title: 'Reconnecting...',
          description: 'Attempting to restore real-time connection',
          duration: 2000,
        });
      }
      setPreviousState(connectionState);
    }
  }, [connectionState, previousState, toast]);

  // Determine status and styling
  const getStatus = () => {
    if (connectionState === 'RECONNECTING') {
      return {
        label: 'Reconnecting',
        color: 'bg-blue-500',
        textColor: 'text-blue-700',
        icon: '🔄',
        description: 'Attempting to reconnect...'
      };
    }
    
    if (isConnected && isRealTime) {
      return {
        label: 'Live',
        color: 'bg-green-500',
        textColor: 'text-green-700',
        icon: '🟢',
        description: 'Real-time data streaming'
      };
    }
    
    if (!isConnected && connectionState !== 'CLOSED') {
      return {
        label: 'Connecting',
        color: 'bg-yellow-500',
        textColor: 'text-yellow-700',
        icon: '🟡',
        description: 'Establishing connection...'
      };
    }
    
    if (!isRealTime) {
      return {
        label: 'Delayed',
        color: 'bg-yellow-500',
        textColor: 'text-yellow-700',
        icon: '🟡',
        description: 'Polling mode (30s intervals)'
      };
    }
    
    return {
      label: 'Offline',
      color: 'bg-red-500',
      textColor: 'text-red-700',
      icon: '🔴',
      description: 'No connection'
    };
  };

  const status = getStatus();

  // Format last update time
  const getLastUpdateText = () => {
    if (!lastUpdate) return 'Never';
    
    const seconds = Math.floor((Date.now() - lastUpdate.getTime()) / 1000);
    
    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  // Position classes
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      <div className="group relative">
        {/* Status Badge */}
        <div
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-full
            bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700
            transition-all duration-300 cursor-pointer
            ${showPulse ? 'scale-110' : 'scale-100'}
          `}
        >
          {/* Status Dot with Animation */}
          <div className="relative">
            <div className={`w-2 h-2 rounded-full ${status.color}`} />
            {connectionState === 'RECONNECTING' && (
              <div className={`absolute inset-0 w-2 h-2 rounded-full ${status.color} animate-ping`} />
            )}
            {showPulse && isRealTime && (
              <div className={`absolute inset-0 w-2 h-2 rounded-full ${status.color} animate-ping`} />
            )}
          </div>

          {/* Status Label */}
          <span className={`text-sm font-medium ${status.textColor}`}>
            {status.label}
          </span>

          {/* Latency Badge (only show if real-time and latency > 0) */}
          {isRealTime && latency > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {latency}ms
            </span>
          )}
        </div>

        {/* Tooltip with Details */}
        {showDetails && (
          <div
            className="
              absolute top-full mt-2 right-0 w-64 p-3 rounded-lg
              bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700
              opacity-0 invisible group-hover:opacity-100 group-hover:visible
              transition-all duration-200 pointer-events-none
            "
          >
            <div className="space-y-2">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Status</span>
                <span className={`text-xs font-medium ${status.textColor}`}>
                  {status.icon} {status.description}
                </span>
              </div>

              {/* Connection State */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">State</span>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {connectionState}
                </span>
              </div>

              {/* Last Update */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Last Update</span>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {getLastUpdateText()}
                </span>
              </div>

              {/* Latency (only if real-time) */}
              {isRealTime && latency > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Latency</span>
                  <span className={`text-xs font-medium ${
                    latency < 500 ? 'text-green-600' : 
                    latency < 1000 ? 'text-yellow-600' : 
                    'text-red-600'
                  }`}>
                    {latency}ms
                  </span>
                </div>
              )}

              {/* Performance Metrics */}
              {performanceMetrics && isRealTime && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Messages/sec</span>
                    <span className="text-xs font-medium text-blue-600">
                      {performanceMetrics.messagesPerSecond.toFixed(1)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Uptime</span>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {Math.floor(performanceMetrics.connectionUptime / 60000)}m
                    </span>
                  </div>

                  {performanceMetrics.reconnectCount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Reconnects</span>
                      <span className="text-xs font-medium text-orange-600">
                        {performanceMetrics.reconnectCount}
                      </span>
                    </div>
                  )}
                </>
              )}

              {/* Mode */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-xs text-gray-500 dark:text-gray-400">Mode</span>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {isRealTime ? 'WebSocket' : 'Polling'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
