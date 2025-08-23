'use client';

import React from 'react';
import LazyImage from './LazyImage';

interface BlurredBackgroundImageProps {
  src: string | null | undefined;
  alt?: string;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'auto';
  backgroundIntensity?: 'light' | 'medium' | 'strong';
  onClick?: () => void;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * 显示带有模糊背景的图片组件
 * 实现"任何图片都能完整显示+空白处用模糊"的效果
 */
export default function BlurredBackgroundImage({
  src,
  alt = '',
  className = '',
  aspectRatio = 'auto',
  backgroundIntensity = 'medium',
  onClick,
  onLoad,
  onError,
}: BlurredBackgroundImageProps) {
  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video', 
    auto: ''
  };

  const backgroundOpacities = {
    light: 'opacity-30',
    medium: 'opacity-50',
    strong: 'opacity-70'
  };

  const backgroundBlurs = {
    light: 'blur-lg',
    medium: 'blur-xl',
    strong: 'blur-2xl'
  };

  if (!src) {
    return (
      <div className={`relative overflow-hidden rounded-lg bg-sand-3 flex items-center justify-center ${aspectClasses[aspectRatio]} ${className}`}>
        <div className="w-8 h-8 bg-sand-4 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-lg ${aspectClasses[aspectRatio]} ${className}`}>
      {/* 模糊背景层 - 放大并模糊的图片作为背景 */}
      <div className={`absolute inset-0 ${backgroundBlurs[backgroundIntensity]}`}>
        <LazyImage 
          src={src}
          alt="" 
          className={`w-[120%] h-[120%] object-cover ${backgroundOpacities[backgroundIntensity]}`}
          style={{
            transform: 'translate(-10%, -10%)' // 居中放大的效果
          }}
        />
      </div>
      
      {/* 主要图片层 - 保持完整显示 */}
      <LazyImage 
        src={src}
        alt={alt} 
        className={`relative w-full h-full object-contain mx-auto ${onClick ? 'cursor-pointer hover:scale-105 transition-transform duration-200' : ''}`}
        onClick={onClick}
        onLoad={onLoad}
        onError={onError}
      />
      
      {/* 边框装饰层 */}
      <div className="absolute inset-0 box-border border-[0.5px] border-black/5 mix-blend-luminosity rounded-lg pointer-events-none"></div>
    </div>
  );
}