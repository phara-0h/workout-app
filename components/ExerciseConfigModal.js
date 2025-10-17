import { el } from '../utils.js';

export default function ExerciseConfigModal(exercise, onSave, onCancel) {
  let isMain = false;
  let sets = '3x10-12';
  let rpe = 'RPE 7-8';
  let rotation = ['4x4 @ RPE 8-8.5', '4x8 @ RPE 8', '5x3 @ RPE 7-7.5'];

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

    const content = el('div', {
      className: 'bg-white rounded-xl shadow-2xl max-w-lg w-full',
      onClick: (event) => event.stopPropagation()
    });

    const header = el('div', { className: 'p-6 border-b' });
    const headerTop = el('div', { className: 'flex items-center justify-between' });
    headerTop.appendChild(el('h2', { className: 'text-xl font-bold text-gray-900' }, 'Configure Exercise'));
    headerTop.appendChild(el('button', {
      className: 'text-gray-400 hover:text-gray-600 text-2xl leading-none',
      onClick: () => onCancel?.()
    }, '×'));
    header.appendChild(headerTop);
    header.appendChild(el('p', { className: 'text-sm text-gray-600 mt-2' }, exercise.name));
    content.appendChild(header);

    const body = el('div', { className: 'p-6 space-y-6' });

    const mainToggle = el('div', { className: 'flex items-center justify-between p-4 bg-gray-50 rounded-lg' });
    const mainToggleInfo = el('div');
    mainToggleInfo.appendChild(el('label', { className: 'font-semibold text-gray-900 block mb-1' }, 'Main Lift (DUP)'));
    mainToggleInfo.appendChild(el('p', { className: 'text-sm text-gray-600' }, 'Use Daily Undulating Periodization rotation'));
    mainToggle.appendChild(mainToggleInfo);

    const toggleWrapper = el('label', { className: 'relative inline-flex items-center cursor-pointer' });
    const toggleInput = el('input', {
      type: 'checkbox',
      className: 'sr-only peer',
      checked: isMain,
      onChange: (event) => {
        isMain = event.target.checked;
        render();
      }
    });
    toggleWrapper.appendChild(toggleInput);
    toggleWrapper.appendChild(el('div', { className: 'w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[""] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600' }));

    mainToggle.appendChild(toggleWrapper);
    body.appendChild(mainToggle);

    if (isMain) {
      const rotationSection = el('div', { className: 'space-y-4' });
      rotationSection.appendChild(el('p', { className: 'text-sm text-gray-700 font-medium' }, 'DUP Rotation (3-week cycle):'));

      rotation.forEach((value, index) => {
        const row = el('div', { className: 'flex items-center gap-2' });
        row.appendChild(el('label', { className: 'text-sm text-gray-600 w-16' }, `Week ${index + 1}:`));
        row.appendChild(el('input', {
          type: 'text',
          className: 'flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm',
          value,
          placeholder: 'e.g., 4x4 @ RPE 8-8.5',
          onInput: (event) => {
            rotation[index] = event.target.value;
          }
        }));
        rotationSection.appendChild(row);
      });

      body.appendChild(rotationSection);
    } else {
      const accessorySection = el('div', { className: 'space-y-4' });

      const setsField = el('div');
      setsField.appendChild(el('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 'Sets & Reps'));
      setsField.appendChild(el('input', {
        type: 'text',
        className: 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
        value: sets,
        placeholder: 'e.g., 3x10-12, 4x8-10',
        onInput: (event) => {
          sets = event.target.value;
        }
      }));

      const rpeField = el('div');
      rpeField.appendChild(el('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 'RPE Target'));
      rpeField.appendChild(el('input', {
        type: 'text',
        className: 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
        value: rpe,
        placeholder: 'e.g., RPE 7-8, RPE 8-9',
        onInput: (event) => {
          rpe = event.target.value;
        }
      }));

      accessorySection.appendChild(setsField);
      accessorySection.appendChild(rpeField);

      body.appendChild(accessorySection);
    }

    content.appendChild(body);

    const footer = el('div', { className: 'p-6 border-t flex justify-end gap-3' });
    footer.appendChild(el('button', {
      className: 'px-6 py-2 text-gray-700 font-semibold hover:bg-gray-100 rounded-lg',
      onClick: () => onCancel?.()
    }, 'Cancel'));
    footer.appendChild(el('button', {
      className: 'px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg',
      onClick: () => {
        onSave?.({
          is_main: isMain,
          rotation: isMain ? rotation : null,
          sets: !isMain ? sets : null,
          rpe: !isMain ? rpe : null
        });
      }
    }, 'Add Exercise'));
    content.appendChild(footer);

    modal.appendChild(content);
  };

  render();
  return modal;
}
