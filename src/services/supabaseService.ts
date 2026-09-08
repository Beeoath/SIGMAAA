import { 
  LearningModule, 
  ModuleProgress, 
  QuizAttempt, 
  QuizQuestion,
  QuizQuestionReview,
  QuizSubmissionResponse,
  DiscussionThread, 
  DiscussionReply,
  UserProfile, 
  AvatarConfig 
} from '../types';
import { MODULES_DATA } from '../data/modulesData';
import { supabase, SUPABASE_CONFIG, testSupabaseConnection } from './supabaseClient';

const STORAGE_KEYS = {
  USER_PROFILE: 'sigma_user_profile',
  ACTIVE_USER_ID: 'sigma_active_user_id',
  MODULE_PROGRESS: 'sigma_module_progress',
  QUIZ_ATTEMPTS: 'sigma_quiz_attempts',
  DISCUSSIONS: 'sigma_discussions_v2',
  BOOKMARKED_QUESTIONS: 'sigma_bookmarked_questions',
  AUTH_SESSION: 'sigma_auth_session',
};

// Default Profiles matching auth.users & profiles records in Supabase Cloud
export const DEFAULT_STUDENT: UserProfile = {
  id: '8a5ce00e-bc03-4b92-8642-dd8faecaf7a1',
  name: 'Fathir Rabbani',
  role: 'student',
  school: 'MAS DARUNNAJAH 9',
  classGrade: 'Kelas XI - MIA 1',
  avatarConfig: {
    glyph: 'Σ',
    frameShape: 'hexagon',
    accentColor: '#10B981',
    focusTag: 'Aljabar & TKA Prep'
  }
};

export const DEFAULT_TEACHER: UserProfile = {
  id: '476536b6-e855-411d-bbb0-384595ea638e',
  name: 'Tim PKM Mahasiswa Matematika UNPAM',
  role: 'teacher',
  school: 'MAS DARUNNAJAH 9 & Univ. Pamulang',
  classGrade: 'Pendamping Akademik TKA',
  avatarConfig: {
    glyph: '∫',
    frameShape: 'circle',
    accentColor: '#10B981',
    focusTag: 'Instruktur TKA'
  }
};

// Initial module progress baseline
const INITIAL_PROGRESS: Record<string, ModuleProgress> = {
  'mod-1': {
    moduleId: 'mod-1',
    isUnlocked: true,
    isCompleted: false,
    lastSlideIndex: 0,
    attemptsCount: 0
  },
  'mod-2': {
    moduleId: 'mod-2',
    isUnlocked: false,
    isCompleted: false,
    lastSlideIndex: 0,
    attemptsCount: 0
  },
  'mod-3': {
    moduleId: 'mod-3',
    isUnlocked: false,
    isCompleted: false,
    lastSlideIndex: 0,
    attemptsCount: 0
  },
  'mod-4': {
    moduleId: 'mod-4',
    isUnlocked: false,
    isCompleted: false,
    lastSlideIndex: 0,
    attemptsCount: 0
  },
  'mod-5': {
    moduleId: 'mod-5',
    isUnlocked: false,
    isCompleted: false,
    lastSlideIndex: 0,
    attemptsCount: 0
  }
};

