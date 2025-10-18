import { el } from '../utils.js';
import { store } from '../store.js';
import PlateCalculator from './PlateCalculator.js';

export default function TrackWorkoutView() {
  let workout = store.activeWorkout;

  if (!workout) {
    return el('div');
  }

  const restState = {
    duration: 120,
    remaining: 0,
    timerId: null,
    display: null
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(Math.max(seconds, 0) / 60).toString().padStart(2, '0');
    const secs = Math.max(seconds, 0) % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const updateRestDisplay = () => {
    if (restState.display) {
      restState.display.textContent = formatTime(restState.remaining);
    }
  };

  const stopRestTimer = () => {
    if (restState.timerId) {
      clearInterval(restState.timerId);
      restState.timerId = null;
    }
    restState.remaining = 0;
    updateRestDisplay();
  };

  const startRestTimer = () => {
    stopRestTimer();
    restState.remaining = Math.max(10, parseInt(restState.duration, 10) || 60);
    updateRestDisplay();
    restState.timerId = setInterval(() => {
      restState.remaining -= 1;
      if (restState.remaining <= 0) {
        stopRestTimer();
      } else {
        updateRestDisplay();
      }
    }, 1000);
  };

  const container = el('div', { className: 'min-h-screen bg-gray-50 pb-24' });

  let isNavigating = false;

  const render = () => {
    workout = store.activeWorkout;

    if (!workout) {
      stopRestTimer();
      if (!isNavigating) {
        isNavigating = true;
        store.setView('workout');
      }
      return;
    }

    container.innerHTML = '';

    const exercises = workout.exercises || [];
    const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
    const completedSets = exercises.reduce(
      (sum, ex) => sum + ex.sets.filter((set) => set.completed).length,
      0
    );

    const header = el('div', { className: 'bg-white shadow-sm border-b sticky top-0 z-10' },
      el('div', { className: 'max-w-4xl mx-auto px-4 py-4 flex items-center justify-between' },
        el('button', {
          className: 'text-gray-600 hover:text-gray-900 font-medium',
          onClick: () => {
            if (confirm('End workout and discard progress?')) {
              stopRestTimer();
              store.cancelWorkout();
            }
          }
        }, '← Exit'),
        el('div', { className: 'text-center' },
          el('h1', { className: 'text-xl font-bold text-gray-900' }, workout.dayName),
          el('p', { className: 'text-sm text-gray-500' },
            `Week ${workout.week} • ${new Date(workout.date).toLocaleString()}`
          )
        ),
        el('div', { className: 'w-16 text-right text-sm text-gray-500' }, `${completedSets}/${totalSets} sets`)
      )
    );

    const summary = el('div', { className: 'max-w-4xl mx-auto px-4 py-4 grid gap-4 sm:grid-cols-4' },
      el('div', { className: 'bg-white rounded-xl border border-indigo-100 p-4 shadow-sm' },
        el('p', { className: 'text-sm text-gray-500' }, 'Exercises'),
        el('p', { className: 'text-2xl font-semibold text-indigo-700' }, exercises.length.toString())
      ),
      el('div', { className: 'bg-white rounded-xl border border-indigo-100 p-4 shadow-sm' },
        el('p', { className: 'text-sm text-gray-500' }, 'Sets Completed'),
        el('p', { className: 'text-2xl font-semibold text-indigo-700' }, `${completedSets}/${totalSets}`)
      ),
      el('div', { className: 'bg-white rounded-xl border border-indigo-100 p-4 shadow-sm cursor-pointer hover:bg-indigo-50 transition-colors' },
        el('button', {
          className: 'w-full h-full flex flex-col items-center justify-center gap-1',
          onClick: () => {
            const calculator = PlateCalculator(135, () => {
              document.body.removeChild(calculator);
            });
            document.body.appendChild(calculator);
          }
        },
          el('p', { className: 'text-2xl' }, '🏋️'),
          el('p', { className: 'text-xs text-gray-600 font-medium' }, 'Plate Calc')
        )
      ),
      el('div', { className: 'bg-white rounded-xl border border-indigo-100 p-4 shadow-sm flex flex-col gap-3' },
        el('div', { className: 'flex items-center justify-between' },
          el('p', { className: 'text-sm text-gray-500' }, 'Rest Timer'),
          restState.display = el('span', { className: 'text-lg font-semibold text-indigo-700' }, formatTime(restState.remaining))
        ),
        el('div', { className: 'flex items-center gap-2' },
          el('input', {
            type: 'number',
            min: '10',
            className: 'w-20 px-2 py-1 border border-gray-300 rounded text-sm',
            value: restState.duration,
            onInput: (event) => {
              restState.duration = Math.max(10, parseInt(event.target.value, 10) || 60);
            }
          }),
          el('span', { className: 'text-sm text-gray-500' }, 'seconds')
        ),
        el('div', { className: 'flex gap-2' },
          el('button', {
            className: 'flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 rounded-lg',
            onClick: startRestTimer
          }, 'Start'),
          el('button', {
            className: 'flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg',
            onClick: stopRestTimer
          }, 'Reset')
        )
      )
    );

    const exerciseCards = exercises.map((exercise, exIndex) => renderExercise(exercise, exIndex));
    const exercisesList = el('div', { className: 'max-w-4xl mx-auto px-4 pb-24 space-y-4' }, ...exerciseCards);

    const actionBar = el('div', {
      className: 'fixed left-0 right-0 bottom-0 bg-white border-t border-gray-200 py-4 px-6 flex flex-col sm:flex-row gap-3 sm:gap-4'
    },
      el('button', {
        className: 'sm:flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg',
        onClick: () => {
          if (confirm('Cancel workout and discard progress?')) {
            stopRestTimer();
            store.cancelWorkout();
          }
        }
      }, 'Cancel Workout'),
      el('button', {
        className: 'sm:flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg',
        onClick: () => {
          const hasLoggedSets = (store.activeWorkout?.exercises || []).some((exerciseItem) =>
            exerciseItem.sets.some((set) => set.weight !== '' || set.reps !== '')
          );
          if (!hasLoggedSets) {
            alert('Please log at least one set before finishing the workout.');
            return;
          }
          stopRestTimer();
          store.finishWorkout();
        }
      }, 'Finish Workout')
    );

    container.appendChild(header);
    container.appendChild(summary);
    container.appendChild(exercisesList);
    container.appendChild(actionBar);
    updateRestDisplay();
  };

  const renderExercise = (exercise, exIndex) => {
    const prescription = exercise.sessionType || exercise.prescription || '';
    const previousSets = store.getPreviousSetsForExercise(exercise.name);

    const previousSetsDisplay = previousSets
      ? el('div', { className: 'px-6 py-3 bg-blue-50 border-b border-blue-100' },
          el('p', { className: 'text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2' }, 'Last Workout'),
          el('div', { className: 'flex gap-2 overflow-x-auto' },
            ...previousSets.map((prevSet, idx) =>
              el('div', { className: 'bg-white px-3 py-2 rounded border border-blue-200 text-xs whitespace-nowrap' },
                el('div', { className: 'font-semibold text-blue-900' }, `Set ${idx + 1}`),
                el('div', { className: 'text-gray-600' }, `${prevSet.weight} lbs × ${prevSet.reps}`)
              )
            )
          )
        )
      : null;

    const card = el('div', { className: 'bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden' },
      el('div', { className: 'px-6 py-4 border-b border-gray-100 bg-gray-50' },
        el('div', { className: 'flex items-center justify-between' },
          el('div', {},
            el('h2', { className: 'text-lg font-semibold text-gray-900' }, exercise.name),
            el('p', { className: 'text-sm text-gray-500 mt-1' }, prescription || 'No prescription set')
          ),
          exercise.is_main
            ? el('span', { className: 'px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full uppercase' }, 'Main Lift')
            : null
        )
      ),
      previousSetsDisplay,
      el('div', { className: 'px-6 py-4 space-y-3' },
        ...(exercise.sets.length === 0
          ? [el('p', { className: 'text-center text-sm text-gray-500 py-4 bg-gray-50 rounded-lg' }, 'No sets logged yet.')]
          : exercise.sets.map((set, setIndex) => renderSetRow(set, exIndex, setIndex))),
        el('button', {
          className: 'w-full mt-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold py-2 rounded-lg border border-indigo-100',
          onClick: () => store.addWorkoutSet(exIndex)
        }, '+ Add Set')
      )
    );

    return card;
  };

  const renderSetRow = (set, exIndex, setIndex) => {
    return el('div', {
      className: `p-4 rounded-lg border ${
        set.completed ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'
      } transition-colors`
    },
      el('div', { className: 'flex flex-wrap gap-3 items-center' },
        el('span', { className: 'text-sm font-semibold text-gray-600 w-16' }, `Set ${setIndex + 1}`),
        el('input', {
          type: 'number',
          min: '0',
          step: '0.5',
          value: set.weight,
          placeholder: 'Weight',
          className: 'flex-1 min-w-[90px] px-3 py-2 border border-gray-300 rounded text-sm',
          onInput: (event) => {
            const value = event.target.value === '' ? '' : Number(event.target.value);
            store.updateWorkoutSet(exIndex, setIndex, 'weight', value);
          }
        }),
        el('input', {
          type: 'number',
          min: '0',
          step: '1',
          value: set.reps,
          placeholder: 'Reps',
          className: 'flex-1 min-w-[90px] px-3 py-2 border border-gray-300 rounded text-sm',
          onInput: (event) => {
            const value = event.target.value === '' ? '' : Number(event.target.value);
            store.updateWorkoutSet(exIndex, setIndex, 'reps', value);
          }
        }),
        el('input', {
          type: 'number',
          min: '0',
          max: '10',
          step: '0.5',
          value: set.rpe,
          placeholder: 'RPE',
          className: 'flex-1 min-w-[90px] px-3 py-2 border border-gray-300 rounded text-sm',
          onInput: (event) => {
            const value = event.target.value === '' ? '' : Number(event.target.value);
            store.updateWorkoutSet(exIndex, setIndex, 'rpe', value);
          }
        }),
        el('label', { className: 'flex items-center gap-2 text-sm text-gray-600' },
          el('input', {
            type: 'checkbox',
            checked: Boolean(set.completed),
            onChange: () => store.toggleWorkoutSetCompleted(exIndex, setIndex)
          }),
          'Completed'
        ),
        el('button', {
          className: 'text-red-500 hover:text-red-700 text-sm font-medium ml-auto',
          onClick: () => store.removeWorkoutSet(exIndex, setIndex)
        }, 'Remove')
      )
    );
  };

  const handleStoreChange = () => {
    if (!isNavigating) {
      render();
    }
  };

  store.subscribe(handleStoreChange);
  render();

  return container;
}
