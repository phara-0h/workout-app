import { supabase } from './supabase.js';
import { createAuthUI } from './auth.js';
import { store } from './store.js';
import { isDemoMode } from './utils.js';
import { LoadingView } from './components/LoadingView.js';
import { HomeView } from './components/HomeView.js';
import { WorkoutView } from './components/WorkoutView.js';
import { ProgressView } from './components/ProgressView.js';
import { EditView } from './components/EditView.js';
import { ExerciseLibraryView } from './components/ExerciseLibraryView.js';
import ProgramBuilderView from './components/ProgramBuilderView.js';
import EmptyStateView from './components/EmptyStateView.js';

function render() {
  const root = document.getElementById('root');
  if (!root) return;

  root.innerHTML = '';

  if (store.loading) {
    root.appendChild(LoadingView());
    return;
  }

  if (!isDemoMode && !store.isAuthenticated) {
    root.appendChild(createAuthUI());
    return;
  }

  let view;
  switch (store.view) {
    case 'workout':
      view = WorkoutView();
      break;
    case 'progress':
      view = ProgressView();
      break;
    case 'edit':
      view = EditView();
      break;
    case 'exercise-library':
      view = ExerciseLibraryView();
      break;
    case 'program-builder':
      view = ProgramBuilderView();
      break;
    case 'empty-state':
      view = EmptyStateView();
      break;
    default:
      view = HomeView();
  }

  root.appendChild(view);
}

supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_IN') {
    store.isAuthenticated = true;
    store.init();
  } else if (event === 'SIGNED_OUT') {
    store.isAuthenticated = false;
    store.notify();
  }
});

store.subscribe(render);
render();
store.init();
