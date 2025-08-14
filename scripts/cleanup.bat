@echo off
echo 🧹 开始清理上传的图片和数据...
echo.

echo 📁 清理上传的图片文件...
node scripts/cleanup.js

echo.
echo 💡 提示：
echo    1. 图片文件已清理完成
echo    2. 要清理浏览器中的书签数据，请：
echo       - 打开浏览器开发者工具 (F12)
echo       - 在控制台中输入: localStorage.clear()
echo       - 然后刷新页面
echo.
echo ✅ 清理脚本执行完成！
pause