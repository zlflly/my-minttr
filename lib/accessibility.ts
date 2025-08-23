// 可访问性工具函数库

// 生成唯一ID，用于aria-describedby等属性
export function generateId(prefix: string = 'element'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

// 键盘导航助手
export const KeyboardKeys = {
  ENTER: 'Enter',
  SPACE: ' ',
  TAB: 'Tab',
  ESCAPE: 'Escape',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
} as const;

export type KeyboardKey = typeof KeyboardKeys[keyof typeof KeyboardKeys];

// 焦点管理工具
export class FocusManager {
  private static focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[role="button"]:not([disabled])',
    '[role="link"]:not([disabled])',
    '[role="menuitem"]:not([disabled])',
    '[role="option"]:not([disabled])',
  ].join(', ');

  // 获取容器内所有可聚焦元素
  static getFocusableElements(container: HTMLElement): HTMLElement[] {
    return Array.from(
      container.querySelectorAll<HTMLElement>(this.focusableSelectors)
    ).filter(element => this.isVisible(element));
  }

  // 检查元素是否可见
  static isVisible(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      element.offsetWidth > 0 &&
      element.offsetHeight > 0
    );
  }

  // 设置焦点到第一个可聚焦元素
  static focusFirstElement(container: HTMLElement): boolean {
    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
      return true;
    }
    return false;
  }

  // 设置焦点到最后一个可聚焦元素
  static focusLastElement(container: HTMLElement): boolean {
    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus();
      return true;
    }
    return false;
  }

  // 焦点陷阱（用于模态框等）
  static trapFocus(container: HTMLElement): () => void {
    const focusableElements = this.getFocusableElements(container);
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    const handleTabKeyPress = (e: KeyboardEvent) => {
      if (e.key !== KeyboardKeys.TAB) return;

      if (e.shiftKey) {
        // Shift + Tab: 如果当前是第一个元素，跳转到最后一个
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        // Tab: 如果当前是最后一个元素，跳转到第一个
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKeyPress);

    // 返回清理函数
    return () => {
      container.removeEventListener('keydown', handleTabKeyPress);
    };
  }
}

// 屏幕阅读器公告
export class ScreenReaderAnnouncer {
  private static instance: ScreenReaderAnnouncer;
  private liveRegion: HTMLElement | null = null;
  private politeRegion: HTMLElement | null = null;

  private constructor() {
    this.createLiveRegions();
  }

  static getInstance(): ScreenReaderAnnouncer {
    if (!this.instance) {
      this.instance = new ScreenReaderAnnouncer();
    }
    return this.instance;
  }

  private createLiveRegions(): void {
    // 创建assertive live region（立即公告，会打断其他内容）
    this.liveRegion = document.createElement('div');
    this.liveRegion.setAttribute('aria-live', 'assertive');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.liveRegion.style.position = 'absolute';
    this.liveRegion.style.left = '-10000px';
    this.liveRegion.style.width = '1px';
    this.liveRegion.style.height = '1px';
    this.liveRegion.style.overflow = 'hidden';
    document.body.appendChild(this.liveRegion);

    // 创建polite live region（等待当前内容完成后公告）
    this.politeRegion = document.createElement('div');
    this.politeRegion.setAttribute('aria-live', 'polite');
    this.politeRegion.setAttribute('aria-atomic', 'true');
    this.politeRegion.style.position = 'absolute';
    this.politeRegion.style.left = '-10000px';
    this.politeRegion.style.width = '1px';
    this.politeRegion.style.height = '1px';
    this.politeRegion.style.overflow = 'hidden';
    document.body.appendChild(this.politeRegion);
  }

  // 立即公告（assertive）
  announce(message: string): void {
    if (this.liveRegion) {
      this.liveRegion.textContent = message;
    }
  }

  // 礼貌公告（polite）
  announcePolitely(message: string): void {
    if (this.politeRegion) {
      this.politeRegion.textContent = message;
    }
  }

  // 清除公告
  clear(): void {
    if (this.liveRegion) {
      this.liveRegion.textContent = '';
    }
    if (this.politeRegion) {
      this.politeRegion.textContent = '';
    }
  }
}

