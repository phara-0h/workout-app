import { el } from '../utils.js';
import { store } from '../store.js';

export function EditView() {
  const container = el('div', { className: 'min-h-screen bg-gray-50 pb-20' });
  if (!store.program) {
    container.appendChild(
      el('div', { className: 'p-6 text-center text-gray-600' }, 'Program data unavailable.')
    );
    return container;
  }
  const tempProgram = JSON.parse(JSON.stringify(store.program));

  const header = el('div', { className: 'bg-blue-600 text-white p-6 shadow-lg' },
    el('div', { className: 'flex items-center justify-between' },
      el('h1', { className: 'text-2xl font-bold' }, 'Edit Program'),
      el('button', {
        className: 'bg-green-500 px-4 py-2 rounded font-medium',
        onClick: async () => {
          await store.updateProgram(tempProgram);
          store.setView('home');
        }
      }, '💾 Save')
    )
  );

  const programContainer = el('div', { className: 'p-4' });

  const renderProgram = () => {
    programContainer.innerHTML = '';

    Object.entries(tempProgram).forEach(([dayKey, day]) => {
      const dayCard = el('div', { className: 'bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4' },
        el('h2', { className: 'font-bold text-lg mb-3' }, day.name)
      );

      day.exercises.forEach((exercise, exerciseIndex) => {
        const exerciseBox = el('div', { className: 'mb-3 p-3 bg-gray-50 rounded' });

        const headerRow = el('div', { className: 'flex justify-between items-start mb-2' });
        const nameInput = el('input', {
          type: 'text',
          value: exercise.name,
          className: 'flex-1 px-2 py-1 border border-gray-300 rounded text-sm font-semibold',
          onInput: (event) => {
            tempProgram[dayKey].exercises[exerciseIndex].name = event.target.value;
          }
        });
        headerRow.appendChild(nameInput);

        if (exercise.type !== 'main') {
          const deleteButton = el('button', {
            className: 'ml-2 text-red-500 hover:text-red-700',
            onClick: () => {
              tempProgram[dayKey].exercises.splice(exerciseIndex, 1);
              renderProgram();
            }
          }, '✕');
          headerRow.appendChild(deleteButton);
        }
        exerciseBox.appendChild(headerRow);

        if (exercise.rotation) {
          exerciseBox.appendChild(
            el('p', { className: 'text-xs text-gray-600' }, 'Main lift with DUP rotation')
          );
        } else {
          const setsInput = el('input', {
            type: 'text',
            value: exercise.sets,
            className: 'w-full px-2 py-1 border border-gray-300 rounded text-sm',
            placeholder: 'e.g. 3x10-12',
            onInput: (event) => {
              tempProgram[dayKey].exercises[exerciseIndex].sets = event.target.value;
            }
          });
          exerciseBox.appendChild(setsInput);
        }

        dayCard.appendChild(exerciseBox);
      });

      const addButton = el('button', {
        className: 'w-full bg-blue-500 text-white py-2 rounded font-medium hover:bg-blue-600',
        onClick: () => {
          tempProgram[dayKey].exercises.push({
            name: 'New Exercise',
            type: 'accessory',
            sets: '3x10-12',
            rpe: 'RPE 7-8'
          });
          renderProgram();
        }
      }, '+ Add Exercise');
      dayCard.appendChild(addButton);

      programContainer.appendChild(dayCard);
    });
  };

  renderProgram();

  container.appendChild(header);
  container.appendChild(programContainer);
  return container;
}
