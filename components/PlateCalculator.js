import { el } from '../utils.js';

export default function PlateCalculator(targetWeight, onClose) {
  const barWeight = 45; // Standard barbell
  const availablePlates = [45, 35, 25, 10, 5, 2.5]; // Standard plate sizes in lbs

  const calculatePlates = (weight) => {
    const weightPerSide = (weight - barWeight) / 2;

    if (weightPerSide < 0) {
      return { valid: false, message: `Weight must be at least ${barWeight} lbs (empty bar)` };
    }

    const plates = [];
    let remaining = weightPerSide;

    for (const plate of availablePlates) {
      while (remaining >= plate) {
        plates.push(plate);
        remaining -= plate;
      }
    }

    // Round remaining to 2 decimal places
    remaining = Math.round(remaining * 100) / 100;

    if (remaining > 0.1) {
      return {
        valid: true,
        plates,
        remaining,
        message: `Closest: ${weight - (remaining * 2)} lbs (${remaining} lbs short per side)`
      };
    }

    return { valid: true, plates, remaining: 0 };
  };

  let currentWeight = targetWeight || 135;
  const result = calculatePlates(currentWeight);

  const modal = el('div', {
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4',
    onClick: (e) => {
      if (e.target === modal) onClose();
    }
  });

  const renderPlateVisual = (plates) => {
    if (!plates || plates.length === 0) {
      return el('div', { className: 'text-center py-8 text-gray-500' }, 'Empty bar');
    }

    const plateColors = {
      45: 'bg-red-500',
      35: 'bg-yellow-500',
      25: 'bg-green-500',
      10: 'bg-blue-500',
      5: 'bg-purple-500',
      2.5: 'bg-gray-500'
    };

    return el('div', { className: 'flex items-center justify-center gap-1 py-8' },
      // Left collar
      el('div', { className: 'w-2 h-12 bg-gray-400 rounded' }),
      // Left plates
      ...plates.map(weight =>
        el('div', {
          className: `${plateColors[weight] || 'bg-gray-600'} text-white text-xs font-bold flex items-center justify-center rounded`,
          style: `width: ${Math.max(weight / 3, 20)}px; height: ${Math.max(weight * 1.5, 40)}px;`
        }, weight)
      ),
      // Bar
      el('div', { className: 'flex-1 h-3 bg-gray-700 mx-2 relative' },
        el('div', { className: 'absolute inset-0 flex items-center justify-center' },
          el('span', { className: 'bg-gray-700 px-2 text-xs text-white font-semibold' }, `${barWeight} lb bar`)
        )
      ),
      // Right plates (reversed)
      ...plates.slice().reverse().map(weight =>
        el('div', {
          className: `${plateColors[weight] || 'bg-gray-600'} text-white text-xs font-bold flex items-center justify-center rounded`,
          style: `width: ${Math.max(weight / 3, 20)}px; height: ${Math.max(weight * 1.5, 40)}px;`
        }, weight)
      ),
      // Right collar
      el('div', { className: 'w-2 h-12 bg-gray-400 rounded' })
    );
  };

  const renderContent = () => {
    const calc = calculatePlates(currentWeight);

    return el('div', { className: 'bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto' },
      // Header
      el('div', { className: 'p-6 border-b border-gray-200' },
        el('div', { className: 'flex items-center justify-between' },
          el('h2', { className: 'text-2xl font-bold text-gray-900' }, '🏋️ Plate Calculator'),
          el('button', {
            className: 'text-gray-400 hover:text-gray-600 text-2xl',
            onClick: onClose
          }, '×')
        )
      ),

      // Weight Input
      el('div', { className: 'p-6 bg-gray-50' },
        el('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 'Target Weight (lbs)'),
        el('input', {
          type: 'number',
          value: currentWeight.toString(),
          className: 'w-full px-4 py-3 text-2xl font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center',
          min: barWeight.toString(),
          step: '2.5',
          onInput: (e) => {
            currentWeight = Number(e.target.value) || barWeight;
            renderContent();
          }
        }),
        el('div', { className: 'flex gap-2 mt-3' },
          ...[135, 185, 225, 275, 315, 405].map(weight =>
            el('button', {
              className: 'flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 text-sm font-semibold',
              onClick: () => {
                currentWeight = weight;
                renderContent();
              }
            }, weight.toString())
          )
        )
      ),

      // Visual Display
      el('div', { className: 'p-6 bg-white' },
        renderPlateVisual(calc.plates)
      ),

      // Plate Breakdown
      el('div', { className: 'p-6 border-t border-gray-200' },
        el('h3', { className: 'font-semibold text-gray-900 mb-3' }, 'Plates Per Side'),
        calc.plates && calc.plates.length > 0
          ? el('div', { className: 'grid grid-cols-2 sm:grid-cols-3 gap-3' },
              ...Object.entries(
                calc.plates.reduce((acc, plate) => {
                  acc[plate] = (acc[plate] || 0) + 1;
                  return acc;
                }, {})
              ).map(([weight, count]) =>
                el('div', { className: 'bg-gray-50 px-4 py-3 rounded-lg border border-gray-200' },
                  el('div', { className: 'text-2xl font-bold text-indigo-600' }, `${count}×`),
                  el('div', { className: 'text-sm text-gray-600' }, `${weight} lb`)
                )
              )
            )
          : el('p', { className: 'text-gray-500 text-center' }, 'Empty bar only'),
        calc.message
          ? el('div', { className: 'mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800' },
              calc.message
            )
          : null,
        el('div', { className: 'mt-4 flex items-center justify-between text-sm' },
          el('span', { className: 'text-gray-600' }, 'Total Weight:'),
          el('span', { className: 'text-2xl font-bold text-gray-900' },
            `${currentWeight - (calc.remaining * 2 || 0)} lbs`
          )
        )
      ),

      // Footer
      el('div', { className: 'p-6 bg-gray-50 border-t border-gray-200' },
        el('button', {
          className: 'w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg',
          onClick: onClose
        }, 'Close')
      )
    );
  };

  modal.appendChild(renderContent());
  return modal;
}
