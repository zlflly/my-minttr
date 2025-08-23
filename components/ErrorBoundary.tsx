'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, Home, Bug } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showErrorDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // 调用自定义错误处理函数
    this.props.onError?.(error, errorInfo);

    // 在开发环境下记录错误详情
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 React Error Boundary');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }

    // 在生产环境下发送错误报告（如果需要）
    if (process.env.NODE_ENV === 'production') {
      // TODO: 集成错误报告服务（如 Sentry）
      // reportError(error, errorInfo);
    }
  }

  private handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // 如果提供了自定义fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 否则使用默认的错误UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900">
                出现了一些问题
              </h2>
              <p className="text-gray-600">
                抱歉，应用遇到了意外错误。请尝试刷新页面或返回首页。
              </p>
            </div>

            {/* 错误详情（仅在开发模式或明确要求时显示） */}
            {(process.env.NODE_ENV === 'development' || this.props.showErrorDetails) && 
             this.state.error && (
              <details className="text-left bg-gray-50 rounded-lg p-4 text-sm">
                <summary className="cursor-pointer font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Bug className="w-4 h-4" />
                  错误详情
                </summary>
                <div className="space-y-2">
                  <div>
                    <strong className="text-gray-800">错误消息:</strong>
                    <pre className="mt-1 text-red-600 whitespace-pre-wrap">
                      {this.state.error.message}
                    </pre>
                  </div>
                  {this.state.error.stack && (
                    <div>
                      <strong className="text-gray-800">错误堆栈:</strong>
                      <pre className="mt-1 text-gray-600 whitespace-pre-wrap text-xs overflow-x-auto">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* 操作按钮 */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={this.handleRetry}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                重试
              </Button>
              
              <Button 
                onClick={this.handleReload}
                variant="default"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                刷新页面
              </Button>
              
              <Button 
                onClick={this.handleGoHome}
                variant="ghost"
                className="flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                返回首页
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC版本的错误边界，用于函数组件
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedWithErrorBoundary = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WrappedWithErrorBoundary.displayName = `withErrorBoundary(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return WrappedWithErrorBoundary;
}

// Hook版本的错误边界
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    // 在React 18中，可以通过抛出错误触发最近的错误边界
    throw error;
  };
}

// 专门用于异步错误的处理
export class AsyncErrorBoundary extends ErrorBoundary {
  componentDidMount() {
    // 监听未捕获的Promise拒绝
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  componentWillUnmount() {
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  private handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    // 将Promise拒绝转换为错误
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    
    this.setState({
      hasError: true,
      error,
      errorInfo: null,
    });

    this.props.onError?.(error, {} as ErrorInfo);
    
    // 阻止默认的控制台错误输出
    event.preventDefault();
  };
}

export default ErrorBoundary;