# 部署到 Render.com

## 步骤1：推送代码到 GitHub
1. 在 GitHub 创建新仓库 `travel-journal`
2. 推送代码：
```bash
cd /Users/panpanpan/Documents/travel-journal
git init
git add .
git commit -m "init"
git remote add origin https://github.com/YOUR_USERNAME/travel-journal.git
git push -u origin main
```

## 步骤2：部署到 Render
1. 登录 https://render.com
2. 创建新 Web Service
3. 连接到 GitHub 仓库
4. 设置：
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start`
   - Environment: `Node`

## 访问地址
部署后会得到一个 URL，如：https://travel-journal.onrender.com

## 注意事项
- 免费服务会在 15 分钟无活动后休眠，访问时会自动唤醒
- 首次访问可能需要等待几秒