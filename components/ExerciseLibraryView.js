import { el } from '../utils.js';
import { store } from '../store.js';
import { getAllExercises, deleteCustomExercise, searchExercises } from '../exerciseLibrary.js';
import { AddExerciseModal } from './AddExerciseModal.js';

export function ExerciseLibraryView() {
  const container = el('div', { className: 'min-h-screen bg-gray-50 pb-20' });

  const formatLabel = (value) => value ? value.charAt(0).toUpperCase() + value.slice(1) : '';

  const header = el('div', { className: 'bg-blue-600 text-white p-6 shadow-lg' },
    el('div', { className: 'flex items-center justify-between' },
      el('h1', { className: 'text-2xl font-bold' }, '📚 Exercise Library'),
      el('button', {
        className: 'bg-blue-500 px-4 py-2 rounded font-medium hover:bg-blue-400',
        onClick: () => store.setView('home')
      }, '← Back')
    ),
    el('button', {
      className: 'mt-4 bg-green-500 px-4 py-2 rounded font-medium hover:bg-green-400',
      onClick: () => {
        let modalElement;
        const handleClose = () => {
          if (modalElement?.parentNode) {
            modalElement.parentNode.removeChild(modalElement);
          }
        };
        modalElement = AddExerciseModal(handleClose, renderExercises);
        document.body.appendChild(modalElement);
      }
    }, '+ Add Custom Exercise')
  );

  const searchWrapper = el('div', { className: 'p-4' });
  const searchInput = el('input', {
    id: 'exercise-search',
    type: 'text',
    placeholder: 'Search exercises...',
    className: 'w-full px-3 py-2 border border-gray-300 rounded text-sm'
  });
  searchWrapper.appendChild(searchInput);

  const exercisesContainer = el('div', {
    id: 'exercises-container',
    className: 'p-4 space-y-6'
  });

  const displayExercises = (exercises) => {
    exercisesContainer.innerHTML = '';
    const grouped = exercises.reduce((acc, exercise) => {
      const category = exercise.category || 'other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(exercise);
      return acc;
    }, {});

    let hasExercises = false;
    Object.keys(grouped).sort().forEach((category) => {
      const items = grouped[category].slice().sort((a, b) => a.name.localeCompare(b.name));
      if (items.length === 0) return;
      hasExercises = true;

      const section = el('div', { className: 'space-y-3' });
      const heading = el('h2', { className: 'text-xl font-semibold text-gray-900' },
        `${formatLabel(category)} (${items.length} exercise${items.length > 1 ? 's' : ''})`
      );
      section.appendChild(heading);

      items.forEach((exercise) => {
        const card = el('div', { className: 'bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex justify-between items-start' });

        const content = el('div', { className: 'flex-1' },
          el('h3', { className: 'text-lg font-semibold text-gray-900' }, exercise.name),
          el('div', { className: 'flex flex-wrap gap-2 mt-2 text-xs' },
            exercise.equipment ? el('span', { className: 'bg-gray-100 text-gray-700 px-2 py-1 rounded' }, formatLabel(exercise.equipment)) : null,
            exercise.is_compound ? el('span', { className: 'bg-blue-100 text-blue-700 px-2 py-1 rounded' }, 'Compound') : null,
            exercise.is_custom ? el('span', { className: 'bg-green-100 text-green-700 px-2 py-1 rounded' }, 'Custom') : null
          )
        );

        card.appendChild(content);

        if (exercise.is_custom) {
          const deleteButton = el('button', {
            className: 'text-red-500 hover:text-red-700 text-sm ml-4',
            onClick: async () => {
              if (!confirm(`Delete ${exercise.name}?`)) return;
              try {
                await deleteCustomExercise(exercise.id);
                await renderExercises();
              } catch (error) {
                console.error('Failed to delete exercise:', error);
                alert('Failed to delete exercise. Please try again.');
              }
            }
          }, '✕');
          card.appendChild(deleteButton);
        }

        section.appendChild(card);
      });

      exercisesContainer.appendChild(section);
    });

    if (!hasExercises) {
      exercisesContainer.appendChild(
        el('p', { className: 'text-center text-gray-500' }, 'No exercises found.')
      );
    }
  };

  const renderExercises = async () => {
    const exercises = await getAllExercises();
    store.exerciseLibrary = exercises;
    displayExercises(exercises);
  };

  searchInput.addEventListener('input', async (event) => {
    const term = event.target.value.trim();
    if (term) {
      const results = await searchExercises(term);
      displayExercises(results);
    } else {
      await renderExercises();
    }
  });

  renderExercises();

  container.appendChild(header);
  container.appendChild(searchWrapper);
  container.appendChild(exercisesContainer);

  return container;
}
