import { supabase } from '../config/database.js';
import process from 'process';

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');
    console.log('Note: Please run the schema.sql file in your Supabase SQL Editor instead.');
    console.log('The schema.sql file contains all necessary table creation and sample data.');
    console.log('Location: server/database/schema.sql');
    
    // Check if tables exist
    const { data: tables, error } = await supabase
      .from('blog_posts')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('✗ Database tables not found. Please run schema.sql first.');
      console.log('Steps:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Copy and paste the contents of server/database/schema.sql');
      console.log('4. Execute the SQL');
      process.exit(1);
    }

    console.log(`✓ Database connected successfully. Found ${tables?.count || 0} posts.`);
    console.log('Database is ready for use!');
  } catch (error) {
    console.error('Error checking database:', error);
    process.exit(1);
  }
}

// Run seeder if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}

export { seedDatabase };
