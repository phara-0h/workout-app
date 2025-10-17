import { el } from '../utils.js';
import { store } from '../store.js';

export default function WorkoutView() {
  const programRecord = store.currentProgram;

  if (!programRecord) {
    store.setView('home');
    return el('div');
  }

  const programData = programRecord.program_data || programRecord;
  const days = programData.days || [];

  if (days.length === 0) {
    return el('div', { className: 'min-h-screen bg-gray-50 flex items-center justify-center p-4' },
      el('div', { className: 'text-center bg-white shadow-sm rounded-xl p-8' },
        el('h2', { className: 'text-xl font-semibold text-gray-900 mb-2' }, 'No Workout Days Found'),
        el('p', { className: 'text-gray-600 mb-6' }, 'Your current program has no workout days.'),
        el('button', {
          className: 'px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700',
          onClick: () => store.setView('home')
        }, 'Go Back')
      )
    );
  }

  const container = el('div', { className: 'min-h-screen bg-gray-50 pb-20' });

  const render = () => {
    container.innerHTML = '';

    const header = el('div', { className: 'bg-white shadow-sm border-b sticky top-0 z-10' },
      el('div', { className: 'max-w-4xl mx-auto px-4 py-4 flex items-center justify-between' },
        el('button', {
          className: 'text-gray-600 hover:text-gray-900 font-medium',
          onClick: () => store.setView('home')
        }, '← Back'),
        el('h1', { className: 'text-xl font-bold text-gray-900' }, programData.name || 'My Program'),
        el('div', { className: 'w-16' })
      )
    );

    const weekIndicator = el('div', { className: 'bg-indigo-50 border-b border-indigo-100 py-3' },
      el('div', { className: 'max-w-4xl mx-auto px-4 flex items-center justify-between' },
        el('button', {
          className: 'text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed',
          disabled: store.currentWeek === 1,
          onClick: () => {
            if (store.currentWeek > 1) {
              store.currentWeek -= 1;
              store.notify();
            }
          }
        }, '← Previous'),
        el('span', { className: 'font-semibold text-indigo-900' }, `Week ${store.currentWeek}`),
        el('button', {
          className: 'text-indigo-600 hover:text-indigo-700 font-medium',
          onClick: () => {
            store.currentWeek += 1;
            store.notify();
          }
        }, 'Next →')
      )
    );

    const daysList = el('div', { className: 'max-w-4xl mx-auto px-4 py-6 space-y-4' },
      days.map((day, index) => renderDayCard(day, index))
    );

    container.appendChild(header);
    container.appendChild(weekIndicator);
    container.appendChild(daysList);
  };

  const renderDayCard = (day, dayIndex) => {
    const exerciseContainer = (!day.exercises || day.exercises.length === 0)
      ? el('p', { className: 'text-center text-gray-500 py-4' }, 'No exercises in this day')
      : el('div', { className: 'space-y-4' },
          ...day.exercises.map((exercise) => renderExercise(exercise))
        );

    return el('div', {
      className: 'bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow'
    },
      el('div', { className: 'bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-4' },
        el('h2', { className: 'text-xl font-bold text-white' }, day.name || `Day ${dayIndex + 1}`),
        el('p', { className: 'text-indigo-100 text-sm mt-1' },
          `${day.exercises?.length || 0} exercise${day.exercises?.length !== 1 ? 's' : ''}`
        )
      ),
      el('div', { className: 'p-6' }, exerciseContainer),
      el('div', { className: 'px-6 pb-6' },
        el('button', {
          className: 'w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors',
          onClick: () => startWorkout(day, dayIndex)
        }, `Start ${day.name || `Day ${dayIndex + 1}`} →`)
      )
    );
  };

  const renderExercise = (exercise) => {
    let prescription = '';
    if (exercise.is_main && Array.isArray(exercise.rotation) && exercise.rotation.length > 0) {
      const weekIndex = (store.currentWeek - 1) % exercise.rotation.length;
      prescription = exercise.rotation[weekIndex] || '';
    } else {
      prescription = `${exercise.sets || ''}${exercise.rpe ? ` @ ${exercise.rpe}` : ''}`.trim();
    }

    return el('div', {
      className: `p-4 rounded-lg border-2 ${
        exercise.is_main ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-200'
      }`
    },
      el('div', { className: 'flex items-start justify-between' },
        el('div', { className: 'flex-1' },
          el('div', { className: 'flex items-center gap-2 mb-2' },
            el('h3', { className: 'font-semibold text-gray-900' }, exercise.exercise_name || exercise.name || 'Exercise'),
            exercise.is_main
              ? el('span', { className: 'px-2 py-1 bg-indigo-600 text-white text-xs font-bold rounded uppercase' }, 'Main Lift')
              : null
          ),
          el('p', { className: 'text-sm text-gray-700 font-medium' }, prescription || 'No prescription set')
        )
      )
    );
  };

  const startWorkout = (day, dayIndex) => {
    store.activeWorkout = {
      date: new Date().toISOString(),
      week: store.currentWeek,
      programId: store.currentProgramId || null,
      programName: programData.name || 'My Program',
      dayIndex,
      dayId: day.id || day.dayKey || `day-${dayIndex + 1}`,
      dayKey: day.id || day.dayKey || `day-${dayIndex + 1}`,
      dayName: day.name || `Day ${dayIndex + 1}`,
      exercises: (day.exercises || []).map((exercise) => {
        let sessionType = '';
        if (exercise.is_main && Array.isArray(exercise.rotation) && exercise.rotation.length > 0) {
          const weekIndex = (store.currentWeek - 1) % exercise.rotation.length;
          sessionType = exercise.rotation[weekIndex] || '';
        } else {
          sessionType = `${exercise.sets || ''}${exercise.rpe ? ` @ ${exercise.rpe}` : ''}`.trim();
        }
        return {
          exercise_id: exercise.exercise_id || exercise.id || null,
          name: exercise.exercise_name || exercise.name,
          is_main: Boolean(exercise.is_main || exercise.type === 'main'),
          sessionType,
          sets: [{
            set_number: 1,
            weight: '',
            reps: '',
            rpe: '',
            completed: false
          }]
        };
      })
    };

    store.setView('track-workout');
  };

  store.subscribe(render);
  render();

  return container;
}
