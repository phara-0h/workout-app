import { defaultProgram } from './programData.js';
import {
  saveProgram,
  saveWorkout,
  getWorkouts,
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
    this.programBuilder = {
      step: 1,
      programName: '',
      days: [],
      currentDayIndex: null
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
        this.workoutHistory = data.history || [];
        if (!this.program && data.program) {
          this.program = data.program;
        }
      }
      if (!this.program && this.currentProgram) {
        this.program = this.normalizeProgram(this.currentProgram);
      }
    } else {
      try {
        const [workouts, week] = await Promise.all([
          getWorkouts(),
          getCurrentWeek()
        ]);

        this.workoutHistory = workouts || [];
        this.currentWeek = week || 1;
      } catch (error) {
        console.error('Error loading data:', error);
      }
      if (!this.program && this.currentProgram) {
        this.program = this.normalizeProgram(this.currentProgram);
      }
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

  startWorkout(dayKey) {
    const day = this.program[dayKey];
    const sessionIndex = this.getSessionType(this.currentWeek, parseInt(dayKey.replace('day', ''), 10));

    this.activeWorkout = {
      date: new Date().toISOString(),
      week: this.currentWeek,
      day: dayKey,
      dayName: day.name,
      exercises: day.exercises.map(ex => ({
        name: ex.name,
        type: ex.type,
        sessionType: ex.rotation ? ex.rotation[sessionIndex] : `${ex.sets} @ ${ex.rpe}`,
        sets: []
      }))
    };

    this.view = 'workout';
    this.notify();
  }

  addSet(exerciseIndex, weight, reps, rpe) {
    this.activeWorkout.exercises[exerciseIndex].sets.push({ weight, reps, rpe });
    this.notify();
  }

  deleteSet(exerciseIndex, setIndex) {
    this.activeWorkout.exercises[exerciseIndex].sets.splice(setIndex, 1);
    this.notify();
  }

  async finishWorkout() {
    if (isDemoMode) {
      this.workoutHistory = [this.activeWorkout, ...this.workoutHistory];
      await this.save({ persistProgram: false });
    } else {
      try {
        await saveWorkout(this.activeWorkout);
        this.workoutHistory = await getWorkouts();
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
    this.view = 'home';
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

    if (isDemoMode) {
      localStorage.setItem('workout-program', JSON.stringify(programData));
      this.currentProgram = programData;
      const normalized = this.normalizeProgram(programData);
      if (normalized) {
        this.program = normalized;
      }
    } else {
      const saved = await saveProgram(programData);
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
      currentDayIndex: null
    };
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
        history.push({
          date: workout.date,
          week: workout.week,
          sets: exercise.sets
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
          if (set.weight > max) max = set.weight;
        });
      });
      return max;
    };

    const getEstimated1RM = (history) => {
      let best = 0;
      history.forEach(session => {
        session.sets.forEach(set => {
          const estimated = set.weight * (1 + set.reps / 30);
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