// ARIA标签工具
export const AriaLabels = {
  // 笔记相关
  NOTE_CARD: '笔记卡片',
  NOTE_TITLE: '笔记标题',
  NOTE_CONTENT: '笔记内容',
  NOTE_TAGS: '笔记标签',
  NOTE_DATE: '创建日期',
  
  // 操作相关
  EDIT_NOTE: '编辑笔记',
  DELETE_NOTE: '删除笔记',
  HIDE_NOTE: '隐藏笔记',
  SHOW_NOTE: '显示笔记',
  CHANGE_COLOR: '更改颜色',
  CREATE_NOTE: '创建新笔记',
  
  // 导航相关
  MAIN_NAVIGATION: '主导航',
  BREADCRUMB: '面包屑导航',
  SKIP_TO_CONTENT: '跳转到主内容',
  
  // 表单相关
  REQUIRED_FIELD: '必填字段',
  OPTIONAL_FIELD: '可选字段',
  FORM_ERROR: '表单错误',
  VALIDATION_ERROR: '输入验证错误',
  
  // 状态相关
  LOADING: '正在加载',
  LOAD_MORE: '加载更多',
  SEARCH_RESULTS: '搜索结果',
  NO_RESULTS: '没有找到结果',
  
  // 对话框相关
  DIALOG: '对话框',
  CLOSE_DIALOG: '关闭对话框',
  CONFIRM_DIALOG: '确认对话框',
  
  // 菜单相关
  MENU: '菜单',
  MENU_ITEM: '菜单项',
  SUBMENU: '子菜单',
  CONTEXT_MENU: '右键菜单',
} as const;

// 颜色对比度检查（基础版本）
export function checkColorContrast(foreground: string, background: string): {
  ratio: number;
  wcagAA: boolean;
  wcagAAA: boolean;
} {
  // 这是一个简化的实现，实际应用中建议使用专业的颜色对比度库
  // 如 'color-contrast' 或 'wcag-contrast'
  
  // 这里返回模拟数据，实际实现需要计算真实的对比度
  const mockRatio = 4.5; // 假设对比度
  
  return {
    ratio: mockRatio,
    wcagAA: mockRatio >= 4.5,
    wcagAAA: mockRatio >= 7,
  };
}

// 响应式断点检查
export function getScreenReaderText(condition: boolean, trueText: string, falseText: string): string {
  return condition ? trueText : falseText;
}

// React Hook for accessibility
export function useAccessibility() {
  const announcer = ScreenReaderAnnouncer.getInstance();
  
  return {
    announce: announcer.announce.bind(announcer),
    announcePolitely: announcer.announcePolitely.bind(announcer),
    generateId,
    FocusManager,
    KeyboardKeys,
  };
}

// 常用的可访问性属性生成器
export const createAriaProps = {
  button: (label: string, pressed?: boolean, disabled?: boolean) => ({
    'role': 'button',
    'aria-label': label,
    ...(pressed !== undefined && { 'aria-pressed': pressed }),
    ...(disabled && { 'aria-disabled': true }),
    'tabIndex': disabled ? -1 : 0,
  }),

  link: (label: string, current?: boolean) => ({
    'role': 'link',
    'aria-label': label,
    ...(current && { 'aria-current': 'page' }),
  }),

  textbox: (label: string, required?: boolean, invalid?: boolean, describedBy?: string) => ({
    'role': 'textbox',
    'aria-label': label,
    ...(required && { 'aria-required': true }),
    ...(invalid && { 'aria-invalid': true }),
    ...(describedBy && { 'aria-describedby': describedBy }),
  }),

  listbox: (label: string, multiselectable?: boolean) => ({
    'role': 'listbox',
    'aria-label': label,
    ...(multiselectable && { 'aria-multiselectable': true }),
  }),

  option: (label: string, selected?: boolean, disabled?: boolean) => ({
    'role': 'option',
    'aria-label': label,
    ...(selected && { 'aria-selected': true }),
    ...(disabled && { 'aria-disabled': true }),
  }),

  dialog: (label: string, describedBy?: string) => ({
    'role': 'dialog',
    'aria-label': label,
    'aria-modal': true,
    ...(describedBy && { 'aria-describedby': describedBy }),
  }),

  menu: (label: string) => ({
    'role': 'menu',
    'aria-label': label,
  }),

  menuitem: (label: string, disabled?: boolean) => ({
    'role': 'menuitem',
    'aria-label': label,
    ...(disabled && { 'aria-disabled': true }),
    'tabIndex': disabled ? -1 : 0,
  }),
};