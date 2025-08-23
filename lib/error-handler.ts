// 全局错误处理机制

import { ScreenReaderAnnouncer } from './accessibility';

// 错误类型定义
export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION', 
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  UNKNOWN = 'UNKNOWN',
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// 错误接口
export interface AppError {
  type: ErrorType;
  severity: ErrorSeverity;
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
  context?: {
    component?: string;
    action?: string;
    userId?: string;
    sessionId?: string;
    route?: string;
  };
  stack?: string;
}

// 用户友好的错误消息映射
const USER_FRIENDLY_MESSAGES = {
  [ErrorType.NETWORK]: {
    default: '网络连接出现问题，请检查网络连接后重试',
    timeout: '请求超时，请稍后重试',
    offline: '您当前处于离线状态，请检查网络连接',
  },
  [ErrorType.VALIDATION]: {
    default: '输入的数据格式不正确，请检查后重试',
    required: '请填写必需的信息',
    format: '数据格式不正确',
  },
  [ErrorType.AUTHENTICATION]: {
    default: '需要登录才能执行此操作',
    expired: '登录已过期，请重新登录',
    invalid: '登录信息无效',
  },
  [ErrorType.AUTHORIZATION]: {
    default: '您没有权限执行此操作',
    forbidden: '访问被拒绝',
  },
  [ErrorType.NOT_FOUND]: {
    default: '请求的资源不存在',
    note: '笔记不存在或已被删除',
    page: '页面不存在',
  },
  [ErrorType.SERVER]: {
    default: '服务器暂时无法响应，请稍后重试',
    maintenance: '系统正在维护中，请稍后重试',
    overload: '系统繁忙，请稍后重试',
  },
  [ErrorType.CLIENT]: {
    default: '应用程序出现错误',
    script: '页面加载出现问题，请刷新页面',
  },
  [ErrorType.UNKNOWN]: {
    default: '发生未知错误，请刷新页面或联系支持',
  },
} as const;

// 错误处理器类
export class ErrorHandler {
  private static instance: ErrorHandler;
  private announcer: ScreenReaderAnnouncer;
  private errorLog: AppError[] = [];
  private maxLogSize = 100;

  private constructor() {
    this.announcer = ScreenReaderAnnouncer.getInstance();
    this.setupGlobalErrorHandlers();
  }

  static getInstance(): ErrorHandler {
    if (!this.instance) {
      this.instance = new ErrorHandler();
    }
    return this.instance;
  }

  // 设置全局错误处理器
  private setupGlobalErrorHandlers(): void {
    // 处理未捕获的JavaScript错误
    window.addEventListener('error', (event) => {
      const error = this.createAppError({
        type: ErrorType.CLIENT,
        severity: ErrorSeverity.HIGH,
        code: 'UNCAUGHT_ERROR',
        message: event.message,
        context: {
          component: 'Global',
          action: 'Script Execution',
        },
        stack: event.error?.stack,
      });
      this.handleError(error);
    });

    // 处理未捕获的Promise拒绝
    window.addEventListener('unhandledrejection', (event) => {
      const error = this.createAppError({
        type: ErrorType.CLIENT,
        severity: ErrorSeverity.HIGH,
        code: 'UNHANDLED_PROMISE_REJECTION',
        message: String(event.reason),
        context: {
          component: 'Global',
          action: 'Promise Execution',
        },
      });
      this.handleError(error);
    });

    // 处理网络错误（资源加载失败）
    window.addEventListener('error', (event) => {
      if (event.target !== window && event.target instanceof HTMLElement) {
        const error = this.createAppError({
          type: ErrorType.NETWORK,
          severity: ErrorSeverity.MEDIUM,
          code: 'RESOURCE_LOAD_ERROR',
          message: `Failed to load resource: ${event.target.tagName}`,
          context: {
            component: 'Global',
            action: 'Resource Loading',
          },
        });
        this.handleError(error, false); // 不显示用户通知
      }
    }, true);
  }

  // 创建应用错误
  createAppError(params: {
    type: ErrorType;
    severity: ErrorSeverity;
    code: string;
    message: string;
    details?: Record<string, unknown>;
    context?: AppError['context'];
    stack?: string;
  }): AppError {
    return {
      ...params,
      timestamp: new Date(),
    };
  }

  // 主要错误处理方法
  handleError(error: AppError | Error, notify = true): void {
    const appError = error instanceof Error ? this.convertToAppError(error) : error;
    
    // 记录错误
    this.logError(appError);
    
    // 用户通知
    if (notify) {
      this.notifyUser(appError);
    }
    
    // 上报错误（生产环境）
    if (process.env.NODE_ENV === 'production') {
      this.reportError(appError);
    }
    
    // 控制台记录（开发环境）
    if (process.env.NODE_ENV === 'development') {
      this.logToConsole(appError);
    }
  }

