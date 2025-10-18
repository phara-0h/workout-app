import { defaultProgram } from './programData.js';
import {
  saveProgram,
  saveWorkout,
  getWorkoutHistory,
  saveCurrentWeek,
  getCurrentWeek,
  getActiveProgram,
  updateProgram
} from './supabase.js';
import { checkAuth, signOut } from './auth.js';
import { isDemoMode } from './utils.js';

class WorkoutStore {
  constructor() {
    this.currentWeek = 1;
    this.workoutHistory = [];
    this.program = null;
    this.activeWorkout = null;
    this.expandedExercise = null;
    this.view = 'home';
    this.listeners = [];
    this.isAuthenticated = false;
    this.loading = true;
    this.exerciseLibrary = [];
    this.currentProgram = null;
    this.currentProgramId = null;
    this.notes = {}; // { workoutId: 'note text', 'day-dayId': 'note', 'exercise-exerciseName': 'note' }
    this.programBuilder = {
      step: 1,
      programName: '',
      days: [],
      currentDayIndex: null,
      isEditing: false,
      sourceProgramId: null
    };
  }

  async init() {
    if (!isDemoMode) {
      this.isAuthenticated = await checkAuth();
      if (!this.isAuthenticated) {
        this.loading = false;
        this.notify();
        return;
      }
    }

    await this.loadProgram();
    await this.load();
    await this.loadExerciseLibrary();
    this.loading = false;
    this.notify();
  }

  async load() {
    if (isDemoMode) {
      const saved = localStorage.getItem('workoutData');
      if (saved) {
        const data = JSON.parse(saved);
        this.currentWeek = data.currentWeek || 1;
        if (!this.program && data.program) {
          this.program = data.program;
        }
      }
      if (!this.program && this.currentProgram) {
        this.program = this.normalizeProgram(this.currentProgram);
      }
      await this.loadWorkoutHistory();
    } else {
      try {
        const week = await getCurrentWeek();
        this.currentWeek = week || 1;
      } catch (error) {
        console.error('Error loading current week:', error);
      }
      if (!this.program && this.currentProgram) {
        this.program = this.normalizeProgram(this.currentProgram);
      }
      await this.loadWorkoutHistory();
    }

    if (!this.program) {
      this.program = defaultProgram;
    }
  }

  async save(options = {}) {
    const { persistProgram = true } = options;

    if (isDemoMode) {
      const payload = {
        currentWeek: this.currentWeek,
        history: this.workoutHistory,
        program: this.program
      };
      localStorage.setItem('workoutData', JSON.stringify(payload));
      localStorage.setItem('workout-history', JSON.stringify(this.workoutHistory));

      if (persistProgram) {
        const builderProgram = this.buildProgramDataFromCurrent();
        if (builderProgram) {
          localStorage.setItem('workout-program', JSON.stringify(builderProgram));
          this.currentProgram = builderProgram;
        }
      }
    } else {
      try {
        const operations = [saveCurrentWeek(this.currentWeek)];

        if (persistProgram) {
          const builderProgram = this.buildProgramDataFromCurrent();
          if (builderProgram) {
            const persistence = (this.currentProgramId
              ? updateProgram(this.currentProgramId, builderProgram)
              : saveProgram(builderProgram))
              .then((saved) => {
                this.currentProgram = saved?.program_data || builderProgram;
                this.currentProgramId = saved?.id ?? this.currentProgramId;
              });
            operations.push(persistence);
          }
        }

        await Promise.all(operations);
      } catch (error) {
        console.error('Error saving data:', error);
        alert('Failed to save data. Please try again.');
      }
    }
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
  }

  notify() {
    this.listeners.forEach(listener => listener());
  }

  async setWeek(week) {
    this.currentWeek = Math.max(1, Math.min(12, week));
    await this.save({ persistProgram: false });
  }

  addWorkoutSet(exerciseIndex) {
    if (!this.activeWorkout) return;
    this.activeWorkout.exercises[exerciseIndex].sets.push({
      set_number: this.activeWorkout.exercises[exerciseIndex].sets.length + 1,
      weight: '',
      reps: '',
      rpe: '',
      completed: false
    });
    this.notify();
  }

