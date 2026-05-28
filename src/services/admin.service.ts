// src/services/admin.service.ts - FULL COMPLETE VERSION
import { supabase } from './supabase.service';

export interface AdminAccount {
  id: string;
  name: string;
  email: string;
  username: string | null;
  password_hash?: string;
  role: string;
  status: string;
  login_method: 'credentials' | 'magiclink';
  theme_preference: string;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAdminCredentials {
  name: string;
  email: string;
  username: string;
  password: string;
  role?: string;
}

export interface CreateMagicLinkAdmin {
  name: string;
  email: string;
  role?: string;
}

export interface UpdateAdminData {
  name?: string;
  email?: string;
  username?: string;
  role?: string;
  status?: string;
  theme_preference?: string;
  password?: string;
}

class AdminServiceClass {
  private table = 'admin_accounts';

  // ============================================
  // PASSWORD HASHING (Plain text muna for testing)
  // ============================================
  
  private async hashPassword(password: string): Promise<string> {
    // For now, plain text muna
    return password;
  }

  private async verifyPassword(password: string, storedPassword: string): Promise<boolean> {
    console.log('🔐 VERIFY PASSWORD:');
    console.log('   Entered password:', password);
    console.log('   Stored password:', storedPassword);
    console.log('   Match:', password === storedPassword ? '✅ YES' : '❌ NO');
    return password === storedPassword;
  }

  // ============================================
  // GET ADMIN FUNCTIONS
  // ============================================

  async getAdminByUsername(username: string): Promise<AdminAccount | null> {
    console.log('🔍 GET ADMIN BY USERNAME:', username);
    console.log('   Table:', this.table);
    
    try {
      const { data, error } = await supabase
        .from(this.table)
        .select('*')
        .eq('username', username)
        .eq('login_method', 'credentials')
        .maybeSingle();
      
      if (error) {
        console.error('❌ DATABASE ERROR:', error);
        return null;
      }
      
      if (data) {
        console.log('✅ ADMIN FOUND:', data.username);
        return data;
      } else {
        console.log('❌ ADMIN NOT FOUND for username:', username);
        return null;
      }
    } catch (err) {
      console.error('❌ EXCEPTION:', err);
      return null;
    }
  }

  async getAdminByEmail(email: string): Promise<AdminAccount | null> {
    console.log('🔍 Looking for email:', email);
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('email', email)
      .maybeSingle();
    
    if (error) {
      console.error('❌ Database error:', error);
      return null;
    }
    console.log('📦 Found admin by email:', data?.email || 'NOT FOUND');
    return data;
  }

  async getAdminById(id: string): Promise<AdminAccount | null> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') return null;
    return data;
  }

