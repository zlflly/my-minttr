# 部署到Vercel指南

## 部署前准备

1. 确保代码已推送到GitHub仓库
2. 确保Prisma schema已更新为PostgreSQL
3. 确保所有环境变量已正确配置

## 在Vercel中配置数据库

### 方案1：使用Vercel Postgres（推荐）

1. 登录Vercel控制台
2. 进入您的项目
3. 点击"Storage"选项卡
4. 点击"Create Database"
5. 选择"Postgres"并创建数据库
6. Vercel会自动设置所需的环境变量

### 方案2：使用外部数据库（如Supabase）

1. 在Supabase中创建项目并获取连接信息
2. 在Vercel项目的"Settings" -> "Environment Variables"中添加：
   ```
   DATABASE_URL=your-supabase-connection-string
   ```

## 部署步骤

1. 登录Vercel控制台
2. 点击"Add New Project"
3. 选择您的GitHub仓库
4. 点击"Deploy"
5. 部署完成后，Vercel会自动运行Prisma迁移脚本创建表结构

## 环境变量

Vercel会自动配置以下环境变量（使用Vercel Postgres时）：
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`

## 常见问题

### 1. 部署失败：环境变量未设置
确保在Vercel项目中正确配置了数据库环境变量。

### 2. 数据库连接失败
检查连接字符串是否正确，网络是否可达。

### 3. 表不存在
确保部署时Prisma迁移脚本正确执行。

## 本地开发与生产环境切换

- 本地开发时可以使用SQLite进行快速开发
- 生产环境必须使用PostgreSQL或其他云数据库
- 通过环境变量控制不同环境的数据库连接