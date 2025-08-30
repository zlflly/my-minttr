'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'
import { storage } from '@/lib/local-storage'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider 
      {...props}
      storageKey="theme"
      value={{
        light: 'light',
        dark: 'dark',
        system: 'system'
      }}
      enableSystem={true}
      enableColorScheme={true}
      onStorageSync={(theme) => {
        // 同步主题到我们的localStorage管理器
        if (theme && ['light', 'dark', 'system'].includes(theme)) {
          storage.setTheme(theme as 'light' | 'dark' | 'system')
        }
      }}
    >
      {children}
    </NextThemesProvider>
  )
}
