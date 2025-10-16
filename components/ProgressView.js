import { el } from '../utils.js';
import { store } from '../store.js';

export function ProgressView() {
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
