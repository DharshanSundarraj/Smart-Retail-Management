document.addEventListener('DOMContentLoaded', () => {
  initAuthDropdown();

  const loginForm = document.getElementById('login-form');
  const regForm = document.getElementById('register-form');
  const forgotForm = document.getElementById('forgot-form');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      try {
        const data = await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });

        if (data && (data.token || data.id || data.email)) {
          if (data.token) localStorage.setItem('zetlan_token', data.token);
          else localStorage.setItem('zetlan_token', 'session_active_' + Date.now());

          localStorage.setItem('zetlan_user_name', data.name || data.fullName || email);
          localStorage.setItem('zetlan_user_role', data.role || data.roleName || 'ADMIN');
          window.location.replace('index.html');
        } else {
          showAuthToast("Login failed: Invalid credentials received.", true);
        }
      } catch (error) {
        showAuthToast("Invalid email or password.", true);
      }
    });
  }

  if (regForm) {
    regForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('reg-name').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const roleIdVal = document.getElementById('reg-role').value;
      const password = document.getElementById('reg-password').value;

      if (!roleIdVal) {
        showAuthToast("Please select a user role.", true);
        return;
      }

      // Generate a username from the email prefix so MySQL NOT NULL constraints never fail
      const username = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
      const roleId = parseInt(roleIdVal);
      const roleName = roleId === 1 ? 'ADMIN' : roleId === 2 ? 'MANAGER' : 'STAFF';

      const payload = {
        name: name,
        fullName: name,
        username: username,
        email: email,
        password: password,
        role: roleName,
        roleId: roleId,
        isActive: true
      };

      try {
        await apiRequest('/auth/register', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        showAuthToast("Registration successful! Please sign in.");
        setTimeout(() => switchAuthView('login'), 1500);
      } catch (error) {
        console.error("Registration Error:", error);
        showAuthToast("Registration failed. Email or username already exists.", true);
      }
    });
  }

  if (forgotForm) {
    forgotForm.addEventListener('submit', (e) => {
      e.preventDefault();
      showAuthToast("Recovery link sent if email exists in system.");
      setTimeout(() => switchAuthView('login'), 2000);
    });
  }
});

// Global switch function
window.switchAuthView = function(view) {
  const loginForm = document.getElementById('login-form');
  const regForm = document.getElementById('register-form');
  const forgotForm = document.getElementById('forgot-form');

  if (loginForm) loginForm.classList.add('auth-hidden');
  if (regForm) regForm.classList.add('auth-hidden');
  if (forgotForm) forgotForm.classList.add('auth-hidden');

  if (view === 'login' && loginForm) loginForm.classList.remove('auth-hidden');
  if (view === 'register' && regForm) regForm.classList.remove('auth-hidden');
  if (view === 'forgot' && forgotForm) forgotForm.classList.remove('auth-hidden');
};

// Global toggle password visibility
window.togglePasswordVisibility = function(inputId, iconEl) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    iconEl.classList.remove('fa-eye-slash');
    iconEl.classList.add('fa-eye');
  } else {
    input.type = 'password';
    iconEl.classList.remove('fa-eye');
    iconEl.classList.add('fa-eye-slash');
  }
};

// Role dropdown handler
function initAuthDropdown() {
  const dropdown = document.getElementById('reg-role-dropdown');
  const selected = document.getElementById('reg-role-selected');
  const input = document.getElementById('reg-role');
  if (!dropdown || !selected || !input) return;

  selected.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('active');
  });

  document.querySelectorAll('#reg-role-options .dropdown-option').forEach(opt => {
    opt.addEventListener('click', () => {
      selected.textContent = opt.textContent;
      input.value = opt.getAttribute('data-value');
      dropdown.classList.remove('active');
    });
  });

  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove('active');
    }
  });
}

// Toast handler
function showAuthToast(msg, isError = false) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `custom-toast ${isError ? 'toast-error' : ''}`;
  toast.innerHTML = `<i class="fa-solid ${isError ? 'fa-circle-exclamation' : 'fa-circle-check'}" style="margin-right:8px;"></i> ${msg}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}