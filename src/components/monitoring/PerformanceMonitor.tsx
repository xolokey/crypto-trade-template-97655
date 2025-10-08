import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Zap, 
  Clock, 
  Wifi, 
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface PerformanceMetrics {
  messagesPerSecond: number;
  averageLatency: number;
  connectionUptime: number;
  reconnectCount: number;
  memoryUsage?: number;
  cpuUsage?: number;
}

interface PerformanceMonitorProps {
  metrics: PerformanceMetrics;
  isRealTime: boolean;
  isConnected: boolean;
  showDetails?: boolean;
}

export function PerformanceMonitor({
  metrics,
  isRealTime,
  isConnected,
  showDetails = false
}: PerformanceMonitorProps) {
  const [webVitals, setWebVitals] = useState({
    fcp: 0, // First Contentful Paint
    lcp: 0, // Largest Contentful Paint
    fid: 0, // First Input Delay
    cls: 0  // Cumulative Layout Shift
  });

  // Monitor Web Vitals
  useEffect(() => {
    if ('performance' in window) {
      // Measure FCP
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            setWebVitals(prev => ({ ...prev, fcp: entry.startTime }));
          }
        }
      });
      observer.observe({ entryTypes: ['paint'] });

      // Measure LCP
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        setWebVitals(prev => ({ ...prev, lcp: lastEntry.startTime }));
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      return () => {
        observer.disconnect();
        lcpObserver.disconnect();
      };
    }
  }, []);

  const getLatencyStatus = (latency: number) => {
    if (latency < 100) return { status: 'excellent', color: 'text-green-500', icon: CheckCircle };
    if (latency < 300) return { status: 'good', color: 'text-yellow-500', icon: Activity };
    return { status: 'poor', color: 'text-red-500', icon: AlertTriangle };
  };

  const getUptimeFormatted = (uptime: number) => {
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const latencyStatus = getLatencyStatus(metrics.averageLatency);
  const LatencyIcon = latencyStatus.icon;

  if (!showDetails) {
    // Compact view
    return (
      <div className="flex items-center gap-2 text-sm">
        <div className="flex items-center gap-1">
          <LatencyIcon className={`h-3 w-3 ${latencyStatus.color}`} />
          <span className="text-muted-foreground">{Math.round(metrics.averageLatency)}ms</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3 text-blue-500" />
          <span className="text-muted-foreground">{metrics.messagesPerSecond.toFixed(1)}/s</span>
        </div>
        {isRealTime && (
          <Badge variant="default" className="text-xs">
            Live
          </Badge>
        )}
      </div>
    );
  }

  // Detailed view
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Performance Monitor
          {isConnected ? (
            <Badge variant="default" className="ml-auto">Connected</Badge>
          ) : (
            <Badge variant="destructive" className="ml-auto">Disconnected</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Real-Time Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Latency
              </span>
              <span className={`text-sm font-medium ${latencyStatus.color}`}>
                {Math.round(metrics.averageLatency)}ms
              </span>
            </div>
            <Progress 
              value={Math.min((metrics.averageLatency / 500) * 100, 100)} 
              className="h-2"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Messages/sec
              </span>
              <span className="text-sm font-medium">
                {metrics.messagesPerSecond.toFixed(1)}
              </span>
            </div>
            <Progress 
              value={Math.min((metrics.messagesPerSecond / 10) * 100, 100)} 
              className="h-2"
            />
          </div>
        </div>

        {/* Connection Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Uptime
            </span>
            <span className="text-sm font-medium">
              {getUptimeFormatted(metrics.connectionUptime)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Wifi className="h-3 w-3" />
              Reconnects
            </span>
            <span className="text-sm font-medium">
              {metrics.reconnectCount}
            </span>
          </div>
        </div>

        {/* Web Vitals */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-2">Web Vitals</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">FCP:</span>
              <span className={webVitals.fcp < 1800 ? 'text-green-500' : 'text-yellow-500'}>
                {Math.round(webVitals.fcp)}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">LCP:</span>
              <span className={webVitals.lcp < 2500 ? 'text-green-500' : 'text-yellow-500'}>
                {Math.round(webVitals.lcp)}ms
              </span>
            </div>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${
              isRealTime ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
            }`} />
            <span className="text-xs text-muted-foreground">
              {isRealTime ? 'Real-time' : 'Polling'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${
              metrics.averageLatency < 200 ? 'bg-green-500' : 
              metrics.averageLatency < 500 ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <span className="text-xs text-muted-foreground">
              {latencyStatus.status} latency
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default PerformanceMonitor;