"use client"

import React from 'react'

// 笔记卡片骨架屏
export function NoteCardSkeleton({ variant = 'default' }: { variant?: 'default' | 'tall' | 'short' | 'image' }) {
  const getVariantContent = () => {
    switch (variant) {
      case 'tall':
        return (
          <>
            {/* 图片占位 */}
            <div className="aspect-video w-full bg-sand-3"></div>
            <div className="p-4 space-y-3">
              {/* 标题占位 */}
              <div className="h-6 bg-sand-3 rounded w-4/5"></div>
              {/* 长描述占位 */}
              <div className="space-y-2">
                <div className="h-4 bg-sand-3 rounded w-full"></div>
                <div className="h-4 bg-sand-3 rounded w-full"></div>
                <div className="h-4 bg-sand-3 rounded w-3/4"></div>
                <div className="h-4 bg-sand-3 rounded w-5/6"></div>
              </div>
              {/* 标签占位 */}
              <div className="flex gap-2 flex-wrap">
                <div className="h-5 bg-sand-3 rounded-full w-12"></div>
                <div className="h-5 bg-sand-3 rounded-full w-16"></div>
                <div className="h-5 bg-sand-3 rounded-full w-10"></div>
              </div>
              {/* 底部信息占位 */}
              <div className="flex items-center justify-between">
                <div className="h-4 bg-sand-3 rounded w-20"></div>
                <div className="h-6 bg-sand-3 rounded w-6"></div>
              </div>
            </div>
          </>
        )
      case 'short':
        return (
          <div className="p-4 space-y-3">
            {/* 标题占位 */}
            <div className="h-6 bg-sand-3 rounded w-2/3"></div>
            {/* 短描述占位 */}
            <div className="space-y-2">
              <div className="h-4 bg-sand-3 rounded w-full"></div>
            </div>
            {/* 标签占位 */}
            <div className="flex gap-2">
              <div className="h-5 bg-sand-3 rounded-full w-14"></div>
            </div>
            {/* 底部信息占位 */}
            <div className="flex items-center justify-between">
              <div className="h-4 bg-sand-3 rounded w-16"></div>
              <div className="h-6 bg-sand-3 rounded w-6"></div>
            </div>
          </div>
        )
      case 'image':
        return (
          <>
            {/* 正方形图片占位（图片笔记风格） */}
            <div className="aspect-square w-full bg-sand-3"></div>
            <div className="p-4 space-y-3">
              {/* 描述占位 */}
              <div className="space-y-2">
                <div className="h-4 bg-sand-3 rounded w-4/5"></div>
                <div className="h-4 bg-sand-3 rounded w-3/5"></div>
              </div>
              {/* 标签占位 */}
              <div className="flex gap-2">
                <div className="h-5 bg-sand-3 rounded-full w-10"></div>
                <div className="h-5 bg-sand-3 rounded-full w-12"></div>
              </div>
              {/* 底部信息占位 */}
              <div className="flex items-center justify-between">
                <div className="h-4 bg-sand-3 rounded w-18"></div>
                <div className="h-6 bg-sand-3 rounded w-6"></div>
              </div>
            </div>
          </>
        )
      default:
        return (
          <>
            {/* 图片占位 */}
            <div className="aspect-video w-full bg-sand-3"></div>
            <div className="p-4 space-y-3">
              {/* 标题占位 */}
              <div className="h-6 bg-sand-3 rounded w-3/4"></div>
              {/* 描述占位 */}
              <div className="space-y-2">
                <div className="h-4 bg-sand-3 rounded w-full"></div>
                <div className="h-4 bg-sand-3 rounded w-5/6"></div>
              </div>
              {/* 标签占位 */}
              <div className="flex gap-2">
                <div className="h-5 bg-sand-3 rounded-full w-12"></div>
                <div className="h-5 bg-sand-3 rounded-full w-16"></div>
              </div>
              {/* 底部信息占位 */}
              <div className="flex items-center justify-between">
                <div className="h-4 bg-sand-3 rounded w-20"></div>
                <div className="h-6 bg-sand-3 rounded w-6"></div>
              </div>
            </div>
          </>
        )
    }
  }

  return (
    <div className="relative rounded-xl border shadow-sm overflow-hidden mb-4 animate-pulse">
      {getVariantContent()}
    </div>
  )
}

// 仪表板骨架屏
export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#F6F4F0] p-4">
      {/* 使用与实际布局相同的 Masonry 布局，让卡片自然交错排列 */}
      <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 gap-4 space-y-4">
        {/* 混合排列所有卡片，让 CSS columns 自动分配到各列 */}
        <div className="break-inside-avoid">
          <NoteCardSkeleton variant="default" />
        </div>
        <div className="break-inside-avoid">
          <NoteCardSkeleton variant="short" />
        </div>
        <div className="break-inside-avoid">
          <NoteCardSkeleton variant="image" />
        </div>
        <div className="break-inside-avoid">
          <NoteCardSkeleton variant="tall" />
        </div>
        <div className="break-inside-avoid">
          <NoteCardSkeleton variant="default" />
        </div>
        <div className="break-inside-avoid">
          <NoteCardSkeleton variant="short" />
        </div>
        <div className="break-inside-avoid">
          <NoteCardSkeleton variant="image" />
        </div>
        <div className="break-inside-avoid">
          <NoteCardSkeleton variant="tall" />
        </div>
        <div className="break-inside-avoid">
          <NoteCardSkeleton variant="default" />
        </div>
        <div className="break-inside-avoid">
          <NoteCardSkeleton variant="short" />
        </div>
        <div className="break-inside-avoid">
          <NoteCardSkeleton variant="image" />
        </div>
        <div className="break-inside-avoid">
          <NoteCardSkeleton variant="default" />
        </div>
      </div>
    </div>
  )
}

// 加载更多骨架 - 使用与主布局相同的 Masonry 布局
export function LoadMoreSkeleton() {
  return (
    <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 gap-4 space-y-4 mt-4">
      {/* 让卡片自然交错排列，模拟真实的加载更多效果 */}
      <div className="break-inside-avoid">
        <NoteCardSkeleton variant="short" />
      </div>
      <div className="break-inside-avoid">
        <NoteCardSkeleton variant="default" />
      </div>
      <div className="break-inside-avoid">
        <NoteCardSkeleton variant="image" />
      </div>
      <div className="break-inside-avoid">
        <NoteCardSkeleton variant="tall" />
      </div>
      <div className="break-inside-avoid">
        <NoteCardSkeleton variant="default" />
      </div>
      <div className="break-inside-avoid">
        <NoteCardSkeleton variant="short" />
      </div>
    </div>
  )
}
