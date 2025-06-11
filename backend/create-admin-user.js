const { pool } = require('./config/database');
const bcrypt = require('bcryptjs');

const createTestUser = async () => {
  try {
    console.log('🔄 Creating test user...');
    
    const username = 'admin';
    const email = 'admin@admin.com';
    const password = 'Admin123!'; // Meets all requirements
    
    // Check if user already exists
    const [existingUsers] = await pool.execute(
      'SELECT id, username FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    
    if (existingUsers.length > 0) {
      console.log('✅ User already exists:', existingUsers[0]);
      
      // Update password to known value
      const hashedPassword = await bcrypt.hash(password, 12);
      await pool.execute(
        'UPDATE users SET password = ? WHERE username = ?',
        [hashedPassword, username]
      );
      
      console.log(`✅ Updated password for user: ${username}`);
      console.log(`🔑 Login with: username="${username}", password="${password}"`);
    } else {
      // Create new user
      const hashedPassword = await bcrypt.hash(password, 12);
      
      const [result] = await pool.execute(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        [username, email, hashedPassword, 'admin']
      );
      
      console.log(`✅ Created new user: ${username} (ID: ${result.insertId})`);
      console.log(`🔑 Login with: username="${username}", password="${password}"`);
    }
    
    // Show current users
    const [allUsers] = await pool.execute('SELECT id, username, email, role FROM users');
    console.log('\n📊 All users in database:');
    allUsers.forEach(user => {
      console.log(`  - ID: ${user.id}, Username: ${user.username}, Email: ${user.email}, Role: ${user.role}`);
    });
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    process.exit(1);
  }
};

createTestUser(); 