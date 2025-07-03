import { dbService } from '../config/database.js';
import { blogPosts } from '../data/blogPosts.js';
import { comments } from '../data/comments.js';
import process from 'process';

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');
    
    // Seed blog posts
    console.log('Seeding blog posts...');
    for (const post of blogPosts) {
      try {
        await dbService.createPost({
          title: post.title,
          description: post.description,
          content: post.content,
          image: post.image,
          category: post.category,
          author: post.author,
          likes: post.likes,
          date: post.date
        });
        console.log(`✓ Created post: ${post.title}`);
      } catch (error) {
        console.error(`✗ Error creating post "${post.title}":`, error.message);
      }
    }

    // Seed comments
    console.log('Seeding comments...');
    for (const comment of comments) {
      try {
        await dbService.createComment({
          post_id: comment.postId,
          name: comment.name,
          comment: comment.comment,
          image: comment.image,
          date: comment.date
        });
        console.log(`✓ Created comment by: ${comment.name}`);
      } catch (error) {
        console.error(`✗ Error creating comment by "${comment.name}":`, error.message);
      }
    }

    console.log('Database seeding completed!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run seeder if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}

export { seedDatabase };
