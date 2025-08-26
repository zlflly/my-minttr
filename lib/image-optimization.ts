/**
 * 客户端图片优化工具
 * 压缩图片以减少上传时间和存储成本
 */

export interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'webp' | 'jpeg' | 'png'
  maxSizeKB?: number
}

export interface CompressionResult {
  file: File
  originalSize: number
  compressedSize: number
  compressionRatio: number
  dimensions: { width: number; height: number }
}

/**
 * 压缩图片文件
 */
export async function compressImage(
  file: File, 
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxWidth = 1920,
    maxHeight = 1080, 
    quality = 0.8,
    format = 'webp',
    maxSizeKB = 500
  } = options

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      try {
        // 计算新尺寸
        let { width, height } = calculateDimensions(
          img.width, 
          img.height, 
          maxWidth, 
          maxHeight
        )

        canvas.width = width
        canvas.height = height

        if (!ctx) {
          throw new Error('无法获取canvas上下文')
        }

        // 绘制压缩后的图片
        ctx.fillStyle = '#FFFFFF' // 白色背景
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)

        // 转换为blob
        canvas.toBlob(
          async (blob) => {
            if (!blob) {
              reject(new Error('图片压缩失败'))
              return
            }

            const originalSize = file.size
            let compressedSize = blob.size
            let finalBlob = blob
            let currentQuality = quality

            // 如果文件仍然太大，进一步压缩
            while (compressedSize > maxSizeKB * 1024 && currentQuality > 0.1) {
              currentQuality -= 0.1
              const newBlob = await new Promise<Blob | null>((resolve) => {
                canvas.toBlob(resolve, `image/${format}`, currentQuality)
              })
              
              if (newBlob && newBlob.size < compressedSize) {
                finalBlob = newBlob
                compressedSize = newBlob.size
              } else {
                break
              }
            }

            // 创建新的文件对象
            const compressedFile = new File(
              [finalBlob], 
              `compressed_${file.name.replace(/\.[^/.]+$/, `.${format}`)}`,
              { 
                type: `image/${format}`,
                lastModified: Date.now()
              }
            )

            const result: CompressionResult = {
              file: compressedFile,
              originalSize,
              compressedSize,
              compressionRatio: (originalSize - compressedSize) / originalSize,
              dimensions: { width, height }
            }

            resolve(result)
          },
          `image/${format}`,
          quality
        )
      } catch (error) {
        reject(error)
      }
    }

    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * 计算压缩后的尺寸
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let { width, height } = { width: originalWidth, height: originalHeight }

  // 如果图片尺寸小于最大限制，不进行缩放
  if (width <= maxWidth && height <= maxHeight) {
    return { width, height }
  }

  const aspectRatio = width / height

  if (width > maxWidth) {
    width = maxWidth
    height = width / aspectRatio
  }

  if (height > maxHeight) {
    height = maxHeight
    width = height * aspectRatio
  }

  return { 
    width: Math.round(width), 
    height: Math.round(height) 
  }
}

/**
 * 检查是否需要压缩
 */
export function shouldCompress(file: File): boolean {
  const maxSize = 1024 * 1024 // 1MB
  const compressibleTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  
  return file.size > maxSize && compressibleTypes.includes(file.type)
}

/**
 * 格式化文件大小显示
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 预览压缩效果
 */
export function getCompressionPreview(result: CompressionResult): string {
  const { originalSize, compressedSize, compressionRatio } = result
  const savedSize = formatFileSize(originalSize - compressedSize)
  const percentage = Math.round(compressionRatio * 100)
  
  return `压缩了 ${percentage}% (节省 ${savedSize})`
}