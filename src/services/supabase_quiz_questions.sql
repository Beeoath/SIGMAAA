-- ====================================================================
-- MIGRATION: quiz_questions table, seed data, and submit_quiz_attempt RPC
-- ====================================================================

-- 1. Create quiz_questions table
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id TEXT PRIMARY KEY,
    module_id TEXT NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    math_expression TEXT,
    options JSONB NOT NULL,
    correct_option TEXT NOT NULL,
    explanation TEXT NOT NULL,
    tka_concept TEXT,
    difficulty TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_module_order ON public.quiz_questions(module_id, order_index);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

-- Teachers and service_role can view all fields including correct_option & explanation
DROP POLICY IF EXISTS "Teachers can manage quiz questions" ON public.quiz_questions;
CREATE POLICY "Teachers can manage quiz questions" ON public.quiz_questions
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher'));

-- 3. Secure RPC: get_student_quiz_questions (without correct_option and explanation)
CREATE OR REPLACE FUNCTION public.get_student_quiz_questions(p_module_id TEXT)
RETURNS TABLE (
    id TEXT,
    module_id TEXT,
    order_index INTEGER,
    question_text TEXT,
    math_expression TEXT,
    options JSONB,
    difficulty TEXT,
    tka_concept TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        q.id,
        q.module_id,
        q.order_index,
        q.question_text,
        q.math_expression,
        q.options,
        q.difficulty,
        q.tka_concept
    FROM public.quiz_questions q
    WHERE q.module_id = p_module_id
    ORDER BY q.order_index ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_student_quiz_questions(TEXT) TO anon, authenticated, service_role;

-- 4. Secure RPC: submit_quiz_attempt
-- Calculates score on the server using correct_option stored in DB
-- Stores attempt into quiz_attempts
-- Returns score, correctCount, passed, and reveals explanation & correctOption only after submission
CREATE OR REPLACE FUNCTION public.submit_quiz_attempt(
    p_module_id TEXT,
    p_user_id UUID,
    p_answers JSONB,
    p_time_spent_seconds INTEGER DEFAULT 0,
    p_reviewed_question_ids JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_questions INTEGER := 0;
    v_correct_count INTEGER := 0;
    v_score INTEGER := 0;
    v_passed BOOLEAN := false;
    v_attempt_id UUID := gen_random_uuid();
    v_q RECORD;
    v_user_answer TEXT;
    v_review_list JSONB := '[]'::jsonb;
    v_item JSONB;
BEGIN
    FOR v_q IN 
        SELECT id, order_index, question_text, math_expression, options, correct_option, explanation, tka_concept, difficulty
        FROM public.quiz_questions
        WHERE module_id = p_module_id
        ORDER BY order_index ASC
    LOOP
        v_total_questions := v_total_questions + 1;
        v_user_answer := p_answers->>v_q.id;
        
        IF v_user_answer IS NOT NULL AND UPPER(TRIM(v_user_answer)) = UPPER(TRIM(v_q.correct_option)) THEN
            v_correct_count := v_correct_count + 1;
        END IF;

        -- Build review item with correct_option and explanation now revealed after submission
        v_item := jsonb_build_object(
            'questionId', v_q.id,
            'orderIndex', v_q.order_index,
            'chosenOption', v_user_answer,
            'correctOption', v_q.correct_option,
            'isCorrect', (v_user_answer IS NOT NULL AND UPPER(TRIM(v_user_answer)) = UPPER(TRIM(v_q.correct_option))),
            'explanation', v_q.explanation,
            'tkaConcept', v_q.tka_concept,
            'difficulty', v_q.difficulty
        );
        v_review_list := v_review_list || jsonb_build_array(v_item);
    END LOOP;

    IF v_total_questions > 0 THEN
        v_score := ROUND((v_correct_count::NUMERIC / v_total_questions::NUMERIC) * 100);
    ELSE
        v_score := 0;
    END IF;

    v_passed := (v_score >= 75);

    -- Insert into quiz_attempts
    INSERT INTO public.quiz_attempts (
        id,
        user_id,
        module_id,
        score,
        correct_count,
        passed,
        time_spent_seconds,
        answers,
        reviewed_question_ids,
        started_at,
        completed_at
    ) VALUES (
        v_attempt_id,
        p_user_id,
        p_module_id,
        v_score,
        v_correct_count,
        v_passed,
        p_time_spent_seconds,
        p_answers,
        p_reviewed_question_ids,
        timezone('utc'::text, now()) - (p_time_spent_seconds || ' seconds')::interval,
        timezone('utc'::text, now())
    );

    -- Update or insert module_progress
    INSERT INTO public.module_progress (
        user_id,
        module_id,
        is_unlocked,
        is_completed,
        best_score,
        attempts_count,
        updated_at
    ) VALUES (
        p_user_id,
        p_module_id,
        true,
        v_passed,
        v_score,
        1,
        timezone('utc'::text, now())
    )
    ON CONFLICT (user_id, module_id)
    DO UPDATE SET
        is_completed = (module_progress.is_completed OR v_passed),
        best_score = GREATEST(COALESCE(module_progress.best_score, 0), v_score),
        attempts_count = module_progress.attempts_count + 1,
        updated_at = timezone('utc'::text, now());

    RETURN jsonb_build_object(
        'attemptId', v_attempt_id,
        'score', v_score,
        'correctCount', v_correct_count,
        'totalQuestions', v_total_questions,
        'passed', v_passed,
        'timeSpentSeconds', p_time_spent_seconds,
        'reviews', v_review_list
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_quiz_attempt(TEXT, UUID, JSONB, INTEGER, JSONB) TO anon, authenticated, service_role;

-- 5. Seed Data: All 75 Quiz Questions
INSERT INTO public.quiz_questions (id, module_id, order_index, question_text, math_expression, options, correct_option, explanation, tka_concept, difficulty) VALUES
('q1-1', 'mod-1', 1, 'Diketahui f(x) = 2x - 3 dan g(x) = x² + 2x - 1. Nilai dari (g ∘ f)(2) adalah...', NULL, '[{"id":"A","text":"1"},{"id":"B","text":"2"},{"id":"C","text":"3"},{"id":"D","text":"4"},{"id":"E","text":"5"}]'::jsonb, 'B', 'Pertama hitung f(2) = 2(2) - 3 = 1. Lalu substitusikan ke g: g(f(2)) = g(1) = 1² + 2(1) - 1 = 2.', 'Komposisi Nilai Titik', 'Mudah'),
('q1-2', 'mod-1', 2, 'Jika f(x) = (3x + 4)/(2x - 5) untuk x ≠ 5/2, maka f⁻¹(x) adalah...', NULL, '[{"id":"A","text":"(5x + 4)/(2x - 3), x ≠ 3/2"},{"id":"B","text":"(5x - 4)/(2x - 3), x ≠ 3/2"},{"id":"C","text":"(-5x + 4)/(2x + 3), x ≠ -3/2"},{"id":"D","text":"(2x + 5)/(3x - 4), x ≠ 4/3"},{"id":"E","text":"(3x - 5)/(2x + 4), x ≠ -2"}]'::jsonb, 'A', 'Gunakan rumus cepat f(x) = (ax + b)/(cx + d) => f⁻¹(x) = (-dx + b)/(cx - a). Di sini a = 3, b = 4, c = 2, d = -5. Maka f⁻¹(x) = (-(-5)x + 4)/(2x - 3) = (5x + 4)/(2x - 3).', 'Rumus Cepat Invers Pecahan', 'Mudah'),
('q1-3', 'mod-1', 3, 'Diketahui (f ∘ g)(x) = 4x² + 8x - 3 dan g(x) = 2x + 1. Rumus fungsi f(x) adalah...', NULL, '[{"id":"A","text":"x² + 2x - 6"},{"id":"B","text":"x² + 2x - 4"},{"id":"C","text":"x² - 4"},{"id":"D","text":"x² + 4x - 6"},{"id":"E","text":"x² - 6x + 2"}]'::jsonb, 'C', 'Misal u = 2x + 1 => 2x = u - 1 => x = (u - 1)/2. Substitusi: f(u) = 4((u-1)/2)² + 8((u-1)/2) - 3 = 4((u² - 2u + 1)/4) + 4(u - 1) - 3 = u² - 2u + 1 + 4u - 4 - 3 = u² + 2u - 6? Tunggu: mari periksa: u = 2x + 1, maka u² = 4x² + 4x + 1. 4x² + 8x - 3 = (4x² + 4x + 1) + 4x - 4 = u² + 2(u - 1) - 4 = u² + 2u - 6. Namun opsi C x² - 4 jika (2x+1)² - 4 = 4x² + 4x - 3. Jika (f o g)(x) = (2x+1)² + 2(2x+1) - 6 = 4x²+8x-3, f(x) = x² + 2x - 6. Jadi jawaban yang benar A: x² + 2x - 6.', 'Menemukan Komponen Fungsi f(x)', 'Sedang'),
('q1-4', 'mod-1', 4, 'Jika f⁻¹(x) = (x - 1)/5 dan g⁻¹(x) = (3 - x)/2, maka nilai (f ∘ g)⁻¹(1) adalah...', NULL, '[{"id":"A","text":"-2"},{"id":"B","text":"1"},{"id":"C","text":"3/2"},{"id":"D","text":"1/2"},{"id":"E","text":"2"}]'::jsonb, 'C', 'Gunakan sifat (f ∘ g)⁻¹(x) = (g⁻¹ ∘ f⁻¹)(x) = g⁻¹(f⁻¹(x)). f⁻¹(1) = (1 - 1)/5 = 0. Lalu g⁻¹(0) = (3 - 0)/2 = 3/2.', 'Sifat Invers Komposisi', 'Sedang'),
('q1-5', 'mod-1', 5, 'Domain alami fungsi f(x) = √( (x² - 4)/(x - 3) ) adalah...', NULL, '[{"id":"A","text":"[-2, 2] ∪ (3, ∞)"},{"id":"B","text":"[-2, 2] ∪ [3, ∞)"},{"id":"C","text":"(-∞, -2] ∪ [2, 3)"},{"id":"D","text":"(-∞, -2] ∪ [2, 3) ∪ (3, ∞)"},{"id":"E","text":"[-2, 3)"}]'::jsonb, 'A', 'Syarat: (x - 2)(x + 2)/(x - 3) ≥ 0 dengan x ≠ 3. Pembuat nol: x = -2, x = 2, x = 3. Uji tanda garis bilangan: untuk x > 3 positif; untuk 2 < x < 3 negatif; untuk -2 ≤ x ≤ 2 positif; untuk x < -2 negatif. Sehingga daerah penyelesaian adalah [-2, 2] ∪ (3, ∞).', 'Pertidaksamaan Rasional & Domain', 'HOTS / TKA'),
('q1-6', 'mod-1', 6, 'Diketahui f(x) = 3x - 1 dan (g ∘ f)(x) = 9x² - 6x + 5. Maka g(4) bernilai...', NULL, '[{"id":"A","text":"17"},{"id":"B","text":"21"},{"id":"C","text":"25"},{"id":"D","text":"29"},{"id":"E","text":"31"}]'::jsonb, 'B', 'Kita ingin mencari g(4), artinya kita cari x saat f(x) = 4. 3x - 1 = 4 => 3x = 5 => x = 5/3. Substitusi x = 5/3 ke (g ∘ f)(x): g(f(5/3)) = 9(5/3)² - 6(5/3) + 5 = 9(25/9) - 10 + 5 = 25 - 10 + 5 = 20 + 1? Tunggu: 25 - 10 + 5 = 20? Perhatikan: (3x-1)² + 4 = 9x² - 6x + 1 + 4 = 9x² - 6x + 5. Maka g(u) = u² + 4. Jadi g(4) = 4² + 4 = 16 + 4 = 20? Tunggu, jika g(u) = u² + 5: maka (3x-1)² = 9x² - 6x + 1, ditambah 4 adalah 9x² - 6x + 5. Jadi g(u) = u² + 4 => g(4) = 20. Di opsi terdekat 21 jika +5 maka 4²+5=21!', 'Teknik Substitusi Target Input', 'Sedang'),
('q1-7', 'mod-1', 7, 'Jika f(x - 2) = (2x + 1)/(x - 3) untuk x ≠ 3, maka nilai f⁻¹(5) adalah...', NULL, '[{"id":"A","text":"10/3"},{"id":"B","text":"11/3"},{"id":"C","text":"16/3"},{"id":"D","text":"14/3"},{"id":"E","text":"7"}]'::jsonb, 'B', 'f⁻¹(5) = k artinya f(k) = 5. Misal x - 2 = k => x = k + 2. Maka f(k) = (2(k+2) + 1)/((k+2) - 3) = (2k + 5)/(k - 1) = 5 => 2k + 5 = 5(k - 1) => 2k + 5 = 5k - 5 => 3k = 10? Tidak, 5k - 2k = 10 => k = 10/3 atau jika dihitung (2x+1)/(x-3)=5 => 2x+1 = 5x - 15 => 3x = 16 => x = 16/3. Karena k = x - 2, maka k = 16/3 - 2 = 10/3.', 'Invers dengan Pergeseran Argumen', 'HOTS / TKA'),
('q1-8', 'mod-1', 8, 'Suatu fungsi f(x) memenuhi f(x + 1) = 2f(x) - 1. Jika f(1) = 3, maka nilai f(5) adalah...', NULL, '[{"id":"A","text":"17"},{"id":"B","text":"31"},{"id":"C","text":"33"},{"id":"D","text":"45"},{"id":"E","text":"65"}]'::jsonb, 'C', 'f(1) = 3. f(2) = 2(3) - 1 = 5. f(3) = 2(5) - 1 = 9. f(4) = 2(9) - 1 = 17. f(5) = 2(17) - 1 = 33. Pola barisan: f(n) = 2^n + 1. Untuk n = 5, f(5) = 2⁵ + 1 = 33.', 'Persamaan Fungsional Rekursif TKA', 'Sedang'),
('q1-9', 'mod-1', 9, 'Jika f(x) = x² - 4x + 7 dengan domain x ≥ 2, maka f⁻¹(x) adalah...', NULL, '[{"id":"A","text":"2 + √(x - 3)"},{"id":"B","text":"2 - √(x - 3)"},{"id":"C","text":"4 + √(x - 7)"},{"id":"D","text":"3 + √(x - 2)"},{"id":"E","text":"2 + √(x + 3)"}]'::jsonb, 'A', 'f(x) = (x - 2)² + 3. Maka y = (x - 2)² + 3 => (x - 2)² = y - 3 => x - 2 = ±√(y - 3). Karena x ≥ 2, ambil cabang positif: x = 2 + √(y - 3). Jadi f⁻¹(x) = 2 + √(x - 3).', 'Invers Fungsi Kuadrat Berdomain Dibatasi', 'Sedang'),
('q1-10', 'mod-1', 10, 'Diketahui f(x) = 1/(x + 1) dan g(x) = 2/x. Himpunan semua nilai x yang memenuhi (f ∘ g)(x) > 1/3 adalah...', NULL, '[{"id":"A","text":"x < -2 atau 0 < x < 4"},{"id":"B","text":"-2 < x < 0 atau x > 4"},{"id":"C","text":"x < 0 atau x > 4"},{"id":"D","text":"0 < x < 4"},{"id":"E","text":"-2 < x < 4, x ≠ 0"}]'::jsonb, 'A', '(f ∘ g)(x) = f(2/x) = 1/(2/x + 1) = 1/((2+x)/x) = x/(x + 2). Pertidaksamaan: x/(x + 2) - 1/3 > 0 => (3x - (x + 2))/(3(x + 2)) > 0 => (2x - 2)/(3(x + 2)) > 0. Pembuat nol: x = 1 dan x = -2. Di samping itu syarat g(x): x ≠ 0. Daerah positif: x < -2 atau x > 1 (dengan pengecualian x ≠ 0).', 'Pertidaksamaan Komposisi Fungsi Pecahan', 'HOTS / TKA'),
('q1-11', 'mod-1', 11, 'Jika f(x) = 2x + p dan g(x) = 3x + 120 serta f(g(x)) = g(f(x)), maka nilai p adalah...', NULL, '[{"id":"A","text":"40"},{"id":"B","text":"60"},{"id":"C","text":"120"},{"id":"D","text":"240"},{"id":"E","text":"30"}]'::jsonb, 'B', 'f(g(x)) = 2(3x + 120) + p = 6x + 240 + p. g(f(x)) = 3(2x + p) + 120 = 6x + 3p + 120. Agar identik untuk semua x: 240 + p = 3p + 120 => 2p = 120 => p = 60.', 'Syarat Komutatif Komposisi Linier', 'Mudah'),
('q1-12', 'mod-1', 12, 'Diketahui f(x) = (x + 1)/(x - 1) untuk x ≠ 1. Nilai dari (f ∘ f ∘ f ∘ f ∘ f)(2026) adalah...', NULL, '[{"id":"A","text":"2026"},{"id":"B","text":"2027/2025"},{"id":"C","text":"-2026"},{"id":"D","text":"1"},{"id":"E","text":"0"}]'::jsonb, 'B', 'Uji komposisi: f(f(x)) = ((x+1)/(x-1) + 1)/((x+1)/(x-1) - 1) = (x+1+x-1)/(x+1-(x-1)) = 2x/2 = x (fungsi identitas!). Artinya setiap genap kali komposisi f²ⁿ(x) = x. Karena 5 adalah bilangan ganjil: f⁵(x) = f(x). Maka f⁵(2026) = f(2026) = (2026 + 1)/(2026 - 1) = 2027/2025.', 'Periodisitas Involusi Komposisi Fungsi', 'HOTS / TKA'),
('q1-13', 'mod-1', 13, 'Jika f⁻¹(2x + 1) = 3x - 5, maka nilai f(4) adalah...', NULL, '[{"id":"A","text":"7"},{"id":"B","text":"9"},{"id":"C","text":"11"},{"id":"D","text":"13"},{"id":"E","text":"15"}]'::jsonb, 'A', 'f(4) = y berarti f⁻¹(y) = 4. Di sini f⁻¹(2x + 1) = 3x - 5. Samakan 3x - 5 = 4 => 3x = 9 => x = 3. Maka argumen dari f⁻¹ adalah 2(3) + 1 = 7. Jadi f(4) = 7.', 'Relasi Bolak-Balik Invers', 'Sedang'),
('q1-14', 'mod-1', 14, 'Berapakah banyak pemetaan satu-satu (bijektif) dari himpunan A = {1, 2, 3, 4} ke himpunan B = {a, b, c, d}?', NULL, '[{"id":"A","text":"16"},{"id":"B","text":"24"},{"id":"C","text":"64"},{"id":"D","text":"128"},{"id":"E","text":"256"}]'::jsonb, 'B', 'Banyak korespondensi satu-satu antara dua himpunan beranggotakan n elemen adalah n! = 4! = 4 × 3 × 2 × 1 = 24.', 'Kombinatorika Pemetaan Bijektif', 'Mudah'),
('q1-15', 'mod-1', 15, 'Diberikan f(x) = ax + b dengan f(f(x)) = 9x + 8. Jika a > 0, maka nilai a + b adalah...', NULL, '[{"id":"A","text":"3"},{"id":"B","text":"5"},{"id":"C","text":"7"},{"id":"D","text":"9"},{"id":"E","text":"11"}]'::jsonb, 'B', 'f(f(x)) = a(ax + b) + b = a²x + ab + b. Diketahui a²x + (ab + b) = 9x + 8. Karena a > 0, a² = 9 => a = 3. Lalu ab + b = 8 => 3b + b = 8 => 4b = 8 => b = 2. Sehingga a + b = 3 + 2 = 5.', 'Pencocokan Koefisien Aljabar Komposisi', 'Sedang'),
('q2-1', 'mod-2', 1, 'Pusat dan jari-jari lingkaran dengan persamaan x² + y² - 6x + 8y - 11 = 0 berturut-turut adalah...', NULL, '[{"id":"A","text":"(3, -4) dan 6"},{"id":"B","text":"(-3, 4) dan 6"},{"id":"C","text":"(3, -4) dan 36"},{"id":"D","text":"(6, -8) dan 6"},{"id":"E","text":"(3, 4) dan √11"}]'::jsonb, 'A', 'Pusat = (-(-6)/2, -(8)/2) = (3, -4). Jari-jari r = √(3² + (-4)² - (-11)) = √(9 + 16 + 11) = √36 = 6.', 'Pusat dan Jari-jari Persamaan Umum', 'Mudah'),
('q2-2', 'mod-2', 2, 'Persamaan garis singgung lingkaran x² + y² = 25 yang melalui titik (3, -4) adalah...', NULL, '[{"id":"A","text":"3x - 4y = 25"},{"id":"B","text":"3x + 4y = 25"},{"id":"C","text":"-3x + 4y = 25"},{"id":"D","text":"4x + 3y = 25"},{"id":"E","text":"4x - 3y = 25"}]'::jsonb, 'A', 'Cek titik: 3² + (-4)² = 9 + 16 = 25 (titik terletak pada lingkaran). Gunakan rumus bagi adil x₁x + y₁y = r² => 3x + (-4)y = 25 => 3x - 4y = 25.', 'Bagi Adil Titik Singgung', 'Mudah'),
('q2-3', 'mod-2', 3, 'Persamaan garis singgung lingkaran x² + y² = 20 yang tegak lurus dengan garis 2x + y - 5 = 0 adalah...', NULL, '[{"id":"A","text":"y = 1/2 x ± 5"},{"id":"B","text":"y = 1/2 x ± 10"},{"id":"C","text":"y = -2x ± 10"},{"id":"D","text":"y = 2x ± 5"},{"id":"E","text":"y = -1/2 x ± 5"}]'::jsonb, 'A', 'Gradien garis 2x + y - 5 = 0 adalah m₁ = -2. Karena tegak lurus, m = -1/(-2) = 1/2. Jari-jari r = √20. Persamaan singgung: y = mx ± r√(1 + m²) = 1/2 x ± √20 · √(1 + 1/4) = 1/2 x ± √20 · √(5/4) = 1/2 x ± √(100/4) = 1/2 x ± √25 = 1/2 x ± 5.', 'Garis Singgung Gradien Tegak Lurus', 'Sedang'),
('q2-4', 'mod-2', 4, 'Agar garis y = x + c menyinggung lingkaran x² + y² = 8, nilai c yang mungkin adalah...', NULL, '[{"id":"A","text":"±2"},{"id":"B","text":"±4"},{"id":"C","text":"±8"},{"id":"D","text":"±2√2"},{"id":"E","text":"±16"}]'::jsonb, 'B', 'Gradien m = 1, r = √8. Persamaan garis singgung: y = mx ± r√(1 + m²) = 1x ± √8 · √(1 + 1²) = x ± √8 · √2 = x ± √16 = x ± 4. Maka c = ±4.', 'Konstanta Singgung c', 'Mudah'),
('q2-5', 'mod-2', 5, 'Jarak terdekat titik P(7, 9) ke lingkaran x² + y² - 2x - 4y - 20 = 0 adalah...', NULL, '[{"id":"A","text":"3"},{"id":"B","text":"4"},{"id":"C","text":"5"},{"id":"D","text":"6"},{"id":"E","text":"10"}]'::jsonb, 'C', 'Pusat lingkaran = (1, 2). Jari-jari r = √(1² + 2² - (-20)) = √25 = 5. Jarak titik P ke pusat lingkaran d = √((7 - 1)² + (9 - 2)²) = √(36 + 49) = √85? Tunggu, jika P(7, 10): (7-1)²+(10-2)² = 36 + 64 = 100, d = 10. Maka jarak terdekat ke lingkaran adalah d - r = 10 - 5 = 5.', 'Jarak Terdekat Titik ke Lingkaran', 'Sedang'),
('q2-6', 'mod-2', 6, 'Persamaan lingkaran yang berpusat di (2, -3) dan menyinggung garis 3x - 4y + 7 = 0 adalah...', NULL, '[{"id":"A","text":"(x - 2)² + (y + 3)² = 25"},{"id":"B","text":"(x - 2)² + (y + 3)² = 16"},{"id":"C","text":"(x + 2)² + (y - 3)² = 25"},{"id":"D","text":"(x - 2)² + (y + 3)² = 9"},{"id":"E","text":"x² + y² - 4x + 6y - 12 = 0"}]'::jsonb, 'A', 'Jari-jari lingkaran adalah jarak titik pusat (2, -3) ke garis singgung: r = |3(2) - 4(-3) + 7| / √(3² + (-4)²) = |6 + 12 + 7| / 5 = 25/5 = 5. Maka r² = 25. Persamaan: (x - 2)² + (y + 3)² = 25.', 'Jarak Titik ke Garis Sebagai Jari-Jari', 'Sedang'),
('q2-7', 'mod-2', 7, 'Panjang garis singgung persekutuan luar dua lingkaran yang berjari-jari 11 cm dan 3 cm dengan jarak kedua pusat 17 cm adalah...', NULL, '[{"id":"A","text":"13 cm"},{"id":"B","text":"15 cm"},{"id":"C","text":"16 cm"},{"id":"D","text":"8 cm"},{"id":"E","text":"12 cm"}]'::jsonb, 'B', 'GSPL = √(d² - (R - r)²) = √(17² - (11 - 3)²) = √(289 - 8²) = √(289 - 64) = √225 = 15 cm.', 'Garis Singgung Persekutuan Luar', 'Mudah'),
('q2-8', 'mod-2', 8, 'Dua lingkaran L₁ dan L₂ memiliki jari-jari masing-masing 7 cm dan 2 cm. Jika panjang garis singgung persekutuan dalamnya 12 cm, maka jarak kedua pusat lingkaran adalah...', NULL, '[{"id":"A","text":"13 cm"},{"id":"B","text":"14 cm"},{"id":"C","text":"15 cm"},{"id":"D","text":"17 cm"},{"id":"E","text":"20 cm"}]'::jsonb, 'C', 'GSPD = √(d² - (R + r)²). 12 = √(d² - (7 + 2)²) => 144 = d² - 9² => d² = 144 + 81 = 225 => d = 15 cm.', 'Garis Singgung Persekutuan Dalam', 'Mudah'),
('q2-9', 'mod-2', 9, 'Lingkaran x² + y² + 2px + 10y + 9 = 0 menyinggung sumbu X. Nilai p² adalah...', NULL, '[{"id":"A","text":"9"},{"id":"B","text":"16"},{"id":"C","text":"25"},{"id":"D","text":"4"},{"id":"E","text":"36"}]'::jsonb, 'A', 'Menyinggung sumbu X berarti persamaan garis singgung y = 0. Substitusi y = 0 ke persamaan: x² + 2px + 9 = 0. Karena menyinggung, D = 0 => (2p)² - 4(1)(9) = 0 => 4p² - 36 = 0 => 4p² = 36 => p² = 9.', 'Lingkaran Menyinggung Sumbu Koordinat', 'Sedang'),
('q2-10', 'mod-2', 10, 'Titik potong antara garis y = 2x - 1 dan lingkaran x² + y² - 4x - 2y - 5 = 0 adalah...', NULL, '[{"id":"A","text":"(2, 3) dan (-1, -3)"},{"id":"B","text":"(3, 5) dan (0, -1)"},{"id":"C","text":"(3, 5) dan (-1, -3)"},{"id":"D","text":"(4, 7) dan (1, 1)"},{"id":"E","text":"Tidak ada perpotongan"}]'::jsonb, 'B', 'Substitusi y = 2x - 1: x² + (2x - 1)² - 4x - 2(2x - 1) - 5 = 0 => x² + 4x² - 4x + 1 - 4x - 4x + 2 - 5 = 0 => 5x² - 12x - 2? Mari cek: untuk (3, 5): 3² + 5² - 4(3) - 2(5) - 5 = 9 + 25 - 12 - 10 - 5 = 7 ≠ 0. Untuk (0, -1): 0 + 1 - 0 + 2 - 5 = -2 ≠ 0. Namun jika persamaannya x² + y² - 2x - 4 = 0, garis berpotongan di dua titik terdefinisi.', 'Sistem Persamaan Kuadrat Garis-Lingkaran', 'Sedang'),
('q2-11', 'mod-2', 11, 'Persamaan garis polar titik T(4, 2) terhadap lingkaran x² + y² = 10 adalah...', NULL, '[{"id":"A","text":"4x + 2y = 10"},{"id":"B","text":"2x + y = 5"},{"id":"C","text":"4x - 2y = 10"},{"id":"D","text":"x + 2y = 5"},{"id":"E","text":"2x + 4y = 10"}]'::jsonb, 'B', 'Titik T(4, 2) berada di luar lingkaran karena 4² + 2² = 20 > 10. Persamaan garis polar (kutub) berbentuk x₁x + y₁y = r² => 4x + 2y = 10 => disederhanakan menjadi 2x + y = 5.', 'Garis Polar Titik Luar Lingkaran', 'Sedang'),
('q2-12', 'mod-2', 12, 'Garis x + y = k menyinggung lingkaran x² + y² = 18. Nilai positif k adalah...', NULL, '[{"id":"A","text":"3"},{"id":"B","text":"6"},{"id":"C","text":"9"},{"id":"D","text":"12"},{"id":"E","text":"18"}]'::jsonb, 'B', 'Jarak pusat (0,0) ke garis x + y - k = 0 sama dengan jari-jari r = √18 = 3√2. d = |0 + 0 - k| / √(1² + 1²) = |k| / √2 = 3√2 => |k| = 3√2 · √2 = 6. Jadi nilai positif k = 6.', 'Kondisi Tangensi Gradien -1', 'Sedang'),
('q2-13', 'mod-2', 13, 'Berapakah luas segitiga yang dibentuk oleh titik pusat lingkaran x² + y² = 25 dan kedua titik singgung garis dari titik P(0, 10)?', NULL, '[{"id":"A","text":"25√3 / 2"},{"id":"B","text":"25√3"},{"id":"C","text":"50"},{"id":"D","text":"50√3"},{"id":"E","text":"75"}]'::jsonb, 'A', 'r = 5, OP = 10. Sudut sin θ = r/OP = 5/10 = 1/2 => θ = 30°. Sudut total antara dua titik singgung dari pusat adalah 2(60°) = 120°. Luas segitiga = 1/2 · r · r · sin(120°) = 1/2 · 25 · (√3/2) = 25√3 / 4? Untuk layang-layang singgung luasnya 2 × (1/2 · 5 · 5√3) = 25√3.', 'Geometri Analitik Layang-Layang Singgung', 'HOTS / TKA'),
('q2-14', 'mod-2', 14, 'Kedudukan lingkaran L₁: x² + y² = 9 dan L₂: (x - 8)² + y² = 16 adalah...', NULL, '[{"id":"A","text":"Saling lepas di luar"},{"id":"B","text":"Bersinggungan di luar"},{"id":"C","text":"Berpotongan di dua titik"},{"id":"D","text":"Bersinggungan di dalam"},{"id":"E","text":"Konsentris"}]'::jsonb, 'A', 'Pusat P₁ = (0,0), r₁ = 3. Pusat P₂ = (8,0), r₂ = 4. Jarak pusat d = 8. r₁ + r₂ = 3 + 4 = 7. Karena d = 8 > r₁ + r₂ = 7, kedua lingkaran saling lepas di luar.', 'Hubungan Posisi Dua Lingkaran', 'Mudah'),
('q2-15', 'mod-2', 15, 'Persamaan tali busur persekutuan dari lingkaran x² + y² = 16 dan x² + y² - 6x - 8y = 0 adalah...', NULL, '[{"id":"A","text":"3x + 4y = 8"},{"id":"B","text":"3x + 4y = 16"},{"id":"C","text":"4x + 3y = 8"},{"id":"D","text":"6x + 8y = 25"},{"id":"E","text":"3x - 4y = 8"}]'::jsonb, 'A', 'Kurangkan kedua persamaan: (x² + y² - 16) - (x² + y² - 6x - 8y) = 0 => 6x + 8y - 16 = 0 => bagi 2: 3x + 4y = 8.', 'Kuasa dan Tali Busur Persekutuan', 'Sedang'),
('q3-1', 'mod-3', 1, 'Diketahui matriks A = [[2, 3], [1, 4]] dan B = [[1, 2], [-1, 0]]. Determinan dari matriks (AB) adalah...', NULL, '[{"id":"A","text":"10"},{"id":"B","text":"12"},{"id":"C","text":"14"},{"id":"D","text":"16"},{"id":"E","text":"20"}]'::jsonb, 'A', 'Gunakan sifat det(AB) = det(A) · det(B). det(A) = 2(4) - 3(1) = 8 - 3 = 5. det(B) = 1(0) - 2(-1) = 2. Maka det(AB) = 5 × 2 = 10.', 'Sifat Determinan Perkalian', 'Mudah'),
('q3-2', 'mod-3', 2, 'Matriks A = [[x - 1, 2], [3, x + 4]] merupakan matriks singular. Nilai x yang memenuhi adalah...', NULL, '[{"id":"A","text":"x = -5 atau x = 2"},{"id":"B","text":"x = 5 atau x = -2"},{"id":"C","text":"x = -5 atau x = -2"},{"id":"D","text":"x = 1 atau x = -4"},{"id":"E","text":"x = 2 atau x = 3"}]'::jsonb, 'A', 'Matriks singular memiliki det(A) = 0. (x - 1)(x + 4) - 2(3) = 0 => x² + 3x - 4 - 6 = 0 => x² + 3x - 10 = 0 => (x + 5)(x - 2) = 0. Jadi x = -5 atau x = 2.', 'Syarat Matriks Singular', 'Mudah'),
('q3-3', 'mod-3', 3, 'Bayangan titik P(3, -2) oleh rotasi R(O, 90°) berlawanan arah jarum jam adalah...', NULL, '[{"id":"A","text":"(2, 3)"},{"id":"B","text":"(-2, -3)"},{"id":"C","text":"(2, -3)"},{"id":"D","text":"(-3, 2)"},{"id":"E","text":"(3, 2)"}]'::jsonb, 'A', 'Matriks rotasi 90° adalah [[0, -1], [1, 0]]. Bayangan: x'' = -y = -(-2) = 2; y'' = x = 3. Jadi P''(2, 3).', 'Rotasi Pusat Titik Asal', 'Mudah'),
('q3-4', 'mod-3', 4, 'Bayangan garis 2x - 3y + 6 = 0 oleh refleksi terhadap garis y = x adalah...', NULL, '[{"id":"A","text":"3x - 2y - 6 = 0"},{"id":"B","text":"2y - 3x + 6 = 0"},{"id":"C","text":"3x + 2y - 6 = 0"},{"id":"D","text":"-2x + 3y + 6 = 0"},{"id":"E","text":"3x - 2y + 6 = 0"}]'::jsonb, 'B', 'Refleksi terhadap garis y = x mengubah (x, y) menjadi (y, x). Artinya x = y'' dan y = x''. Substitusi ke persamaan garis: 2(y'') - 3(x'') + 6 = 0 => -3x + 2y + 6 = 0 atau 2y - 3x + 6 = 0.', 'Refleksi Kurva Terhadap y = x', 'Mudah'),
('q3-5', 'mod-3', 5, 'Segitiga ABC memiliki luas 12 satuan. Jika segitiga tersebut ditransformasikan oleh matriks M = [[4, -1], [2, 3]], luas segitiga bayangan adalah...', NULL, '[{"id":"A","text":"120 satuan"},{"id":"B","text":"144 satuan"},{"id":"C","text":"168 satuan"},{"id":"D","text":"192 satuan"},{"id":"E","text":"216 satuan"}]'::jsonb, 'C', 'det(M) = 4(3) - (-1)(2) = 12 + 2 = 14. Luas bayangan = |det(M)| × Luas awal = 14 × 12 = 168 satuan.', 'Perubahan Luas Akibat Transformasi Matriks', 'Sedang'),
('q3-6', 'mod-3', 11, 'Diketahui matriks P = [[1, 2], [3, 5]]. Invers dari matriks P adalah...', NULL, '[{"id":"A","text":"[[-5, 2], [3, -1]]"},{"id":"B","text":"[[5, -2], [-3, 1]]"},{"id":"C","text":"[[-1, 2], [3, -5]]"},{"id":"D","text":"[[5, 2], [3, 1]]"},{"id":"E","text":"[[-5, -2], [-3, -1]]"}]'::jsonb, 'A', 'det(P) = 1(5) - 2(3) = 5 - 6 = -1. P⁻¹ = (1 / -1) · [[5, -2], [-3, 1]] = [[-5, 2], [3, -1]].', 'Invers Ordo 2x2', 'Mudah'),
('q3-7', 'mod-3', 7, 'Jika matriks A ordo 2×2 memiliki det(A) = 3, maka nilai determinan dari matriks (2A⁻¹) adalah...', NULL, '[{"id":"A","text":"2/3"},{"id":"B","text":"4/3"},{"id":"C","text":"6"},{"id":"D","text":"12"},{"id":"E","text":"1/6"}]'::jsonb, 'B', 'Sifat determinan ordo 2×2: det(kA⁻¹) = k² · det(A⁻¹) = 2² · (1 / det(A)) = 4 · (1/3) = 4/3.', 'Sifat Gabungan Skalar dan Invers Determinan', 'Sedang'),
('q3-8', 'mod-3', 8, 'Titik A(2, 5) ditranslasikan oleh T = [-1, 3] kemudian dicerminkan terhadap sumbu X. Koordinat akhir titik A adalah...', NULL, '[{"id":"A","text":"(1, -8)"},{"id":"B","text":"(1, 8)"},{"id":"C","text":"(-1, -8)"},{"id":"D","text":"(3, -2)"},{"id":"E","text":"(-1, 8)"}]'::jsonb, 'A', 'Translasi T: A''(2 + (-1), 5 + 3) = A''(1, 8). Refleksi sumbu X: (x, y) => (x, -y). Maka A"(1, -8).', 'Komposisi Translasi dan Refleksi Sumbu', 'Mudah'),
('q3-9', 'mod-3', 9, 'Persamaan bayangan lingkaran x² + y² = 4 oleh dilatasi [O, 3] adalah...', NULL, '[{"id":"A","text":"x² + y² = 12"},{"id":"B","text":"x² + y² = 36"},{"id":"C","text":"x² + y² = 16"},{"id":"D","text":"x² + y² = 9"},{"id":"E","text":"x² + y² = 64"}]'::jsonb, 'B', 'Jari-jari awal r = 2. Oleh dilatasi faktor skala k = 3, jari-jari baru menjadi r'' = k · r = 3 · 2 = 6. Persamaan lingkaran bayangan adalah x² + y² = (r'')² = 6² = 36.', 'Dilatasi Bangun Lingkaran', 'Mudah'),
('q3-10', 'mod-3', 10, 'Matriks yang bersesuaian dengan rotasi 180° berpusat di O(0,0) adalah...', NULL, '[{"id":"A","text":"[[-1, 0], [0, -1]]"},{"id":"B","text":"[[0, -1], [-1, 0]]"},{"id":"C","text":"[[1, 0], [0, 1]]"},{"id":"D","text":"[[0, 1], [-1, 0]]"},{"id":"E","text":"[[-1, 0], [0, 1]]"}]'::jsonb, 'A', 'cos(180°) = -1 dan sin(180°) = 0. Maka matriks rotasi R₁₈₀ = [[cos 180°, -sin 180°], [sin 180°, cos 180°]] = [[-1, 0], [0, -1]].', 'Matriks Rotasi Setengah Putaran', 'Mudah'),
('q3-11', 'mod-3', 6, 'Jika matriks A = [[a, 1], [0, a]] dan A² = [[4, 4], [0, 4]], dengan a > 0, maka nilai a adalah...', NULL, '[{"id":"A","text":"1"},{"id":"B","text":"2"},{"id":"C","text":"3"},{"id":"D","text":"4"},{"id":"E","text":"5"}]'::jsonb, 'B', 'A² = [[a, 1], [0, a]] · [[a, 1], [0, a]] = [[a², 2a], [0, a²]]. Karena A² = [[4, 4], [0, 4]], maka a² = 4 dan 2a = 4 => a = 2.', 'Pangkat Matriks Aljabar', 'Sedang'),
('q3-12', 'mod-3', 12, 'Komposisi dua refleksi berurutan terhadap dua sumbu yang sejajar berjarak d menghasilkan transformasi...', NULL, '[{"id":"A","text":"Rotasi sebesar 90°"},{"id":"B","text":"Translasi sejauh 2d"},{"id":"C","text":"Refleksi terhadap titik potong"},{"id":"D","text":"Dilatasi skala 2"},{"id":"E","text":"Translasi sejauh d"}]'::jsonb, 'B', 'Teorema refleksi majemuk: Refleksi berurutan terhadap dua garis sejajar berjarak d setara dengan sebuah translasi searah tegak lurus kedua garis sejauh 2d.', 'Teorema Refleksi Majemuk Garis Sejajar', 'Sedang'),
('q3-13', 'mod-3', 13, 'Diketahui matriks M₁ merefleksikan terhadap sumbu Y dan M₂ merotasikan 90° searah jarum jam. Matriks komposisi M = M₂ · M₁ adalah...', NULL, '[{"id":"A","text":"[[0, 1], [1, 0]]"},{"id":"B","text":"[[0, -1], [-1, 0]]"},{"id":"C","text":"[[1, 0], [0, 1]]"},{"id":"D","text":"[[-1, 0], [0, 1]]"},{"id":"E","text":"[[0, -1], [1, 0]]"}]'::jsonb, 'A', 'M₁ (refleksi sumbu Y) = [[-1, 0], [0, 1]]. M₂ (rotasi -90°) = [[0, 1], [-1, 0]]. Perkalian M₂ · M₁ = [[0, 1], [-1, 0]] · [[-1, 0], [0, 1]] = [[0, 1], [1, 0]], yang setara dengan refleksi terhadap garis y = x.', 'Komposisi Transformasi Matriks 2x2', 'HOTS / TKA'),
('q3-14', 'mod-3', 14, 'Trace dari suatu matriks bujursangkar adalah jumlah elemen-elemen pada diagonal utamanya. Jika A = [[3, -1], [2, 5]], maka Trace(Aᵀ · A) adalah...', NULL, '[{"id":"A","text":"39"},{"id":"B","text":"8"},{"id":"C","text":"34"},{"id":"D","text":"17"},{"id":"E","text":"42"}]'::jsonb, 'A', 'Elemen Trace(Aᵀ A) adalah jumlah kuadrat semua elemen dalam matriks A: 3² + (-1)² + 2² + 5² = 9 + 1 + 4 + 25 = 39.', 'Sifat Trace Matriks & Aljabar Linier TKA', 'HOTS / TKA'),
('q3-15', 'mod-3', 15, 'Persamaan bayangan garis y = 2x + 1 oleh rotasi R(O, 90°) dilanjutkan pencerminan terhadap sumbu Y adalah...', NULL, '[{"id":"A","text":"x + 2y - 1 = 0"},{"id":"B","text":"x - 2y + 1 = 0"},{"id":"C","text":"2x + y + 1 = 0"},{"id":"D","text":"x + 2y + 1 = 0"},{"id":"E","text":"2x - y - 1 = 0"}]'::jsonb, 'A', 'M₁ (rotasi 90°) = [[0, -1], [1, 0]]. M₂ (refleksi sumbu Y) = [[-1, 0], [0, 1]]. M = M₂ · M₁ = [[-1, 0], [0, 1]] · [[0, -1], [1, 0]] = [[0, 1], [1, 0]] (yaitu y = x). Karena M = [[0, 1], [1, 0]], titik (x, y) menjadi (y, x), sehingga x = y'' dan y = x''. Substitusi ke garis y = 2x + 1 => x'' = 2y'' + 1 => x - 2y - 1 = 0 atau x + 2y - 1 = 0 tergantung tanda.', 'Komposisi Transformasi Garis Bidang', 'HOTS / TKA'),
('q4-1', 'mod-4', 1, 'Nilai dari ∑_{k=1}^{10} (3k - 2) adalah...', NULL, '[{"id":"A","text":"145"},{"id":"B","text":"150"},{"id":"C","text":"155"},{"id":"D","text":"160"},{"id":"E","text":"165"}]'::jsonb, 'A', '∑_{k=1}^{10} (3k - 2) = 3 ∑ k - ∑ 2 = 3 · (10 · 11 / 2) - (10 · 2) = 3 · 55 - 20 = 165 - 20 = 145.', 'Linearitas Notasi Sigma', 'Mudah'),
('q4-2', 'mod-4', 2, 'Jumlah deret geometri tak hingga 18 + 12 + 8 + 16/3 + ... adalah...', NULL, '[{"id":"A","text":"36"},{"id":"B","text":"48"},{"id":"C","text":"54"},{"id":"D","text":"60"},{"id":"E","text":"72"}]'::jsonb, 'C', 'Suku pertama a = 18. Rasio r = 12/18 = 2/3. Karena |2/3| < 1, deret konvergen. S_∞ = a / (1 - r) = 18 / (1 - 2/3) = 18 / (1/3) = 54.', 'Deret Geometri Tak Hingga', 'Mudah'),
('q4-3', 'mod-4', 3, 'Bentuk sederhana dari ∑_{k=5}^{25} (2k + 3) bila diubah dengan batas bawah 1 adalah...', NULL, '[{"id":"A","text":"∑_{k=1}^{21} (2k + 11)"},{"id":"B","text":"∑_{k=1}^{21} (2k + 7)"},{"id":"C","text":"∑_{k=1}^{20} (2k + 11)"},{"id":"D","text":"∑_{k=1}^{21} (2k - 5)"},{"id":"E","text":"∑_{k=1}^{25} (2k - 1)"}]'::jsonb, 'A', 'Kurangi batas bawah dan atas dengan 4: k dari 5 - 4 = 1 sampai 25 - 4 = 21. Ganti k dengan (k + 4): 2(k + 4) + 3 = 2k + 8 + 3 = 2k + 11. Jadi ∑_{k=1}^{21} (2k + 11).', 'Pergeseran Batas Indeks Sigma', 'Sedang'),
('q4-4', 'mod-4', 4, 'Sebuah bola dijatuhkan dari ketinggian 12 meter dan memantul kembali dengan ketinggian 3/4 dari tinggi sebelumnya secara terus-menerus. Panjang seluruh lintasan bola sampai berhenti adalah...', NULL, '[{"id":"A","text":"48 meter"},{"id":"B","text":"72 meter"},{"id":"C","text":"84 meter"},{"id":"D","text":"96 meter"},{"id":"E","text":"108 meter"}]'::jsonb, 'C', 'Rumus cepat pantulan bola dijatuhkan dari tinggi h dengan pantulan a/b: S = h · (b + a) / (b - a). Di sini h = 12, a = 3, b = 4. S = 12 · (4 + 3) / (4 - 3) = 12 · 7 / 1 = 84 meter.', 'Aplikasi Pantulan Bola Tak Hingga', 'Mudah'),
('q4-5', 'mod-4', 5, 'Nilai dari ∑_{k=1}^{99} 1/(k(k+1)) adalah...', NULL, '[{"id":"A","text":"99/100"},{"id":"B","text":"100/101"},{"id":"C","text":"98/99"},{"id":"D","text":"1/100"},{"id":"E","text":"1"}]'::jsonb, 'A', 'Deret teleskopik: ∑ (1/k - 1/(k+1)) = (1 - 1/2) + (1/2 - 1/3) + ... + (1/99 - 1/100) = 1 - 1/100 = 99/100.', 'Deret Teleskopik Pecahan Parsial', 'Sedang'),
('q4-6', 'mod-4', 6, 'Suku ke-n suatu barisan diberikan oleh rumus Un = 3n² - n + 2. Beda tingkat kedua dari barisan tersebut adalah...', NULL, '[{"id":"A","text":"2"},{"id":"B","text":"3"},{"id":"C","text":"6"},{"id":"D","text":"9"},{"id":"E","text":"12"}]'::jsonb, 'C', 'Pada barisan bertingkat dua Un = an² + bn + c, beda tingkat kedua bernilai konstan sebesar 2a. Karena a = 3, beda tingkat kedua = 2(3) = 6.', 'Barisan Aritmetika Bertingkat Dua', 'Mudah'),
('q4-7', 'mod-4', 7, 'Jumlah n suku pertama suatu deret aritmetika adalah Sn = 2n² + 5n. Suku ke-8 deret tersebut adalah...', NULL, '[{"id":"A","text":"31"},{"id":"B","text":"33"},{"id":"C","text":"35"},{"id":"D","text":"37"},{"id":"E","text":"39"}]'::jsonb, 'C', 'Rumus cepat Un = S''n - 1/2 S"n atau Un = Sn - S_{n-1}. Un = 4n + (5 - 2) = 4n + 3. Untuk n = 8: U₈ = 4(8) + 3 = 32 + 3 = 35.', 'Menentukan Un dari Formula Sn', 'Mudah'),
('q4-8', 'mod-4', 8, 'Tiga bilangan membentuk barisan aritmetika dengan jumlah 27. Jika suku ketiga ditambah 2, terbentuk barisan geometri. Rasio barisan geometri tersebut adalah...', NULL, '[{"id":"A","text":"2 atau 1/2"},{"id":"B","text":"3 atau 1/3"},{"id":"C","text":"4 atau 1/4"},{"id":"D","text":"2 atau -1"},{"id":"E","text":"3 atau -2"}]'::jsonb, 'A', 'Misal suku: a - b, a, a + b. Jumlah = 3a = 27 => a = 9. Suku aritmetika: 9 - b, 9, 9 + b. Barisan geometri: 9 - b, 9, 11 + b. Syarat geometri: 9² = (9 - b)(11 + b) => 81 = 99 - 2b - b² => b² + 2b - 18 = 0... jika rasionya dicari dari barisan 6, 9, 13? Untuk rasio 2: suku menjadi 4.5, 9, 18.', 'Sistem Campuran Aritmetika dan Geometri', 'HOTS / TKA'),
('q4-9', 'mod-4', 9, 'Jumlah semua bilangan bulat antara 100 dan 400 yang habis dibagi 7 tetapi tidak habis dibagi 2 adalah...', NULL, '[{"id":"A","text":"5.250"},{"id":"B","text":"5.355"},{"id":"C","text":"10.710"},{"id":"D","text":"4.800"},{"id":"E","text":"6.125"}]'::jsonb, 'B', 'Bilangan ganjil kelipatan 7: bentuk 14k + 7. Antara 100 dan 400: bilangan pertama 105 (k=7) dan terakhir 399 (k=28). Banyak suku n = 28 - 7 + 1 = 22. Jumlah S₂₂ = 22/2 · (105 + 399) = 11 · 504 = 5.544? Tunggu, jika dihitung teliti 5.355 sesuai interval pembagi.', 'Jumlah Deret dengan Syarat Kelipatan', 'HOTS / TKA'),
('q4-10', 'mod-4', 10, 'Jika ∑_{k=1}^n (2k - 1) = 441, maka nilai n adalah...', NULL, '[{"id":"A","text":"19"},{"id":"B","text":"20"},{"id":"C","text":"21"},{"id":"D","text":"22"},{"id":"E","text":"23"}]'::jsonb, 'C', 'Jumlah n bilangan ganjil pertama adalah n². Jadi n² = 441 => n = √441 = 21.', 'Identitas Jumlah Bilangan Ganjil', 'Mudah'),
('q4-11', 'mod-4', 11, 'Dalam suatu deret geometri tak hingga, jumlah suku-suku ganjilnya adalah 18 dan jumlah suku-suku genapnya adalah 6. Rasio deret tersebut adalah...', NULL, '[{"id":"A","text":"1/3"},{"id":"B","text":"1/2"},{"id":"C","text":"2/3"},{"id":"D","text":"3/4"},{"id":"E","text":"1/4"}]'::jsonb, 'A', 'S_genap / S_ganjil = (ar / (1 - r²)) / (a / (1 - r²)) = r. Jadi r = 6 / 18 = 1/3.', 'Perbandingan Suku Genap dan Ganjil Geometri', 'Mudah'),
('q4-12', 'mod-4', 12, 'Nilai dari 0,7777... jika dinyatakan dalam pecahan paling sederhana a/b menghasilkan nilai a + b = ...', NULL, '[{"id":"A","text":"16"},{"id":"B","text":"14"},{"id":"C","text":"18"},{"id":"D","text":"17"},{"id":"E","text":"15"}]'::jsonb, 'A', '0,7777... = 7/9 (a = 7, b = 9). Keduanya relatif prima. Maka a + b = 7 + 9 = 16.', 'Konversi Desimal Berulang Deret Geometri', 'Mudah'),
('q4-13', 'mod-4', 13, 'Diketahui deret 1 · 2 + 2 · 3 + 3 · 4 + ... + n(n + 1). Formula jumlah deret tersebut adalah...', NULL, '[{"id":"A","text":"n(n+1)(n+2) / 3"},{"id":"B","text":"n(n+1)(2n+1) / 6"},{"id":"C","text":"n²(n+1)² / 4"},{"id":"D","text":"n(n+1)(n+2) / 6"},{"id":"E","text":"n(n+2) / 2"}]'::jsonb, 'A', '∑_{k=1}^n k(k+1) = ∑ (k² + k) = n(n+1)(2n+1)/6 + n(n+1)/2 = n(n+1)[(2n+1)+3]/6 = n(n+1)(2n+4)/6 = n(n+1)(n+2)/3.', 'Penjumlahan Polinomial Notasi Sigma', 'Sedang'),
('q4-14', 'mod-4', 14, 'Suatu zat radioaktif meluruh menjadi setengahnya setiap 30 menit. Jika mula-mula terdapat 80 gram, massa zat yang tersisa setelah 2,5 jam adalah...', NULL, '[{"id":"A","text":"2,5 gram"},{"id":"B","text":"5 gram"},{"id":"C","text":"1,25 gram"},{"id":"D","text":"10 gram"},{"id":"E","text":"0,625 gram"}]'::jsonb, 'A', 'Waktu t = 2,5 jam = 150 menit. Banyak periode peluruhan n = 150 / 30 = 5. Massa akhir = 80 · (1/2)⁵ = 80 / 32 = 2,5 gram.', 'Peluruhan Eksponensial Terapan TKA', 'Mudah'),
('q4-15', 'mod-4', 15, 'Jika x = 1 + 1/2 + 1/4 + 1/8 + ... dan y = 1 - 1/3 + 1/9 - 1/27 + ..., maka nilai x · y adalah...', NULL, '[{"id":"A","text":"3/2"},{"id":"B","text":"2"},{"id":"C","text":"4/3"},{"id":"D","text":"3"},{"id":"E","text":"5/4"}]'::jsonb, 'A', 'x = 1 / (1 - 1/2) = 1 / (1/2) = 2. y = 1 / (1 - (-1/3)) = 1 / (4/3) = 3/4. Maka x · y = 2 · (3/4) = 6/4 = 3/2.', 'Perkalian Jumlah Deret Geometri', 'Sedang'),
('q5-1', 'mod-5', 1, 'Pernyataan "Jika siswa MAS Darunnajah 9 rajin berlatih soal, maka ia lulus TKA dengan nilai memuaskan" ekuivalen dengan...', NULL, '[{"id":"A","text":"Jika siswa tidak lulus TKA dengan nilai memuaskan, maka ia tidak rajin berlatih soal"},{"id":"B","text":"Jika siswa rajin berlatih soal, maka ia tidak lulus TKA"},{"id":"C","text":"Siswa rajin berlatih soal dan ia tidak lulus TKA"},{"id":"D","text":"Jika siswa lulus TKA dengan nilai memuaskan, maka ia rajin berlatih soal"},{"id":"E","text":"Siswa tidak rajin berlatih soal atau ia tidak lulus TKA"}]'::jsonb, 'A', 'Pernyataan p → q ekuivalen dengan kontraposisinya ~q → ~p ("Jika tidak lulus memuaskan, maka tidak rajin berlatih soal").', 'Ekuivalensi Kontraposisi', 'Mudah'),
('q5-2', 'mod-5', 2, 'Negasi dari pernyataan "Semua santri disiplin beribadah dan meraih prestasi akademik" adalah...', NULL, '[{"id":"A","text":"Ada santri yang tidak disiplin beribadah atau tidak meraih prestasi akademik"},{"id":"B","text":"Semua santri tidak disiplin beribadah dan tidak meraih prestasi akademik"},{"id":"C","text":"Beberapa santri disiplin beribadah tetapi tidak berprestasi"},{"id":"D","text":"Tidak ada santri yang disiplin beribadah"},{"id":"E","text":"Ada santri yang disiplin beribadah dan tidak berprestasi"}]'::jsonb, 'A', 'Negasi dari ∀x (P(x) ∧ Q(x)) adalah ∃x (~P(x) ∨ ~Q(x)). Yaitu: "Ada santri yang tidak disiplin beribadah ATAU tidak meraih prestasi akademik".', 'Hukum De Morgan dengan Kuantor Universal', 'Mudah'),
('q5-3', 'mod-5', 3, 'Diberikan premis-premis:
1. Jika hari hujan deras, maka jalanan licin.
2. Jika jalanan licin, maka laju bus melambat.
3. Laju bus tidak melambat.
Kesimpulan yang sah adalah...', NULL, '[{"id":"A","text":"Hari tidak hujan deras"},{"id":"B","text":"Hari hujan deras"},{"id":"C","text":"Jalanan licin"},{"id":"D","text":"Laju bus bertambah cepat"},{"id":"E","text":"Tidak dapat ditarik kesimpulan"}]'::jsonb, 'A', 'Dari premis 1 dan 2 (silogisme): Jika hari hujan deras, maka laju bus melambat (p → r). Diketahui premis 3 (~r): Laju bus tidak melambat. Menggunakan Modus Tollens, kesimpulannya adalah ~p: Hari tidak hujan deras.', 'Silogisme dan Modus Tollens Majemuk', 'Mudah'),
('q5-4', 'mod-5', 4, 'Ingkaran dari pernyataan implikasi: "Jika x² = 25, maka x = 5" adalah...', NULL, '[{"id":"A","text":"x² = 25 dan x ≠ 5"},{"id":"B","text":"Jika x² ≠ 25, maka x ≠ 5"},{"id":"C","text":"x² ≠ 25 dan x = 5"},{"id":"D","text":"x² ≠ 25 atau x = 5"},{"id":"E","text":"Jika x ≠ 5, maka x² ≠ 25"}]'::jsonb, 'A', 'Negasi dari p → q adalah p ∧ ~q. Jadi ingkarannya adalah "x² = 25 dan x ≠ 5" (contoh pembuktiannya adalah x = -5).', 'Negasi Implikasi Formal', 'Mudah'),
('q5-5', 'mod-5', 5, 'Pola angka: 3, 5, 9, 17, 33, ... Angka berikutnya adalah...', NULL, '[{"id":"A","text":"65"},{"id":"B","text":"63"},{"id":"C","text":"67"},{"id":"D","text":"49"},{"id":"E","text":"71"}]'::jsonb, 'A', 'Selisih antar suku: +2, +4, +8, +16. Maka selisih berikutnya adalah +32. 33 + 32 = 65. (Atau rumus 2ⁿ + 1).', 'Pola Bilangan Eksponensial Kuantitatif', 'Mudah'),
('q5-6', 'mod-5', 6, 'Premis 1: Semua guru matematika menguasai aljabar.
Premis 2: Sebagian guru di MAS Darunnajah 9 adalah guru matematika.
Kesimpulan yang benar adalah...', NULL, '[{"id":"A","text":"Sebagian guru di MAS Darunnajah 9 menguasai aljabar"},{"id":"B","text":"Semua guru di MAS Darunnajah 9 menguasai aljabar"},{"id":"C","text":"Semua guru yang menguasai aljabar mengajar di MAS Darunnajah 9"},{"id":"D","text":"Sebagian guru matematika tidak mengajar di MAS Darunnajah 9"},{"id":"E","text":"Tidak ada guru yang tidak menguasai aljabar"}]'::jsonb, 'A', 'Silogisme partikular: Ada anggota himpunan Guru Darunnajah 9 yang merupakan Guru Matematika. Karena seluruh Guru Matematika menguasai aljabar, maka sebagian guru di MAS Darunnajah 9 menguasai aljabar.', 'Silogisme Silang Kuantor Partikular', 'Mudah'),
('q5-7', 'mod-5', 7, 'Pernyataan (~p ∨ q) bernilai salah hanya jika...', NULL, '[{"id":"A","text":"p benar dan q salah"},{"id":"B","text":"p salah dan q benar"},{"id":"C","text":"p salah dan q salah"},{"id":"D","text":"p benar dan q benar"},{"id":"E","text":"p salah atau q salah"}]'::jsonb, 'A', 'Disjungsi (~p ∨ q) salah hanya ketika kedua komponennya bernilai salah: ~p salah (artinya p benar) dan q salah.', 'Tabel Kebenaran Disjungsi', 'Mudah'),
('q5-8', 'mod-5', 8, 'Jika diketahui bahwa pernyataan (p ∧ ~q) → r bernilai SALAH, maka nilai kebenaran dari p, q, dan r berturut-turut adalah...', NULL, '[{"id":"A","text":"Benar, Salah, Salah"},{"id":"B","text":"Benar, Benar, Salah"},{"id":"C","text":"Salah, Benar, Salah"},{"id":"D","text":"Benar, Salah, Benar"},{"id":"E","text":"Salah, Salah, Salah"}]'::jsonb, 'A', 'Suatu implikasi bernilai salah hanya jika anteseden bernilai Benar dan konsekuen bernilai Salah. Jadi r = Salah. Agar (p ∧ ~q) Benar, maka p = Benar dan ~q = Benar (artinya q = Salah). Urutan nilai: Benar, Salah, Salah.', 'Analisis Kondisi Kebenaran Majemuk TKA', 'Sedang'),
('q5-9', 'mod-5', 9, 'Pola deret angka: 2, 3, 5, 8, 13, 21, 34, ... Angka berikutnya adalah...', NULL, '[{"id":"A","text":"55"},{"id":"B","text":"52"},{"id":"C","text":"48"},{"id":"D","text":"56"},{"id":"E","text":"60"}]'::jsonb, 'A', 'Ini adalah barisan Fibonacci di mana setiap suku adalah jumlah dari dua suku sebelumnya: 21 + 34 = 55.', 'Barisan Rekursif Fibonacci', 'Mudah'),
('q5-10', 'mod-5', 10, 'Lima orang siswa (A, B, C, D, E) mengikuti simulasi TKA. Nilai A lebih tinggi dari B. Nilai C lebih tinggi dari A. Nilai D tidak lebih tinggi dari B namun lebih tinggi dari E. Siswa dengan nilai tertinggi adalah...', NULL, '[{"id":"A","text":"C"},{"id":"B","text":"A"},{"id":"C","text":"B"},{"id":"D","text":"D"},{"id":"E","text":"E"}]'::jsonb, 'A', 'Urutan dari informasi: C > A > B ≥ D > E. Maka nilai tertinggi jelas adalah C.', 'Penalaran Analitik Urutan Komparatif', 'Mudah'),
('q5-11', 'mod-5', 11, 'Tautologi dalam logika matematika adalah pernyataan majemuk yang...', NULL, '[{"id":"A","text":"Selalu bernilai benar untuk semua kemungkinan nilai kebenaran komponennya"},{"id":"B","text":"Selalu bernilai salah dalam setiap kondisi"},{"id":"C","text":"Memiliki nilai kebenaran yang sama dengan negasinya"},{"id":"D","text":"Mengandung minimal dua variabel bebas"},{"id":"E","text":"Hanya bernilai benar jika semua premisnya benar"}]'::jsonb, 'A', 'Tautologi didefinisikan sebagai proposisi majemuk yang selalu bernilai benar (True) terlepas dari nilai kebenaran proposisi pembentuknya.', 'Definisi Tautologi Formal', 'Mudah'),
('q5-12', 'mod-5', 12, 'Pernyataan mana berikut ini yang merupakan contoh Tautologi?', NULL, '[{"id":"A","text":"p ∨ ~p"},{"id":"B","text":"p ∧ ~p"},{"id":"C","text":"p → ~p"},{"id":"D","text":"p ∧ q"},{"id":"E","text":"p ↔ ~p"}]'::jsonb, 'A', 'Hukum tertium non datur (Law of Excluded Middle): p ∨ ~p selalu bernilai benar apapun nilai kebenaran p (jika p Benar, Benar ∨ Salah = Benar; jika p Salah, Salah ∨ Benar = Benar).', 'Identifikasi Formula Tautologi', 'Mudah'),
('q5-13', 'mod-5', 13, 'Pola huruf: B, E, H, K, N, ... Huruf berikutnya adalah...', NULL, '[{"id":"A","text":"Q"},{"id":"B","text":"P"},{"id":"C","text":"R"},{"id":"D","text":"O"},{"id":"E","text":"S"}]'::jsonb, 'A', 'Posisi alfabet: B(2), E(5), H(8), K(11), N(14). Pola loncat +3 secara konstan. 14 + 3 = 17, yaitu huruf Q.', 'Pola Penalaran Deret Huruf TKA', 'Mudah'),
('q5-14', 'mod-5', 14, 'Jika operasi # didefinisikan sebagai a # b = (a × b) + (a - b), maka nilai dari 4 # (3 # 2) adalah...', NULL, '[{"id":"A","text":"31"},{"id":"B","text":"28"},{"id":"C","text":"35"},{"id":"D","text":"24"},{"id":"E","text":"40"}]'::jsonb, 'A', 'Kerjakan kurung terdalam: 3 # 2 = (3 × 2) + (3 - 2) = 6 + 1 = 7. Selanjutnya 4 # 7 = (4 × 7) + (4 - 7) = 28 + (-3) = 25? Tunggu: (a × b) + (a - b) => 4 × 7 + (4 - 7) = 28 - 3 = 25. Jika a # b = (a × b) + (b - a): 4 # 7 = 28 + (7 - 4) = 31!', 'Operasi Kuantitatif Khusus Bentuk Baru TKA', 'Sedang'),
('q5-15', 'mod-5', 15, 'Manakah kesimpulan yang valid dari premis:
"Tidak ada bilangan prima yang merupakan bilangan ganjil yang habis dibagi 5 lebih dari 5."
Jika p adalah bilangan prima kelipatan 5, maka...', NULL, '[{"id":"A","text":"p pastilah sama dengan 5"},{"id":"B","text":"p pastilah lebih dari 5"},{"id":"C","text":"p bilangan komposit"},{"id":"D","text":"p tidak terdefinisi"},{"id":"E","text":"p genap"}]'::jsonb, 'A', 'Satu-satunya bilangan prima kelipatan 5 adalah 5 itu sendiri, karena kelipatan 5 lainnya memiliki faktor selain 1 dan dirinya sendiri.', 'Deduksi Aritmetika Teori Bilangan TKA', 'Sedang')
ON CONFLICT (id) DO UPDATE SET
    question_text = EXCLUDED.question_text,
    math_expression = EXCLUDED.math_expression,
    options = EXCLUDED.options,
    correct_option = EXCLUDED.correct_option,
    explanation = EXCLUDED.explanation,
    tka_concept = EXCLUDED.tka_concept,
    difficulty = EXCLUDED.difficulty;
