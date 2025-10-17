import { el } from '../utils.js';
import { store } from '../store.js';
import ExerciseSelectorModal from './ExerciseSelectorModal.js';
import ExerciseConfigModal from './ExerciseConfigModal.js';

export default function ProgramBuilderView() {
  const container = el('div', { className: 'min-h-screen bg-gray-50 pb-20' });

  const renderHeader = (builder) => el('div', { className: 'bg-white shadow-sm border-b sticky top-0 z-10' },
    el('div', { className: 'max-w-4xl mx-auto px-4 py-4 flex items-center justify-between' },
      el('div', { className: 'flex items-center gap-3' },
        el('button', {
          className: 'text-gray-600 hover:text-gray-900',
          onClick: () => store.setView('home')
        }, '← Back'),
        el('h1', { className: 'text-xl font-bold text-gray-900' },
          builder.step === 1
            ? (builder.isEditing ? 'Update Program Name' : 'Name Your Program')
            : builder.step === 2
              ? (builder.isEditing ? 'Review Workout Days' : 'Add Workout Days')
              : (builder.isEditing ? 'Adjust Your Workouts' : 'Build Your Workouts')
        )
      ),
      el('div', { className: 'text-sm text-gray-500' }, `Step ${builder.step} of 3`)
    )
  );

  const renderProgress = (builder) => el('div', { className: 'bg-gray-200 h-1' },
    el('div', {
      className: 'bg-indigo-600 h-1 transition-all duration-300',
      style: `width: ${(builder.step / 3) * 100}%`
    })
  );

  const renderStep1 = (builder) => {
    const step = el('div', { className: 'max-w-2xl mx-auto px-4 py-8' });
    const card = el('div', { className: 'bg-white rounded-xl shadow-sm p-8' });

    card.appendChild(el('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 'Program Name'));

    const nextButton = el('button', {
      disabled: true,
      onClick: () => {
        if (!builder.programName.trim()) return;
        builder.step = 2;
        store.notify();
      }
    }, builder.isEditing ? 'Next: Review Workout Days →' : 'Next: Add Workout Days →');

    const updateNextState = () => {
      const enabled = builder.programName.trim().length > 0;
      nextButton.disabled = !enabled;
      nextButton.className = enabled
        ? 'px-6 py-3 rounded-lg font-semibold bg-indigo-600 hover:bg-indigo-700 text-white'
        : 'px-6 py-3 rounded-lg font-semibold bg-gray-300 text-gray-500 cursor-not-allowed';
    };

    const input = el('input', {
      type: 'text',
      className: 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
      placeholder: 'e.g., Push/Pull/Legs, Upper/Lower, Bro Split',
      value: builder.programName,
      onInput: (event) => {
        builder.programName = event.target.value;
        updateNextState();
      }
    });

    card.appendChild(input);
    updateNextState();
    card.appendChild(el('div', { className: 'mt-6 flex justify-end' }, nextButton));
    step.appendChild(card);

    if (!builder.isEditing) {
      const examples = el('div', { className: 'mt-8' },
        el('h3', { className: 'text-sm font-medium text-gray-700 mb-3' }, 'Need ideas? Try one of these:'),
        el('div', { className: 'grid grid-cols-2 gap-3' },
          ['Push/Pull/Legs', 'Upper/Lower', 'Full Body', 'Bro Split'].map((name) =>
            el('button', {
              className: 'p-3 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 text-sm text-left',
              onClick: () => {
                builder.programName = name;
                input.value = name;
                updateNextState();
              }
            }, name)
          )
        )
      );
      step.appendChild(examples);
    }

    return step;
  };

  const renderStep2 = (builder) => {
    const step = el('div', { className: 'max-w-2xl mx-auto px-4 py-8' });
    const card = el('div', { className: 'bg-white rounded-xl shadow-sm p-8' });

    card.appendChild(el('h2', { className: 'text-lg font-semibold text-gray-900 mb-4' },
      builder.isEditing ? 'Review Your Workout Days' : 'Add Your Workout Days'
    ));
    card.appendChild(el('p', { className: 'text-sm text-gray-600 mb-6' },
      builder.isEditing
        ? 'Rename, remove, or add new days to keep your split organized.'
        : 'Create as many workout days as you need for your program.'
    ));

    const list = el('div', { className: 'space-y-3 mb-6' });
    if (builder.days.length === 0) {
      list.appendChild(el('p', { className: 'text-center text-gray-500 py-8' }, 'No workout days yet. Add your first day below.'));
    } else {
      builder.days.forEach((day, index) => {
        list.appendChild(
          el('div', { className: 'flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200' },
            el('span', { className: 'text-2xl' }, '📅'),
            el('input', {
              type: 'text',
              className: 'flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
              value: day.name,
              placeholder: `Day ${index + 1}`,
              onInput: (event) => {
                builder.days[index].name = event.target.value;
              }
            }),
            el('button', {
              className: 'text-red-500 hover:text-red-700 font-medium px-3 py-2',
              onClick: () => {
                builder.days.splice(index, 1);
                if (builder.currentDayIndex != null && builder.currentDayIndex >= builder.days.length) {
                  builder.currentDayIndex = builder.days.length - 1;
                }
                store.notify();
              }
            }, '🗑️')
          )
        );
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

    const nextEnabled = builder.days.length > 0;
    const nextButtonClasses = nextEnabled
      ? 'px-6 py-3 rounded-lg font-semibold bg-indigo-600 hover:bg-indigo-700 text-white'
      : 'px-6 py-3 rounded-lg font-semibold bg-gray-300 text-gray-500 cursor-not-allowed';

    card.appendChild(el('div', { className: 'mt-8 flex justify-between' },
      el('button', {
        className: 'px-6 py-3 text-gray-700 font-semibold hover:bg-gray-100 rounded-lg',
        onClick: () => {
          builder.step = 1;
          store.notify();
        }
      }, '← Back'),
      el('button', {
        className: nextButtonClasses,
        disabled: !nextEnabled,
        onClick: () => {
          if (!nextEnabled) return;
          builder.step = 3;
          builder.currentDayIndex = 0;
          store.notify();
        }
      }, builder.isEditing ? 'Next: Update Exercises →' : 'Next: Add Exercises →')
    ));

    step.appendChild(card);
    return step;
  };

  const renderStep3 = (builder) => {
    if (builder.currentDayIndex == null || !builder.days[builder.currentDayIndex]) {
      builder.currentDayIndex = 0;
    }

    const currentDay = builder.days[builder.currentDayIndex];
    const step = el('div', { className: 'max-w-2xl mx-auto px-4 py-8' });

    const tabs = el('div', { className: 'mb-6 overflow-x-auto' },
      el('div', { className: 'flex gap-2 pb-2' },
        builder.days.map((day, index) =>
          el('button', {
            className: `px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
              index === builder.currentDayIndex
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`,
            onClick: () => {
              builder.currentDayIndex = index;
              store.notify();
            }
          }, day.name)
        )
      )
    );
    step.appendChild(tabs);

    const card = el('div', { className: 'bg-white rounded-xl shadow-sm p-8' },
      el('div', { className: 'flex items-center justify-between mb-6' },
        el('h2', { className: 'text-lg font-semibold text-gray-900' }, currentDay.name),
        el('span', { className: 'text-sm text-gray-500' }, `${currentDay.exercises.length} exercise${currentDay.exercises.length !== 1 ? 's' : ''}`)
      )
    );

    const exerciseList = el('div', { className: 'space-y-3 mb-6' });
    if (currentDay.exercises.length === 0) {
      exerciseList.appendChild(el('p', { className: 'text-center text-gray-500 py-8' }, 'No exercises added yet. Add your first exercise below.'));
    } else {
      currentDay.exercises.forEach((exercise, index) => {
        exerciseList.appendChild(
          el('div', { className: 'p-4 bg-gray-50 rounded-lg border border-gray-200' },
            el('div', { className: 'flex items-start justify-between' },
              el('div', { className: 'flex-1' },
                el('div', { className: 'flex items-center gap-2 mb-2' },
                  el('h3', { className: 'font-semibold text-gray-900' }, exercise.exercise_name),
                  exercise.is_main
                    ? el('span', { className: 'px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded' }, 'MAIN LIFT')
                    : null
                ),
                exercise.is_main && Array.isArray(exercise.rotation)
                  ? el('div', { className: 'text-sm text-gray-600' },
                      el('p', { className: 'font-medium mb-1' }, 'DUP Rotation:'),
                      ...exercise.rotation.map((rot, i) => el('p', { className: 'text-xs' }, `Week ${i + 1}: ${rot}`))
                    )
                  : el('div', { className: 'text-sm text-gray-600' }, `${exercise.sets} @ ${exercise.rpe}`)
              ),
              el('button', {
                className: 'text-red-500 hover:text-red-700 ml-4',
                onClick: () => {
                  currentDay.exercises.splice(index, 1);
                  store.notify();
                }
              }, '🗑️')
            )
          )
        );
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

    step.appendChild(card);

    const nav = el('div', { className: 'mt-8 flex justify-between items-center' },
      el('button', {
        className: `px-6 py-3 text-gray-700 font-semibold hover:bg-white rounded-lg ${builder.currentDayIndex === 0 ? 'invisible' : ''}`,
        onClick: () => {
          if (builder.currentDayIndex > 0) {
            builder.currentDayIndex -= 1;
            store.notify();
          }
        }
      }, '← Previous Day'),
      el('button', {
        className: 'px-6 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-lg',
        onClick: () => {
          builder.step = 2;
          store.notify();
        }
      }, 'Back to Days'),
      builder.currentDayIndex < builder.days.length - 1
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
                alert(builder.isEditing ? 'Program updated successfully! 🎉' : 'Program created successfully! 🎉');
                store.setView('home');
              } catch (error) {
                console.error('Error saving program:', error);
                alert('Failed to save program. Please try again.');
              }
            }
          }, builder.isEditing ? '✓ Update Program' : '✓ Finish & Save Program')
    );

    step.appendChild(nav);
    return step;
  };

  const render = () => {
    const builder = store.programBuilder;
    container.innerHTML = '';

    container.appendChild(renderHeader(builder));
    container.appendChild(renderProgress(builder));

    if (builder.step === 1) {
      container.appendChild(renderStep1(builder));
    } else if (builder.step === 2) {
      container.appendChild(renderStep2(builder));
    } else {
      container.appendChild(renderStep3(builder));
    }
  };

  store.subscribe(render);
  render();

  return container;
}
