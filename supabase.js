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

// Get the user's active program
export async function getProgram() {
  const user = await getCurrentUser();
  if (!user) return null;

  const data = await getActiveProgram();
  return data?.program_data || null;
}

// Save a completed workout
export async function saveWorkout(workoutEntry) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const payload = {
    user_id: user.id,
    date: workoutEntry.date,
    week: workoutEntry.week,
    day_key: workoutEntry.dayId || workoutEntry.dayKey,
    day_name: workoutEntry.dayName,
    workout_data: workoutEntry
  };

  const { data, error } = await supabase
    .from('workouts')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error('Error saving workout:', error);
    throw error;
  }

  return data;
}

export async function getWorkoutHistory(limit = 20) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching workout history:', error);
    return [];
  }

  return data || [];
}

export async function deleteWorkout(workoutId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('workouts')
    .delete()
    .eq('id', workoutId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting workout:', error);
    throw error;
  }
}

// Delete a workout
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

/**
 * Get user's active program
 */
export async function getActiveProgram() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching active program:', error);
    return null;
  }

  return data;
}

/**
 * Save a new program
 */
export async function saveProgram(programData) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  await supabase
    .from('programs')
    .update({ is_active: false })
    .eq('user_id', user.id)
    .eq('is_active', true);

  const { data, error } = await supabase
    .from('programs')
    .insert([
      {
        user_id: user.id,
        name: programData.name,
        program_data: programData,
        is_active: true
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Error saving program:', error);
    throw error;
  }

  return data;
}

/**
 * Update existing program
 */
export async function updateProgram(programId, programData) {
  const { data, error } = await supabase
    .from('programs')
    .update({
      program_data: programData,
      name: programData.name
    })
    .eq('id', programId)
    .select()
    .single();

  if (error) {
    console.error('Error updating program:', error);
    throw error;
  }

  return data;
}