  async getAllAdmins(): Promise<AdminAccount[]> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('❌ Error getting admins:', error);
      return [];
    }
    console.log(`📦 Loaded ${data?.length || 0} admins from database`);
    return data || [];
  }

  async getAdminsByMethod(loginMethod: 'credentials' | 'magiclink'): Promise<AdminAccount[]> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('login_method', loginMethod)
      .order('created_at', { ascending: true });
    
    if (error) return [];
    return data || [];
  }

  // ============================================
  // AUTHENTICATION FUNCTIONS
  // ============================================

  async verifyCredentials(username: string, password: string): Promise<AdminAccount | null> {
    console.log('========================================');
    console.log('🔐 VERIFY CREDENTIALS START');
    console.log('   Username:', username);
    console.log('========================================');
    
    const admin = await this.getAdminByUsername(username);
    
    if (!admin) {
      console.log('❌ No admin found for username:', username);
      return null;
    }
    
    console.log('✅ Admin found, checking password...');
    
    if (!admin.password_hash) {
      console.log('❌ Admin has no password_hash stored');
      return null;
    }
    
    if (admin.status !== 'Active') {
      console.log('❌ Admin status is not Active:', admin.status);
      return null;
    }
    
    const isValid = await this.verifyPassword(password, admin.password_hash);
    
    if (isValid) {
      console.log('✅✅✅ PASSWORD VALID! LOGIN SUCCESS! ✅✅✅');
      await this.updateLastLogin(admin.id);
      return admin;
    }
    
    console.log('❌❌❌ PASSWORD INVALID! ❌❌❌');
    return null;
  }

  async verifyMagicLink(email: string): Promise<AdminAccount | null> {
    console.log('🔐 Verifying magic link for:', email);
    const admin = await this.getAdminByEmail(email);
    
    if (!admin) {
      console.log('❌ Admin not found');
      return null;
    }
    
    if (admin.status !== 'Active') {
      console.log('❌ Admin account is inactive');
      return null;
    }
    
    if (admin.login_method !== 'magiclink') {
      console.log('❌ Not a magic link account');
      return null;
    }
    
    console.log('✅ Magic link verified for:', admin.name);
    await this.updateLastLogin(admin.id);
    return admin;
  }

  // ============================================
  // THEME PERSISTENCE FUNCTIONS
  // ============================================

  async getAdminTheme(adminId: string): Promise<string> {
    const admin = await this.getAdminById(adminId);
    return admin?.theme_preference || 'green';
  }

  async updateThemePreference(id: string, theme: string): Promise<void> {
    const { error } = await supabase
      .from(this.table)
      .update({ theme_preference: theme })
      .eq('id', id);
    
    if (error) throw new Error(error.message);
    console.log('🎨 Theme updated:', theme);
  }

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  async updateLastLogin(id: string): Promise<void> {
    const { error } = await supabase
      .from(this.table)
      .update({ last_login: new Date().toISOString() })
      .eq('id', id);
    
    if (error) console.error('Failed to update last login:', error);
  }

  async createCredentialsAdmin(data: CreateAdminCredentials): Promise<AdminAccount> {
    const existing = await this.getAdminByUsername(data.username);
    if (existing) {
      throw new Error('Username already exists');
    }
    
    const existingEmail = await this.getAdminByEmail(data.email);
    if (existingEmail) {
      throw new Error('Email already exists');
    }
    
    const { data: newAdmin, error } = await supabase
      .from(this.table)
      .insert({
        name: data.name,
        email: data.email,
        username: data.username,
        password_hash: data.password,
        role: data.role || 'Admin',
        status: 'Active',
        login_method: 'credentials',
        theme_preference: 'green'
      })
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    console.log('✅ Credentials admin created:', data.username);
    return newAdmin;
  }

  async createMagicLinkAdmin(data: CreateMagicLinkAdmin): Promise<AdminAccount> {
    const existing = await this.getAdminByEmail(data.email);
    if (existing) {
      throw new Error('Email already exists');
    }
    
    const { data: newAdmin, error } = await supabase
      .from(this.table)
      .insert({
        name: data.name,
        email: data.email,
        username: null,
        password_hash: null,
        role: data.role || 'Admin',
        status: 'Active',
        login_method: 'magiclink',
        theme_preference: 'green'
      })
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    console.log('✅ Magic link admin created:', data.email);
    return newAdmin;
  }

  async updateAdmin(id: string, data: UpdateAdminData): Promise<AdminAccount> {
    const updateData: any = {};
    
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.username) updateData.username = data.username;
    if (data.role) updateData.role = data.role;
    if (data.status) updateData.status = data.status;
    if (data.theme_preference) updateData.theme_preference = data.theme_preference;
    if (data.password) {
      updateData.password_hash = data.password;
    }
    
    const { data: updated, error } = await supabase
      .from(this.table)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    console.log('✅ Admin updated:', id);
    return updated;
  }

  async deleteAdmin(id: string): Promise<void> {
    const { error } = await supabase
      .from(this.table)
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(error.message);
    console.log('✅ Admin deleted:', id);
  }

  async changePassword(id: string, newPassword: string): Promise<void> {
    const admin = await this.getAdminById(id);
    if (!admin) throw new Error('Admin not found');
    if (admin.login_method !== 'credentials') {
      throw new Error('Only credentials admins can change password');
    }
    
    const { error } = await supabase
      .from(this.table)
      .update({ password_hash: newPassword })
      .eq('id', id);
    
    if (error) throw new Error(error.message);
    console.log('✅ Password changed for admin:', id);
  }

  async toggleAdminStatus(id: string): Promise<void> {
    const admin = await this.getAdminById(id);
    if (!admin) throw new Error('Admin not found');
    
    const newStatus = admin.status === 'Active' ? 'Inactive' : 'Active';
    const { error } = await supabase
      .from(this.table)
      .update({ status: newStatus })
      .eq('id', id);
    
    if (error) throw new Error(error.message);
    console.log('✅ Status toggled to:', newStatus);
  }

  // ============================================
  // STATISTICS FUNCTIONS
  // ============================================

  async getAdminStats(): Promise<{ total: number; active: number; credentials: number; magiclink: number }> {
    const admins = await this.getAllAdmins();
    return {
      total: admins.length,
      active: admins.filter(a => a.status === 'Active').length,
      credentials: admins.filter(a => a.login_method === 'credentials').length,
      magiclink: admins.filter(a => a.login_method === 'magiclink').length
    };
  }
}

export const AdminService = new AdminServiceClass();