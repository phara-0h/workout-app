import { el } from '../utils.js';
import { store } from '../store.js';
import { HomeView } from './HomeView.js';

export function WorkoutView() {
  if (!store.activeWorkout) {
    return HomeView();
  }

  const container = el('div', { className: 'min-h-screen bg-gray-50 pb-20' });

  const header = el('div', { className: 'bg-blue-600 text-white p-6 shadow-lg' },
    el('h1', { className: 'text-2xl font-bold' }, store.activeWorkout.dayName),
    el('p', { className: 'text-blue-100 mt-1' },
      `Week ${store.currentWeek} • ${new Date(store.activeWorkout.date).toLocaleDateString()}`
    )
  );

  const exercisesContainer = el('div', { className: 'p-4' });

  store.activeWorkout.exercises.forEach((exercise, index) => {
    const isExpanded = store.expandedExercise === index;
    const history = store.getExerciseHistory(exercise.name).slice(0, 3);

    const exerciseCard = el('div', { className: 'bg-white rounded-lg shadow-sm border border-gray-200 mb-3' });

    const exerciseHeader = el('div', {
      className: 'p-4 cursor-pointer',
      onClick: () => store.toggleExercise(index)
    },
      el('div', { className: 'flex justify-between items-start' },
        el('div', { className: 'flex-1' },
          el('h3', { className: 'font-semibold text-gray-900' }, exercise.name),
          el('p', { className: 'text-sm text-gray-600 mt-1' }, exercise.sessionType),
          exercise.sets.length > 0 ? el('p', { className: 'text-xs text-green-600 mt-1' },
            `${exercise.sets.length} set${exercise.sets.length > 1 ? 's' : ''} completed`
          ) : null
        ),
        el('span', {}, isExpanded ? '▲' : '▼')
      )
    );

    exerciseCard.appendChild(exerciseHeader);

    if (isExpanded) {
      const expandedSection = el('div', { className: 'px-4 pb-4 border-t border-gray-100' });

      if (history.length > 0) {
        const historyBox = el('div', { className: 'mt-3 mb-3 bg-blue-50 p-2 rounded' },
          el('p', { className: 'text-xs font-semibold text-blue-900 mb-1' }, 'Last Sessions:')
        );
        history.forEach(session => {
          const topSet = session.sets.reduce((max, set) =>
            set.weight > max.weight ? set : max, session.sets[0]
          );
          historyBox.appendChild(
            el('p', { className: 'text-xs text-blue-700' },
              `Week ${session.week}: ${topSet.weight}lbs × ${topSet.reps} @ RPE ${topSet.rpe}`
            )
          );
        });
        expandedSection.appendChild(historyBox);
      }

      const setsContainer = el('div', { className: 'mt-3 space-y-2' });
      exercise.sets.forEach((set, i) => {
        const setRow = el('div', { className: 'flex justify-between items-center text-sm bg-gray-50 p-2 rounded' },
          el('span', {}, `Set ${i + 1}: ${set.weight}lbs × ${set.reps} @ RPE ${set.rpe}`),
          el('button', {
            className: 'text-red-500 hover:text-red-700',
            onClick: (e) => {
              e.stopPropagation();
              store.deleteSet(index, i);
            }
          }, '✕')
        );
        setsContainer.appendChild(setRow);
      });
      expandedSection.appendChild(setsContainer);

      const inputContainer = el('div', { className: 'mt-4 grid grid-cols-3 gap-2' });
      const weightInput = el('input', {
        type: 'number',
        placeholder: 'Weight',
        className: 'px-3 py-2 border border-gray-300 rounded text-sm'
      });
      const repsInput = el('input', {
        type: 'number',
        placeholder: 'Reps',
        className: 'px-3 py-2 border border-gray-300 rounded text-sm'
      });
      const rpeInput = el('input', {
        type: 'number',
        step: '0.5',
        placeholder: 'RPE',
        className: 'px-3 py-2 border border-gray-300 rounded text-sm'
      });

      inputContainer.appendChild(weightInput);
      inputContainer.appendChild(repsInput);
      inputContainer.appendChild(rpeInput);
      expandedSection.appendChild(inputContainer);

      const addButton = el('button', {
        className: 'mt-2 w-full bg-blue-500 text-white py-2 rounded font-medium hover:bg-blue-600',
        onClick: () => {
          const weight = parseFloat(weightInput.value);
          const reps = parseInt(repsInput.value, 10);
          const rpe = parseFloat(rpeInput.value);
          if (weight && reps && rpe) {
            store.addSet(index, weight, reps, rpe);
            repsInput.value = '';
            rpeInput.value = '';
          }
        }
      }, 'Add Set');
      expandedSection.appendChild(addButton);

      exerciseCard.appendChild(expandedSection);
    }

    exercisesContainer.appendChild(exerciseCard);
  });

  const buttonContainer = el('div', { className: 'flex gap-3 mt-4' },
    el('button', {
      className: 'flex-1 bg-gray-500 text-white py-4 rounded-lg font-bold text-lg hover:bg-gray-600',
      onClick: () => store.cancelWorkout()
    }, 'Cancel'),
    el('button', {
      className: 'flex-1 bg-green-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-700',
      onClick: () => store.finishWorkout()
    }, 'Finish')
  );
  exercisesContainer.appendChild(buttonContainer);

  container.appendChild(header);
  container.appendChild(exercisesContainer);
  return container;
}
