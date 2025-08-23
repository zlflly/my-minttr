'use client';

import { ErrorBoundary } from './ErrorBoundary';

interface ClientErrorBoundaryProps {
  children: React.ReactNode;
}

export function ClientErrorBoundary({ children }: ClientErrorBoundaryProps) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // 在生产环境中，这里可以集成错误报告服务
        console.error('Application Error:', error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

export default ClientErrorBoundary;