import { defaultProgram } from './programData.js';
import {
  saveProgram,
  getProgram,
  saveWorkout,
  getWorkouts,
  saveCurrentWeek,
  getCurrentWeek
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
        this.program = data.program || defaultProgram;
      } else {
        this.program = defaultProgram;
      }
    } else {
      try {
        const [program, workouts, week] = await Promise.all([
          getProgram(),
          getWorkouts(),
          getCurrentWeek()
        ]);

        this.program = program || defaultProgram;
        this.workoutHistory = workouts || [];
        this.currentWeek = week || 1;

        if (!program) {
          await saveProgram(defaultProgram);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        this.program = defaultProgram;
      }
    }
  }

  async save() {
    if (isDemoMode) {
      localStorage.setItem('workoutData', JSON.stringify({
        currentWeek: this.currentWeek,
        history: this.workoutHistory,
        program: this.program
      }));
    } else {
      try {
        await Promise.all([
          saveProgram(this.program),
          saveCurrentWeek(this.currentWeek)
        ]);
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
    await this.save();
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
      await this.save();
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
    await this.save();
  }

  async loadExerciseLibrary() {
    const { getAllExercises } = await import('./exerciseLibrary.js');
    this.exerciseLibrary = await getAllExercises();
    this.notify();
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
