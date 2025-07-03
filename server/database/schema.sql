-- Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT,
    image VARCHAR(500),
    category VARCHAR(100),
    author VARCHAR(100) DEFAULT 'Thompson P.',
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date VARCHAR(50) -- Keep original date format for compatibility
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES blog_posts(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    comment TEXT NOT NULL,
    image VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date VARCHAR(50) -- Keep original date format for compatibility
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON blog_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access on blog_posts" ON blog_posts
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access on comments" ON comments
    FOR SELECT USING (true);

-- Insert sample data
INSERT INTO blog_posts (title, description, content, image, category, author, likes, date) VALUES
(
    'The Art of Mindfulness: Finding Peace in a Busy World',
    'Discover the transformative power of mindfulness and how it can help you navigate the challenges of modern life with greater ease and contentment.',
    '## 1. Understanding Mindfulness

Mindfulness is the practice of being fully present and engaged in the moment, aware of your thoughts and feelings without distraction or judgment.

## 2. Benefits of Mindfulness

Regular mindfulness practice can reduce stress, improve focus, enhance emotional regulation, and boost overall well-being.

## 3. Simple Mindfulness Techniques

Learn easy-to-implement mindfulness exercises, from deep breathing to body scans, that you can incorporate into your daily routine.

## 4. Mindfulness in Daily Life

Discover how to bring mindfulness into everyday activities, from eating to working, to create a more balanced and fulfilling life.

## 5. Overcoming Challenges

Address common obstacles to mindfulness practice and learn strategies to maintain consistency in your mindfulness journey.',
    'https://res.cloudinary.com/dcbpjtd1r/image/upload/v1728449771/my-blog-post/e739huvlalbfz9eynysc.jpg',
    'General',
    'Thompson P.',
    321,
    '11 September 2024'
),
(
    'The Secret Language of Cats: Decoding Feline Communication',
    'Unravel the mysteries of cat communication and learn how to better understand your feline friend''s needs and desires.',
    '## 1. Vocal Communications

Explore the various meows, purrs, and other vocalizations cats use to express themselves.

## 2. Body Language

Learn to read your cat''s posture, tail position, and ear movements to understand their mood and intentions.

## 3. Scent Marking

Discover why cats use scent to communicate and mark their territory.

## 4. Facial Expressions

Understand the subtle facial cues cats use to convey emotions and intentions.

## 5. Interspecies Communication

Learn how cats have adapted their communication methods to interact with humans and other animals.',
    'https://res.cloudinary.com/dcbpjtd1r/image/upload/v1728449771/my-blog-post/gsutzgam24abrvgee9r4.jpg',
    'Cat',
    'Thompson P.',
    123,
    '21 August 2024'
),
(
    'Embracing Change: How to Thrive in Times of Transition',
    'Learn powerful strategies to navigate life''s changes with grace and emerge stronger on the other side.',
    '## 1. Understanding Change

Explore the nature of change and why it''s an essential part of personal growth and development.

## 2. Overcoming Fear of Change

Learn techniques to confront and overcome the anxiety often associated with major life transitions.

## 3. Adapting to New Situations

Discover strategies for quickly adapting to new environments, roles, or circumstances.

## 4. Finding Opportunities in Change

Learn how to identify and capitalize on the opportunities that often arise during periods of transition.

## 5. Building Resilience

Develop the mental and emotional resilience needed to thrive in an ever-changing world.',
    'https://res.cloudinary.com/dcbpjtd1r/image/upload/v1728449771/my-blog-post/zzye4nxfm3pmh81z7hni.jpg',
    'Inspiration',
    'Thompson P.',
    21,
    '23 March 2024'
),
(
    'The Future of Work: Adapting to a Digital-First Economy',
    'Explore how technology is reshaping the workplace and learn skills to succeed in the evolving job market.',
    '## 1. The Digital Transformation

Understand how digital technologies are revolutionizing industries and job roles.

## 2. Remote Work Revolution

Explore the benefits and challenges of remote work and how to thrive in a distributed team.

## 3. Essential Digital Skills

Discover the key digital competencies that will be crucial for career success in the coming years.

## 4. AI and Automation

Learn how artificial intelligence and automation are changing job landscapes and how to adapt.

## 5. Continuous Learning

Understand the importance of lifelong learning and how to stay relevant in a rapidly evolving job market.',
    'https://res.cloudinary.com/dcbpjtd1r/image/upload/v1728449771/my-blog-post/e0haxst38li4g8i0vpsr.jpg',
    'General',
    'Thompson P.',
    32,
    '23 May 2024'
),
(
    'The Power of Habits: Small Changes, Big Results',
    'Discover how small, consistent habits can lead to significant personal and professional growth over time.',
    '## 1. Understanding Habit Formation

Learn the science behind habit formation and why habits are so powerful in shaping our lives.

## 2. Identifying Key Habits

Discover how to identify the habits that will have the most significant impact on your goals.

## 3. Building Positive Habits

Explore strategies for successfully implementing and maintaining positive habits.

## 4. Breaking Bad Habits

Learn effective techniques for identifying and breaking detrimental habits.

## 5. Habit Stacking

Understand how to use habit stacking to make new habits easier to adopt and maintain.',
    'https://res.cloudinary.com/dcbpjtd1r/image/upload/v1728449771/my-blog-post/g8qpepvgnz6gioylyhrz.jpg',
    'Inspiration',
    'Thompson P.',
    515,
    '23 June 2024'
),
(
    'Cat Nutrition: A Guide to Feeding Your Feline Friend',
    'Learn about the nutritional needs of cats and how to provide a balanced diet for optimal health and longevity.',
    '## 1. Understanding Feline Nutritional Needs

Explore the unique dietary requirements of cats as obligate carnivores.

## 2. Choosing the Right Cat Food

Learn how to read cat food labels and select high-quality options for your pet.

## 3. Wet vs. Dry Food

Understand the pros and cons of wet and dry cat food and how to incorporate both into your cat''s diet.

## 4. Portion Control and Feeding Schedule

Discover how to determine the right portion sizes and establish a healthy feeding routine.

## 5. Special Dietary Considerations

Learn about nutrition for cats with specific health conditions or at different life stages.',
    'https://res.cloudinary.com/dcbpjtd1r/image/upload/v1728449771/my-blog-post/koydfh6jpmzhtxvwein3.jpg',
    'Cat',
    'Thompson P.',
    555,
    '21 July 2024'
);

-- Insert sample comments
INSERT INTO comments (post_id, name, comment, image, date) VALUES
(
    2,
    'Jacob Lash',
    'I loved this article! It really explains why my cat is so independent yet loving. The purring section was super interesting.',
    'https://s3-alpha-sig.figma.com/img/7583/57be/ae9594f1160471db992db1cf36ca3f46?Expires=1728864000&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=hBjXqwftGT6YjEcc7Ad-3uYjDG57pDkgcxjnHyG4uxkoeAI6BkuJRIpJdAdXZgblQmDt3V6LSSJYdSA3nFS-YacZfLq8yR3lSpS9byHzZNxd15K9LTSLVxuAXhymBdNvdgyeFPUCPR-Cjk2bBkE~1kTOUGYPQzmVf8MtNyZgN6MCP38mFOP4Ca1zr-PIY5n7r6wD-eKnMhPjAemjVU6E9DXIEKkf7pThpqK1PJWtgKsWTkCu0TUjQ~IYrtcdUuQxB7nY4mjaBmj0uBtQ2Iv5ZMJTPaU2xbgK9BsznP-s~zH5VA7JL59t0MuE5jerosnZACif6NvLhCD6K4VXGnLZdQ__',
    '12 September 2024 at 18:30'
),
(
    2,
    'Ahri',
    'Such a great read! I''ve always wondered why my cat slow blinks at me—now I know it''s her way of showing trust!',
    'https://s3-alpha-sig.figma.com/img/1852/f933/5b1d7401994fcd48a9a60538ddbfb196?Expires=1728864000&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=WJ3HdeZlxZTw3Qj1DmflgJithNJanTkaq7rAa5qGCfxIqme1DJAfUd0hx1B~~eqNsyR-oEWNc4X96Ctn6yGmFGK6xaK-ESqVl-C7yGJbezbhielNRSoyfm9Jwu-1IqSOWxMerkqa6Ty4o5Yz15aO2iPHL1yGEd5ykTRGi-crcPdFCE1PVz~6QahlerseE3prLFIylTYM1Rzp-hNTYUm7fBAUoFsAFlvmLaeFwdHSXNklwuXiECTE16e1Aada83p90hZUCszeTTri7GYNp3I4fAiHeKt90BH8SHLLJhUEElQy5aFL1SEH~pqzJmwjE7mP-QuhkqdPOo42QFay~sHoCg__',
    '12 September 2024 at 18:30'
),
(
    6,
    'Mimi mama',
    'This article perfectly captures why cats make such amazing pets. I had no idea their purring could help with healing. Fascinating stuff!',
    'https://s3-alpha-sig.figma.com/img/da58/2ef3/fc9bda3903c1a2bedb688672ce673327?Expires=1728864000&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=PIMt7QZMJ3OXXuVGsuRvxa0wWHScJAyek8bNeYR3RhE-4RS0S~pxxdNmY3KZ~leZpSc~bJodoMHv13ZlQg4bHENt2h8nM0-MhUaUqKw0o-ynqfCfP1nDv~td2sfce7v~C-mLUTcijR3PqCxKyIM~MI~j7uU414rw5hL21kgRwQ5EJKKZThrSu5j01xP3vpbewUi1tfw6PVXiKv5GC9t96at9xAErgqIO8ySPpdy-7j4dvXf7Fs8D1HoWJMYct7K4-LMHxVK60YBTQ8dmRIEzAQkxoWNrjGrxCt9~5~lXgVchcB2uk4i26C0a4IUFniJmCLqeyfxNWkAcYDHP4DNVHw__',
    '12 September 2024 at 18:30'
);
