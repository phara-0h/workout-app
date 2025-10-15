import { supabase } from './supabase.js';

// Create the login/signup UI
export function createAuthUI() {
  const container = document.createElement('div');
  container.className = 'min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center p-4';
  
  container.innerHTML = `
    <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-gray-900 mb-2">💪 Workout Tracker</h1>
        <p class="text-gray-600">Sign in to sync your workouts across devices</p>
      </div>

      <div id="auth-form">
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input 
            type="email" 
            id="email" 
            placeholder="your@email.com"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
        </div>

        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
          <input 
            type="password" 
            id="password" 
            placeholder="••••••••"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
        </div>

        <div id="error-message" class="mb-4 text-red-600 text-sm hidden"></div>
        <div id="success-message" class="mb-4 text-green-600 text-sm hidden"></div>

        <button 
          id="sign-in-btn"
          class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition mb-3"
        >
          Sign In
        </button>

        <button 
          id="sign-up-btn"
          class="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
        >
          Create Account
        </button>

        <div class="mt-6 text-center">
          <button 
            id="demo-btn"
            class="text-sm text-blue-600 hover:underline"
          >
            Continue with demo mode (local storage only)
          </button>
        </div>
      </div>

      <div id="loading" class="hidden text-center">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        <p class="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  `;

  // Get elements
  const emailInput = container.querySelector('#email');
  const passwordInput = container.querySelector('#password');
  const signInBtn = container.querySelector('#sign-in-btn');
  const signUpBtn = container.querySelector('#sign-up-btn');
  const demoBtn = container.querySelector('#demo-btn');
  const errorMsg = container.querySelector('#error-message');
  const successMsg = container.querySelector('#success-message');
  const authForm = container.querySelector('#auth-form');
  const loading = container.querySelector('#loading');

  // Helper to show error
  function showError(message) {
    errorMsg.textContent = message;
    errorMsg.classList.remove('hidden');
    successMsg.classList.add('hidden');
  }

  // Helper to show success
  function showSuccess(message) {
    successMsg.textContent = message;
    successMsg.classList.remove('hidden');
    errorMsg.classList.add('hidden');
  }

  // Helper to show loading
  function setLoading(isLoading) {
    if (isLoading) {
      authForm.classList.add('hidden');
      loading.classList.remove('hidden');
    } else {
      authForm.classList.remove('hidden');
      loading.classList.add('hidden');
    }
  }

  // Sign in handler
  signInBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showError('Please enter email and password');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setLoading(false);
      showError(error.message);
    } else {
      // Success - the auth state listener will handle the redirect
      showSuccess('Signed in! Loading your data...');
    }
  });

  // Sign up handler
  signUpBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showError('Please enter email and password');
      return;
    }

    if (password.length < 6) {
      showError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    setLoading(false);

    if (error) {
      showError(error.message);
    } else {
      showSuccess('Account created! Check your email to confirm, then sign in.');
      emailInput.value = '';
      passwordInput.value = '';
    }
  });

  // Demo mode handler (uses localStorage like before)
  demoBtn.addEventListener('click', () => {
    localStorage.setItem('demo-mode', 'true');
    window.location.reload();
  });

  // Allow Enter key to sign in
  passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      signInBtn.click();
    }
  });

  return container;
}

// Check if user is authenticated
export async function checkAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  return session !== null;
}

// Sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) console.error('Error signing out:', error);
  window.location.reload();
}
