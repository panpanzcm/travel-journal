# Travel Journal - 旅游记录本

## 1. 项目概述

- **项目名称**：Travel Journal（旅游记录本）
- **项目类型**：Web 应用（全栈）
- **核心功能**：个人旅游记录管理，支持多媒体上传、协作编辑、地图展示
- **目标用户**：热爱旅游、想要记录和分享旅行的用户

## 2. 技术选型

### 后端
- **框架**：Express.js (Node.js)
- **数据库**：SQLite (better-sqlite3)
- **文件存储**：本地文件系统
- **认证**：JWT

### 前端
- **框架**：React 18 + Vite
- **UI**：Tailwind CSS
- **地图**：Leaflet + OpenStreetMap
- **HTTP**：Axios

## 3. 核心功能

### 3.1 记录本管理
- ✅ 创建记录本（标题、描述、地点、公开/私有）
- ✅ 地点搜索（使用 Nominatim API）
- ✅ 地图光标显示
- ✅ 我的记录本 / 参与的记录本 / 公开记录本

### 3.2 协作分享
- ✅ 邀请朋友编辑
- ✅ 移除协作者
- ✅ 私有（仅自己和协作者可见）/ 公开（所有人可见）

### 3.3 内容条目
- ✅ 文字
- ✅ 照片
- ✅ 视频
- ✅ 音频
- ✅ 路线（GPS坐标）

### 3.4 地图展示
- ✅ 标记点光标
- ✅ 公开广场地图

## 4. 页面路由

| 路径 | 页面 | 权限 |
|------|------|------|
| /login | 登录 | 公开 |
| /register | 注册 | 公开 |
| / | 首页（记录本列表+地图） | 登录 |
| /notebooks/new | 创建记录本 | 登录 |
| /notebooks/:id | 记录本详情 | 协作者/公开 |
| /notebooks/:id/share | 分享管理 | 所有者 |
| /explore | 公开广场 | 公开 |

## 5. 快速开始

### 前置要求
- Node.js 18+

### 安装依赖

```bash
# 后端
cd server
npm install

# 前端
cd client
npm install
```

### 启动项目

```bash
# 终端1 - 启动后端
cd server
npm run dev

# 终端2 - 启动前端
cd client
npm run dev
```

### 访问
- 前端：http://localhost:5173
- 后端：http://localhost:3001

## 6. API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 注册 |
| POST | /api/auth/login | 登录 |
| GET | /api/auth/me | 当前用户 |
| GET | /api/notebooks | 我的记录本 |
| GET | /api/notebooks/shared | 参与的记录本 |
| GET | /api/notebooks/public | 公开记录本 |
| POST | /api/notebooks | 创建记录本 |
| GET | /api/notebooks/:id | 记录本详情 |
| PUT | /api/notebooks/:id | 编辑记录本 |
| DELETE | /api/notebooks/:id | 删除记录本 |
| GET | /api/notebooks/:id/collaborators | 协作者列表 |
| POST | /api/notebooks/:id/collaborators | 邀请协作者 |
| DELETE | /api/notebooks/:id/collaborators/:userId | 移除协作者 |
| GET | /api/entries/:notebookId/entries | 条目列表 |
| POST | /api/entries/:notebookId/entries | 创建条目 |
| PUT | /api/entries/:id | 编辑条目 |
| DELETE | /api/entries/:id | 删除条目 |
| POST | /api/upload | 上传文件 |

## 7. 数据表设计

### users
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| username | TEXT | 用户名 |
| email | TEXT | 邮箱 |
| password | TEXT | 密码 |
| avatar | TEXT | 头像 |
| created_at | DATETIME | 创建时间 |

### notebooks
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| owner_id | INTEGER | 所有者 |
| title | TEXT | 标题 |
| description | TEXT | 描述 |
| cover_image | TEXT | 封面 |
| latitude | REAL | 纬度 |
| longitude | REAL | 经度 |
| location_name | TEXT | 地点名称 |
| is_public | INTEGER | 是否公开 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### notebook_collaborators
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| notebook_id | INTEGER | 记录本ID |
| user_id | INTEGER | 用户ID |
| role | TEXT | 角色 |
| invited_at | DATETIME | 邀请时间 |

### entries
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| notebook_id | INTEGER | 记录本ID |
| author_id | INTEGER | 作者ID |
| type | TEXT | 类型 |
| content | TEXT | 内容 |
| file_path | TEXT | 文件路径 |
| thumbnail_path | TEXT | 缩略图 |
| latitude | REAL | 纬度 |
| longitude | REAL | 经度 |
| route_data | TEXT | 路线数据 |
| created_at | DATETIME | 创建时间 |