  updateWorkoutSet(exerciseIndex, setIndex, field, value) {
    if (!this.activeWorkout) return;
    const exercise = this.activeWorkout.exercises[exerciseIndex];
    if (!exercise || !exercise.sets[setIndex]) return;
    exercise.sets[setIndex][field] = value;
    this.notify();
  }

  removeWorkoutSet(exerciseIndex, setIndex) {
    if (!this.activeWorkout) return;
    const exercise = this.activeWorkout.exercises[exerciseIndex];
    if (!exercise || !exercise.sets[setIndex]) return;
    exercise.sets.splice(setIndex, 1);
    exercise.sets.forEach((set, idx) => {
      set.set_number = idx + 1;
    });
    this.notify();
  }

  toggleWorkoutSetCompleted(exerciseIndex, setIndex) {
    if (!this.activeWorkout) return;
    const exercise = this.activeWorkout.exercises[exerciseIndex];
    if (!exercise || !exercise.sets[setIndex]) return;
    exercise.sets[setIndex].completed = !exercise.sets[setIndex].completed;
    this.notify();
  }

  async finishWorkout() {
    if (!this.activeWorkout) {
      return;
    }

    const workoutRecord = {
      ...this.activeWorkout,
      programId: this.currentProgramId || this.activeWorkout.programId || null,
      completed_at: new Date().toISOString()
    };

    if (isDemoMode) {
      const normalized = this.formatWorkoutEntry(workoutRecord);
      this.workoutHistory = [normalized, ...this.workoutHistory];
      await this.save({ persistProgram: false });
    } else {
      try {
        await saveWorkout(workoutRecord);
        await this.loadWorkoutHistory();
      } catch (error) {
        console.error('Error saving workout:', error);
        alert('Failed to save workout. Please try again.');
        return;
      }
    }

    this.activeWorkout = null;
    this.expandedExercise = null;
    this.view = 'home';
    this.notify();
  }

  cancelWorkout() {
    this.activeWorkout = null;
    this.expandedExercise = null;
    this.view = 'workout';
    this.notify();
  }

  setView(view) {
    this.view = view;
    this.notify();
  }

  toggleExercise(index) {
    this.expandedExercise = this.expandedExercise === index ? null : index;
    this.notify();
  }

  async updateProgram(newProgram) {
    this.program = newProgram;
    await this.save({ persistProgram: true });
  }

  async loadExerciseLibrary() {
    const { getAllExercises } = await import('./exerciseLibrary.js');
    this.exerciseLibrary = await getAllExercises();
    this.notify();
  }

  async loadProgram() {
    if (isDemoMode) {
      const saved = localStorage.getItem('workout-program');
      if (saved) {
        try {
          const program = JSON.parse(saved);
          this.currentProgram = program;
          const normalized = this.normalizeProgram(program);
          if (normalized) {
            this.program = normalized;
          }
        } catch (error) {
          console.error('Failed to parse stored program:', error);
        }
      } else {
        this.currentProgram = null;
      }
    } else {
      try {
        const record = await getActiveProgram();
        if (record) {
          this.currentProgram = record.program_data;
          this.currentProgramId = record.id;
          const normalized = this.normalizeProgram(record.program_data);
          if (normalized) {
            this.program = normalized;
          }
        } else {
          this.currentProgram = null;
          this.currentProgramId = null;
        }
      } catch (error) {
        console.error('Error loading program:', error);
        this.currentProgram = null;
      }
    }
  }

