import { el } from '../utils.js';
import { addCustomExercise } from '../exerciseLibrary.js';

export function AddExerciseModal(onClose, onSuccess) {
  const overlay = el('div', {
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
  });

  const modal = el('div', {
    className: 'bg-white rounded-lg shadow-xl w-full max-w-md p-6'
  });

  const title = el('h2', { className: 'text-2xl font-bold text-gray-900 mb-4' }, 'Add Custom Exercise');

  const form = el('div', { className: 'space-y-4' });

  const nameLabel = el('label', { className: 'block text-sm font-medium text-gray-700', htmlFor: 'exercise-name' }, 'Exercise Name *');
  const nameInput = el('input', {
    id: 'exercise-name',
    type: 'text',
    placeholder: 'e.g., Cable Crossover',
    className: 'mt-1 w-full px-3 py-2 border border-gray-300 rounded text-sm'
  });

  const categoryLabel = el('label', { className: 'block text-sm font-medium text-gray-700', htmlFor: 'exercise-category' }, 'Category *');
  const categorySelect = el('select', {
    id: 'exercise-category',
    className: 'mt-1 w-full px-3 py-2 border border-gray-300 rounded text-sm'
  },
    el('option', { value: '' }, '-- Select Category --'),
    el('option', { value: 'chest' }, 'Chest'),
    el('option', { value: 'back' }, 'Back'),
    el('option', { value: 'legs' }, 'Legs'),
    el('option', { value: 'shoulders' }, 'Shoulders'),
    el('option', { value: 'arms' }, 'Arms'),
    el('option', { value: 'core' }, 'Core')
  );

  const equipmentLabel = el('label', { className: 'block text-sm font-medium text-gray-700', htmlFor: 'exercise-equipment' }, 'Equipment');
  const equipmentSelect = el('select', {
    id: 'exercise-equipment',
    className: 'mt-1 w-full px-3 py-2 border border-gray-300 rounded text-sm'
  },
    el('option', { value: 'other' }, 'Other'),
    el('option', { value: 'barbell' }, 'Barbell'),
    el('option', { value: 'dumbbell' }, 'Dumbbell'),
    el('option', { value: 'machine' }, 'Machine'),
    el('option', { value: 'cable' }, 'Cable'),
    el('option', { value: 'bodyweight' }, 'Bodyweight')
  );

  const compoundCheckbox = el('input', {
    id: 'exercise-compound',
    type: 'checkbox',
    className: 'h-4 w-4 text-blue-600 border-gray-300 rounded'
  });

  const compoundWrapper = el('div', { className: 'flex items-center gap-2' },
    compoundCheckbox,
    el('label', { className: 'text-sm text-gray-700', htmlFor: 'exercise-compound' }, 'This is a compound exercise')
  );

  const errorDiv = el('div', {
    id: 'add-exercise-error',
    className: 'hidden text-sm text-red-600'
  });

  const buttonRow = el('div', { className: 'flex justify-end gap-3 pt-4' });
  const cancelButton = el('button', {
    className: 'px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300',
    onClick: () => onClose?.()
  }, 'Cancel');

  const addButton = el('button', {
    className: 'px-4 py-2 rounded bg-blue-600 text-white font-medium hover:bg-blue-700',
    onClick: async () => {
      errorDiv.textContent = '';
      errorDiv.classList.add('hidden');

      const name = nameInput.value.trim();
      const category = categorySelect.value;
      const equipment = equipmentSelect.value;
      const isCompound = compoundCheckbox.checked;

      if (!name) {
        errorDiv.textContent = 'Exercise name is required';
        errorDiv.classList.remove('hidden');
        return;
      }

      if (!category) {
        errorDiv.textContent = 'Please select a category';
        errorDiv.classList.remove('hidden');
        return;
      }

      try {
        await addCustomExercise({
          name,
          category,
          equipment,
          is_compound: isCompound
        });
        if (onSuccess) {
          await onSuccess();
        }
        onClose?.();
      } catch (error) {
        console.error('Failed to add exercise:', error);
        errorDiv.textContent = 'Failed to add exercise. Please try again.';
        errorDiv.classList.remove('hidden');
      }
    }
  }, 'Add Exercise');

  buttonRow.appendChild(cancelButton);
  buttonRow.appendChild(addButton);

  form.appendChild(nameLabel);
  form.appendChild(nameInput);
  form.appendChild(categoryLabel);
  form.appendChild(categorySelect);
  form.appendChild(equipmentLabel);
  form.appendChild(equipmentSelect);
  form.appendChild(compoundWrapper);
  form.appendChild(errorDiv);
  form.appendChild(buttonRow);

  modal.appendChild(title);
  modal.appendChild(form);
  overlay.appendChild(modal);

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      onClose?.();
    }
  });

  return overlay;
}