export const SupabaseService = {
  /**
   * Helper to get active user ID
   */
  getActiveUserId(): string {
    try {
      const storedId = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER_ID);
      if (storedId) return storedId;
      const storedProfile = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (storedProfile) {
        const parsed = JSON.parse(storedProfile);
        if (parsed.id) return parsed.id;
      }
    } catch {
      // ignore
    }
    return DEFAULT_STUDENT.id;
  },

  /**
   * Returns static curriculum modules
   */
  getModules(): LearningModule[] {
    return MODULES_DATA;
  },

  /**
   * Get current Supabase auth session
   */
  async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.warn('Supabase getSession error:', error.message);
        return null;
      }
      return data.session;
    } catch {
      return null;
    }
  },

  /**
   * 1. Get User Profile from Supabase Auth & 'profiles' table
   * Reads role securely from raw_user_meta_data and verified profile record
   */
  async getUserProfile(userId?: string): Promise<UserProfile> {
    // If no userId specified, try to resolve from active Supabase session
    let targetId = userId;
    let authMetadataRole: 'student' | 'teacher' | undefined = undefined;
    let authMetadataName: string | undefined = undefined;

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        if (!targetId) targetId = authUser.id;
        // Securely extract role stored in raw_user_meta_data
        if (authUser.user_metadata?.role) {
          authMetadataRole = authUser.user_metadata.role as 'student' | 'teacher';
        }
        if (authUser.user_metadata?.name) {
          authMetadataName = authUser.user_metadata.name;
        }
      }
    } catch {
      // ignore auth check error
    }

    if (!targetId) {
      targetId = this.getActiveUserId();
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetId)
        .maybeSingle();

      if (!error && data) {
        // Authoritative role: auth metadata or verified database profile role
        const verifiedRole: 'student' | 'teacher' = 
          authMetadataRole || 
          (data.role as 'student' | 'teacher') || 
          (targetId === DEFAULT_TEACHER.id ? 'teacher' : 'student');

        const profile: UserProfile = {
          id: data.id,
          name: authMetadataName || data.name || (targetId === DEFAULT_TEACHER.id ? DEFAULT_TEACHER.name : DEFAULT_STUDENT.name),
          role: verifiedRole,
          school: data.school || 'MAS DARUNNAJAH 9',
          classGrade: data.class_grade || (verifiedRole === 'teacher' ? 'Pendamping Akademik TKA' : 'Kelas XI - MIA 1'),
          nisn: data.nisn || undefined,
          avatarConfig: data.avatar_config || (verifiedRole === 'teacher' ? DEFAULT_TEACHER.avatarConfig : DEFAULT_STUDENT.avatarConfig),
          photoUrl: data.photo_url || undefined
        };
        localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
        localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, profile.id);
        return profile;
      }
    } catch (err) {
      console.warn('Supabase getUserProfile error, using local fallback:', err);
    }

    // Local fallback
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (!targetId || parsed.id === targetId)) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return targetId === DEFAULT_TEACHER.id ? DEFAULT_TEACHER : DEFAULT_STUDENT;
  },

  /**
   * Synchronous cached read of user profile for instant initial renders
   */
  getCachedUserProfile(): UserProfile {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return this.getActiveUserId() === DEFAULT_TEACHER.id ? DEFAULT_TEACHER : DEFAULT_STUDENT;
  },

  /**
   * Update User Profile in Supabase 'profiles' and 'student_avatar_unlocks'
   * CRITICAL SECURITY: Role cannot be updated via this function. 
   * Role is locked to raw_user_meta_data / verified database authorization.
   */
  async setUserProfile(profile: UserProfile): Promise<void> {
    // Preserve authoritative role from existing verified profile/metadata
    const existing = await this.getUserProfile(profile.id);
    const lockedRole = existing.role;

    const sanitizedProfile: UserProfile = {
      ...profile,
      role: lockedRole // Force locked verified role to prevent client elevation
    };

    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(sanitizedProfile));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, sanitizedProfile.id);

    try {
      // 1. Update profiles table (excluding role modification to prevent privilege escalation)
      await supabase
        .from('profiles')
        .update({
          name: sanitizedProfile.name,
          school: sanitizedProfile.school,
          class_grade: sanitizedProfile.classGrade,
          nisn: sanitizedProfile.nisn || null,
          avatar_config: sanitizedProfile.avatarConfig,
          photo_url: sanitizedProfile.photoUrl || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', sanitizedProfile.id);

      // 2. Upsert student_avatar_unlocks if avatar config provided
      if (sanitizedProfile.avatarConfig) {
        await supabase
          .from('student_avatar_unlocks')
          .upsert({
            user_id: sanitizedProfile.id,
            glyph: sanitizedProfile.avatarConfig.glyph,
            frame_shape: sanitizedProfile.avatarConfig.frameShape,
            accent_color: sanitizedProfile.avatarConfig.accentColor,
            focus_tag: sanitizedProfile.avatarConfig.focusTag,
            photo_url: sanitizedProfile.photoUrl || null,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
      }
    } catch (err) {
      console.warn('Supabase setUserProfile error:', err);
    }
  },

  /**
   * Role modification - ONLY executable by verified teachers/instructors.
   * Modifies role in public.profiles table.
   */
  async updateUserRoleByTeacher(targetUserId: string, newRole: 'student' | 'teacher'): Promise<{ success: boolean; message: string }> {
    const caller = await this.getUserProfile();
    if (caller.role !== 'teacher') {
      return { 
        success: false, 
        message: 'Akses ditolak: Hanya pengajar/guru yang berhak mengubah peran siswa.' 
      };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', targetUserId);

      if (error) {
        return { success: false, message: error.message };
      }
      return { success: true, message: `Peran berhasil diperbarui menjadi ${newRole}.` };
    } catch (err: any) {
      return { success: false, message: err.message || 'Gagal mengubah peran.' };
    }
  },

  /**
   * Real Supabase Auth: Sign In with Email and Password
   */
  async signInWithPassword(email: string, password: string): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'User tidak ditemukan.' };
      }

      // Sync active user ID and fetch profile
      localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, data.user.id);
      await this.setAuthenticated(true);

      const profile = await this.getUserProfile(data.user.id);
      return { success: true, profile };
    } catch (err: any) {
      return { success: false, error: err.message || 'Terjadi kesalahan saat masuk.' };
    }
  },

  /**
   * Real Supabase Auth: Sign In with Magic Link (OTP)
   */
  async signInWithOtp(email: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: window.location.origin
        }
      });

      if (error) {
        const lower = error.message.toLowerCase();
        if (lower.includes('rate limit') || lower.includes('email rate')) {
          return {
            success: false,
            error: 'Batas pengiriman email Supabase terlampaui (rate limit). Silakan gunakan opsi masuk dengan Kata Sandi.'
          };
        }
        return { success: false, error: error.message };
      }

      return { 
        success: true, 
        message: 'Tautan masuk ajaib (Magic Link) telah dikirim ke email Anda! Buka tautan tersebut untuk masuk.' 
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Gagal mengirim magic link.' };
    }
  },

  /**
   * Real Supabase Auth: Sign Up with raw_user_meta_data
   * Stores user role securely in raw_user_meta_data
   */
  async signUp(params: {
    email: string;
    password: string;
    name: string;
    role?: 'student' | 'teacher';
    school?: string;
    classGrade?: string;
    nisn?: string;
  }): Promise<{ success: boolean; profile?: UserProfile; requiresConfirmation?: boolean; error?: string }> {
    const assignedRole = params.role || 'student';
    const cleanEmail = params.email.trim().toLowerCase();
    const cleanName = params.name.trim();

    // Strategy 1: Server-Side Registration with Admin API (auto-confirmed, zero Supabase email rate limits!)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          password: params.password,
          name: cleanName,
          role: assignedRole,
          school: params.school || 'MAS DARUNNAJAH 9',
          classGrade: params.classGrade || (assignedRole === 'teacher' ? 'Pendamping Akademik TKA' : 'Kelas XI - MIA 1'),
          nisn: params.nisn || undefined,
        })
      });

      const resData = await response.json().catch(() => null);

      if (response.ok && resData?.success) {
        // Since the account is pre-confirmed on the server, sign in immediately!
        const signInRes = await this.signInWithPassword(cleanEmail, params.password);
        if (signInRes.success && signInRes.profile) {
          return { success: true, profile: signInRes.profile, requiresConfirmation: false };
        }
        return { success: true, requiresConfirmation: false };
      } else if (resData?.error) {
        return { success: false, error: resData.error };
      }
    } catch (apiErr) {
      console.warn('Server registration endpoint unreachable, trying client SDK fallback:', apiErr);
    }

    // Strategy 2: Fallback to client Supabase Auth SDK
    try {
      // Sign up with Supabase Auth - Role stored in raw_user_meta_data
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: params.password,
        options: {
          data: {
            role: assignedRole, // Stored in raw_user_meta_data!
            name: cleanName,
            school: params.school || 'MAS DARUNNAJAH 9',
            class_grade: params.classGrade || (assignedRole === 'teacher' ? 'Pendamping Akademik TKA' : 'Kelas XI - MIA 1'),
            nisn: params.nisn || null
          }
        }
      });

      if (error) {
        const lower = error.message.toLowerCase();
        if (lower.includes('rate limit') || lower.includes('email rate')) {
          return { 
            success: false, 
            error: 'Batas frekuensi email Supabase terlampaui (email rate limit exceeded). Silakan gunakan form masuk jika akun sudah pernah dibuat, atau coba kembali beberapa saat lagi.' 
          };
        }
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'Pendaftaran gagal diproses oleh server autentikasi.' };
      }

      // 2. Initialize public.profiles row
      const avatarConfig = assignedRole === 'teacher' ? DEFAULT_TEACHER.avatarConfig : DEFAULT_STUDENT.avatarConfig;
      await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          name: cleanName,
          role: assignedRole,
          school: params.school || 'MAS DARUNNAJAH 9',
          class_grade: params.classGrade || (assignedRole === 'teacher' ? 'Pendamping Akademik TKA' : 'Kelas XI - MIA 1'),
          nisn: params.nisn || null,
          avatar_config: avatarConfig,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      // 3. Initialize module_progress for all curriculum modules
      const initialProgressRows = MODULES_DATA.map((m, idx) => ({
        user_id: data.user!.id,
        module_id: m.id,
        is_unlocked: idx === 0, // First module unlocked
        is_completed: false,
        last_slide_index: 0,
        attempts_count: 0,
        updated_at: new Date().toISOString()
      }));

      await supabase
        .from('module_progress')
        .upsert(initialProgressRows, { onConflict: 'user_id,module_id' });

      // Check if email confirmation is required
      const hasActiveSession = !!data.session;
      if (hasActiveSession) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, data.user.id);
        await this.setAuthenticated(true);
        const profile = await this.getUserProfile(data.user.id);
        return { success: true, profile, requiresConfirmation: false };
      } else {
        return { 
          success: true, 
          requiresConfirmation: true 
        };
      }
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('rate limit')) {
        return {
          success: false,
          error: 'Batas frekuensi email Supabase terlampaui (email rate limit exceeded). Silakan coba lagi beberapa saat.'
        };
      }
      return { success: false, error: msg || 'Gagal mendaftar akun.' };
    }
  },

  isAuthenticated(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEYS.AUTH_SESSION) === 'true';
    } catch {
      return false;
    }
  },

  async setAuthenticated(status: boolean): Promise<void> {
    try {
      if (status) {
        localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, 'true');
      } else {
        localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
      }
    } catch {
      // ignore
    }
  },

  async loginAs(profile: UserProfile): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, profile.id);
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    await this.setAuthenticated(true);
  },

  /**
   * Dedicated Developer Authentication with immutable collision-proof ID
   */
  async loginAsDeveloper(params: {
    devKey: string;
    role?: 'student' | 'teacher';
    customName?: string;
    unlockAll?: boolean;
  }): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
    try {
      const res = await fetch('/api/auth/dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.success && data?.profile) {
        await this.loginAs(data.profile);

        if (params.unlockAll) {
          const allUnlocked: Record<string, ModuleProgress> = {};
          const moduleIds = ['mod-1', 'mod-2', 'mod-3', 'mod-4', 'mod-5', 'mod-6', 'mod-7'];
          moduleIds.forEach(mId => {
            allUnlocked[mId] = {
              moduleId: mId,
              isUnlocked: true,
              isCompleted: true,
              lastSlideIndex: 0,
              attemptsCount: 1,
              bestScore: 100
            };
          });
          localStorage.setItem(STORAGE_KEYS.MODULE_PROGRESS, JSON.stringify(allUnlocked));
        }

        return { success: true, profile: data.profile };
      } else {
        return { success: false, error: data?.error || 'Gagal login pengembang.' };
      }
    } catch (err: any) {
      // Offline fallback: verify cryptographic SHA-256 hash using Web Crypto API
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(params.devKey.trim());
        const hashBuf = await window.crypto.subtle.digest('SHA-256', data);
        const hashHex = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');

        const ALLOWED_ENCRYPTED_HASHES = [
          '25350ce3c314e3b610b9b5ff6fa86d996dadd298e5a5e39f6d6cf26f6d9b4d44',
          '04d1694f4c9c735d46f56475b75ad07f66a2f8bdf9b3e15b6d51bbd3381a4b5b'
        ];

        if (ALLOWED_ENCRYPTED_HASHES.includes(hashHex)) {
          const fallbackDevProfile: UserProfile = {
            id: 'dev-root-sigma-001',
            name: params.customName || 'Developer Core (SIGMA)',
            role: params.role || 'teacher',
            school: 'MAS DARUNNAJAH 9 (DEV SUITE)',
            classGrade: (params.role === 'student') ? 'Siswa Mode Dev' : 'System Architect & Guru Pembimbing',
            nisn: 'DEV-ROOT-001',
            isDev: true,
            avatarConfig: {
              glyph: 'Σ',
              frameShape: 'hexagon',
              accentColor: '#1ED760',
              focusTag: 'Developer & System Architect'
            }
          };
          await this.loginAs(fallbackDevProfile);
          return { success: true, profile: fallbackDevProfile };
        }
      } catch {
        // ignore crypto error
      }
      return { success: false, error: err.message || 'Gagal terhubung ke server autentikasi developer.' };
    }
  },

  async logout(): Promise<void> {
    await this.setAuthenticated(false);
    try {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER_ID);
      localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
  },

  /**
   * 2. Get Module Progress from Supabase 'module_progress' table
   */
  async getModuleProgress(userId?: string): Promise<Record<string, ModuleProgress>> {
    const uid = userId || this.getActiveUserId();
    try {
      const { data, error } = await supabase
        .from('module_progress')
        .select('*')
        .eq('user_id', uid);

      if (!error && data && data.length > 0) {
        const result: Record<string, ModuleProgress> = { ...INITIAL_PROGRESS };
        data.forEach((row: any) => {
          result[row.module_id] = {
            moduleId: row.module_id,
            isUnlocked: row.is_unlocked,
            isCompleted: row.is_completed,
            bestScore: row.best_score ?? undefined,
            lastSlideIndex: row.last_slide_index ?? 0,
            attemptsCount: row.attempts_count ?? 0
          };
        });
        localStorage.setItem(STORAGE_KEYS.MODULE_PROGRESS, JSON.stringify(result));
        return result;
      }
    } catch (err) {
      console.warn('Supabase getModuleProgress error, using local fallback:', err);
    }

    // Local storage fallback
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.MODULE_PROGRESS);
      if (stored) {
        return { ...INITIAL_PROGRESS, ...JSON.parse(stored) };
      }
    } catch {
      // fallback
    }
    return INITIAL_PROGRESS;
  },

  /**
   * Synchronous cached module progress
   */
  getCachedModuleProgress(): Record<string, ModuleProgress> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.MODULE_PROGRESS);
      if (stored) return { ...INITIAL_PROGRESS, ...JSON.parse(stored) };
    } catch {
      // fallback
    }
    return INITIAL_PROGRESS;
  },

  /**
   * Save Module Progress to Supabase 'module_progress'
   */
  async saveModuleProgress(progress: Record<string, ModuleProgress>, userId?: string): Promise<void> {
    const uid = userId || this.getActiveUserId();
    localStorage.setItem(STORAGE_KEYS.MODULE_PROGRESS, JSON.stringify(progress));

    try {
      for (const [moduleId, p] of Object.entries(progress)) {
        await supabase
          .from('module_progress')
          .update({
            is_unlocked: p.isUnlocked,
            is_completed: p.isCompleted,
            best_score: p.bestScore ?? null,
            last_slide_index: p.lastSlideIndex,
            attempts_count: p.attemptsCount,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', uid)
          .eq('module_id', moduleId);
      }
    } catch (err) {
      console.warn('Supabase saveModuleProgress error:', err);
    }
  },

  /**
   * Unlock next module when previous test is passed (score >= 75%)
   */
  async unlockNextModule(completedModuleId: string, score: number, userId?: string): Promise<Record<string, ModuleProgress>> {
    const uid = userId || this.getActiveUserId();
    const current = await this.getModuleProgress(uid);
    const moduleList = MODULES_DATA;
    const currentIndex = moduleList.findIndex(m => m.id === completedModuleId);

    const updated = { ...current };
    if (updated[completedModuleId]) {
      updated[completedModuleId] = {
        ...updated[completedModuleId],
        isCompleted: score >= 75,
        bestScore: Math.max(updated[completedModuleId].bestScore || 0, score),
        attemptsCount: (updated[completedModuleId].attemptsCount || 0) + 1
      };
    }

    // If passed (score >= 75%), unlock next module in sequence
    let nextModuleId: string | null = null;
    if (score >= 75 && currentIndex >= 0 && currentIndex < moduleList.length - 1) {
      const nextModule = moduleList[currentIndex + 1];
      nextModuleId = nextModule.id;
      if (updated[nextModule.id]) {
        updated[nextModule.id] = {
          ...updated[nextModule.id],
          isUnlocked: true
        };
      }
    }

    // Persist to local & Supabase
    localStorage.setItem(STORAGE_KEYS.MODULE_PROGRESS, JSON.stringify(updated));

    try {
      // Update completed module
      await supabase
        .from('module_progress')
        .update({
          is_completed: score >= 75,
          best_score: updated[completedModuleId]?.bestScore ?? score,
          attempts_count: updated[completedModuleId]?.attemptsCount ?? 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', uid)
        .eq('module_id', completedModuleId);

      // Update next module if unlocked
      if (nextModuleId) {
        await supabase
          .from('module_progress')
          .update({
            is_unlocked: true,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', uid)
          .eq('module_id', nextModuleId);
      }
    } catch (err) {
      console.warn('Supabase unlockNextModule update error:', err);
    }

    return updated;
  },

  /**
   * 3. Get Quiz Attempts from Supabase 'quiz_attempts' table
   */
  async getQuizAttempts(userId?: string): Promise<QuizAttempt[]> {
    const uid = userId || this.getActiveUserId();
    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .order('completed_at', { ascending: false });

      if (!error && data) {
        // Filter by user if not teacher
        const userAttempts = uid === DEFAULT_TEACHER.id ? data : data.filter((row: any) => row.user_id === uid);
        const list: QuizAttempt[] = userAttempts.map((row: any) => ({
          id: row.id,
          userId: row.user_id,
          moduleId: row.module_id,
          score: row.score,
          correctCount: row.correct_count,
          passed: row.passed,
          timeSpentSeconds: row.time_spent_seconds,
          answers: row.answers || {},
          reviewedQuestionIds: row.reviewed_question_ids || [],
          startedAt: row.started_at,
          completedAt: row.completed_at
        }));
        localStorage.setItem(STORAGE_KEYS.QUIZ_ATTEMPTS, JSON.stringify(list));
        return list;
      }
    } catch (err) {
      console.warn('Supabase getQuizAttempts error, using local fallback:', err);
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.QUIZ_ATTEMPTS);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return [];
  },

  /**
   * Synchronous cached quiz attempts
   */
  getCachedQuizAttempts(): QuizAttempt[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.QUIZ_ATTEMPTS);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return [];
  },

  /**
   * 3a. Get Quiz Questions for Student
   * STRICT SECURITY MANDATE: Excludes correctOption and explanation.
   * Only questionText, options, and mathExpression (plus id, orderIndex, difficulty, tkaConcept) are returned.
   */
  async getStudentQuizQuestions(moduleId: string): Promise<QuizQuestion[]> {
    // 1. Try Supabase RPC get_student_quiz_questions
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_student_quiz_questions', {
        p_module_id: moduleId
      });

      if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
        return rpcData.map((row: any) => ({
          id: row.id,
          moduleId: row.module_id,
          orderIndex: row.order_index,
          questionText: row.question_text,
          mathExpression: row.math_expression || undefined,
          options: typeof row.options === 'string' ? JSON.parse(row.options) : row.options,
          difficulty: row.difficulty,
          tkaConcept: row.tka_concept,
        }));
      }

      // 2. Try Supabase table SELECT with explicit columns (excluding correct_option and explanation)
      const { data: tblData, error: tblError } = await supabase
        .from('quiz_questions')
        .select('id, module_id, order_index, question_text, math_expression, options, difficulty, tka_concept')
        .eq('module_id', moduleId)
        .order('order_index', { ascending: true });

      if (!tblError && Array.isArray(tblData) && tblData.length > 0) {
        return tblData.map((row: any) => ({
          id: row.id,
          moduleId: row.module_id,
          orderIndex: row.order_index,
          questionText: row.question_text,
          mathExpression: row.math_expression || undefined,
          options: typeof row.options === 'string' ? JSON.parse(row.options) : row.options,
          difficulty: row.difficulty,
          tkaConcept: row.tka_concept,
        }));
      }
    } catch (err) {
      console.warn('Supabase questions query error, falling back to server API:', err);
    }

    // 3. Fallback: Query backend server API /api/quiz/questions/:moduleId
    // Runs in Node.js server where correctOption and explanation are kept secret
    try {
      const res = await fetch(`/api/quiz/questions/${moduleId}`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.questions) && json.questions.length > 0) {
          return json.questions;
        }
      }
    } catch (apiErr) {
      console.warn('API /api/quiz/questions fallback error:', apiErr);
    }

    return [];
  },

  /**
   * 3b. Submit Quiz Attempt via Supabase RPC or Server API
   * Calculates score on the server using correctOption stored in DB,
   * stores attempt in quiz_attempts, updates module_progress,
   * and returns score + correctCount + passed + reviews (which now reveals explanations).
   */
  async submitQuizAttempt(params: {
    moduleId: string;
    userId: string;
    answers: Record<string, 'A' | 'B' | 'C' | 'D' | 'E'>;
    timeSpentSeconds: number;
    reviewedQuestionIds?: string[];
  }): Promise<QuizSubmissionResponse> {
    const uid = params.userId || this.getActiveUserId();

    // 1. Try Supabase RPC 'submit_quiz_attempt'
    try {
      const { data, error } = await supabase.rpc('submit_quiz_attempt', {
        p_module_id: params.moduleId,
        p_user_id: uid,
        p_answers: params.answers,
        p_time_spent_seconds: params.timeSpentSeconds,
        p_reviewed_question_ids: params.reviewedQuestionIds || []
      });

      if (!error && data) {
        const result: QuizSubmissionResponse = {
          attemptId: data.attemptId,
          score: data.score,
          correctCount: data.correctCount,
          totalQuestions: data.totalQuestions,
          passed: data.passed,
          timeSpentSeconds: data.timeSpentSeconds,
          reviews: data.reviews || [],
        };

        // Cache attempt locally
        const attempt: QuizAttempt = {
          id: result.attemptId,
          userId: uid,
          moduleId: params.moduleId,
          startedAt: new Date(Date.now() - (params.timeSpentSeconds * 1000)).toISOString(),
          completedAt: new Date().toISOString(),
          score: result.score,
          correctCount: result.correctCount,
          passed: result.passed,
          timeSpentSeconds: params.timeSpentSeconds,
          answers: params.answers,
          reviewedQuestionIds: params.reviewedQuestionIds || [],
        };
        const list = this.getCachedQuizAttempts();
        list.unshift(attempt);
        localStorage.setItem(STORAGE_KEYS.QUIZ_ATTEMPTS, JSON.stringify(list));
        await this.unlockNextModule(params.moduleId, result.score, uid);

        return result;
      }
    } catch (rpcErr) {
      console.warn('Supabase submit_quiz_attempt RPC error, using server API fallback:', rpcErr);
    }

    // 2. Fallback to Server API /api/quiz/submit-attempt
    try {
      const res = await fetch('/api/quiz/submit-attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId: params.moduleId,
          userId: uid,
          answers: params.answers,
          timeSpentSeconds: params.timeSpentSeconds,
          reviewedQuestionIds: params.reviewedQuestionIds || []
        })
      });

      if (res.ok) {
        const result: QuizSubmissionResponse = await res.json();
        const attempt: QuizAttempt = {
          id: result.attemptId,
          userId: uid,
          moduleId: params.moduleId,
          startedAt: new Date(Date.now() - (params.timeSpentSeconds * 1000)).toISOString(),
          completedAt: new Date().toISOString(),
          score: result.score,
          correctCount: result.correctCount,
          passed: result.passed,
          timeSpentSeconds: params.timeSpentSeconds,
          answers: params.answers,
          reviewedQuestionIds: params.reviewedQuestionIds || [],
        };
        const list = this.getCachedQuizAttempts();
        list.unshift(attempt);
        localStorage.setItem(STORAGE_KEYS.QUIZ_ATTEMPTS, JSON.stringify(list));
        await this.unlockNextModule(params.moduleId, result.score, uid);

        return result;
      }
    } catch (apiErr) {
      console.warn('Failed to call /api/quiz/submit-attempt:', apiErr);
    }

    return {
      attemptId: `attempt-${Date.now()}`,
      score: 0,
      correctCount: 0,
      totalQuestions: 15,
      passed: false,
      timeSpentSeconds: params.timeSpentSeconds,
      reviews: [],
    };
  },

  /**
   * 3c. Get Quiz Questions for Teacher (includes explanation & correctOption)
   */
  async getTeacherQuizQuestions(moduleId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('module_id', moduleId)
        .order('order_index', { ascending: true });

      if (!error && data && data.length > 0) {
        return data;
      }
    } catch {
      // ignore
    }

    try {
      const res = await fetch(`/api/teacher/quiz-questions/${moduleId}`);
      if (res.ok) {
        const json = await res.json();
        return json.questions || [];
      }
    } catch {
      // ignore
    }

    return [];
  },

  /**
   * Save / Record Quiz Attempt into Supabase 'quiz_attempts'
   */
  async recordQuizAttempt(attempt: QuizAttempt): Promise<void> {
    const uid = attempt.userId || this.getActiveUserId();

    // 1. Update local cache immediately
    const list = this.getCachedQuizAttempts();
    list.unshift(attempt);
    localStorage.setItem(STORAGE_KEYS.QUIZ_ATTEMPTS, JSON.stringify(list));

    // 2. Unlock progress
    await this.unlockNextModule(attempt.moduleId, attempt.score, uid);

    // 3. Insert into Supabase table
    try {
      await supabase.from('quiz_attempts').insert({
        user_id: uid,
        module_id: attempt.moduleId,
        score: attempt.score,
        correct_count: attempt.correctCount,
        passed: attempt.passed,
        time_spent_seconds: attempt.timeSpentSeconds,
        answers: attempt.answers,
        reviewed_question_ids: attempt.reviewedQuestionIds || [],
        started_at: attempt.startedAt || new Date(Date.now() - (attempt.timeSpentSeconds * 1000)).toISOString(),
        completed_at: attempt.completedAt || new Date().toISOString()
      });
    } catch (err) {
      console.warn('Failed to insert quiz attempt into Supabase:', err);
    }
  },

  /**
   * 4. Get Discussions from Supabase 'discussion_threads', 'discussion_replies', 'discussion_upvotes'
   */
  async getDiscussions(moduleId?: string): Promise<DiscussionThread[]> {
    try {
      // Fetch threads
      let threadQuery = supabase
        .from('discussion_threads')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (moduleId && moduleId !== 'all') {
        threadQuery = threadQuery.eq('module_id', moduleId);
      }

      const [threadsRes, repliesRes, upvotesRes, profilesRes] = await Promise.all([
        threadQuery,
        supabase.from('discussion_replies').select('*').order('created_at', { ascending: true }),
        supabase.from('discussion_upvotes').select('*'),
        supabase.from('profiles').select('*')
      ]);

      if (!threadsRes.error && threadsRes.data) {
        const threadRows = threadsRes.data;
        const replyRows = repliesRes.data || [];
        const upvoteRows = upvotesRes.data || [];
        const profileMap = new Map((profilesRes.data || []).map((p: any) => [p.id, p]));

        const assembledThreads: DiscussionThread[] = threadRows.map((t: any) => {
          const authorProfile = profileMap.get(t.author_id);
          const threadUpvotes = upvoteRows
            .filter((u: any) => u.thread_id === t.id && !u.reply_id)
            .map((u: any) => u.user_id);

          const threadReplies: DiscussionReply[] = replyRows
            .filter((r: any) => r.thread_id === t.id)
            .map((r: any) => {
              const replyAuthor = profileMap.get(r.author_id);
              const replyUpvotes = upvoteRows
                .filter((u: any) => u.reply_id === r.id)
                .map((u: any) => u.user_id);

              return {
                id: r.id,
                threadId: r.thread_id,
                authorId: r.author_id,
                authorName: replyAuthor?.name || 'Anggota Diskusi',
                authorRole: replyAuthor?.role || 'student',
                authorAvatar: replyAuthor?.avatar_config || DEFAULT_STUDENT.avatarConfig,
                content: r.content,
                createdAt: r.created_at,
                upvotes: replyUpvotes
              };
            });

          return {
            id: t.id,
            moduleId: t.module_id,
            authorId: t.author_id,
            authorName: authorProfile?.name || 'Siswa MAS DARUNNAJAH 9',
            authorRole: authorProfile?.role || 'student',
            authorAvatar: authorProfile?.avatar_config || DEFAULT_STUDENT.avatarConfig,
            title: t.title,
            content: t.content,
            createdAt: t.created_at,
            upvotes: threadUpvotes,
            isPinnedByTeacher: !!t.is_pinned,
            replies: threadReplies
          };
        });

        localStorage.setItem(STORAGE_KEYS.DISCUSSIONS, JSON.stringify(assembledThreads));
        return assembledThreads;
      }
    } catch (err) {
      console.warn('Supabase getDiscussions error, using local fallback:', err);
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DISCUSSIONS);
      if (stored) {
        const list: DiscussionThread[] = JSON.parse(stored);
        if (moduleId && moduleId !== 'all') {
          return list.filter(d => d.moduleId === moduleId);
        }
        return list;
      }
    } catch {
      // fallback
    }
    return [];
  },

  /**
   * Cached discussions for immediate synchronous access
   */
  getCachedDiscussions(moduleId?: string): DiscussionThread[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DISCUSSIONS);
      if (stored) {
        const list: DiscussionThread[] = JSON.parse(stored);
        if (moduleId && moduleId !== 'all') {
          return list.filter(d => d.moduleId === moduleId);
        }
        return list;
      }
    } catch {
      // fallback
    }
    return [];
  },

  /**
   * Create discussion thread in Supabase 'discussion_threads'
   */
  async createDiscussionThread(
    thread: Omit<DiscussionThread, 'id' | 'createdAt' | 'upvotes' | 'replies' | 'isPinnedByTeacher'>
  ): Promise<DiscussionThread> {
    const uid = thread.authorId || this.getActiveUserId();

    try {
      const { data, error } = await supabase
        .from('discussion_threads')
        .insert({
          module_id: thread.moduleId,
          author_id: uid,
          title: thread.title,
          content: thread.content,
          is_pinned: false
        })
        .select()
        .single();

      if (!error && data) {
        const created: DiscussionThread = {
          id: data.id,
          moduleId: data.module_id,
          authorId: data.author_id,
          authorName: thread.authorName,
          authorRole: thread.authorRole,
          authorAvatar: thread.authorAvatar,
          title: data.title,
          content: data.content,
          createdAt: data.created_at,
          upvotes: [],
          isPinnedByTeacher: false,
          replies: []
        };
        // Update cache
        const cached = this.getCachedDiscussions();
        cached.unshift(created);
        localStorage.setItem(STORAGE_KEYS.DISCUSSIONS, JSON.stringify(cached));
        return created;
      }
    } catch (err) {
      console.warn('Supabase createDiscussionThread error:', err);
    }

    // Local fallback
    const fallback: DiscussionThread = {
      ...thread,
      id: `th-${Date.now()}`,
      createdAt: new Date().toISOString(),
      upvotes: [],
      isPinnedByTeacher: false,
      replies: []
    };
    const cached = this.getCachedDiscussions();
    cached.unshift(fallback);
    localStorage.setItem(STORAGE_KEYS.DISCUSSIONS, JSON.stringify(cached));
    return fallback;
  },

  /**
   * Add reply to discussion in Supabase 'discussion_replies'
   */
  async addReply(
    threadId: string, 
    reply: Omit<DiscussionReply, 'id' | 'createdAt' | 'upvotes'>
  ): Promise<DiscussionReply> {
    const uid = reply.authorId || this.getActiveUserId();

    try {
      const { data, error } = await supabase
        .from('discussion_replies')
        .insert({
          thread_id: threadId,
          author_id: uid,
          content: reply.content
        })
        .select()
        .single();

      if (!error && data) {
        const newReply: DiscussionReply = {
          id: data.id,
          threadId: data.thread_id,
          authorId: data.author_id,
          authorName: reply.authorName,
          authorRole: reply.authorRole,
          authorAvatar: reply.authorAvatar,
          content: data.content,
          createdAt: data.created_at,
          upvotes: []
        };
        return newReply;
      }
    } catch (err) {
      console.warn('Supabase addReply error:', err);
    }

    const fallback: DiscussionReply = {
      ...reply,
      id: `rep-${Date.now()}`,
      createdAt: new Date().toISOString(),
      upvotes: []
    };
    return fallback;
  },

  // Alias as specified in user prompt
  async addDiscussionReply(
    threadId: string, 
    reply: Omit<DiscussionReply, 'id' | 'createdAt' | 'upvotes'>
  ): Promise<DiscussionReply> {
    return this.addReply(threadId, reply);
  },

  /**
   * 5. Toggle upvote in Supabase 'discussion_upvotes'
   */
  async toggleUpvote(threadId: string, replyId?: string): Promise<void> {
    const uid = this.getActiveUserId();

    try {
      let query = supabase
        .from('discussion_upvotes')
        .select('id')
        .eq('user_id', uid);

      if (replyId) {
        query = query.eq('reply_id', replyId);
      } else {
        query = query.eq('thread_id', threadId).is('reply_id', null);
      }

      const { data } = await query;

      if (data && data.length > 0) {
        // Delete upvote
        await supabase.from('discussion_upvotes').delete().eq('id', data[0].id);
      } else {
        // Add upvote
        await supabase.from('discussion_upvotes').insert({
          user_id: uid,
          thread_id: threadId,
          reply_id: replyId || null
        });
      }
    } catch (err) {
      console.warn('Supabase toggleUpvote error:', err);
    }
  },

  /**
   * Pin or unpin thread by teacher in Supabase 'discussion_threads'
   */
  async togglePinThread(threadId: string): Promise<void> {
    try {
      const { data } = await supabase
        .from('discussion_threads')
        .select('is_pinned')
        .eq('id', threadId)
        .single();

      if (data) {
        await supabase
          .from('discussion_threads')
          .update({ is_pinned: !data.is_pinned })
          .eq('id', threadId);
      }
    } catch (err) {
      console.warn('Supabase togglePinThread error:', err);
    }
  },

  /**
   * 6. Get Bookmarked Questions from Supabase 'question_bookmarks' table
   */
  async getBookmarks(userId?: string): Promise<string[]> {
    const uid = userId || this.getActiveUserId();
    try {
      const { data, error } = await supabase
        .from('question_bookmarks')
        .select('question_id')
        .eq('user_id', uid);

      if (!error && data) {
        const ids = data.map((row: any) => row.question_id);
        localStorage.setItem(STORAGE_KEYS.BOOKMARKED_QUESTIONS, JSON.stringify(ids));
        return ids;
      }
    } catch (err) {
      console.warn('Supabase getBookmarks error, using local fallback:', err);
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.BOOKMARKED_QUESTIONS);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return [];
  },

  /**
   * Cached bookmarks for synchronous initial state
   */
  getCachedBookmarks(): string[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.BOOKMARKED_QUESTIONS);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return [];
  },

  /**
   * Toggle Bookmark in Supabase 'question_bookmarks'
   */
  async toggleBookmark(questionId: string, userId?: string): Promise<boolean> {
    const uid = userId || this.getActiveUserId();
    let isNowBookmarked = false;

    try {
      const { data } = await supabase
        .from('question_bookmarks')
        .select('question_id')
        .eq('user_id', uid)
        .eq('question_id', questionId);

      if (data && data.length > 0) {
        // Delete bookmark
        await supabase
          .from('question_bookmarks')
          .delete()
          .eq('user_id', uid)
          .eq('question_id', questionId);
        isNowBookmarked = false;
      } else {
        // Add bookmark
        await supabase
          .from('question_bookmarks')
          .insert({
            user_id: uid,
            question_id: questionId
          });
        isNowBookmarked = true;
      }
    } catch (err) {
      console.warn('Supabase toggleBookmark error:', err);
    }

    // Sync local cache
    const current = this.getCachedBookmarks();
    const idx = current.indexOf(questionId);
    if (isNowBookmarked && idx < 0) {
      current.push(questionId);
    } else if (!isNowBookmarked && idx >= 0) {
      current.splice(idx, 1);
    }
    localStorage.setItem(STORAGE_KEYS.BOOKMARKED_QUESTIONS, JSON.stringify(current));

    return isNowBookmarked;
  },

  /**
   * Check if question is bookmarked
   */
  async isBookmarked(questionId: string, userId?: string): Promise<boolean> {
    const bookmarks = await this.getBookmarks(userId);
    return bookmarks.includes(questionId);
  },

  /**
   * Supabase Architecture DDL & RLS script for database documentation/export
   */
  getSupabaseSchemaSQL(): string {
    return `-- ==========================================================
-- SIGMA: Sistem Interaktif Gerbang Modul Matematika Atraktif
-- Platform Persiapan TKA Kelas XI MAS DARUNNAJAH 9
-- PKM Pendidikan Matematika Universitas Pamulang (UNPAM)
-- ==========================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Modules Table
create table if not exists public.modules (
    id text primary key,
    order_index integer not null,
    title text not null,
    domain text not null,
    short_description text not null,
    estimated_duration text default '45 Menit',
    track_count integer default 5,
    question_count integer default 15,
    accent_color text default '#10B981',
    geometric_art_type text not null,
    is_published boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Module Slides Table
create table if not exists public.module_slides (
    id text primary key,
    module_id text references public.modules(id) on delete cascade,
    order_index integer not null,
    title text not null,
    subtitle text,
    category text not null,
    content_markdown text not null,
    math_formulas jsonb default '[]'::jsonb,
    key_takeaway text not null
);

-- 3. Quiz Questions Table (15 questions per module, pass threshold >= 75%)
create table if not exists public.quiz_questions (
    id text primary key,
    module_id text references public.modules(id) on delete cascade,
    order_index integer not null,
    question_text text not null,
    math_expression text,
    options jsonb not null,
    explanation text not null,
    tka_concept text not null,
    difficulty text not null
);

-- 4. User Profiles Table
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    name text not null,
    role text not null check (role in ('student', 'teacher')),
    school text default 'MAS DARUNNAJAH 9',
    class_grade text default 'Kelas XI - MIA 1',
    nisn text,
    avatar_config jsonb,
    photo_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Module Progress Table
create table if not exists public.module_progress (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade,
    module_id text references public.modules(id) on delete cascade,
    is_unlocked boolean not null default false,
    is_completed boolean not null default false,
    best_score integer,
    last_slide_index integer default 0,
    attempts_count integer default 0,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, module_id)
);

-- 6. Quiz Attempts Table
create table if not exists public.quiz_attempts (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade,
    module_id text references public.modules(id) on delete cascade,
    score integer not null check (score between 0 and 100),
    correct_count integer not null check (correct_count between 0 and 15),
    passed boolean not null default false,
    time_spent_seconds integer not null default 0,
    answers jsonb not null,
    reviewed_question_ids jsonb default '[]'::jsonb,
    started_at timestamp with time zone default timezone('utc'::text, now()) not null,
    completed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Discussion Threads & Replies
create table if not exists public.discussion_threads (
    id uuid primary key default uuid_generate_v4(),
    module_id text references public.modules(id) on delete cascade,
    author_id uuid references auth.users(id) on delete cascade,
    title text not null,
    content text not null,
    is_pinned boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.discussion_replies (
    id uuid primary key default uuid_generate_v4(),
    thread_id uuid references public.discussion_threads(id) on delete cascade,
    author_id uuid references auth.users(id) on delete cascade,
    content text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.discussion_upvotes (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade,
    thread_id uuid references public.discussion_threads(id) on delete cascade,
    reply_id uuid references public.discussion_replies(id) on delete cascade,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Question Bookmarks Table
create table if not exists public.question_bookmarks (
    user_id uuid references auth.users(id) on delete cascade,
    question_id text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (user_id, question_id)
);

-- 9. Student Avatar Customizations
create table if not exists public.student_avatar_unlocks (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade unique,
    glyph text not null default 'Σ',
    frame_shape text not null default 'hexagon',
    accent_color text not null default '#10B981',
    focus_tag text not null default 'Aljabar TKA',
    photo_url text,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. RPC: get_student_quiz_questions (Excludes correct_option & explanation)
create or replace function public.get_student_quiz_questions(p_module_id text)
returns table (
    id text,
    module_id text,
    order_index integer,
    question_text text,
    math_expression text,
    options jsonb,
    difficulty text,
    tka_concept text
)
language sql
security definer
set search_path = public
as $$
    select 
        q.id,
        q.module_id,
        q.order_index,
        q.question_text,
        q.math_expression,
        q.options,
        q.difficulty,
        q.tka_concept
    from public.quiz_questions q
    where q.module_id = p_module_id
    order by q.order_index asc;
$$;

grant execute on function public.get_student_quiz_questions(text) to anon, authenticated, service_role;

-- 11. RPC: submit_quiz_attempt (Calculates score on server using DB correct_option)
create or replace function public.submit_quiz_attempt(
    p_module_id text,
    p_user_id uuid,
    p_answers jsonb,
    p_time_spent_seconds integer default 0,
    p_reviewed_question_ids jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_total_questions integer := 0;
    v_correct_count integer := 0;
    v_score integer := 0;
    v_passed boolean := false;
    v_attempt_id uuid := gen_random_uuid();
    v_q record;
    v_user_answer text;
    v_review_list jsonb := '[]'::jsonb;
    v_item jsonb;
begin
    for v_q in 
        select id, order_index, question_text, math_expression, options, correct_option, explanation, tka_concept, difficulty
        from public.quiz_questions
        where module_id = p_module_id
        order by order_index asc
    loop
        v_total_questions := v_total_questions + 1;
        v_user_answer := p_answers->>v_q.id;
        
        if v_user_answer is not null and upper(trim(v_user_answer)) = upper(trim(v_q.correct_option)) then
            v_correct_count := v_correct_count + 1;
        end if;

        v_item := jsonb_build_object(
            'questionId', v_q.id,
            'orderIndex', v_q.order_index,
            'chosenOption', v_user_answer,
            'correctOption', v_q.correct_option,
            'isCorrect', (v_user_answer is not null and upper(trim(v_user_answer)) = upper(trim(v_q.correct_option))),
            'explanation', v_q.explanation,
            'tkaConcept', v_q.tka_concept,
            'difficulty', v_q.difficulty
        );
        v_review_list := v_review_list || jsonb_build_array(v_item);
    end loop;

    if v_total_questions > 0 then
        v_score := round((v_correct_count::numeric / v_total_questions::numeric) * 100);
    else
        v_score := 0;
    end if;

    v_passed := (v_score >= 75);

    insert into public.quiz_attempts (
        id, user_id, module_id, score, correct_count, passed,
        time_spent_seconds, answers, reviewed_question_ids, started_at, completed_at
    ) values (
        v_attempt_id, p_user_id, p_module_id, v_score, v_correct_count, v_passed,
        p_time_spent_seconds, p_answers, p_reviewed_question_ids,
        timezone('utc'::text, now()) - (p_time_spent_seconds || ' seconds')::interval,
        timezone('utc'::text, now())
    );

    insert into public.module_progress (
        user_id, module_id, is_unlocked, is_completed, best_score, attempts_count, updated_at
    ) values (
        p_user_id, p_module_id, true, v_passed, v_score, 1, timezone('utc'::text, now())
    )
    on conflict (user_id, module_id)
    do update set
        is_completed = (module_progress.is_completed or v_passed),
        best_score = greatest(coalesce(module_progress.best_score, 0), v_score),
        attempts_count = module_progress.attempts_count + 1,
        updated_at = timezone('utc'::text, now());

    return jsonb_build_object(
        'attemptId', v_attempt_id,
        'score', v_score,
        'correctCount', v_correct_count,
        'totalQuestions', v_total_questions,
        'passed', v_passed,
        'timeSpentSeconds', p_time_spent_seconds,
        'reviews', v_review_list
    );
end;
$$;

grant execute on function public.submit_quiz_attempt(text, uuid, jsonb, integer, jsonb) to anon, authenticated, service_role;
`;
  },

  getSupabaseConfig() {
    return SUPABASE_CONFIG;
  },

  getClient() {
    return supabase;
  },

  testConnection() {
    return testSupabaseConnection();
  },

  async fetchRemoteModules(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .order('order_index', { ascending: true });
      if (!error && data && data.length > 0) {
        return data;
      }
    } catch {
      // ignore
    }
    return MODULES_DATA;
  }
};