  async saveCurrentProgram(programData) {
    if (!programData || !Array.isArray(programData.days)) {
      throw new Error('Invalid program data');
    }

    const isEditing = this.programBuilder.isEditing;
    const sourceProgramId = this.programBuilder.sourceProgramId;

    if (isDemoMode) {
      localStorage.setItem('workout-program', JSON.stringify(programData));
      this.currentProgram = programData;
      const normalized = this.normalizeProgram(programData);
      if (normalized) {
        this.program = normalized;
      }
    } else {
      let saved;
      if (isEditing && sourceProgramId) {
        // Update existing program
        const { updateProgram } = await import('./supabase.js');
        saved = await updateProgram(sourceProgramId, programData);
      } else {
        // Create new program
        const { saveProgram } = await import('./supabase.js');
        saved = await saveProgram(programData);
      }
      this.currentProgram = saved?.program_data || programData;
      this.currentProgramId = saved?.id ?? null;
      const normalized = this.normalizeProgram(this.currentProgram);
      if (normalized) {
        this.program = normalized;
      }
    }

    this.resetProgramBuilder();
    await this.save({ persistProgram: false });
  }

  resetProgramBuilder() {
    this.programBuilder = {
      step: 1,
      programName: '',
      days: [],
      currentDayIndex: null,
      isEditing: false,
      sourceProgramId: null
    };
  }

  loadProgramForEditing(programRecord) {
    if (!programRecord) {
      console.error('No program record provided for editing');
      return;
    }

    const programData = programRecord.program_data || programRecord;
    const clonedDays = JSON.parse(JSON.stringify(programData.days || []));

    this.programBuilder = {
      step: 1,
      programName: programData.name || '',
      days: clonedDays,
      currentDayIndex: 0,
      isEditing: true,
      sourceProgramId: programRecord.id || null
    };

    this.notify();
  }

  getPreviousSetsForExercise(exerciseName) {
    const history = this.workoutHistory || [];

    for (let i = history.length - 1; i >= 0; i--) {
      const workout = history[i];
      const exercise = (workout.exercises || []).find(ex => ex.name === exerciseName);

      if (exercise && exercise.sets && exercise.sets.length > 0) {
        return exercise.sets.map(set => ({
          weight: set.weight || '—',
          reps: set.reps || '—',
          rpe: set.rpe || '—',
          completed: set.completed || false
        }));
      }
    }

    return null;
  }

  getAllPersonalRecords() {
    const history = this.workoutHistory || [];
    const records = {};

    history.forEach(workout => {
      (workout.exercises || []).forEach(exercise => {
        const exerciseName = exercise.name;
        if (!exerciseName) return;

        if (!records[exerciseName]) {
          records[exerciseName] = {
            name: exerciseName,
            maxWeight: 0,
            maxWeightDate: null,
            maxReps: 0,
            maxRepsDate: null,
            maxVolume: 0,
            maxVolumeDate: null,
            estimated1RM: 0
          };
        }

        (exercise.sets || []).forEach(set => {
          const weight = Number(set.weight) || 0;
          const reps = Number(set.reps) || 0;
          const volume = weight * reps;

          // Track max weight
          if (weight > records[exerciseName].maxWeight) {
            records[exerciseName].maxWeight = weight;
            records[exerciseName].maxWeightDate = workout.date;
          }

          // Track max reps (at any weight)
          if (reps > records[exerciseName].maxReps) {
            records[exerciseName].maxReps = reps;
            records[exerciseName].maxRepsDate = workout.date;
          }

          // Track max volume for single set
          if (volume > records[exerciseName].maxVolume) {
            records[exerciseName].maxVolume = volume;
            records[exerciseName].maxVolumeDate = workout.date;
          }

          // Estimate 1RM using Brzycki formula: weight × (36 / (37 - reps))
          if (weight > 0 && reps > 0 && reps < 37) {
            const estimated1RM = weight * (36 / (37 - reps));
            if (estimated1RM > records[exerciseName].estimated1RM) {
              records[exerciseName].estimated1RM = Math.round(estimated1RM);
            }
          }
        });
      });
    });

    return Object.values(records).sort((a, b) => b.maxWeight - a.maxWeight);
  }

