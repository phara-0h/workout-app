import { defaultProgram } from './programData.js';

// Simple state management
class WorkoutStore {
  constructor() {
    this.currentWeek = 1;
    this.workoutHistory = [];
    this.program = null;
    this.activeWorkout = null;
    this.expandedExercise = null;
    this.view = 'home';
    this.listeners = [];
    this.load();
  }

  load() {
    const saved = localStorage.getItem('workoutData');
    if (saved) {
      const data = JSON.parse(saved);
      this.currentWeek = data.currentWeek || 1;
      this.workoutHistory = data.history || [];
      this.program = data.program || defaultProgram;
    } else {
      this.program = defaultProgram;
    }
  }

  save() {
    localStorage.setItem('workoutData', JSON.stringify({
      currentWeek: this.currentWeek,
      history: this.workoutHistory,
      program: this.program
    }));
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
  }

  notify() {
    this.listeners.forEach(listener => listener());
  }

  setWeek(week) {
    this.currentWeek = Math.max(1, Math.min(12, week));
    this.save();
  }

  startWorkout(dayKey) {
    const day = this.program[dayKey];
    const sessionIndex = this.getSessionType(this.currentWeek, parseInt(dayKey.replace('day', '')));
    
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

  finishWorkout() {
    this.workoutHistory = [this.activeWorkout, ...this.workoutHistory];
    this.activeWorkout = null;
    this.expandedExercise = null;
    this.view = 'home';
    this.save();
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

  updateProgram(newProgram) {
    this.program = newProgram;
    this.save();
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
    const squat = this.getExerciseHistory("Back Squat");
    const bench = this.getExerciseHistory("Barbell Bench Press");
    const deadlift = this.getExerciseHistory("Conventional Deadlift");

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
}

// Initialize store
const store = new WorkoutStore();

// UI Helper functions
const el = (tag, props = {}, ...children) => {
  const element = document.createElement(tag);
  Object.entries(props).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key.startsWith('on')) {
      element.addEventListener(key.substring(2).toLowerCase(), value);
    } else {
      element.setAttribute(key, value);
    }
  });
  children.forEach(child => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else if (child) {
      element.appendChild(child);
    }
  });
  return element;
};

