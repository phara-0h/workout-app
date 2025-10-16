import { supabase } from './supabase.js';
import { isDemoMode } from './utils.js';

const LOCAL_STORAGE_KEY = 'customExercises';

function getDefaultExercises() {
  return [
    { id: 'default-1', name: 'Barbell Bench Press', category: 'chest', equipment: 'barbell', is_compound: true, is_custom: false },
    { id: 'default-2', name: 'Back Squat', category: 'legs', equipment: 'barbell', is_compound: true, is_custom: false },
    { id: 'default-3', name: 'Conventional Deadlift', category: 'legs', equipment: 'barbell', is_compound: true, is_custom: false },
    { id: 'default-4', name: 'Overhead Press', category: 'shoulders', equipment: 'barbell', is_compound: true, is_custom: false },
    { id: 'default-5', name: 'Barbell Row', category: 'back', equipment: 'barbell', is_compound: true, is_custom: false },
    { id: 'default-6', name: 'Lat Pulldown', category: 'back', equipment: 'machine', is_compound: false, is_custom: false },
    { id: 'default-7', name: 'Leg Press', category: 'legs', equipment: 'machine', is_compound: true, is_custom: false },
    { id: 'default-8', name: 'Cable Fly', category: 'chest', equipment: 'cable', is_compound: false, is_custom: false },
    { id: 'default-9', name: 'Hanging Leg Raise', category: 'core', equipment: 'bodyweight', is_compound: false, is_custom: false },
    { id: 'default-10', name: 'Barbell Curl', category: 'arms', equipment: 'barbell', is_compound: false, is_custom: false }
  ];
}

function readCustomExercises() {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to read custom exercises:', error);
    return [];
  }
}

function writeCustomExercises(exercises) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(exercises));
  } catch (error) {
    console.error('Failed to store custom exercises:', error);
  }
}

export async function getAllExercises() {
  if (isDemoMode) {
    const customExercises = readCustomExercises();
    const defaults = getDefaultExercises();
    return [...defaults, ...customExercises];
  }

  const { data, error } = await supabase
    .from('exercise_library')
    .select('*')
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('Failed to load exercise library:', error);
    return [];
  }

  return data ?? [];
}

export async function getExercisesByCategory(category) {
  const exercises = await getAllExercises();
  return exercises.filter((exercise) => exercise.category === category);
}

export async function searchExercises(searchTerm) {
  const exercises = await getAllExercises();
  const term = searchTerm.trim().toLowerCase();
  if (!term) return exercises;
  return exercises.filter((exercise) => exercise.name.toLowerCase().includes(term));
}

export async function addCustomExercise({ name, category, equipment = 'other', is_compound = false, description = '' }) {
  if (isDemoMode) {
    const customExercises = readCustomExercises();
    const exercise = {
      id: `custom-${Date.now()}`,
      name,
      category,
      equipment,
      is_compound,
      description,
      is_custom: true
    };
    customExercises.push(exercise);
    writeCustomExercises(customExercises);
    return exercise;
  }

  const { data, error } = await supabase
    .from('exercise_library')
    .insert([{
      name,
      category,
      equipment,
      is_compound,
      description,
      is_custom: true
    }])
    .select()
    .single();

  if (error) {
    console.error('Failed to add exercise:', error);
    throw error;
  }

  return data;
}

export async function deleteCustomExercise(exerciseId) {
  if (isDemoMode) {
    const customExercises = readCustomExercises();
    const updated = customExercises.filter((exercise) => exercise.id !== exerciseId);
    writeCustomExercises(updated);
    return;
  }

  const { error } = await supabase
    .from('exercise_library')
    .delete()
    .eq('id', exerciseId);

  if (error) {
    console.error('Failed to delete exercise:', error);
    throw error;
  }
}

export async function updateCustomExercise(exerciseId, updates) {
  if (isDemoMode) {
    const customExercises = readCustomExercises();
    const index = customExercises.findIndex((exercise) => exercise.id === exerciseId);
    if (index === -1) return;
    customExercises[index] = { ...customExercises[index], ...updates };
    writeCustomExercises(customExercises);
    return customExercises[index];
  }

  const { data, error } = await supabase
    .from('exercise_library')
    .update(updates)
    .eq('id', exerciseId)
    .select()
    .single();

  if (error) {
    console.error('Failed to update exercise:', error);
    throw error;
  }

  return data;
}