  getVolumeTrend(limit = 10) {
    const history = this.workoutHistory || [];
    const recentWorkouts = history.slice(-limit).reverse();

    return recentWorkouts.map(workout => {
      let totalVolume = 0;
      (workout.exercises || []).forEach(exercise => {
        (exercise.sets || []).forEach(set => {
          const weight = Number(set.weight) || 0;
          const reps = Number(set.reps) || 0;
          totalVolume += weight * reps;
        });
      });

      return {
        date: workout.date,
        dayName: workout.dayName,
        volume: totalVolume,
        week: workout.week
      };
    });
  }

  setNote(key, noteText) {
    if (noteText && noteText.trim()) {
      this.notes[key] = noteText.trim();
    } else {
      delete this.notes[key];
    }
    this.save();
    this.notify();
  }

  getNote(key) {
    return this.notes[key] || '';
  }

  deleteNote(key) {
    delete this.notes[key];
    this.save();
    this.notify();
  }

  normalizeProgram(programData) {
    if (!programData || !Array.isArray(programData.days)) {
      return null;
    }

    const normalized = {};
    programData.days.forEach((day, index) => {
      const key = `day${index + 1}`;
      const exercises = (day.exercises || []).map((exercise) => {
        const base = {
          name: exercise.exercise_name,
          type: exercise.is_main ? 'main' : 'accessory'
        };

        if (exercise.exercise_id) {
          base.exercise_id = exercise.exercise_id;
        }

        if (exercise.is_main) {
          base.rotation = exercise.rotation || [];
        } else {
          base.sets = exercise.sets || '';
          base.rpe = exercise.rpe || '';
        }

        return base;
      });

      normalized[key] = {
        name: day.name || `Day ${index + 1}`,
        exercises
      };
    });

    return normalized;
  }

  buildProgramDataFromCurrent() {
    if (!this.program) {
      return null;
    }

    const dayKeys = Object.keys(this.program).sort();
    const days = dayKeys.map((key, index) => {
      const day = this.program[key];
      return {
        id: day.id || `day-${index + 1}`,
        name: day.name || `Day ${index + 1}`,
        exercises: (day.exercises || []).map((exercise) => ({
          exercise_id: exercise.exercise_id || null,
          exercise_name: exercise.name,
          is_main: exercise.type === 'main',
          rotation: exercise.type === 'main' ? (exercise.rotation || []) : null,
          sets: exercise.type !== 'main' ? (exercise.sets || '') : null,
          rpe: exercise.type !== 'main' ? (exercise.rpe || '') : null
        }))
      };
    });

    return {
      name: this.currentProgram?.name || this.programBuilder.programName || 'Custom Program',
      days
    };
  }

  async loadWorkoutHistory() {
    if (isDemoMode) {
      try {
        const storedHistory = localStorage.getItem('workout-history');
        if (storedHistory) {
          this.workoutHistory = this.normalizeHistoryList(JSON.parse(storedHistory));
        } else if (Array.isArray(this.workoutHistory)) {
          localStorage.setItem('workout-history', JSON.stringify(this.workoutHistory));
        } else {
          this.workoutHistory = [];
        }
      } catch (error) {
        console.error('Error loading workout history from localStorage:', error);
        this.workoutHistory = [];
      }
    } else {
      try {
        const history = await getWorkoutHistory();
        this.workoutHistory = this.normalizeHistoryList(history);
      } catch (error) {
        console.error('Error loading workout history:', error);
        this.workoutHistory = [];
      }
    }
    this.notify();
  }

  async deleteWorkoutEntry(workoutId) {
    if (!workoutId) return;
    if (isDemoMode) {
      this.workoutHistory = this.workoutHistory.filter((workout) => workout.id !== workoutId);
      localStorage.setItem('workout-history', JSON.stringify(this.workoutHistory));
      await this.save({ persistProgram: false });
    } else {
      try {
        await deleteWorkout(workoutId);
        await this.loadWorkoutHistory();
      } catch (error) {
        console.error('Error deleting workout:', error);
        alert('Failed to delete workout. Please try again.');
      }
    }
  }

