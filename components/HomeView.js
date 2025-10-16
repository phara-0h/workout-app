import { el, isDemoMode } from '../utils.js';
import { store } from '../store.js';

export function HomeView() {
  const container = el('div', { className: 'min-h-screen bg-gray-50 pb-20' });

  if (!store.program) {
    container.appendChild(
      el('div', { className: 'p-6 text-center text-gray-600' }, 'Program data unavailable.')
    );
    return container;
  }

  const header = el('div', { className: 'bg-blue-600 text-white p-6 shadow-lg' },
    el('div', { className: 'flex items-center justify-between mb-4' },
      el('div', {},
        el('h1', { className: 'text-2xl font-bold' }, '💪 DUP Program'),
        el('p', { className: 'text-blue-100 mt-1' }, `Week ${store.currentWeek} of 12`)
      ),
      el('div', { className: 'text-right' },
        el('button', {
          className: 'bg-blue-500 px-3 py-1 rounded mr-2 hover:bg-blue-400',
          onClick: () => store.setWeek(store.currentWeek - 1)
        }, '-'),
        el('button', {
          className: 'bg-blue-500 px-3 py-1 rounded hover:bg-blue-400',
          onClick: () => store.setWeek(store.currentWeek + 1)
        }, '+')
      )
    ),
    el('div', { className: 'flex gap-2' },
      el('button', {
        className: 'flex-1 bg-blue-500 px-4 py-2 rounded font-medium hover:bg-blue-400',
        onClick: () => store.setView('progress')
      }, '📊 Progress'),
      el('button', {
        className: 'flex-1 bg-blue-500 px-4 py-2 rounded font-medium hover:bg-blue-400',
        onClick: () => store.setView('exercise-library')
      }, '📚 Library'),
      el('button', {
        className: 'flex-1 bg-blue-500 px-4 py-2 rounded font-medium hover:bg-blue-400',
        onClick: () => store.setView('edit')
      }, '✏️ Edit'),
      !isDemoMode ? el('button', {
        className: 'bg-red-500 px-4 py-2 rounded font-medium hover:bg-red-400',
        onClick: () => store.handleSignOut()
      }, '🚪') : null
    )
  );

  const daysContainer = el('div', { className: 'p-4 space-y-3' });
  Object.entries(store.program).forEach(([key, day]) => {
    const sessionIndex = store.getSessionType(store.currentWeek, parseInt(key.replace('day', ''), 10));
    const mainEx = day.exercises[0];
    const sessionType = mainEx.rotation[sessionIndex];

    const dayCard = el('div', { className: 'bg-white rounded-lg shadow-sm border border-gray-200 p-4' },
      el('h2', { className: 'font-bold text-lg text-gray-900' }, day.name),
      el('p', { className: 'text-sm text-gray-600 mt-1' }, `${mainEx.name}: ${sessionType}`),
      el('button', {
        className: 'mt-3 w-full bg-blue-500 text-white py-2 rounded font-medium hover:bg-blue-600',
        onClick: () => store.startWorkout(key)
      }, '+ Start Workout')
    );
    daysContainer.appendChild(dayCard);
  });

  if (store.workoutHistory.length > 0) {
    const historySection = el('div', { className: 'p-4' },
      el('h2', { className: 'font-bold text-xl mb-3' }, '📅 Recent Workouts')
    );

    store.workoutHistory.slice(0, 5).forEach(workout => {
      const workoutCard = el('div', { className: 'bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3' },
        el('div', { className: 'flex justify-between items-start' },
          el('div', {},
            el('h3', { className: 'font-semibold' }, workout.dayName),
            el('p', { className: 'text-sm text-gray-600' },
              `Week ${workout.week} • ${new Date(workout.date).toLocaleDateString()}`
            )
          ),
          el('span', { className: 'text-xs bg-green-100 text-green-800 px-2 py-1 rounded' }, 'Completed')
        )
      );
      historySection.appendChild(workoutCard);
    });

    container.appendChild(header);
    container.appendChild(daysContainer);
    container.appendChild(historySection);
  } else {
    container.appendChild(header);
    container.appendChild(daysContainer);
  }

  return container;
}
