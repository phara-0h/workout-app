import { el } from '../utils.js';
import { store } from '../store.js';
import ExerciseSelectorModal from './ExerciseSelectorModal.js';
import ExerciseConfigModal from './ExerciseConfigModal.js';

export default function ProgramBuilderView() {
  const state = store.programBuilder;

  if (!state || typeof state !== 'object') {
    store.resetProgramBuilder();
    return ProgramBuilderView();
  }

  if (!Array.isArray(state.days)) state.days = [];
  if (!Number.isInteger(state.step)) state.step = state.days.length > 0 ? 3 : 1;
  if (state.currentDayIndex == null) state.currentDayIndex = 0;
  state.programName = state.programName || '';

  const container = el('div', { className: 'min-h-screen bg-gray-50 pb-24 flex flex-col' });

  const title = el('h1', { className: 'text-xl font-bold text-gray-900' }, '');
  const subTitle = el('p', { className: 'text-sm text-gray-500 mt-1' }, '');

  const header = el('div', { className: 'bg-white shadow-sm border-b sticky top-0 z-10' },
    el('div', { className: 'max-w-4xl mx-auto px-4 py-4 flex items-center justify-between' },
      el('div', { className: 'flex items-center gap-3' },
        el('button', {
          className: 'text-gray-600 hover:text-gray-900',
          onClick: () => store.setView('home')
        }, '← Back'),
        el('div', {}, title, subTitle)
      ),
      el('div', { className: 'flex items-center gap-2 text-sm text-gray-500' },
        el('span', {}, 'Step'),
        el('span', { className: 'font-semibold text-indigo-600' }, state.step.toString()),
        el('span', {}, 'of 3')
      )
    )
  );

  const progressBar = el('div', { className: 'bg-gray-200 h-1' },
    el('div', { className: 'h-1 bg-indigo-600 transition-all duration-300', style: `width: ${((state.step - 1) / 2) * 100}%;` })
  );

  const content = el('div', { className: 'max-w-4xl mx-auto w-full px-4 py-8 flex-1' });

  container.appendChild(header);
  container.appendChild(progressBar);
  container.appendChild(content);

  const headings = [
    { title: state.isEditing ? 'Update Program Name' : 'Name Your Program', description: 'Give your program a name so you can recognize it later.' },
    { title: state.isEditing ? 'Review Workout Days' : 'Add Workout Days', description: 'Create the structure of your split by adding workout days.' },
    { title: state.isEditing ? 'Adjust Your Workouts' : 'Build Your Workouts', description: 'Add exercises and DUP rotations for each day.' }
  ];

  const ensureCurrentDayIndex = () => {
    if (state.days.length === 0) {
      state.currentDayIndex = 0;
      return;
    }
    if (state.currentDayIndex < 0) state.currentDayIndex = 0;
    if (state.currentDayIndex >= state.days.length) {
      state.currentDayIndex = state.days.length - 1;
    }
  };

  const goToStep = (step) => {
    state.step = step;
    ensureCurrentDayIndex();
    render();
  };

  const updateHeader = () => {
    const index = Math.min(Math.max(state.step - 1, 0), headings.length - 1);
    const info = headings[index];
    title.textContent = info.title;
    subTitle.textContent = info.description;
    header.querySelector('span.font-semibold').textContent = state.step.toString();
    const width = ((state.step - 1) / 2) * 100;
    progressBar.firstChild.style.width = `${Math.max(0, Math.min(100, width))}%`;
  };

  const renderStep1 = () => {
    const card = el('div', { className: 'bg-white rounded-xl shadow-sm p-8 space-y-6' },
      el('div', {},
        el('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 'Program Name'),
        el('input', {
          type: 'text',
          value: state.programName,
          className: 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
          placeholder: 'e.g., Push/Pull/Legs, Upper/Lower, Bro Split',
          onInput: (event) => {
            state.programName = event.target.value;
            render();
          }
        })
      ),
      el('div', { className: 'flex justify-end' },
        el('button', {
          className: state.programName.trim()
            ? 'px-6 py-3 rounded-lg font-semibold bg-indigo-600 hover:bg-indigo-700 text-white'
            : 'px-6 py-3 rounded-lg font-semibold bg-gray-300 text-gray-500 cursor-not-allowed',
          disabled: !state.programName.trim(),
          onClick: () => goToStep(2)
        }, state.isEditing ? 'Next: Review Workout Days →' : 'Next: Add Workout Days →')
      )
    );

    if (!state.isEditing) {
      card.appendChild(el('div', { className: 'pt-4 border-t border-gray-100 space-y-3' },
        el('p', { className: 'text-sm text-gray-600' }, 'Need ideas? Try one of these:'),
        el('div', { className: 'grid grid-cols-2 gap-3' },
          ...['Push/Pull/Legs', 'Upper/Lower', 'Full Body', 'Bro Split'].map((name) =>
            el('button', {
              className: 'p-3 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 text-sm text-left',
              onClick: () => {
                state.programName = name;
                render();
              }
            }, name)
          )
        )
      ));
    }

    return card;
  };

  const renderStep2 = () => {
    const list = el('div', { className: 'space-y-3 mb-6' });

    if (state.days.length === 0) {
      list.appendChild(el('div', { className: 'border border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500' }, 'No workout days yet. Add your first day below.'));
    } else {
      state.days.forEach((day, index) => {
        list.appendChild(
          el('div', { className: 'flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200' },
            el('span', { className: 'text-2xl' }, '📅'),
            el('input', {
              type: 'text',
              value: day.name,
              className: 'flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
              placeholder: `Day ${index + 1}`,
              onInput: (event) => {
                state.days[index].name = event.target.value;
              }
            }),
            el('button', {
              className: 'text-red-500 hover:text-red-700 font-medium px-3 py-2',
              onClick: () => {
                state.days.splice(index, 1);
                ensureCurrentDayIndex();
                render();
              }
            }, '🗑️')
          )
        );
      });
    }

    const card = el('div', { className: 'bg-white rounded-xl shadow-sm p-8' },
      el('h2', { className: 'text-lg font-semibold text-gray-900 mb-2' }, state.isEditing ? 'Review Your Workout Days' : 'Add Your Workout Days'),
      el('p', { className: 'text-sm text-gray-600 mb-6' }, state.isEditing ? 'Rename, remove, or add days to adjust your split.' : 'Create the days for your program split.'),
      list,
      el('button', {
        className: 'w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-400 hover:text-indigo-600 font-medium',
        onClick: () => {
          const dayNumber = state.days.length + 1;
          state.days.push({
            id: `day-${Date.now()}`,
            name: `Day ${dayNumber}`,
            exercises: []
          });
          render();
        }
      }, '+ Add Workout Day'),
      el('div', { className: 'mt-8 flex justify-between' },
        el('button', {
          className: 'px-6 py-3 text-gray-700 font-semibold hover:bg-gray-100 rounded-lg',
          onClick: () => goToStep(1)
        }, '← Back'),
        el('button', {
          className: state.days.length > 0
            ? 'px-6 py-3 rounded-lg font-semibold bg-indigo-600 hover:bg-indigo-700 text-white'
            : 'px-6 py-3 rounded-lg font-semibold bg-gray-300 text-gray-500 cursor-not-allowed',
          disabled: state.days.length === 0,
          onClick: () => {
            if (state.days.length === 0) return;
            state.currentDayIndex = 0;
            goToStep(3);
          }
        }, state.isEditing ? 'Next: Update Exercises →' : 'Next: Add Exercises →')
      )
    );

    return card;
  };

  const renderExerciseCard = (exercise, index) => {
    return el('div', { className: 'p-4 bg-gray-50 rounded-lg border border-gray-200' },
      el('div', { className: 'flex items-start justify-between' },
        el('div', { className: 'flex-1' },
          el('div', { className: 'flex items-center gap-2 mb-2' },
            el('h3', { className: 'font-semibold text-gray-900' }, exercise.exercise_name),
            exercise.is_main
              ? el('span', { className: 'px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded' }, 'MAIN LIFT')
              : null
          ),
          exercise.is_main && Array.isArray(exercise.rotation)
            ? el('div', { className: 'text-sm text-gray-600 space-y-1' },
                el('p', { className: 'font-medium' }, 'DUP Rotation:'),
                ...exercise.rotation.map((rot, i) => el('p', { className: 'text-xs' }, `Week ${i + 1}: ${rot}`))
              )
            : el('p', { className: 'text-sm text-gray-600' }, `${exercise.sets} @ ${exercise.rpe}`)
        ),
        el('button', {
          className: 'text-red-500 hover:text-red-700 ml-4',
          onClick: () => {
            const day = state.days[state.currentDayIndex];
            day.exercises.splice(index, 1);
            render();
          }
        }, '🗑️')
      )
    );
  };

  const addExercise = () => {
    const currentDay = state.days[state.currentDayIndex];
    const selectorModal = ExerciseSelectorModal((exercise) => {
      document.body.removeChild(selectorModal);
      const configModal = ExerciseConfigModal(exercise, (config) => {
        document.body.removeChild(configModal);
        currentDay.exercises.push({
          exercise_id: exercise.id,
          exercise_name: exercise.name,
          is_main: config.is_main,
          rotation: config.is_main ? config.rotation : null,
          sets: !config.is_main ? config.sets : null,
          rpe: !config.is_main ? config.rpe : null
        });
        render();
      }, () => {
        document.body.removeChild(configModal);
      });
      document.body.appendChild(configModal);
    }, () => {
      document.body.removeChild(selectorModal);
    });
    document.body.appendChild(selectorModal);
  };

  const renderStep3 = () => {
    ensureCurrentDayIndex();
    if (state.days.length === 0) {
      return el('div', { className: 'bg-white rounded-xl shadow-sm p-8 text-center space-y-4' },
        el('p', { className: 'text-gray-600' }, 'You need at least one workout day before adding exercises.'),
        el('button', {
          className: 'px-6 py-3 rounded-lg font-semibold bg-indigo-600 hover:bg-indigo-700 text-white',
          onClick: () => goToStep(2)
        }, '← Back to Days')
      );
    }

    const tabs = el('div', { className: 'flex gap-2 pb-2 overflow-x-auto mb-6' },
      ...state.days.map((day, index) =>
        el('button', {
          className: `px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
            index === state.currentDayIndex ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`,
          onClick: () => {
            state.currentDayIndex = index;
            render();
          }
        }, day.name)
      )
    );

    const currentDay = state.days[state.currentDayIndex];

    const card = el('div', { className: 'bg-white rounded-xl shadow-sm p-8 space-y-6' },
      el('div', { className: 'flex items-center justify-between' },
        el('div', {},
          el('h2', { className: 'text-lg font-semibold text-gray-900' }, currentDay.name),
          el('p', { className: 'text-sm text-gray-600 mt-1' }, `${currentDay.exercises.length} exercise${currentDay.exercises.length === 1 ? '' : 's'}`)
        ),
        el('button', {
          className: 'px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm font-medium',
          onClick: () => goToStep(2)
        }, '← Back to Days')
      ),
      el('div', { className: 'space-y-3' },
        currentDay.exercises.length === 0
          ? el('div', { className: 'border border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500' }, 'No exercises yet. Add one below.')
          : el('div', { className: 'space-y-3' }, ...currentDay.exercises.map((exercise, index) => renderExerciseCard(exercise, index)))
      ),
      el('button', {
        className: 'w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-400 hover:text-indigo-600 font-medium',
        onClick: addExercise
      }, '+ Add Exercise from Library'),
      el('div', { className: 'flex justify-between items-center pt-4 border-t border-gray-100' },
        el('button', {
          className: `px-6 py-3 text-gray-700 font-semibold hover:bg-gray-100 rounded-lg ${state.currentDayIndex === 0 ? 'invisible' : ''}`,
          onClick: () => {
            if (state.currentDayIndex > 0) {
              state.currentDayIndex -= 1;
              render();
            }
          }
        }, '← Previous Day'),
        state.currentDayIndex < state.days.length - 1
          ? el('button', {
              className: 'px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold',
              onClick: () => {
                if (state.currentDayIndex < state.days.length - 1) {
                  state.currentDayIndex += 1;
                  render();
                }
              }
            }, 'Next Day →')
          : el('button', {
              className: 'px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold',
              onClick: async () => {
                const hasExercises = state.days.some((day) => day.exercises.length > 0);
                if (!hasExercises) {
                  alert('Please add at least one exercise to one of your workout days.');
                  return;
                }

                const programData = {
                  name: state.programName,
                  days: state.days
                };

                try {
                  await store.saveCurrentProgram(programData);
                  alert(state.isEditing ? 'Program updated successfully! 🎉' : 'Program created successfully! 🎉');
                  store.setView('home');
                } catch (error) {
                  console.error('Error saving program:', error);
                  alert('Failed to save program. Please try again.');
                }
              }
            }, state.isEditing ? '✓ Update Program' : '✓ Finish & Save Program')
      )
    );

    return el('div', {}, tabs, card);
  };

  const render = () => {
    updateHeader();
    content.innerHTML = '';

    let stepView;
    if (state.step === 1) {
      stepView = renderStep1();
    } else if (state.step === 2) {
      stepView = renderStep2();
    } else {
      stepView = renderStep3();
    }

    content.appendChild(stepView);
  };

  render();

  return container;
}
