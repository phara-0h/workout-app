import { el } from '../utils.js';
import { store } from '../store.js';

export default function ProgressView() {
  const container = el('div', { className: 'min-h-screen bg-gray-50 pb-24' });
  let expandedId = null;

  const formatDate = (value) => {
    if (!value) return 'Unknown date';
    const date = new Date(value);
    return `${date.toLocaleDateString()} • ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const calculateStats = (history) => {
    let totalSets = 0;
    let totalVolume = 0;
    history.forEach((workout) => {
      (workout.exercises || []).forEach((exercise) => {
        (exercise.sets || []).forEach((set) => {
          const weight = Number(set.weight);
          const reps = Number(set.reps);
          if (Number.isFinite(weight) && Number.isFinite(reps)) {
            totalSets += 1;
            totalVolume += weight * reps;
          }
        });
      });
    });
    return {
      totalWorkouts: history.length,
      totalSets,
      totalVolume
    };
  };

  const renderHistoryCard = (workout) => {
    const exerciseCount = workout.exercises.length;
    const setCount = workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
    const isExpanded = expandedId === workout.id;

    const toggleButton = el('button', {
      className: 'text-indigo-600 hover:text-indigo-700 text-sm font-medium',
      onClick: () => {
        expandedId = isExpanded ? null : workout.id;
        render();
      }
    }, isExpanded ? 'Hide Details ↑' : 'View Details ↓');

    const deleteButton = el('button', {
      className: 'text-red-500 hover:text-red-700 text-sm font-medium',
      onClick: async () => {
        const confirmed = confirm(`Delete workout "${workout.dayName}" from ${formatDate(workout.date)}?`);
        if (confirmed) {
          await store.deleteWorkoutEntry(workout.id);
        }
      }
    }, 'Delete');

    const headerRow = el('div', { className: 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3' },
      el('div', {},
        el('h3', { className: 'text-lg font-semibold text-gray-900' }, workout.dayName || 'Workout'),
        el('p', { className: 'text-sm text-gray-500' },
          `Week ${workout.week} • ${formatDate(workout.date)}`
        )
      ),
      el('div', { className: 'flex items-center gap-3' },
        el('span', { className: 'px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full uppercase' },
          `${exerciseCount} exercise${exerciseCount === 1 ? '' : 's'}`
        ),
        el('span', { className: 'px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full' },
          `${setCount} set${setCount === 1 ? '' : 's'}`
        )
      )
    );

    const actionRow = el('div', { className: 'flex items-center justify-between mt-4' },
      toggleButton,
      deleteButton
    );

    const detailRows = isExpanded
      ? el('div', { className: 'mt-4 space-y-3' },
          workout.exercises.map((exercise) => {
            const completedSets = exercise.sets.filter((set) => set.completed).length;
            return el('div', { className: 'bg-gray-50 border border-gray-200 rounded-lg p-4' },
              el('div', { className: 'flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3' },
                el('div', {},
                  el('p', { className: 'font-semibold text-gray-900' }, exercise.name),
                  el('p', { className: 'text-sm text-gray-500 mt-1' }, exercise.sessionType || 'No prescription')
                ),
                el('span', { className: 'px-2 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded self-start' },
                  `${completedSets}/${exercise.sets.length} sets complete`
                )
              ),
              el('div', { className: 'mt-3 grid gap-2 sm:grid-cols-2' },
                exercise.sets.map((set, index) => {
                  const weight = set.weight === '' ? '–' : set.weight;
                  const reps = set.reps === '' ? '–' : set.reps;
                  const rpe = set.rpe === '' || set.rpe === null ? '–' : set.rpe;
                  return el('div', {
                    className: `text-sm flex justify-between items-center px-3 py-2 rounded border ${
                      set.completed ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'
                    }`
                  },
                    el('span', { className: 'text-gray-600' }, `Set ${index + 1}`),
                    el('span', { className: 'text-gray-800 font-medium' },
                      `${weight} lbs × ${reps} reps • RPE ${rpe}`
                    )
                  );
                })
              )
            );
          })
        )
      : null;

    return el('div', { className: 'bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4' },
      headerRow,
      actionRow,
      detailRows
    );
  };

  const render = () => {
    container.innerHTML = '';

    const history = store.workoutHistory || [];
    const stats = calculateStats(history);
    const big3 = store.getBig3Stats();

    const header = el('div', { className: 'bg-indigo-600 text-white shadow-sm border-b' },
      el('div', { className: 'max-w-5xl mx-auto px-4 py-6 flex items-center justify-between' },
        el('div', {},
          el('h1', { className: 'text-2xl font-bold' }, 'Progress Overview'),
          el('p', { className: 'text-indigo-100 text-sm mt-1' }, 'Track your recent workouts and long-term performance trends.')
        ),
        el('button', {
          className: 'bg-indigo-500 hover:bg-indigo-400 text-white font-semibold px-4 py-2 rounded-lg',
          onClick: () => store.setView('home')
        }, '← Home')
      )
    );

    const summaryGrid = el('div', { className: 'max-w-5xl mx-auto px-4 py-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4' },
      el('div', { className: 'bg-white border border-indigo-100 rounded-xl p-4 shadow-sm' },
        el('p', { className: 'text-sm text-gray-500' }, 'Total Workouts'),
        el('p', { className: 'text-2xl font-semibold text-indigo-700' }, stats.totalWorkouts.toString())
      ),
      el('div', { className: 'bg-white border border-indigo-100 rounded-xl p-4 shadow-sm' },
        el('p', { className: 'text-sm text-gray-500' }, 'Sets Logged'),
        el('p', { className: 'text-2xl font-semibold text-indigo-700' }, stats.totalSets.toString())
      ),
      el('div', { className: 'bg-white border border-indigo-100 rounded-xl p-4 shadow-sm' },
        el('p', { className: 'text-sm text-gray-500' }, 'Estimated Volume'),
        el('p', { className: 'text-2xl font-semibold text-indigo-700' }, `${Math.round(stats.totalVolume)} lbs`)
      ),
      el('div', { className: 'bg-white border border-indigo-100 rounded-xl p-4 shadow-sm' },
        el('p', { className: 'text-sm text-gray-500' }, 'Current Week'),
        el('p', { className: 'text-2xl font-semibold text-indigo-700' }, `Week ${store.currentWeek}`)
      )
    );

    const big3Section = el('div', { className: 'max-w-5xl mx-auto px-4' },
      el('h2', { className: 'text-lg font-semibold text-gray-900 mb-3' }, 'Big 3 Highlights'),
      el('div', { className: 'grid gap-4 sm:grid-cols-3' },
        ...[
          { label: 'Squat', data: big3.squat },
          { label: 'Bench Press', data: big3.bench },
          { label: 'Deadlift', data: big3.deadlift }
        ].map(({ label, data }) =>
          el('div', { className: 'bg-white border border-gray-200 rounded-xl p-4 shadow-sm' },
            el('h3', { className: 'text-md font-semibold text-gray-900' }, label),
            el('p', { className: 'text-sm text-gray-600 mt-1' }, `Max: ${data.max || 0} lbs`),
            el('p', { className: 'text-sm text-gray-600 mt-1' }, `Estimated 1RM: ${data.estimated1RM || 0} lbs`),
            el('p', { className: 'text-xs text-gray-500 mt-2 uppercase tracking-wide' }, `${data.sessions || 0} sessions logged`)
          )
        )
      )
    );

    const personalRecords = store.getAllPersonalRecords();
    const topPRs = personalRecords.slice(0, 5);

    const prSection = topPRs.length > 0
      ? el('div', { className: 'max-w-5xl mx-auto px-4 py-6' },
          el('h2', { className: 'text-lg font-semibold text-gray-900 mb-3' }, 'Personal Records'),
          el('div', { className: 'space-y-3' },
            ...topPRs.map(record =>
              el('div', { className: 'bg-white border border-gray-200 rounded-xl p-4' },
                el('div', { className: 'flex items-start justify-between' },
                  el('div', { className: 'flex-1' },
                    el('h3', { className: 'font-semibold text-gray-900' }, record.name),
                    el('div', { className: 'mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm' },
                      el('div', {},
                        el('p', { className: 'text-gray-500 text-xs' }, 'Max Weight'),
                        el('p', { className: 'font-semibold text-indigo-600' }, `${record.maxWeight} lbs`)
                      ),
                      el('div', {},
                        el('p', { className: 'text-gray-500 text-xs' }, 'Max Reps'),
                        el('p', { className: 'font-semibold text-green-600' }, `${record.maxReps} reps`)
                      ),
                      el('div', {},
                        el('p', { className: 'text-gray-500 text-xs' }, 'Est. 1RM'),
                        el('p', { className: 'font-semibold text-purple-600' }, `${record.estimated1RM} lbs`)
                      ),
                      el('div', {},
                        el('p', { className: 'text-gray-500 text-xs' }, 'Max Volume'),
                        el('p', { className: 'font-semibold text-orange-600' }, `${record.maxVolume} lbs`)
                      )
                    )
                  )
                )
              )
            )
          )
        )
      : null;

    const historySection = el('div', { className: 'max-w-5xl mx-auto px-4 py-6' },
      el('div', { className: 'flex items-center justify-between mb-4' },
        el('h2', { className: 'text-lg font-semibold text-gray-900' }, 'Workout History'),
        el('span', { className: 'text-sm text-gray-500' }, history.length > 0 ? `${history.length} recorded workout${history.length === 1 ? '' : 's'}` : '')
      ),
      history.length === 0
        ? el('div', { className: 'bg-white border border-gray-200 rounded-xl p-10 text-center text-gray-500' },
            'No workouts logged yet. Start your first session to see progress here!'
          )
        : el('div', { className: 'space-y-4' },
            ...history.map(renderHistoryCard)
          )
    );

    container.appendChild(header);
    container.appendChild(summaryGrid);
    container.appendChild(big3Section);
    if (prSection) container.appendChild(prSection);
    container.appendChild(historySection);
  };

  store.subscribe(render);
  render();

  return container;
}
