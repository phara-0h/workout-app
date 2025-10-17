import { el } from '../utils.js';
import { store } from '../store.js';

export default function EmptyStateView() {
  const handleCreateProgram = () => {
    store.resetProgramBuilder();
    store.setView('program-builder');
  };

  const container = el('div', { className: 'min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4' });

  const card = el('div', { className: 'max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center' });

  const iconWrapper = el('div', { className: 'mb-6 flex justify-center' });
  const iconCircle = el('div', { className: 'w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center' }, el('span', { className: 'text-4xl' }, '💪'));
  iconWrapper.appendChild(iconCircle);

  const title = el('h1', { className: 'text-3xl font-bold text-gray-900 mb-4' }, 'Welcome to Your Workout Tracker!');

  const description = el('p', { className: 'text-gray-600 mb-8' },
    'Get started by creating your first workout program. Build any split you want - Push/Pull/Legs, Upper/Lower, or your own custom routine.'
  );

  const ctaButton = el('button', {
    className: 'w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all',
    onClick: handleCreateProgram
  }, '🎯 Create Your First Workout Program');

  const secondaryInfo = el('p', { className: 'text-sm text-gray-500 mt-6' },
    'You can also browse the ',
    el('button', {
      className: 'text-indigo-600 hover:text-indigo-700 font-medium underline',
      onClick: () => store.setView('exercise-library')
    }, 'exercise library'),
    ' first'
  );

  card.appendChild(iconWrapper);
  card.appendChild(title);
  card.appendChild(description);
  card.appendChild(ctaButton);
  card.appendChild(secondaryInfo);

  container.appendChild(card);

  return container;
}
