import { el } from '../utils.js';

export function CalendarView(store) {
  const container = el('div', { className: 'min-h-screen bg-gray-50 dark:bg-gray-900 pb-8' });

  const render = () => {
    container.innerHTML = '';

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    // Get days in month
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday

    // Get scheduled workouts for this month
    const schedule = store.getWorkoutSchedule(currentYear, currentMonth);
    const workoutHistory = store.workoutHistory || [];
    const streak = store.getWorkoutStreak();

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const header = el('div', { className: 'max-w-5xl mx-auto px-4 py-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800' },
      el('div', { className: 'flex items-center justify-between mb-4' },
        el('button', {
          className: 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium',
          onClick: () => store.setView('home')
        }, '← Back'),
        el('h1', { className: 'text-2xl font-bold text-gray-900 dark:text-white' }, 'Workout Calendar')
      ),
      el('div', { className: 'flex items-center justify-between' },
        el('div', {},
          el('h2', { className: 'text-xl font-semibold text-gray-800 dark:text-gray-200' }, `${monthNames[currentMonth]} ${currentYear}`)
        ),
        el('div', { className: 'flex items-center gap-4' },
          el('div', { className: 'text-sm' },
            el('span', { className: 'text-gray-600 dark:text-gray-400' }, 'Current Streak: '),
            el('span', { className: 'text-lg font-bold text-green-600 dark:text-green-400' }, `${streak} days 🔥`)
          )
        )
      )
    );

    // Calendar grid
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const calendarGrid = el('div', { className: 'max-w-5xl mx-auto px-4 py-6' },
      el('div', { className: 'bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700' },
        // Day labels
        el('div', { className: 'grid grid-cols-7 border-b border-gray-200 dark:border-gray-700' },
          ...dayLabels.map(day =>
            el('div', { className: 'p-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700' }, day)
          )
        ),
        // Calendar days
        el('div', { className: 'grid grid-cols-7' },
          // Empty cells for days before the first of the month
          ...Array(startDayOfWeek).fill(null).map(() =>
            el('div', { className: 'aspect-square border-b border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900' })
          ),
          // Actual days
          ...Array(daysInMonth).fill(null).map((_, dayIndex) => {
            const day = dayIndex + 1;
            const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
            const scheduledWorkout = schedule[dateKey];
            const completedWorkout = workoutHistory.find(w => w.date.startsWith(dateKey));
            const isRestDay = scheduledWorkout?.isRestDay;

            let bgColor = 'bg-white dark:bg-gray-800';
            let indicator = null;

            if (isToday) {
              bgColor = 'bg-blue-50 dark:bg-blue-900/20';
            }

            if (completedWorkout) {
              indicator = el('div', { className: 'mt-1 w-2 h-2 bg-green-500 rounded-full mx-auto' });
            } else if (isRestDay) {
              indicator = el('div', { className: 'mt-1 text-xs text-gray-500 dark:text-gray-400' }, '💤');
            } else if (scheduledWorkout) {
              indicator = el('div', { className: 'mt-1 w-2 h-2 bg-indigo-500 rounded-full mx-auto' });
            }

            const isPast = new Date(dateKey) < new Date(today.toDateString());
            const isMissed = isPast && scheduledWorkout && !completedWorkout && !isRestDay;

            if (isMissed) {
              bgColor = 'bg-red-50 dark:bg-red-900/20';
            }

            return el('div', {
              className: `aspect-square border-b border-r border-gray-200 dark:border-gray-700 p-2 ${bgColor} cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`,
              onClick: () => {
                if (scheduledWorkout || completedWorkout) {
                  showDayDetails(dateKey, scheduledWorkout, completedWorkout);
                } else {
                  showScheduleModal(dateKey);
                }
              }
            },
              el('div', { className: 'text-sm font-medium text-gray-900 dark:text-gray-100' }, day.toString()),
              scheduledWorkout && !isRestDay
                ? el('div', { className: 'text-xs text-indigo-600 dark:text-indigo-400 mt-1 truncate' }, scheduledWorkout.workoutName)
                : null,
              indicator,
              isMissed ? el('div', { className: 'text-xs text-red-600 dark:text-red-400 mt-1' }, '❌') : null
            );
          })
        )
      )
    );

    // Legend
    const legend = el('div', { className: 'max-w-5xl mx-auto px-4 py-4' },
      el('div', { className: 'bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700' },
        el('h3', { className: 'text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3' }, 'Legend'),
        el('div', { className: 'grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs' },
          el('div', { className: 'flex items-center gap-2' },
            el('div', { className: 'w-3 h-3 bg-green-500 rounded-full' }),
            el('span', { className: 'text-gray-600 dark:text-gray-400' }, 'Completed')
          ),
          el('div', { className: 'flex items-center gap-2' },
            el('div', { className: 'w-3 h-3 bg-indigo-500 rounded-full' }),
            el('span', { className: 'text-gray-600 dark:text-gray-400' }, 'Scheduled')
          ),
          el('div', { className: 'flex items-center gap-2' },
            el('div', { className: 'text-base' }, '💤'),
            el('span', { className: 'text-gray-600 dark:text-gray-400' }, 'Rest Day')
          ),
          el('div', { className: 'flex items-center gap-2' },
            el('div', { className: 'text-base' }, '❌'),
            el('span', { className: 'text-gray-600 dark:text-gray-400' }, 'Missed')
          )
        )
      )
    );

    container.appendChild(header);
    container.appendChild(calendarGrid);
    container.appendChild(legend);
  };

  const showScheduleModal = (dateKey) => {
    const program = store.program;
    if (!program) {
      alert('No active program. Please create a program first.');
      return;
    }

    const workouts = Object.keys(program).map(key => ({
      key,
      name: program[key].name
    }));

    const modal = el('div', {
      className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4',
      onClick: (e) => {
        if (e.target === modal) {
          document.body.removeChild(modal);
        }
      }
    },
      el('div', { className: 'bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-200 dark:border-gray-700' },
        el('h2', { className: 'text-xl font-bold text-gray-900 dark:text-white mb-4' }, `Schedule for ${dateKey}`),
        el('div', { className: 'space-y-3 mb-6' },
          ...workouts.map(workout =>
            el('button', {
              className: 'w-full px-4 py-3 text-left bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg border border-indigo-200 dark:border-indigo-700 text-indigo-900 dark:text-indigo-100 font-medium',
              onClick: () => {
                store.scheduleWorkout(dateKey, workout.key, workout.name);
                document.body.removeChild(modal);
                render();
              }
            }, workout.name)
          ),
          el('button', {
            className: 'w-full px-4 py-3 text-left bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-medium',
            onClick: () => {
              store.scheduleRestDay(dateKey);
              document.body.removeChild(modal);
              render();
            }
          }, '💤 Mark as Rest Day')
        ),
        el('div', { className: 'flex gap-2' },
          el('button', {
            className: 'flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium',
            onClick: () => document.body.removeChild(modal)
          }, 'Cancel')
        )
      )
    );

    document.body.appendChild(modal);
  };

  const showDayDetails = (dateKey, scheduledWorkout, completedWorkout) => {
    const modal = el('div', {
      className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4',
      onClick: (e) => {
        if (e.target === modal) {
          document.body.removeChild(modal);
        }
      }
    },
      el('div', { className: 'bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-200 dark:border-gray-700' },
        el('h2', { className: 'text-xl font-bold text-gray-900 dark:text-white mb-4' }, dateKey),
        completedWorkout
          ? el('div', { className: 'mb-4 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg' },
              el('p', { className: 'text-green-800 dark:text-green-200 font-semibold mb-2' }, '✅ Workout Completed'),
              el('p', { className: 'text-sm text-green-700 dark:text-green-300' }, `${completedWorkout.exercises?.length || 0} exercises completed`)
            )
          : null,
        scheduledWorkout && !scheduledWorkout.isRestDay
          ? el('div', { className: 'mb-4 p-4 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 rounded-lg' },
              el('p', { className: 'text-indigo-800 dark:text-indigo-200 font-semibold mb-2' }, 'Scheduled Workout'),
              el('p', { className: 'text-sm text-indigo-700 dark:text-indigo-300' }, scheduledWorkout.workoutName)
            )
          : null,
        scheduledWorkout?.isRestDay
          ? el('div', { className: 'mb-4 p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg' },
              el('p', { className: 'text-gray-800 dark:text-gray-200 font-semibold' }, '💤 Rest Day')
            )
          : null,
        el('div', { className: 'flex gap-2' },
          scheduledWorkout
            ? el('button', {
                className: 'flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium',
                onClick: () => {
                  store.clearSchedule(dateKey);
                  document.body.removeChild(modal);
                  render();
                }
              }, 'Clear Schedule')
            : null,
          el('button', {
            className: 'flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium',
            onClick: () => document.body.removeChild(modal)
          }, 'Close')
        )
      )
    );

    document.body.appendChild(modal);
  };

  store.subscribe(render);
  render();

  return container;
}
