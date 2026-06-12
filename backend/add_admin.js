import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { supabase } from './src/shared/supabase.js';

// Usage: node add_admin.js "helper@email.com" "mypassword123" "support_admin"

async function addAdmin() {
  const [,, email, password, role] = process.argv;

  if (!email || !password || !role) {
    console.error('Usage: node add_admin.js <email> <password> <role>');
    console.log('Available Roles: analyst, support_admin, billing_admin, super_admin');
    process.exit(1);
  }

  try {
    const passwordHash = bcrypt.hashSync(password, 10);
    const { data, error } = await supabase
      .from('admins')
      .insert([{ email, password_hash: passwordHash, role }])
      .select()
      .single();

    if (error) throw error;
    console.log(`✅ Successfully added admin: ${data.email} as ${data.role}`);
  } catch (err) {
    console.error(`❌ Failed to add admin: ${err.message}`);
  }
}

addAdmin();
