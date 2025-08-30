/**
 * 设置对话框组件
 * 使用localStorage管理用户偏好设置
 */

"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { 
  Settings, 
  Moon, 
  Sun, 
  Monitor,
  Grid,
  List,
  SortAsc,
  SortDesc,
  Clock,
  Calendar,
  Type,
  Trash2,
  Download,
  Upload
} from "lucide-react"
import { useTheme } from "next-themes"
import { 
  useUserPreferences,
  useStorageMonitor,
  useDraftNote 
} from "@/lib/hooks/use-local-storage"

interface SettingsDialogProps {
  children: React.ReactNode
}

export default function SettingsDialog({ children }: SettingsDialogProps) {
  const { theme, setTheme } = useTheme()
  const [preferences, setPreferences] = useUserPreferences()
  const { draft, hasDraft, clearDraft } = useDraftNote()
  const storageMonitor = useStorageMonitor()

  const handlePreferenceChange = (key: string, value: unknown) => {
    setPreferences({ [key]: value })
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const exportData = () => {
    const data = storageMonitor.export()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `minttr-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        if (storageMonitor.import(data)) {
          alert('数据导入成功！')
          storageMonitor.refresh()
        } else {
          alert('数据导入失败！')
        }
      } catch {
        alert('文件格式错误！')
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            设置
          </DialogTitle>
          <DialogDescription>
            个性化您的笔记体验设置
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">通用</TabsTrigger>
            <TabsTrigger value="appearance">外观</TabsTrigger>
            <TabsTrigger value="draft">草稿</TabsTrigger>
            <TabsTrigger value="storage">存储</TabsTrigger>
          </TabsList>
          
          {/* 通用设置 */}
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">显示偏好</CardTitle>
                <CardDescription>配置笔记的显示方式</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="defaultView" className="text-sm">默认视图</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={preferences.defaultView === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePreferenceChange('defaultView', 'grid')}
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={preferences.defaultView === 'list' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePreferenceChange('defaultView', 'list')}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="itemsPerPage" className="text-sm">每页显示</Label>
                  <div className="flex gap-2">
                    {[10, 20, 50, 100].map(num => (
                      <Button
                        key={num}
                        variant={preferences.itemsPerPage === num ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePreferenceChange('itemsPerPage', num)}
                      >
                        {num}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="sortBy" className="text-sm">排序方式</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={preferences.sortBy === 'updated' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePreferenceChange('sortBy', 'updated')}
                    >
                      <Clock className="h-4 w-4 mr-1" />
                      更新时间
                    </Button>
                    <Button
                      variant={preferences.sortBy === 'created' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePreferenceChange('sortBy', 'created')}
                    >
                      <Calendar className="h-4 w-4 mr-1" />
                      创建时间
                    </Button>
                    <Button
                      variant={preferences.sortBy === 'title' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePreferenceChange('sortBy', 'title')}
                    >
                      <Type className="h-4 w-4 mr-1" />
                      标题
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="sortOrder" className="text-sm">排序顺序</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={preferences.sortOrder === 'desc' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePreferenceChange('sortOrder', 'desc')}
                    >
                      <SortDesc className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={preferences.sortOrder === 'asc' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePreferenceChange('sortOrder', 'asc')}
                    >
                      <SortAsc className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="showPreview" className="text-sm">显示预览</Label>
                    <p className="text-xs text-muted-foreground">
                      在笔记卡片中显示内容预览
                    </p>
                  </div>
                  <Switch
                    id="showPreview"
                    checked={preferences.showPreview}
                    onCheckedChange={(checked) => handlePreferenceChange('showPreview', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="autoSave" className="text-sm">自动保存草稿</Label>
                    <p className="text-xs text-muted-foreground">
                      编辑时自动保存到本地存储
                    </p>
                  </div>
                  <Switch
                    id="autoSave"
                    checked={preferences.autoSave}
                    onCheckedChange={(checked) => handlePreferenceChange('autoSave', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 外观设置 */}
          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">主题设置</CardTitle>
                <CardDescription>选择您偏好的界面主题</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    onClick={() => setTheme('light')}
                    className="flex flex-col gap-2 h-20"
                  >
                    <Sun className="h-6 w-6" />
                    <span className="text-xs">浅色</span>
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    onClick={() => setTheme('dark')}
                    className="flex flex-col gap-2 h-20"
                  >
                    <Moon className="h-6 w-6" />
                    <span className="text-xs">深色</span>
                  </Button>
                  <Button
                    variant={theme === 'system' ? 'default' : 'outline'}
                    onClick={() => setTheme('system')}
                    className="flex flex-col gap-2 h-20"
                  >
                    <Monitor className="h-6 w-6" />
                    <span className="text-xs">跟随系统</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 草稿管理 */}
          <TabsContent value="draft" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">草稿管理</CardTitle>
                <CardDescription>管理您的草稿笔记</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasDraft ? (
                  <div className="border rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium">
                          {draft.title || '无标题草稿'}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          最后修改: {new Date(draft.timestamp).toLocaleString()}
                        </p>
                        {draft.content && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {draft.content.substring(0, 100)}...
                          </p>
                        )}
                        {draft.tags.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            标签: {draft.tags.join(', ')}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearDraft}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    暂无草稿
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 存储管理 */}
          <TabsContent value="storage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">存储信息</CardTitle>
                <CardDescription>查看和管理本地存储使用情况</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>已使用空间:</span>
                    <span>{formatBytes(storageMonitor.size)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>存储项数量:</span>
                    <span>{storageMonitor.keys.length}</span>
                  </div>
                  {storageMonitor.nearLimit && (
                    <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                      存储空间接近限制，建议清理数据
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportData}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      导出数据
                    </Button>
                    <div className="relative flex-1">
                      <input
                        type="file"
                        accept=".json"
                        onChange={importData}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <Button variant="outline" size="sm" className="w-full">
                        <Upload className="h-4 w-4 mr-2" />
                        导入数据
                      </Button>
                    </div>
                  </div>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm('确定要清空所有本地数据吗？此操作不可撤销。')) {
                        storageMonitor.clear()
                        storageMonitor.refresh()
                      }
                    }}
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    清空所有数据
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}