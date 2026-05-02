# Vercel 部署配置

## 方法一：手动部署（推荐）

### 1. 推送代码到 GitHub
```bash
cd /Users/panpanpan/Documents/travel-journal
git remote add origin https://github.com/YOUR_USERNAME/travel-journal.git
git push -u origin main
```

### 2. 在 Vercel 部署
1. 打开 https://vercel.com
2. 用 GitHub 登录
3. 点击 **Add New** → **Project**
4. 选择 `travel-journal` 仓库
5. 点击 **Deploy**

---

## 方法二：使用命令行

### 1. 安装 Vercel CLI
```bash
npm install -g vercel
```

### 2. 登录并部署
```bash
vercel login
cd /Users/panpanpan/Documents/travel-journal
vercel --prod
```

按提示操作即可。

---

## 常见问题

### Q: No Production Deployment
A: 设置有问题，请在 Vercel 控制台：
1. 进入项目 → Settings → General
2. 确保 **Build Command** 是：`npm run build`
3. 确保 **Output Directory** 是：`client/dist`

### Q: 页面空白
A: 可能是路由问题，需要在 vercel.json 添加：
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/client/dist/index.html" }]
}
```