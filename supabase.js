// Import Supabase client library
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Your Supabase credentials
const SUPABASE_URL = 'https://fsjvtqumgcfaehdqatty.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzanZ0cXVtZ2NmYWVoZHFhdHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MzA5MTYsImV4cCI6MjA3NjEwNjkxNn0.FYX6OFUIPH8EKOLOdaEVvB08GEIAr04j3GbxrQxVTGU';

// Create the Supabase client - this is what we use to talk to the database
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper functions for database operations

// Get the current logged-in user
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Save or update the user's active program
export async function saveProgram(programData) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  // Check if user already has an active program
  const { data: existing } = await supabase
    .from('programs')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (existing) {
    // Update existing program
    const { error } = await supabase
      .from('programs')
      .update({
        program_data: programData,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id);
    
    if (error) throw error;
  } else {
    // Create new program
    const { error } = await supabase
      .from('programs')
      .insert({
        user_id: user.id,
        name: 'DUP Program',
        program_data: programData,
        is_active: true
      });
    
    if (error) throw error;
  }
}

// Get the user's active program
export async function getProgram() {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('programs')
    .select('program_data')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
  return data?.program_data || null;
}

// Save a completed workout
export async function saveWorkout(workout) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('workouts')
    .insert({
      user_id: user.id,
      date: workout.date,
      week: workout.week,
      day_key: workout.day,
      day_name: workout.dayName,
      workout_data: {
        exercises: workout.exercises
      }
    });

  if (error) throw error;
}

// Get all workouts for the current user
export async function getWorkouts() {
  const user = await getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (error) throw error;

  // Transform database format back to app format
  return data.map(w => ({
    date: w.date,
    week: w.week,
    day: w.day_key,
    dayName: w.day_name,
    exercises: w.workout_data.exercises
  }));
}

// Delete a workout
export async function deleteWorkout(workoutId) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('workouts')
    .delete()
    .eq('id', workoutId)
    .eq('user_id', user.id);

  if (error) throw error;
}

// Save current week number
export async function saveCurrentWeek(week) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  // Store week number in user_profiles or as metadata
  const { error } = await supabase
    .from('user_profiles')
    .upsert({
      id: user.id,
      current_week: week
    });

  if (error) throw error;
}

// Get current week number
export async function getCurrentWeek() {
  const user = await getCurrentUser();
  if (!user) return 1;

  const { data } = await supabase
    .from('user_profiles')
    .select('current_week')
    .eq('id', user.id)
    .single();

  return data?.current_week || 1;
}
