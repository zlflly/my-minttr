import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PerformanceData {
  operation: string;
  startTime: number;
  duration?: number;
  status: 'pending' | 'success' | 'error';
  message?: string;
}

interface PerformanceMonitorProps {
  show: boolean;
  operations: PerformanceData[];
  onClose?: () => void;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  show,
  operations,
  onClose
}) => {
  const [autoClose, setAutoClose] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (show && operations.length > 0) {
      const allCompleted = operations.every(op => op.status !== 'pending');
      
      if (allCompleted) {
        // 3秒后自动关闭
        const timer = setTimeout(() => {
          onClose?.();
        }, 3000);
        
        setAutoClose(timer);
        
        return () => {
          clearTimeout(timer);
        };
      }
    }
  }, [show, operations, onClose]);

  if (!show || operations.length === 0) return null;

  const getStatusIcon = (status: PerformanceData['status']) => {
    switch (status) {
      case 'pending':
        return (
          <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
        );
      case 'success':
        return (
          <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        );
    }
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return '';
    return `${(duration / 1000).toFixed(1)}s`;
  };

  const getTotalDuration = () => {
    const completed = operations.filter(op => op.duration);
    if (completed.length === 0) return null;
    
    const total = completed.reduce((sum, op) => sum + (op.duration || 0), 0);
    return formatDuration(total);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        className="fixed bottom-20 left-4 z-50 max-w-sm"
      >
        <div className="bg-white/95 backdrop-blur-md rounded-lg shadow-lg border border-gray-200/50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200/50">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">操作进度</h3>
              {getTotalDuration() && (
                <span className="text-xs text-gray-500">
                  总用时: {getTotalDuration()}
                </span>
              )}
            </div>
          </div>
          
          <div className="px-4 py-2">
            {operations.map((operation, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 py-2"
              >
                {getStatusIcon(operation.status)}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-700 truncate">
                      {operation.operation}
                    </p>
                    {operation.duration && (
                      <span className="text-xs text-gray-500 ml-2">
                        {formatDuration(operation.duration)}
                      </span>
                    )}
                  </div>
                  
                  {operation.message && (
                    <p className="text-xs text-gray-500 mt-1">
                      {operation.message}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* 进度条 */}
          <div className="px-4 pb-3">
            <div className="w-full bg-gray-200 rounded-full h-1">
              <motion.div
                initial={{ width: 0 }}
                animate={{ 
                  width: `${(operations.filter(op => op.status !== 'pending').length / operations.length) * 100}%` 
                }}
                transition={{ duration: 0.3 }}
                className="bg-blue-500 h-1 rounded-full"
              />
            </div>
          </div>

          {/* 关闭按钮 */}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PerformanceMonitor;