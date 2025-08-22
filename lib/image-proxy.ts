/**
 * Creates a proxied image URL to bypass CORS restrictions
 * @param imageUrl - The original image URL
 * @returns The proxied image URL that can be used in img src attributes
 */
export function getProxiedImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null
  
  // Don't proxy local images or data URLs
  if (imageUrl.startsWith('data:') || 
      imageUrl.startsWith('/') || 
      imageUrl.startsWith('blob:')) {
    return imageUrl
  }
  
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    // Don't proxy images from the same domain
    if (imageUrl.includes(window.location.hostname)) {
      return imageUrl
    }
    
    // Create the proxy URL
    const proxyUrl = new URL('/api/proxy/image', window.location.origin)
    proxyUrl.searchParams.set('url', imageUrl)
    
    return proxyUrl.toString()
  }
  
  // In server-side rendering, return the original URL
  return imageUrl
}

/**
 * Hook for handling image loading with fallback
 */
export function useImageWithFallback(imageUrl: string | null | undefined, fallbackUrl?: string) {
  const proxiedUrl = getProxiedImageUrl(imageUrl)
  const proxiedFallback = getProxiedImageUrl(fallbackUrl)
  
  return {
    src: proxiedUrl || proxiedFallback || null,
    onError: (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget
      if (proxiedFallback && img.src !== proxiedFallback) {
        img.src = proxiedFallback
      }
    }
  }
}