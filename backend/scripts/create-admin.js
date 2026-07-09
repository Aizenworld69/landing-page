const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env manually
const envPath = path.join(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.error('.env file not found at:', envPath);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }
    env[key] = value.trim();
  }
});

const supabaseUrl = env.SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined in backend .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function createAdmin() {
  const email = 'aizen@aizen.edu.vn';
  const password = 'Aizen@2026';
  
  console.log(`Creating/updating admin user: ${email}...`);
  
  // Try to create user
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: 'AIZEN Admin',
    },
    app_metadata: {
      role: 'admin',
    }
  });

  if (error) {
    if (error.message.includes('already registered') || error.message.includes('already exists') || error.status === 422) {
      console.log('User already exists. Attempting to update password and role...');
      
      // List users to find the exact id
      const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) {
        console.error('Error listing users:', listError.message);
        return;
      }
      
      const existingUser = usersData.users.find(u => u.email === email);
      if (existingUser) {
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          existingUser.id,
          { 
            password,
            app_metadata: { role: 'admin' }
          }
        );
        if (updateError) {
          console.error('Error updating user:', updateError.message);
        } else {
          console.log('Password and admin role updated successfully!');
        }
      } else {
        console.error('Could not find existing user to update.');
      }
    } else {
      console.error('Error creating user:', error.message);
    }
  } else {
    console.log('Admin user created successfully:', data.user.email);
  }
}

createAdmin();