// Components
function HomeView() {
  const container = el('div', { className: 'min-h-screen bg-gray-50 pb-20' });
  
  // Header
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
        onClick: () => store.setView('edit')
      }, '✏️ Edit')
    )
  );

  // Workout days
  const daysContainer = el('div', { className: 'p-4 space-y-3' });
  Object.entries(store.program).forEach(([key, day]) => {
    const sessionIndex = store.getSessionType(store.currentWeek, parseInt(key.replace('day', '')));
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

  // Recent workouts
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

function WorkoutView() {
  if (!store.activeWorkout) return HomeView();

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
          const reps = parseInt(repsInput.value);
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

function ProgressView() {
  const container = el('div', { className: 'min-h-screen bg-gray-50 pb-20' });
  
  const header = el('div', { className: 'bg-blue-600 text-white p-6 shadow-lg' },
    el('h1', { className: 'text-2xl font-bold' }, '📈 Progress Tracking'),
    el('button', {
      className: 'mt-2 bg-blue-500 px-4 py-2 rounded',
      onClick: () => store.setView('home')
    }, '← Back')
  );

  const big3 = store.getBig3Stats();
  const statsContainer = el('div', { className: 'p-4' },
    el('h2', { className: 'font-bold text-xl mb-3' }, 'Big 3 Stats'),
    
    el('div', { className: 'bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3' },
      el('h3', { className: 'font-semibold text-lg text-gray-900' }, 'Squat'),
      el('p', { className: 'text-sm text-gray-600' }, `Max Weight: ${big3.squat.max}lbs`),
      el('p', { className: 'text-sm text-gray-600' }, `Estimated 1RM: ${big3.squat.estimated1RM}lbs`),
      el('p', { className: 'text-xs text-gray-500 mt-1' }, `${big3.squat.sessions} sessions logged`)
    ),
    
    el('div', { className: 'bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3' },
      el('h3', { className: 'font-semibold text-lg text-gray-900' }, 'Bench Press'),
      el('p', { className: 'text-sm text-gray-600' }, `Max Weight: ${big3.bench.max}lbs`),
      el('p', { className: 'text-sm text-gray-600' }, `Estimated 1RM: ${big3.bench.estimated1RM}lbs`),
      el('p', { className: 'text-xs text-gray-500 mt-1' }, `${big3.bench.sessions} sessions logged`)
    ),
    
    el('div', { className: 'bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6' },
      el('h3', { className: 'font-semibold text-lg text-gray-900' }, 'Deadlift'),
      el('p', { className: 'text-sm text-gray-600' }, `Max Weight: ${big3.deadlift.max}lbs`),
      el('p', { className: 'text-sm text-gray-600' }, `Estimated 1RM: ${big3.deadlift.estimated1RM}lbs`),
      el('p', { className: 'text-xs text-gray-500 mt-1' }, `${big3.deadlift.sessions} sessions logged`)
    )
  );

  container.appendChild(header);
  container.appendChild(statsContainer);
  return container;
}

function EditProgramView() {
  const container = el('div', { className: 'min-h-screen bg-gray-50 pb-20' });
  const tempProgram = JSON.parse(JSON.stringify(store.program));
  
  const header = el('div', { className: 'bg-blue-600 text-white p-6 shadow-lg' },
    el('div', { className: 'flex items-center justify-between' },
      el('h1', { className: 'text-2xl font-bold' }, 'Edit Program'),
      el('button', {
        className: 'bg-green-500 px-4 py-2 rounded font-medium',
        onClick: () => {
          store.updateProgram(tempProgram);
          store.setView('home');
        }
      }, '💾 Save')
    )
  );

  const programContainer = el('div', { className: 'p-4' });
  
  Object.entries(tempProgram).forEach(([dayKey, day]) => {
    const dayCard = el('div', { className: 'bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4' },
      el('h2', { className: 'font-bold text-lg mb-3' }, day.name)
    );

    day.exercises.forEach((ex, exIndex) => {
      const exerciseBox = el('div', { className: 'mb-3 p-3 bg-gray-50 rounded' });
      
      const headerRow = el('div', { className: 'flex justify-between items-start mb-2' });
      const nameInput = el('input', {
        type: 'text',
        value: ex.name,
        className: 'flex-1 px-2 py-1 border border-gray-300 rounded text-sm font-semibold',
        onInput: (e) => {
          tempProgram[dayKey].exercises[exIndex].name = e.target.value;
        }
      });
      headerRow.appendChild(nameInput);

      if (ex.type !== 'main') {
        const deleteBtn = el('button', {
          className: 'ml-2 text-red-500 hover:text-red-700',
          onClick: () => {
            tempProgram[dayKey].exercises.splice(exIndex, 1);
            render();
          }
        }, '✕');
        headerRow.appendChild(deleteBtn);
      }
      exerciseBox.appendChild(headerRow);

      if (ex.rotation) {
        exerciseBox.appendChild(
          el('p', { className: 'text-xs text-gray-600' }, 'Main lift with DUP rotation')
        );
      } else {
        const setsInput = el('input', {
          type: 'text',
          value: ex.sets,
          className: 'w-full px-2 py-1 border border-gray-300 rounded text-sm',
          placeholder: 'e.g. 3x10-12',
          onInput: (e) => {
            tempProgram[dayKey].exercises[exIndex].sets = e.target.value;
          }
        });
        exerciseBox.appendChild(setsInput);
      }

      dayCard.appendChild(exerciseBox);
    });

    const addBtn = el('button', {
      className: 'w-full bg-blue-500 text-white py-2 rounded font-medium hover:bg-blue-600',
      onClick: () => {
        tempProgram[dayKey].exercises.push({
          name: 'New Exercise',
          type: 'accessory',
          sets: '3x10-12',
          rpe: 'RPE 7-8'
        });
        render();
      }
    }, '+ Add Exercise');
    dayCard.appendChild(addBtn);

    programContainer.appendChild(dayCard);
  });

  container.appendChild(header);
  container.appendChild(programContainer);
  return container;
}

// Main render function
function render() {
  const root = document.getElementById('root');
  root.innerHTML = '';
  
  let view;
  switch (store.view) {
    case 'workout':
      view = WorkoutView();
      break;
    case 'progress':
      view = ProgressView();
      break;
    case 'edit':
      view = EditProgramView();
      break;
    default:
      view = HomeView();
  }
  
  root.appendChild(view);
}

// Initialize app
store.subscribe(render);
render();
