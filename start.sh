#!/bin/bash
# 启动旅游记录本应用

echo "启动后端..."
cd server && npm run dev &
sleep 3

echo "启动前端..."
cd ../client && npm run dev

echo "访问地址："
echo "- 电脑: http://localhost:5173"
echo "- 手机: http://192.168.31.97:5173"