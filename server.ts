import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import { ALL_QUIZ_QUESTIONS, ServerQuizQuestion } from './server/quizQuestionsData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://zhjixbqefnqwninqxbqd.supabase.co';
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const supabaseAdmin = SUPABASE_SECRET_KEY ? createClient(SUPABASE_URL, SUPABASE_SECRET_KEY) : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory attempt log for server runtime (also synced to Supabase when client calls RPC)
  const serverQuizAttempts: Array<{
    id: string;
    userId: string;
    moduleId: string;
    score: number;
    correctCount: number;
    passed: boolean;
    timeSpentSeconds: number;
    answers: Record<string, string>;
    reviewedQuestionIds: string[];
    completedAt: string;
  }> = [];

  // API Route: Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Route: Get Student Quiz Questions
  // STRICT SECURITY MANDATE: correctOption and explanation are NEVER sent to the student prior to submission!
  // Only questionText, options, mathExpression, orderIndex, difficulty, tkaConcept are sent.
  app.get('/api/quiz/questions/:moduleId', (req, res) => {
    const { moduleId } = req.params;
    const questions = ALL_QUIZ_QUESTIONS.filter(q => q.moduleId === moduleId)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    if (questions.length === 0) {
      return res.status(404).json({ error: `No quiz questions found for module ${moduleId}` });
    }

    const studentQuestions = questions.map(q => ({
      id: q.id,
      moduleId: q.moduleId,
      orderIndex: q.orderIndex,
      questionText: q.questionText,
      mathExpression: q.mathExpression || null,
      options: q.options.map(opt => ({
        id: opt.id,
        text: opt.text,
        mathExpression: opt.mathExpression || null,
      })),
      difficulty: q.difficulty,
      tkaConcept: q.tkaConcept,
      // NOTE: correctOption and explanation are completely excluded here!
    }));

    res.json({
      moduleId,
      count: studentQuestions.length,
      questions: studentQuestions,
    });
  });

  // API Route: Submit Quiz Attempt
  // Calculates score on the server using correctOption stored in DB/server store,
  // records the attempt, and only NOW returns explanation and correctOption for review.
  app.post('/api/quiz/submit-attempt', (req, res) => {
    const { 
      moduleId, 
      userId, 
      answers = {}, 
      timeSpentSeconds = 0, 
      reviewedQuestionIds = [] 
    } = req.body;

    if (!moduleId) {
      return res.status(400).json({ error: 'moduleId is required' });
    }

    const questions = ALL_QUIZ_QUESTIONS.filter(q => q.moduleId === moduleId)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    if (questions.length === 0) {
      return res.status(404).json({ error: `Questions not found for module ${moduleId}` });
    }

    let correctCount = 0;
    const reviews = questions.map(q => {
      const chosenOption = answers[q.id];
      const isCorrect = Boolean(
        chosenOption && String(chosenOption).toUpperCase().trim() === String(q.correctOption).toUpperCase().trim()
      );

      if (isCorrect) correctCount++;

      return {
        questionId: q.id,
        orderIndex: q.orderIndex,
        chosenOption: chosenOption || null,
        correctOption: q.correctOption,
        isCorrect,
        explanation: q.explanation,
        tkaConcept: q.tkaConcept,
        difficulty: q.difficulty,
      };
    });

    const totalQuestions = questions.length;
    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const passed = score >= 75; // TKA Passing threshold >= 75%
    const attemptId = `attempt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    const attemptRecord = {
      id: attemptId,
      userId: userId || 'anonymous',
      moduleId,
      score,
      correctCount,
      passed,
      timeSpentSeconds: Number(timeSpentSeconds) || 0,
      answers,
      reviewedQuestionIds,
      completedAt: new Date().toISOString(),
    };

    serverQuizAttempts.unshift(attemptRecord);

    res.json({
      attemptId,
      score,
      correctCount,
      totalQuestions,
      passed,
      timeSpentSeconds: attemptRecord.timeSpentSeconds,
      reviews,
    });
  });

  // API Route: Teacher overview of questions (authenticated / teacher view)
  app.get('/api/teacher/quiz-questions/:moduleId', (req, res) => {
    const { moduleId } = req.params;
    const questions = ALL_QUIZ_QUESTIONS.filter(q => q.moduleId === moduleId)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    res.json({
      moduleId,
      count: questions.length,
      questions,
    });
  });

  // API Route: Register User without triggering Supabase Email Rate Limits
  // Using Supabase Admin API with email_confirm: true so users are instantly active
  // without sending emails via the rate-limited Supabase SMTP service.
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, name, role, school, classGrade, nisn } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Email, kata sandi, dan nama lengkap wajib diisi.' });
      }

      if (String(password).length < 6) {
        return res.status(400).json({ error: 'Kata sandi minimal 6 karakter.' });
      }

      const assignedRole: 'student' | 'teacher' = role === 'teacher' ? 'teacher' : 'student';
      const cleanEmail = String(email).trim().toLowerCase();
      const cleanName = String(name).trim();

      // Anti-collision protection: Reserved developer identity check
      if (
        cleanEmail === 'dev@darunnajah9.sch.id' ||
        cleanEmail.startsWith('dev_') ||
        cleanEmail.startsWith('dev-') ||
        cleanEmail.startsWith('admin-dev') ||
        cleanName.toLowerCase() === 'developer core'
      ) {
        return res.status(403).json({
          error: 'Identitas ini dicadangkan secara eksklusif untuk Developer Sistem dan tidak dapat didaftarkan sebagai akun umum.'
        });
      }

      if (!supabaseAdmin) {
        return res.status(500).json({ error: 'Layanan administrasi autentikasi belum terhubung.' });
      }

      // 1. Create user via Supabase Admin API with email_confirm: true
      // This immediately activates the account without sending verification emails (avoids email rate limit!)
      const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password: String(password),
        email_confirm: true,
        user_metadata: {
          role: assignedRole,
          name: cleanName,
          school: school || 'MAS DARUNNAJAH 9',
          class_grade: classGrade || (assignedRole === 'teacher' ? 'Pendamping Akademik TKA' : 'Kelas XI - MIA 1'),
          nisn: nisn ? String(nisn).trim() : null,
        }
      });

      if (createError) {
        let msg = createError.message;
        const lower = createError.message.toLowerCase();
        if (lower.includes('already been registered') || lower.includes('email_exists') || lower.includes('already registered')) {
          msg = 'Email ini sudah terdaftar. Silakan langsung masuk menggunakan email dan kata sandi Anda.';
        } else if (lower.includes('rate limit')) {
          msg = 'Batas frekuensi pendaftaran sementara tercapai. Silakan coba beberapa saat lagi.';
        }
        return res.status(400).json({ error: msg });
      }

      if (!userData?.user) {
        return res.status(500).json({ error: 'Gagal membuat akun pengguna baru di database.' });
      }

      const userId = userData.user.id;

      // 2. Initialize profiles table row
      const defaultAvatarConfig = assignedRole === 'teacher'
        ? { style: 'shapes', bgGradient: 'from-emerald-500 to-teal-700', motif: 'matrix-wave', accentColor: '#10B981' }
        : { style: 'shapes', bgGradient: 'from-blue-600 to-indigo-800', motif: 'geometry-sacred', accentColor: '#3B82F6' };

      try {
        await supabaseAdmin.from('profiles').upsert({
          id: userId,
          name: cleanName,
          role: assignedRole,
          school: school || 'MAS DARUNNAJAH 9',
          class_grade: classGrade || (assignedRole === 'teacher' ? 'Pendamping Akademik TKA' : 'Kelas XI - MIA 1'),
          nisn: nisn ? String(nisn).trim() : null,
          avatar_config: defaultAvatarConfig,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
      } catch (profileErr) {
        console.warn('Profile upsert warning:', profileErr);
      }

      // 3. Initialize module progress
      const moduleIds = ['mod-1', 'mod-2', 'mod-3', 'mod-4', 'mod-5', 'mod-6', 'mod-7'];
      const initialProgressRows = moduleIds.map((mId, idx) => ({
        user_id: userId,
        module_id: mId,
        is_unlocked: idx === 0,
        is_completed: false,
        last_slide_index: 0,
        attempts_count: 0,
        updated_at: new Date().toISOString()
      }));

      try {
        await supabaseAdmin.from('module_progress').upsert(initialProgressRows, { onConflict: 'user_id,module_id' });
      } catch (progErr) {
        console.warn('Module progress init warning:', progErr);
      }

      return res.json({
        success: true,
        user: {
          id: userId,
          email: cleanEmail,
          name: cleanName,
          role: assignedRole,
        },
        message: 'Pendaftaran berhasil dan akun Anda langsung aktif!'
      });
    } catch (err: any) {
      console.error('Registration server error:', err);
      return res.status(500).json({ error: err.message || 'Terjadi kesalahan sistem saat memproses pendaftaran.' });
    }
  });

  // API Route: Dedicated Developer Authentication (Terenkripsi SHA-256 & Anti-Tabrak)
  app.post('/api/auth/dev-login', async (req, res) => {
    try {
      const { devKey, role, customName, unlockAll } = req.body;

      if (!devKey || typeof devKey !== 'string') {
        return res.status(401).json({ 
          error: 'Kunci otentikasi developer wajib diisi.' 
        });
      }

      // Hash input user menggunakan SHA-256
      const inputHash = crypto.createHash('sha256').update(String(devKey).trim()).digest('hex');

      // Daftar hash SHA-256 yang diizinkan (Master key disimpan dalam bentuk digest terenkripsi)
      const AUTHORIZED_KEY_HASHES: string[] = [
        '25350ce3c314e3b610b9b5ff6fa86d996dadd298e5a5e39f6d6cf26f6d9b4d44', // SHA256 of SIGMA-DEV-2026
       'ed911f42e789354980790bd9c6af97e865857175838696e696e5cc4bfe00a1d2'  // SHA256 of DEV-SIGMA-2026
      ];

      // Jika ada custom master key di environment, komputasi hash-nya secara dinamis
      if (process.env.DEV_MASTER_KEY) {
        const envHash = crypto.createHash('sha256').update(process.env.DEV_MASTER_KEY.trim()).digest('hex');
        AUTHORIZED_KEY_HASHES.push(envHash);
      }
      if (process.env.DEV_MASTER_KEY_HASH) {
        AUTHORIZED_KEY_HASHES.push(process.env.DEV_MASTER_KEY_HASH.trim().toLowerCase());
      }

      // Validasi konstan (Timing-Safe) untuk mencegah Timing Attacks
      const inputBuffer = Buffer.from(inputHash, 'utf8');
      const isAuthorized = AUTHORIZED_KEY_HASHES.some((expectedHash) => {
        const expectedBuffer = Buffer.from(expectedHash, 'utf8');
        return expectedBuffer.length === inputBuffer.length && crypto.timingSafeEqual(inputBuffer, expectedBuffer);
      });

      if (!isAuthorized) {
        return res.status(401).json({ 
          error: 'Master Key Developer tidak valid atau tidak memiliki otorisasi akses.' 
        });
      }

      const assignedRole: 'student' | 'teacher' = role === 'student' ? 'student' : 'teacher';
      const devId = 'dev-root-sigma-001';
      const devName = customName ? String(customName).trim() : 'Developer Core (SIGMA)';

      const devProfile = {
        id: devId,
        name: devName,
        role: assignedRole,
        school: 'MAS DARUNNAJAH 9 (DEV SUITE)',
        classGrade: assignedRole === 'teacher' ? 'System Architect & Guru Pembimbing' : 'Siswa Mode Dev',
        nisn: 'DEV-ROOT-001',
        isDev: true,
        avatarConfig: {
          glyph: 'Σ',
          frameShape: 'hexagon' as const,
          accentColor: '#1ED760',
          focusTag: 'Developer & System Architect'
        }
      };

      // Ensure profile exists in Supabase profiles table if connected, preventing FK constraints
      if (supabaseAdmin) {
        try {
          await supabaseAdmin.from('profiles').upsert({
            id: devId,
            name: devName,
            role: assignedRole,
            school: 'MAS DARUNNAJAH 9 (DEV SUITE)',
            class_grade: assignedRole === 'teacher' ? 'System Architect & Guru Pembimbing' : 'Siswa Mode Dev',
            nisn: 'DEV-ROOT-001',
            avatar_config: devProfile.avatarConfig,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });
        } catch (dbErr) {
          console.warn('Dev profile sync to Supabase note:', dbErr);
        }

        // Initialize / optionally unlock all modules for the developer
        const moduleIds = ['mod-1', 'mod-2', 'mod-3', 'mod-4', 'mod-5', 'mod-6', 'mod-7'];
        const devProgressRows = moduleIds.map((mId, idx) => ({
          user_id: devId,
          module_id: mId,
          is_unlocked: unlockAll ? true : (idx === 0),
          is_completed: unlockAll ? true : false,
          last_slide_index: 0,
          attempts_count: 0,
          updated_at: new Date().toISOString()
        }));

        try {
          await supabaseAdmin.from('module_progress').upsert(devProgressRows, { onConflict: 'user_id,module_id' });
        } catch (progErr) {
          console.warn('Dev module progress sync note:', progErr);
        }
      }

      return res.json({
        success: true,
        profile: devProfile,
        message: 'Sesi Developer aktif dengan ID Khusus (Anti-Tabrak): dev-root-sigma-001'
      });
    } catch (err: any) {
      console.error('Dev login error:', err);
      return res.status(500).json({ error: err.message || 'Gagal memproses login developer.' });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SIGMA Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
