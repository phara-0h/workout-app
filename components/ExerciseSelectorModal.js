import { el } from '../utils.js';
import { store } from '../store.js';

export default function ExerciseSelectorModal(onSelect, onCancel) {
  const exercises = store.exerciseLibrary || [];
  let searchTerm = '';
  let selectedCategory = 'all';
  const formatLabel = (value) => value ? value.charAt(0).toUpperCase() + value.slice(1) : '';

  const modal = el('div', {
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50',
    onClick: (event) => {
      if (event.target === modal) {
        onCancel?.();
      }
    }
  });

  const render = () => {
    modal.innerHTML = '';

    const filteredExercises = exercises.filter((exercise) => {
      const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || exercise.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    const categorySet = new Set(exercises.map((exercise) => exercise.category).filter(Boolean));
    const categories = ['all', ...categorySet];

    const content = el('div', {
      className: 'bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col',
      onClick: (event) => event.stopPropagation()
    });

    const header = el('div', { className: 'p-6 border-b' });

    const headerTop = el('div', { className: 'flex items-center justify-between mb-4' });
    headerTop.appendChild(el('h2', { className: 'text-xl font-bold text-gray-900' }, 'Select Exercise'));
    headerTop.appendChild(el('button', {
      className: 'text-gray-400 hover:text-gray-600 text-2xl leading-none',
      onClick: () => onCancel?.()
    }, '×'));
    header.appendChild(headerTop);

    const searchInput = el('input', {
      type: 'text',
      className: 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
      placeholder: 'Search exercises...',
      value: searchTerm,
      onInput: (event) => {
        searchTerm = event.target.value;
        render();
      }
    });
    header.appendChild(searchInput);

    content.appendChild(header);

    const tabsWrapper = el('div', { className: 'px-6 py-3 border-b overflow-x-auto' });
    const tabs = el('div', { className: 'flex gap-2' });
    categories.forEach((category) => {
      const label = category === 'all' ? 'All' : formatLabel(category);
      tabs.appendChild(el('button', {
        className: `px-3 py-1 rounded-lg text-sm font-medium whitespace-nowrap ${
          selectedCategory === category
            ? 'bg-indigo-100 text-indigo-700'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`,
        onClick: () => {
          selectedCategory = category;
          render();
        }
      }, label));
    });
    tabsWrapper.appendChild(tabs);
    content.appendChild(tabsWrapper);

    const listWrapper = el('div', { className: 'flex-1 overflow-y-auto p-6' });
    if (filteredExercises.length === 0) {
      listWrapper.appendChild(el('p', { className: 'text-center text-gray-500 py-8' }, 'No exercises found'));
    } else {
      filteredExercises.forEach((exercise) => {
        const badges = el('div', { className: 'flex gap-2 text-xs' });
        badges.appendChild(el('span', { className: 'px-2 py-1 bg-gray-200 text-gray-700 rounded' }, formatLabel(exercise.category) || 'Uncategorized'));
        if (exercise.equipment) {
          badges.appendChild(el('span', { className: 'px-2 py-1 bg-gray-200 text-gray-700 rounded' }, formatLabel(exercise.equipment)));
        }
        if (exercise.is_compound) {
          badges.appendChild(el('span', { className: 'px-2 py-1 bg-indigo-100 text-indigo-700 rounded' }, 'Compound'));
        }

        const button = el('button', {
          className: 'w-full p-4 bg-gray-50 hover:bg-indigo-50 rounded-lg border border-gray-200 hover:border-indigo-300 text-left transition-colors',
          onClick: () => onSelect?.(exercise)
        });

        const buttonContent = el('div', { className: 'flex items-start justify-between' });
        const details = el('div');
        details.appendChild(el('h3', { className: 'font-semibold text-gray-900 mb-1' }, exercise.name));
        details.appendChild(badges);

        buttonContent.appendChild(details);
        buttonContent.appendChild(el('span', { className: 'text-2xl' }, '→'));

        button.appendChild(buttonContent);
        listWrapper.appendChild(button);
      });
    }
    content.appendChild(listWrapper);

    modal.appendChild(content);
  };

  render();
  return modal;
}
