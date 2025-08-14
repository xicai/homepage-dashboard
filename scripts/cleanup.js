const fs = require('fs');
const path = require('path');

console.log('🧹 开始清理上传的图片和数据...');

// 清理上传的图片文件
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

try {
  // 读取uploads目录
  const files = fs.readdirSync(uploadsDir);
  
  let deletedCount = 0;
  files.forEach(file => {
    // 跳过.gitkeep文件
    if (file === '.gitkeep') {
      return;
    }
    
    const filePath = path.join(uploadsDir, file);
    try {
      fs.unlinkSync(filePath);
      console.log(`✅ 删除文件: ${file}`);
      deletedCount++;
    } catch (error) {
      console.error(`❌ 删除文件失败 ${file}:`, error.message);
    }
  });
  
  console.log(`📊 总共删除了 ${deletedCount} 个上传的图片文件`);
  
} catch (error) {
  console.error('❌ 读取uploads目录失败:', error.message);
}

console.log('🧹 清理完成！');
console.log('💡 提示：localStorage中的书签数据需要在浏览器中手动清理，或者刷新页面重置为默认数据。');