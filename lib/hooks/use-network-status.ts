/**
 * 网络状态检测Hook
 * 监听网络连接状态和提供离线功能
 */

import { useState, useEffect, useCallback } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  effectiveType: string | null;
  downlink: number | null;
  rtt: number | null;
}

export interface UseNetworkStatusReturn extends NetworkStatus {
  retryConnection: () => void;
  isRetrying: boolean;
}

export function useNetworkStatus(): UseNetworkStatusReturn {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSlowConnection: false,
    effectiveType: null,
    downlink: null,
    rtt: null
  });

  const [isRetrying, setIsRetrying] = useState(false);

  // 更新网络状态信息
  const updateNetworkInfo = useCallback(() => {
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    if (connection) {
      const isSlowConnection = 
        connection.effectiveType === 'slow-2g' ||
        connection.effectiveType === '2g' ||
        (connection.downlink && connection.downlink < 0.5);

      setNetworkStatus(prev => ({
        ...prev,
        isSlowConnection,
        effectiveType: connection.effectiveType || null,
        downlink: connection.downlink || null,
        rtt: connection.rtt || null
      }));
    }
  }, []);

  // 处理在线状态变化
  const handleOnline = useCallback(() => {
    setNetworkStatus(prev => ({ ...prev, isOnline: true }));
    updateNetworkInfo();
    
    // 通知Service Worker网络已恢复
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'NETWORK_STATUS_CHANGED',
        isOnline: true
      });
    }
  }, [updateNetworkInfo]);

  const handleOffline = useCallback(() => {
    setNetworkStatus(prev => ({ ...prev, isOnline: false }));
    
    // 通知Service Worker网络已断开
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'NETWORK_STATUS_CHANGED',
        isOnline: false
      });
    }
  }, []);

  // 重试连接
  const retryConnection = useCallback(async () => {
    if (isRetrying) return;
    
    setIsRetrying(true);
    
    try {
      // 尝试发送一个轻量级的请求来检测网络状态
      const response = await fetch('/favicon.png', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        handleOnline();
      }
    } catch (error) {
      console.log('Network still unavailable:', error);
    } finally {
      setIsRetrying(false);
    }
  }, [isRetrying, handleOnline]);

  useEffect(() => {
    // 初始化网络信息
    updateNetworkInfo();

    // 监听网络状态变化
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 监听连接信息变化
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    if (connection) {
      connection.addEventListener('change', updateNetworkInfo);
    }

    // 定期检查网络状态（对于一些不可靠的网络状态检测）
    const intervalId = setInterval(() => {
      if (navigator.onLine !== networkStatus.isOnline) {
        if (navigator.onLine) {
          handleOnline();
        } else {
          handleOffline();
        }
      }
    }, 10000); // 每10秒检查一次

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection) {
        connection.removeEventListener('change', updateNetworkInfo);
      }
      
      clearInterval(intervalId);
    };
  }, [handleOnline, handleOffline, updateNetworkInfo, networkStatus.isOnline]);

  return {
    ...networkStatus,
    retryConnection,
    isRetrying
  };
}