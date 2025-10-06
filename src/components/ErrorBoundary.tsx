import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  showDetails: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    showDetails: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, showDetails: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('Uncaught error:', error, errorInfo);
    
    // Store error info in state
    this.setState({ errorInfo });
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Log to monitoring service in production
    if (import.meta.env.PROD) {
      this.logErrorToService(error, errorInfo);
    }
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // Log to monitoring service (e.g., Sentry, LogRocket, etc.)
    try {
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };
      
      // In production, send to your monitoring service
      console.log('Error logged to monitoring service:', errorData);
      // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleTryAgain = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  public render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-2xl w-full text-center space-y-6">
            <div className="flex justify-center">
              <div className="rounded-full bg-destructive/10 p-6">
                <AlertTriangle className="h-16 w-16 text-destructive" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">Oops! Something went wrong</h1>
              <p className="text-muted-foreground text-lg">
                We encountered an unexpected error. Don't worry, your data is safe.
              </p>
            </div>

            {/* Error details for development */}
            {import.meta.env.DEV && this.state.error && (
              <div className="text-left space-y-2">
                <button
                  onClick={this.toggleDetails}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
                >
                  {this.state.showDetails ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Hide Error Details
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Show Error Details
                    </>
                  )}
                </button>

                {this.state.showDetails && (
                  <div className="bg-muted p-4 rounded-lg text-sm space-y-3">
                    <div>
                      <p className="font-semibold mb-1">Error Message:</p>
                      <p className="font-mono text-destructive">
                        {this.state.error.message}
                      </p>
                    </div>
                    
                    {this.state.error.stack && (
                      <div>
                        <p className="font-semibold mb-1">Stack Trace:</p>
                        <pre className="font-mono text-xs overflow-auto max-h-40 whitespace-pre-wrap">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}

                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <p className="font-semibold mb-1">Component Stack:</p>
                        <pre className="font-mono text-xs overflow-auto max-h-40 whitespace-pre-wrap">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={this.handleTryAgain} variant="default" size="lg">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              
              <Button onClick={this.handleReload} variant="outline" size="lg">
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload Page
              </Button>
              
              <Button onClick={this.handleGoHome} variant="outline" size="lg">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </div>

            {/* Help text */}
            <div className="text-sm text-muted-foreground pt-4 border-t">
              <p>If the problem persists, please contact support or try again later.</p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;