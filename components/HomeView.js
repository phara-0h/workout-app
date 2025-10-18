import { el } from '../utils.js';
import { store } from '../store.js';
import { themeManager } from '../theme.js';
import EmptyStateView from './EmptyStateView.js';

export default function HomeView() {
  if (!store.currentProgram) {
    return EmptyStateView();
  }

  const programData = store.currentProgram.program_data || store.currentProgram;
  const dayCount = programData.days?.length || 0;

  const container = el('div', { className: 'min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 transition-colors' });

  const header = el('div', { className: 'bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 transition-colors' },
    el('div', { className: 'max-w-4xl mx-auto px-4 py-6 flex items-center justify-between' },
      el('div', {},
        el('h1', { className: 'text-2xl font-bold text-gray-900 dark:text-white mb-2' }, programData.name || 'My Program'),
        el('p', { className: 'text-gray-600 dark:text-gray-300' }, `${dayCount} workout day${dayCount === 1 ? '' : 's'}`)
      ),
      el('button', {
        className: 'px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors',
        onClick: () => {
          themeManager.toggle();
          // Force re-render to update button text
          container.querySelector('button').textContent = themeManager.isDark() ? '☀️ Light' : '🌙 Dark';
        }
      }, themeManager.isDark() ? '☀️ Light' : '🌙 Dark')
    )
  );
  container.appendChild(header);

  const navButtons = el('div', { className: 'max-w-4xl mx-auto px-4 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4' },
    el('button', {
      className: 'bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors shadow-lg',
      onClick: () => store.setView('workout')
    }, '💪 Start Workout'),
    el('button', {
      className: 'bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 px-6 rounded-xl transition-colors shadow-lg',
      onClick: () => store.setView('progress')
    }, '📈 View Progress'),
    el('button', {
      className: 'bg-white hover:bg-gray-50 text-gray-700 font-semibold py-4 px-6 rounded-xl transition-colors shadow-lg border-2 border-gray-200',
      onClick: () => store.setView('exercise-library')
    }, '📚 Exercise Library'),
    el('button', {
      className: 'bg-white hover:bg-gray-50 text-gray-700 font-semibold py-4 px-6 rounded-xl transition-colors shadow-lg border-2 border-gray-200',
      onClick: () => store.startProgramEdit()
    }, '✏️ Edit Program')
  );
  container.appendChild(navButtons);

  const weekCard = el('div', { className: 'max-w-4xl mx-auto px-4 py-4' },
    el('div', { className: 'bg-indigo-50 rounded-xl p-4 text-center' },
      el('p', { className: 'text-sm text-indigo-700 font-medium' }, `Current Week: ${store.currentWeek}`)
    )
  );
  container.appendChild(weekCard);

  if (store.workoutHistory.length > 0) {
    const historySection = el('div', { className: 'max-w-4xl mx-auto px-4 py-6' },
      el('div', { className: 'bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-3' },
        el('div', { className: 'flex items-center justify-between mb-2' },
          el('h2', { className: 'text-xl font-semibold text-gray-900' }, 'Recent Workouts'),
          el('button', {
            className: 'text-sm text-indigo-600 hover:text-indigo-700 font-medium',
            onClick: () => store.setView('progress')
          }, 'View all →')
        ),
        ...store.workoutHistory.slice(0, 5).map((workout) => {
          const dateLabel = workout.date ? new Date(workout.date).toLocaleDateString() : 'Unknown date';
          const setCount = workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
          return el('div', { className: 'flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 py-2 border-b border-gray-100 last:border-b-0' },
            el('div', {},
              el('p', { className: 'font-medium text-gray-900' }, workout.dayName),
              el('p', { className: 'text-sm text-gray-600' }, `Week ${workout.week} • ${dateLabel}`)
            ),
            el('span', { className: 'text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded self-start sm:self-auto' },
              `${setCount} set${setCount === 1 ? '' : 's'}`
            )
          );
        })
      )
    );
    container.appendChild(historySection);
  } else {
    container.appendChild(
      el('div', { className: 'max-w-4xl mx-auto px-4 py-6' },
        el('div', { className: 'bg-white border border-gray-200 rounded-xl p-10 text-center text-gray-500 shadow-sm' },
          'No workouts logged yet. Start your first session to see your progress here!'
        )
      )
    );
  }

  return container;
}
