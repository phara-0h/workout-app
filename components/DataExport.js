import { el } from '../utils.js';
import { store } from '../store.js';

export default function DataExport(onClose) {
  let filterDateFrom = '';
  let filterDateTo = '';
  let filterExercise = '';
  let format = 'json';

  const downloadJSON = (data, filename) => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCSV = (data, filename) => {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    // CSV header
    let csv = 'Date,Day Name,Week,Exercise,Set,Weight (lbs),Reps,RPE,Completed\n';

    // CSV rows
    data.forEach(workout => {
      const date = new Date(workout.date).toLocaleDateString();
      const dayName = workout.dayName || 'Workout';
      const week = workout.week || '';

      (workout.exercises || []).forEach(exercise => {
        const exerciseName = exercise.name || 'Unknown';

        (exercise.sets || []).forEach((set, idx) => {
          csv += `"${date}","${dayName}","${week}","${exerciseName}",${idx + 1},${set.weight || ''},${set.reps || ''},${set.rpe || ''},${set.completed ? 'Yes' : 'No'}\n`;
        });
      });
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filterWorkouts = () => {
    let filtered = store.workoutHistory || [];

    if (filterDateFrom) {
      const fromDate = new Date(filterDateFrom);
      filtered = filtered.filter(w => new Date(w.date) >= fromDate);
    }

    if (filterDateTo) {
      const toDate = new Date(filterDateTo);
      filtered = filtered.filter(w => new Date(w.date) <= toDate);
    }

    if (filterExercise) {
      filtered = filtered.filter(w =>
        w.exercises.some(ex => ex.name.toLowerCase().includes(filterExercise.toLowerCase()))
      );
    }

    return filtered;
  };

  const handleExport = () => {
    const filteredData = filterWorkouts();

    if (filteredData.length === 0) {
      alert('No workouts match your filters');
      return;
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `workout-data-${timestamp}.${format}`;

    if (format === 'json') {
      downloadJSON(filteredData, filename);
    } else {
      downloadCSV(filteredData, filename);
    }

    alert(`Exported ${filteredData.length} workout(s) successfully!`);
  };

  const modal = el('div', {
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4',
    onClick: (e) => {
      if (e.target === modal) onClose();
    }
  });

  const render = () => {
    const filteredCount = filterWorkouts().length;
    const totalCount = (store.workoutHistory || []).length;

    const content = el('div', { className: 'bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto' },
      // Header
      el('div', { className: 'p-6 border-b border-gray-200 dark:border-gray-700' },
        el('div', { className: 'flex items-center justify-between' },
          el('h2', { className: 'text-2xl font-bold text-gray-900 dark:text-white' }, '📊 Export Workout Data'),
          el('button', {
            className: 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl',
            onClick: onClose
          }, '×')
        )
      ),

      // Format Selection
      el('div', { className: 'p-6 border-b border-gray-200 dark:border-gray-700' },
        el('h3', { className: 'text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3' }, 'Export Format'),
        el('div', { className: 'flex gap-3' },
          el('button', {
            className: `flex-1 py-3 px-4 rounded-lg border-2 font-semibold transition-colors ${
              format === 'json'
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-indigo-300'
            }`,
            onClick: () => {
              format = 'json';
              render();
            }
          }, 'JSON'),
          el('button', {
            className: `flex-1 py-3 px-4 rounded-lg border-2 font-semibold transition-colors ${
              format === 'csv'
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-indigo-300'
            }`,
            onClick: () => {
              format = 'csv';
              render();
            }
          }, 'CSV (Excel)')
        )
      ),

      // Filters
      el('div', { className: 'p-6 border-b border-gray-200 dark:border-gray-700' },
        el('h3', { className: 'text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3' }, 'Filters (Optional)'),
        el('div', { className: 'space-y-3' },
          el('div', {},
            el('label', { className: 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1' }, 'Exercise Name'),
            el('input', {
              type: 'text',
              placeholder: 'Filter by exercise...',
              className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm',
              value: filterExercise,
              onInput: (e) => {
                filterExercise = e.target.value;
                render();
              }
            })
          ),
          el('div', { className: 'grid grid-cols-2 gap-3' },
            el('div', {},
              el('label', { className: 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1' }, 'From Date'),
              el('input', {
                type: 'date',
                className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm',
                value: filterDateFrom,
                onInput: (e) => {
                  filterDateFrom = e.target.value;
                  render();
                }
              })
            ),
            el('div', {},
              el('label', { className: 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1' }, 'To Date'),
              el('input', {
                type: 'date',
                className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm',
                value: filterDateTo,
                onInput: (e) => {
                  filterDateTo = e.target.value;
                  render();
                }
              })
            )
          )
        ),
        (filterExercise || filterDateFrom || filterDateTo)
          ? el('div', { className: 'mt-3 flex items-center justify-between text-sm' },
              el('span', { className: 'text-gray-600 dark:text-gray-400' },
                `${filteredCount} of ${totalCount} workouts will be exported`
              ),
              el('button', {
                className: 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium',
                onClick: () => {
                  filterExercise = '';
                  filterDateFrom = '';
                  filterDateTo = '';
                  render();
                }
              }, 'Clear Filters')
            )
          : el('p', { className: 'mt-3 text-sm text-gray-500 dark:text-gray-400' },
              `All ${totalCount} workouts will be exported`
            )
      ),

      // Export Button
      el('div', { className: 'p-6' },
        el('button', {
          className: 'w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed',
          disabled: filteredCount === 0,
          onClick: handleExport
        }, `Export ${filteredCount} Workout${filteredCount === 1 ? '' : 's'} as ${format.toUpperCase()}`)
      )
    );

    modal.innerHTML = '';
    modal.appendChild(content);
  };

  render();
  return modal;
}
