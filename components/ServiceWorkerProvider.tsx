"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';
import { offlineSync } from '@/lib/offline-sync';
import { useNetworkStatus } from '@/lib/hooks/use-network-status';

interface ServiceWorkerContextType {
  isServiceWorkerReady: boolean;
  isUpdating: boolean;
  updateAvailable: boolean;
  updateServiceWorker: () => void;
}

const ServiceWorkerContext = createContext<ServiceWorkerContextType>({
  isServiceWorkerReady: false,
  isUpdating: false,
  updateAvailable: false,
  updateServiceWorker: () => {},
});

export const useServiceWorker = () => useContext(ServiceWorkerContext);

interface ServiceWorkerProviderProps {
  children: React.ReactNode;
}

export default function ServiceWorkerProvider({ children }: ServiceWorkerProviderProps) {
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingServiceWorker, setWaitingServiceWorker] = useState<ServiceWorker | null>(null);
  
  const { isOnline } = useNetworkStatus();

  // 注册Service Worker
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      registerServiceWorker();
    }
  }, []);

  // 网络状态变化时触发同步
  useEffect(() => {
    if (isOnline && isServiceWorkerReady) {
      // 延迟一下再同步，等待网络稳定
      const timer = setTimeout(() => {
        offlineSync.autoSync();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isOnline, isServiceWorkerReady]);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('Service Worker registered:', registration.scope);

      // 检查是否有更新
      registration.addEventListener('updatefound', () => {
        const newServiceWorker = registration.installing;
        if (!newServiceWorker) return;

        setIsUpdating(true);

        newServiceWorker.addEventListener('statechange', () => {
          if (newServiceWorker.state === 'installed') {
            setIsUpdating(false);
            
            if (navigator.serviceWorker.controller) {
              // 有更新可用
              setUpdateAvailable(true);
              setWaitingServiceWorker(newServiceWorker);
            } else {
              // 首次安装
              setIsServiceWorkerReady(true);
            }
          }
        });
      });

      // 如果已经有active service worker
      if (registration.active) {
        setIsServiceWorkerReady(true);
      }

      // 监听Service Worker消息
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('Received message from SW:', event.data);
        handleServiceWorkerMessage(event.data);
      });

      // 监听Service Worker控制器变化
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service Worker controller changed');
        setIsServiceWorkerReady(true);
        setUpdateAvailable(false);
      });

    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  };

  const handleServiceWorkerMessage = (message: any) => {
    const { type, data } = message;
    
    switch (type) {
      case 'SYNC_SUCCESS':
        console.log('Operation synced successfully:', data.operationId);
        break;
        
      case 'SYNC_FAILED':
        console.error('Operation sync failed:', data.operationId, data.error);
        break;
        
      case 'CACHE_UPDATED':
        console.log('Cache updated:', data);
        break;
        
      default:
        console.log('Unknown message type:', type);
    }
  };

  const updateServiceWorker = () => {
    if (waitingServiceWorker) {
      waitingServiceWorker.postMessage({ type: 'SKIP_WAITING' });
      setWaitingServiceWorker(null);
    }
  };

  const contextValue: ServiceWorkerContextType = {
    isServiceWorkerReady,
    isUpdating,
    updateAvailable,
    updateServiceWorker,
  };

  return (
    <ServiceWorkerContext.Provider value={contextValue}>
      {children}
    </ServiceWorkerContext.Provider>
  );
}

// 更新提示组件
export function ServiceWorkerUpdatePrompt() {
  const { updateAvailable, updateServiceWorker, isUpdating } = useServiceWorker();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (updateAvailable) {
      setShowPrompt(true);
    }
  }, [updateAvailable]);

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-sm">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-blue-900">应用更新可用</h3>
            <p className="text-sm text-blue-700 mt-1">
              发现新版本，点击更新以获得最新功能。
            </p>
          </div>
          <button
            onClick={() => setShowPrompt(false)}
            className="ml-2 text-blue-400 hover:text-blue-600"
          >
            ✕
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => {
              updateServiceWorker();
              setShowPrompt(false);
            }}
            disabled={isUpdating}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {isUpdating ? '更新中...' : '立即更新'}
          </button>
          <button
            onClick={() => setShowPrompt(false)}
            className="px-3 py-1 text-blue-600 border border-blue-300 rounded text-sm hover:bg-blue-50"
          >
            稍后提醒
          </button>
        </div>
      </div>
    </div>
  );
}