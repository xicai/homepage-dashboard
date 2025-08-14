const fs = require('fs');
const path = require('path');

function fixPaths(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      fixPaths(filePath);
    } else if (file.endsWith('.html')) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // 修复CSS和JS路径
      content = content.replace(/href="\/_next\//g, 'href="./_next/');
      content = content.replace(/src="\/_next\//g, 'src="./_next/');
      
      // 修复JSON中的路径
      content = content.replace(/"href":"\\?\/_next\//g, '"href":"./_next/');
      content = content.replace(/"src":"\\?\/_next\//g, '"src":"./_next/');
      
      // 修复JavaScript代码中的路径
      content = content.replace(/\\"\\?\/_next\//g, '\\"./_next/');
      content = content.replace(/\[\\"\\?\/_next\//g, '[\\"./_next/');
      content = content.replace(/,\\"\\?\/_next\//g, ',\\"./_next/');
      
      fs.writeFileSync(filePath, content);
      console.log(`Fixed paths in: ${filePath}`);
    } else if (file.endsWith('.css')) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // 修复CSS文件中的字体和资源路径
      content = content.replace(/url\(\/_next\//g, 'url(./_next/');
      content = content.replace(/url\("\/_next\//g, 'url("./_next/');
      content = content.replace(/url\('\/_next\//g, 'url(\'./_next/');
      
      // 修复相对路径问题 - CSS文件在 _next/static/css/ 中，需要向上三级才能到达根目录
      content = content.replace(/url\(\.\/_next\//g, 'url(../../../_next/');
      content = content.replace(/url\("\.\/_next\//g, 'url("../../../_next/');
      content = content.replace(/url\('\.\/_next\//g, 'url(\'../../../_next/');
      
      fs.writeFileSync(filePath, content);
      console.log(`Fixed CSS paths in: ${filePath}`);
    }
  });
}

// 修复out目录中的所有HTML文件
const outDir = path.join(__dirname, '../out');
if (fs.existsSync(outDir)) {
  fixPaths(outDir);
  
  // 删除out目录中的bookmarks.json文件
  const bookmarksPath = path.join(outDir, 'data', 'bookmarks.json');
  if (fs.existsSync(bookmarksPath)) {
    fs.unlinkSync(bookmarksPath);
    console.log('✅ Removed bookmarks.json from build output');
  }
  
  console.log('✅ All paths fixed successfully!');
} else {
  console.log('❌ Out directory not found!');
}