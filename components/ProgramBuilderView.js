import { el } from '../utils.js';
import { store } from '../store.js';
import ExerciseSelectorModal from './ExerciseSelectorModal.js';
import ExerciseConfigModal from './ExerciseConfigModal.js';

export default function ProgramBuilderView() {
  const builder = store.programBuilder;

  const container = el('div', { className: 'min-h-screen bg-gray-50 pb-20' });

  const header = el('div', { className: 'bg-white shadow-sm border-b sticky top-0 z-10' },
    el('div', { className: 'max-w-4xl mx-auto px-4 py-4 flex items-center justify-between' },
      el('div', { className: 'flex items-center gap-3' },
        el('button', {
          className: 'text-gray-600 hover:text-gray-900',
          onClick: () => store.setView('home')
        }, '← Back'),
        el('h1', { className: 'text-xl font-bold text-gray-900' },
          builder.step === 1 ? 'Name Your Program' :
          builder.step === 2 ? 'Add Workout Days' :
          'Build Your Workouts'
        )
      ),
      el('div', { className: 'text-sm text-gray-500' }, `Step ${builder.step} of 3`)
    )
  );
  container.appendChild(header);

  const progressBar = el('div', { className: 'bg-gray-200 h-1' },
    el('div', {
      className: 'bg-indigo-600 h-1 transition-all duration-300',
      style: `width: ${(builder.step / 3) * 100}%`
    })
  );
  container.appendChild(progressBar);

  const renderStep1 = () => {
    const stepContainer = el('div', { className: 'max-w-2xl mx-auto px-4 py-8' });
    const card = el('div', { className: 'bg-white rounded-xl shadow-sm p-8' });

    card.appendChild(el('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 'Program Name'));
    card.appendChild(el('input', {
      type: 'text',
      className: 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
      placeholder: 'e.g., Push/Pull/Legs, Upper/Lower, Bro Split',
      value: builder.programName,
      onInput: (event) => {
        builder.programName = event.target.value;
        store.notify();
      }
    }));

    const nextButton = el('button', {
      className: `px-6 py-3 rounded-lg font-semibold ${
        builder.programName.trim()
          ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
      }`,
      disabled: !builder.programName.trim(),
      onClick: () => {
        if (!builder.programName.trim()) return;
        builder.step = 2;
        store.notify();
      }
    }, 'Next: Add Workout Days →');

    const actions = el('div', { className: 'mt-6 flex justify-end' }, nextButton);
    card.appendChild(actions);
    stepContainer.appendChild(card);

    const examples = el('div', { className: 'mt-8' });
    examples.appendChild(el('h3', { className: 'text-sm font-medium text-gray-700 mb-3' }, 'Popular program examples:'));
    const exampleGrid = el('div', { className: 'grid grid-cols-2 gap-3' });
    ['Push/Pull/Legs', 'Upper/Lower', 'Full Body', 'Bro Split'].forEach((name) => {
      exampleGrid.appendChild(el('button', {
        className: 'p-3 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 text-sm text-left',
        onClick: () => {
          builder.programName = name;
          store.notify();
        }
      }, name));
    });
    examples.appendChild(exampleGrid);
    stepContainer.appendChild(examples);

    return stepContainer;
  };

  const renderStep2 = () => {
    const stepContainer = el('div', { className: 'max-w-2xl mx-auto px-4 py-8' });
    const card = el('div', { className: 'bg-white rounded-xl shadow-sm p-8' });

    card.appendChild(el('h2', { className: 'text-lg font-semibold text-gray-900 mb-4' }, 'Add Your Workout Days'));
    card.appendChild(el('p', { className: 'text-sm text-gray-600 mb-6' }, 'Create as many workout days as you need for your program'));

    const list = el('div', { className: 'space-y-3 mb-6' });
    if (builder.days.length === 0) {
      list.appendChild(el('p', { className: 'text-center text-gray-500 py-8' }, 'No workout days yet. Add your first day below.'));
    } else {
      builder.days.forEach((day, index) => {
        const row = el('div', { className: 'flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200' });
        row.appendChild(el('span', { className: 'text-2xl' }, '📅'));
        row.appendChild(el('input', {
          type: 'text',
          className: 'flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
          value: day.name,
          placeholder: `Day ${index + 1}`,
          onInput: (event) => {
            builder.days[index].name = event.target.value;
            store.notify();
          }
        }));
        row.appendChild(el('button', {
          className: 'text-red-500 hover:text-red-700 font-medium px-3 py-2',
          onClick: () => {
            builder.days.splice(index, 1);
            if (builder.currentDayIndex != null && builder.currentDayIndex >= builder.days.length) {
              builder.currentDayIndex = builder.days.length - 1;
            }
            store.notify();
          }
        }, '🗑️'));
        list.appendChild(row);
      });
    }

    card.appendChild(list);

    card.appendChild(el('button', {
      className: 'w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-400 hover:text-indigo-600 font-medium',
      onClick: () => {
        const dayNumber = builder.days.length + 1;
        builder.days.push({
          id: `day-${Date.now()}`,
          name: `Day ${dayNumber}`,
          exercises: []
        });
        store.notify();
      }
    }, '+ Add Workout Day'));

    const nav = el('div', { className: 'mt-8 flex justify-between' });
    nav.appendChild(el('button', {
      className: 'px-6 py-3 text-gray-700 font-semibold hover:bg-gray-100 rounded-lg',
      onClick: () => {
        builder.step = 1;
        store.notify();
      }
    }, '← Back'));
    nav.appendChild(el('button', {
      className: `px-6 py-3 rounded-lg font-semibold ${
        builder.days.length > 0
          ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
      }`,
      disabled: builder.days.length === 0,
      onClick: () => {
        if (builder.days.length === 0) return;
        builder.step = 3;
        builder.currentDayIndex = 0;
        store.notify();
      }
    }, 'Next: Add Exercises →'));
    card.appendChild(nav);

    stepContainer.appendChild(card);
    return stepContainer;
  };

  const renderStep3 = () => {
    if (builder.currentDayIndex == null || !builder.days[builder.currentDayIndex]) {
      builder.currentDayIndex = 0;
    }

    const currentDay = builder.days[builder.currentDayIndex];

    const stepContainer = el('div', { className: 'max-w-2xl mx-auto px-4 py-8' });

    const tabsWrapper = el('div', { className: 'mb-6 overflow-x-auto' });
    const tabs = el('div', { className: 'flex gap-2 pb-2' });
    builder.days.forEach((day, index) => {
      tabs.appendChild(el('button', {
        className: `px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
          index === builder.currentDayIndex
            ? 'bg-indigo-600 text-white'
            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
        }`,
        onClick: () => {
          builder.currentDayIndex = index;
          store.notify();
        }
      }, day.name));
    });
    tabsWrapper.appendChild(tabs);
    stepContainer.appendChild(tabsWrapper);

    const card = el('div', { className: 'bg-white rounded-xl shadow-sm p-8' });
    const cardHeader = el('div', { className: 'flex items-center justify-between mb-6' });
    cardHeader.appendChild(el('h2', { className: 'text-lg font-semibold text-gray-900' }, currentDay.name));
    cardHeader.appendChild(el('span', { className: 'text-sm text-gray-500' }, `${currentDay.exercises.length} exercise${currentDay.exercises.length !== 1 ? 's' : ''}`));
    card.appendChild(cardHeader);

    const exerciseList = el('div', { className: 'space-y-3 mb-6' });
    if (currentDay.exercises.length === 0) {
      exerciseList.appendChild(el('p', { className: 'text-center text-gray-500 py-8' }, 'No exercises added yet. Add your first exercise below.'));
    } else {
      currentDay.exercises.forEach((exercise, index) => {
        const tile = el('div', { className: 'p-4 bg-gray-50 rounded-lg border border-gray-200' });
        const topRow = el('div', { className: 'flex items-start justify-between' });

        const details = el('div', { className: 'flex-1' });
        const nameRow = el('div', { className: 'flex items-center gap-2 mb-2' });
        nameRow.appendChild(el('h3', { className: 'font-semibold text-gray-900' }, exercise.exercise_name));
        if (exercise.is_main) {
          nameRow.appendChild(el('span', { className: 'px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded' }, 'MAIN LIFT'));
        }
        details.appendChild(nameRow);

        if (exercise.is_main && Array.isArray(exercise.rotation)) {
          const rotationList = el('div', { className: 'text-sm text-gray-600' });
          rotationList.appendChild(el('p', { className: 'font-medium mb-1' }, 'DUP Rotation:'));
          exercise.rotation.forEach((rot, i) => {
            rotationList.appendChild(el('p', { className: 'text-xs' }, `Week ${i + 1}: ${rot}`));
          });
          details.appendChild(rotationList);
        } else {
          details.appendChild(el('div', { className: 'text-sm text-gray-600' }, `${exercise.sets} @ ${exercise.rpe}`));
        }

        topRow.appendChild(details);
        topRow.appendChild(el('button', {
          className: 'text-red-500 hover:text-red-700 ml-4',
          onClick: () => {
            currentDay.exercises.splice(index, 1);
            store.notify();
          }
        }, '🗑️'));
        tile.appendChild(topRow);
        exerciseList.appendChild(tile);
      });
    }
    card.appendChild(exerciseList);

    card.appendChild(el('button', {
      className: 'w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-400 hover:text-indigo-600 font-medium',
      onClick: () => {
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
            store.notify();
          }, () => {
            document.body.removeChild(configModal);
          });
          document.body.appendChild(configModal);
        }, () => {
          document.body.removeChild(selectorModal);
        });
        document.body.appendChild(selectorModal);
      }
    }, '+ Add Exercise from Library'));

    stepContainer.appendChild(card);

    const nav = el('div', { className: 'mt-8 flex justify-between items-center' });
    nav.appendChild(el('button', {
      className: `px-6 py-3 text-gray-700 font-semibold hover:bg-white rounded-lg ${builder.currentDayIndex === 0 ? 'invisible' : ''}`,
      onClick: () => {
        if (builder.currentDayIndex > 0) {
          builder.currentDayIndex -= 1;
          store.notify();
        }
      }
    }, '← Previous Day'));

    nav.appendChild(el('button', {
      className: 'px-6 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-lg',
      onClick: () => {
        builder.step = 2;
        store.notify();
      }
    }, 'Back to Days'));

    const finishButton = builder.currentDayIndex < builder.days.length - 1
      ? el('button', {
          className: 'px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold',
          onClick: () => {
            if (builder.currentDayIndex < builder.days.length - 1) {
              builder.currentDayIndex += 1;
              store.notify();
            }
          }
        }, 'Next Day →')
      : el('button', {
          className: 'px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold',
          onClick: async () => {
            const hasExercises = builder.days.some((day) => day.exercises.length > 0);
            if (!hasExercises) {
              alert('Please add at least one exercise to one of your workout days.');
              return;
            }
            const programData = {
              name: builder.programName,
              days: builder.days
            };
            try {
              await store.saveCurrentProgram(programData);
              alert('Program created successfully! 🎉');
              store.setView('home');
            } catch (error) {
              console.error('Error saving program:', error);
              alert('Failed to save program. Please try again.');
            }
          }
        }, '✓ Finish & Save Program');

    nav.appendChild(finishButton);
    stepContainer.appendChild(nav);

    return stepContainer;
  };

  if (builder.step === 1) {
    container.appendChild(renderStep1());
  } else if (builder.step === 2) {
    container.appendChild(renderStep2());
  } else {
    container.appendChild(renderStep3());
  }

  return container;
}
