// scripts/init-db.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('开始初始化数据库...');
  
  // 这里可以添加一些初始化数据的逻辑
  // 例如创建默认用户、初始收藏夹等
  
  console.log('数据库初始化完成');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });