import { dbService } from './config/database.js';

async function testDatabase() {
  console.log('🔍 Testing database connection...');
  
  // Test users table
  console.log('\n📋 Testing users table...');
  const usersTest = await dbService.testUsersTable();
  console.log('Users table result:', usersTest);
  
  // Test posts table
  console.log('\n📰 Testing posts table...');
  try {
    const posts = await dbService.getAllPosts({ limit: 1 });
    console.log('Posts table ✅ - Found posts:', posts.length);
  } catch (error) {
    console.log('Posts table ❌ - Error:', error.message);
  }
  
  process.exit(0);
}

testDatabase().catch(console.error);
