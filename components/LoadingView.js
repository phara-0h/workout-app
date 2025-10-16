import { el } from '../utils.js';

export function LoadingView() {
  const container = el('div', { className: 'min-h-screen bg-gray-50 flex items-center justify-center' });
  container.innerHTML = `
    <div class="text-center">
      <div class="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
      <p class="text-xl text-gray-600">Loading your workouts...</p>
    </div>
  `;
  return container;
}