  startProgramEdit() {
    if (!this.currentProgram) return;
    const programData = this.currentProgram.program_data || this.currentProgram;
    const clonedDays = JSON.parse(JSON.stringify(programData.days || []));
    this.programBuilder = {
      step: clonedDays.length > 0 ? 3 : 1,
      programName: programData.name || '',
      days: clonedDays,
      currentDayIndex: 0,
      isEditing: true,
      sourceProgramId: this.currentProgramId || this.currentProgram.id || null
    };
    this.setView('program-builder');
  }

  normalizeHistoryList(list = []) {
    return list
      .map((entry) => this.formatWorkoutEntry(entry))
      .filter(Boolean);
  }

  formatWorkoutEntry(entry) {
    if (!entry) return null;

    if (entry.workout_data) {
      const data = entry.workout_data || {};
      return {
        id: entry.id,
        dayId: entry.day_id || entry.day_key,
        dayKey: entry.day_key || entry.day_id,
        dayName: entry.day_name,
        week: entry.week,
        date: entry.workout_date || entry.date,
        exercises: data.exercises || [],
        programId: entry.program_id || data.programId || null,
        completed_at: entry.completed_at || data.completed_at || entry.created_at || entry.date,
        created_at: entry.created_at || entry.workout_date || entry.date
      };
    }

    return {
      id: entry.id || `local-${Date.now()}`,
      dayId: entry.dayId || entry.day_id || entry.dayKey,
      dayKey: entry.dayKey || entry.day_id || entry.dayId,
      dayName: entry.dayName || entry.day_name,
      week: entry.week,
      date: entry.date,
      exercises: entry.exercises || [],
      programId: entry.programId || null,
      completed_at: entry.completed_at || entry.date,
      created_at: entry.created_at || entry.completed_at || entry.date
    };
  }

  getSessionType(week, dayNum) {
    if (dayNum === 3) {
      return week % 2 === 1 ? 0 : 1;
    }
    return (week - 1) % 3;
  }

  getExerciseHistory(exerciseName) {
    const history = [];
    this.workoutHistory.forEach(workout => {
      const exercise = workout.exercises.find(ex => ex.name === exerciseName);
      if (exercise && exercise.sets.length > 0) {
        const sanitizedSets = exercise.sets.map(set => ({
          weight: Number(set.weight) || 0,
          reps: Number(set.reps) || 0,
          rpe: set.rpe === '' || set.rpe === null || set.rpe === undefined ? null : Number(set.rpe),
          completed: Boolean(set.completed)
        }));
        history.push({
          date: workout.date,
          week: workout.week,
          sets: sanitizedSets
        });
      }
    });
    return history.reverse();
  }

  getBig3Stats() {
    const squat = this.getExerciseHistory('Back Squat');
    const bench = this.getExerciseHistory('Barbell Bench Press');
    const deadlift = this.getExerciseHistory('Conventional Deadlift');

    const getMax = (history) => {
      let max = 0;
      history.forEach(session => {
        session.sets.forEach(set => {
          const weight = Number(set.weight);
          if (Number.isFinite(weight) && weight > max) max = weight;
        });
      });
      return max;
    };

    const getEstimated1RM = (history) => {
      let best = 0;
      history.forEach(session => {
        session.sets.forEach(set => {
          const weight = Number(set.weight);
          const reps = Number(set.reps);
          if (!Number.isFinite(weight) || !Number.isFinite(reps) || weight <= 0 || reps <= 0) {
            return;
          }
          const estimated = weight * (1 + reps / 30);
          if (estimated > best) best = estimated;
        });
      });
      return Math.round(best);
    };

    return {
      squat: { max: getMax(squat), estimated1RM: getEstimated1RM(squat), sessions: squat.length },
      bench: { max: getMax(bench), estimated1RM: getEstimated1RM(bench), sessions: bench.length },
      deadlift: { max: getMax(deadlift), estimated1RM: getEstimated1RM(deadlift), sessions: deadlift.length }
    };
  }

  async handleSignOut() {
    if (confirm('Are you sure you want to sign out?')) {
      await signOut();
    }
  }
}

const store = new WorkoutStore();

export { store, WorkoutStore };
