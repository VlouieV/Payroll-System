// Login Page Script
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const forgotPasswordLink = document.getElementById('forgotPassword');
    const registerLink = document.getElementById('registerLink');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginBtnText = document.getElementById('loginBtnText');
    const loginSpinner = document.getElementById('loginSpinner');

    // Check if user is already logged in
    auth.onAuthStateChanged(user => {
        if (user) {
            window.location.href = 'index.html';
        }
    });

    // Login form submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // Show loading state
        loginBtnText.textContent = 'Signing in...';
        loginSpinner.style.display = 'inline-block';
        loginForm.querySelector('button').disabled = true;
        hideMessages();

        try {
            const result = await window.authInstance.login(email, password);
            
            if (result.success) {
                showSuccess('Login successful! Redirecting...');
                
                // Redirect to main app
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 500);
            } else {
                showError(result.error || 'Login failed. Please try again.');
                resetButton();
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('An unexpected error occurred. Please try again.');
            resetButton();
        }
    });

    // Forgot password
    forgotPasswordLink.addEventListener('click', async function(e) {
        e.preventDefault();
        const email = prompt('Enter your email address to reset password:');
        
        if (email && email.trim()) {
            const result = await window.authInstance.resetPassword(email.trim());
            if (result.success) {
                alert('Password reset email sent! Please check your inbox.');
            } else {
                alert('Error: ' + result.error);
            }
        }
    });

    // Register link (admin registration)
    registerLink.addEventListener('click', function(e) {
        e.preventDefault();
        const confirmRegister = confirm('This will register you as an Admin. Continue?');
        if (!confirmRegister) return;
        
        const email = prompt('Enter email for new admin:');
        if (!email) return;
        
        const password = prompt('Enter password (min 6 characters):');
        if (!password || password.length < 6) {
            alert('Password must be at least 6 characters long.');
            return;
        }

        registerAdmin(email, password);
    });

    async function registerAdmin(email, password) {
        try {
            const result = await window.authInstance.register(email, password, 'admin');
            if (result.success) {
                alert('Admin account created successfully! You can now login.');
            } else {
                alert('Error: ' + result.error);
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('An error occurred during registration.');
        }
    }

    function showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }

    function showSuccess(message) {
        const successDiv = document.getElementById('successMessage');
        successDiv.textContent = message;
        successDiv.style.display = 'block';
    }

    function hideMessages() {
        document.getElementById('errorMessage').style.display = 'none';
        document.getElementById('successMessage').style.display = 'none';
    }

    function resetButton() {
        loginBtnText.textContent = 'Sign In';
        loginSpinner.style.display = 'none';
        loginForm.querySelector('button').disabled = false;
    }
});

