"use client"

import React, { useState, useRef, useEffect } from 'react'
import { getProxiedImageUrl } from '@/lib/image-proxy'

interface LazyImageProps {
  src: string | null | undefined
  alt?: string
  className?: string
  fallback?: string
  placeholder?: React.ReactNode
  onLoad?: () => void
  onError?: () => void
  referrerPolicy?: React.ImgHTMLAttributes<HTMLImageElement>['referrerPolicy']
  crossOrigin?: React.ImgHTMLAttributes<HTMLImageElement>['crossOrigin']
}

export default function LazyImage({
  src,
  alt = '',
  className = '',
  fallback = '/placeholder.svg',
  placeholder,
  onLoad,
  onError,
  referrerPolicy = 'no-referrer',
  crossOrigin = 'anonymous'
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const placeholderRef = useRef<HTMLDivElement>(null)

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '50px' // Start loading 50px before the image comes into view
      }
    )

    if (placeholderRef.current) {
      observer.observe(placeholderRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setIsError(true)
    onError?.()
  }

  const imageSrc = getProxiedImageUrl(src) || fallback

  return (
    <div ref={placeholderRef} className={`relative overflow-hidden ${className}`}>
      {/* Placeholder */}
      {!isLoaded && !isError && (
        <div className="absolute inset-0 bg-sand-3 animate-pulse flex items-center justify-center">
          {placeholder || (
            <div className="w-8 h-8 bg-sand-4 rounded animate-pulse"></div>
          )}
        </div>
      )}
      
      {/* Actual Image */}
      {isInView && (
        <img
          ref={imgRef}
          src={imageSrc}
          alt={alt}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          loading="lazy"
          decoding="async"
          referrerPolicy={referrerPolicy}
          crossOrigin={crossOrigin}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            position: isLoaded ? 'static' : 'absolute',
            top: isLoaded ? 'auto' : 0,
            left: isLoaded ? 'auto' : 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      )}
    </div>
  )
}
