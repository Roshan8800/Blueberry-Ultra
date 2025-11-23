/* login.js */
const firebaseConfig = {
  apiKey: "AIzaSyBS5hORECOIB-Wk4VOiR_3XOTdAYO49bMo",
  authDomain: "blueberry-2be3c.firebaseapp.com",
  databaseURL: "https://blueberry-2be3c-default-rtdb.firebaseio.com",
  projectId: "blueberry-2be3c",
  storageBucket: "blueberry-2be3c.firebasestorage.app",
  messagingSenderId: "273487728404",
  appId: "1:273487728404:web:00d03cf891938a8ae97c01",
  measurementId: "G-YXJME3DF7P"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

document.addEventListener('DOMContentLoaded', () => {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('login-button');
    const signupButton = document.getElementById('signup-button');
    const errorMessage = document.getElementById('error-message');

    // Redirect if already logged in
    auth.onAuthStateChanged(user => {
        if (user) {
            window.location.href = 'index.html';
        }
    });

    const handleAuth = async (authFunction, email, password) => {
        try {
            errorMessage.textContent = '';
            await authFunction(email, password);
            // The onAuthStateChanged observer will handle the redirect
        } catch (error) {
            errorMessage.textContent = error.message;
        }
    };

    loginButton.addEventListener('click', () => {
        const email = emailInput.value;
        const password = passwordInput.value;
        if (email && password) {
            handleAuth(auth.signInWithEmailAndPassword.bind(auth), email, password);
        }
    });

    signupButton.addEventListener('click', () => {
        const email = emailInput.value;
        const password = passwordInput.value;
        if (email && password) {
            handleAuth(auth.createUserWithEmailAndPassword.bind(auth), email, password);
        }
    });
});
