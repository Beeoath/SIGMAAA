// Supabase Edge Function: submit_quiz_attempt
// Calculates quiz score on the server using database correct_option,
// records the attempt in quiz_attempts, and returns score, correctCount, passed,
// and reveals explanations and correct options ONLY after submission.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { 
      moduleId, 
      userId, 
      answers = {}, 
      timeSpentSeconds = 0, 
      reviewedQuestionIds = [] 
    } = body;

    if (!moduleId || !userId) {
      return new Response(
        JSON.stringify({ error: "moduleId and userId are required" }), 
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch quiz questions for this module with correct_option and explanation
    const { data: questions, error: qError } = await supabase
      .from("quiz_questions")
      .select("id, order_index, question_text, math_expression, options, correct_option, explanation, tka_concept, difficulty")
      .eq("module_id", moduleId)
      .order("order_index", { ascending: true });

    if (qError || !questions || questions.length === 0) {
      throw new Error(qError?.message || `No quiz questions found for module ${moduleId}`);
    }

    let correctCount = 0;
    const reviews = questions.map((q) => {
      const chosenOption = answers[q.id];
      const isCorrect = Boolean(
        chosenOption && String(chosenOption).toUpperCase().trim() === String(q.correct_option).toUpperCase().trim()
      );
      if (isCorrect) correctCount++;

      return {
        questionId: q.id,
        orderIndex: q.order_index,
        chosenOption: chosenOption || null,
        correctOption: q.correct_option,
        isCorrect,
        explanation: q.explanation,
        tkaConcept: q.tka_concept,
        difficulty: q.difficulty,
      };
    });

    const totalQuestions = questions.length;
    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const passed = score >= 75;

    // Record attempt into quiz_attempts
    const { data: attempt, error: attemptError } = await supabase
      .from("quiz_attempts")
      .insert({
        user_id: userId,
        module_id: moduleId,
        score,
        correct_count: correctCount,
        passed,
        time_spent_seconds: timeSpentSeconds,
        answers,
        reviewed_question_ids: reviewedQuestionIds,
        started_at: new Date(Date.now() - (timeSpentSeconds * 1000)).toISOString(),
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (attemptError) {
      console.warn("Attempt insertion warning:", attemptError);
    }

    // Update module progress
    await supabase.from("module_progress").upsert({
      user_id: userId,
      module_id: moduleId,
      is_unlocked: true,
      is_completed: passed,
      best_score: score,
      attempts_count: 1,
      updated_at: new Date().toISOString()
    }, { onConflict: "user_id,module_id" });

    // Return score, correctCount, passed, and the explanations
    return new Response(
      JSON.stringify({
        attemptId: attempt?.id || `attempt-${Date.now()}`,
        score,
        correctCount,
        totalQuestions,
        passed,
        timeSpentSeconds,
        reviews,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || "Internal server error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
