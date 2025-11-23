// src/pages/login.js
import { login, register, onAuthStateChange } from '../services/auth-service.js';
import '../components/toast.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const errorMessage = document.getElementById('error-message');

    // Form switching
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        errorMessage.textContent = '';
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        errorMessage.textContent = '';
    });

    // Redirect if already logged in
    onAuthStateChange(user => {
        if (user) {
            window.location.href = 'index.html';
        }
    });

    // Login form submit
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            errorMessage.textContent = '';
            await login(email, password);
            showToast('success', 'Login successful!');
            // onAuthStateChange will handle redirect
        } catch (error) {
            showToast('error', error.message);
        }
    });

    // Register form submit
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        try {
            errorMessage.textContent = '';
            await register(email, password);
            showToast('success', 'Registration successful!');
            // onAuthStateChange will handle redirect
        } catch (error) {
            showToast('error', error.message);
        }
    });
});