  // 转换普通Error为AppError
  private convertToAppError(error: Error): AppError {
    return this.createAppError({
      type: ErrorType.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      code: error.name || 'UNKNOWN_ERROR',
      message: error.message,
      stack: error.stack,
    });
  }

  // 记录错误到内存
  private logError(error: AppError): void {
    this.errorLog.unshift(error);
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }
  }

  // 用户通知
  private notifyUser(error: AppError): void {
    const userMessage = this.getUserFriendlyMessage(error);
    
    // 屏幕阅读器公告
    if (error.severity === ErrorSeverity.HIGH || error.severity === ErrorSeverity.CRITICAL) {
      this.announcer.announce(userMessage);
    } else {
      this.announcer.announcePolitely(userMessage);
    }
    
    // 这里可以集成toast通知系统
    // toast.error(userMessage);
  }

  // 获取用户友好的错误消息
  private getUserFriendlyMessage(error: AppError): string {
    const messages = USER_FRIENDLY_MESSAGES[error.type];
    if (!messages) return '发生未知错误';
    
    // 尝试匹配特定的子类型
    const subType = error.code.toLowerCase();
    for (const [key, message] of Object.entries(messages)) {
      if (key !== 'default' && subType.includes(key)) {
        return message;
      }
    }
    
    return messages.default;
  }

  // 控制台记录
  private logToConsole(error: AppError): void {
    const style = this.getConsoleStyle(error.severity);
    console.group(`%c🚨 ${error.type} Error [${error.severity}]`, style);
    console.error('Code:', error.code);
    console.error('Message:', error.message);
    console.error('Timestamp:', error.timestamp.toISOString());
    if (error.context) {
      console.error('Context:', error.context);
    }
    if (error.details) {
      console.error('Details:', error.details);
    }
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    console.groupEnd();
  }

  // 获取控制台样式
  private getConsoleStyle(severity: ErrorSeverity): string {
    const styles = {
      [ErrorSeverity.LOW]: 'color: #FFA500',
      [ErrorSeverity.MEDIUM]: 'color: #FF6347',
      [ErrorSeverity.HIGH]: 'color: #FF4500; font-weight: bold',
      [ErrorSeverity.CRITICAL]: 'color: #DC143C; font-weight: bold; font-size: 14px',
    };
    return styles[severity];
  }

  // 上报错误到服务器
  private reportError(error: AppError): void {
    // 这里可以集成错误报告服务，如 Sentry
    try {
      if (error.severity === ErrorSeverity.HIGH || error.severity === ErrorSeverity.CRITICAL) {
        // 发送到错误监控服务
        // Sentry.captureException(error);
        console.log('Error reported to monitoring service:', error);
      }
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    }
  }

  // 获取错误日志
  getErrorLog(): AppError[] {
    return [...this.errorLog];
  }

  // 清除错误日志
  clearErrorLog(): void {
    this.errorLog = [];
  }

  // 创建特定类型的错误
  createNetworkError(message: string, context?: AppError['context']): AppError {
    return this.createAppError({
      type: ErrorType.NETWORK,
      severity: ErrorSeverity.MEDIUM,
      code: 'NETWORK_ERROR',
      message,
      context,
    });
  }

  createValidationError(message: string, details?: Record<string, unknown>, context?: AppError['context']): AppError {
    return this.createAppError({
      type: ErrorType.VALIDATION,
      severity: ErrorSeverity.LOW,
      code: 'VALIDATION_ERROR',
      message,
      details,
      context,
    });
  }

  createNotFoundError(resource: string, context?: AppError['context']): AppError {
    return this.createAppError({
      type: ErrorType.NOT_FOUND,
      severity: ErrorSeverity.MEDIUM,
      code: 'NOT_FOUND',
      message: `${resource} not found`,
      context,
    });
  }
}

// 导出单例实例
export const errorHandler = ErrorHandler.getInstance();

// 便利函数
export function handleError(error: AppError | Error, notify = true): void {
  errorHandler.handleError(error, notify);
}

export function createNetworkError(message: string, context?: AppError['context']): AppError {
  return errorHandler.createNetworkError(message, context);
}

export function createValidationError(
  message: string, 
  details?: Record<string, unknown>, 
  context?: AppError['context']
): AppError {
  return errorHandler.createValidationError(message, details, context);
}

export function createNotFoundError(resource: string, context?: AppError['context']): AppError {
  return errorHandler.createNotFoundError(resource, context);
}

// React Hook for error handling
export function useErrorHandler() {
  return {
    handleError,
    createNetworkError,
    createValidationError,
    createNotFoundError,
    getErrorLog: () => errorHandler.getErrorLog(),
    clearErrorLog: () => errorHandler.clearErrorLog(),
  };
}