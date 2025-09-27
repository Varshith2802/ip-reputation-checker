<<<<<<< HEAD
document.addEventListener('DOMContentLoaded', () => {
    const authMessage = document.getElementById('auth-message');
    const authSection = document.getElementById('auth-section');
    const checkerSection = document.getElementById('checker-section');

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            if (!email || !password) {
                authMessage.textContent = 'Please fill in all fields.';
                authMessage.style.color = 'red';
                return;
            }

            try {
                const response = await fetch('http://auth-service:8001/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();
                if (response.ok) {
                    authMessage.textContent = data.message;
                    authMessage.style.color = 'green';
                    authSection.style.display = 'none';
                    checkerSection.style.display = 'block';
                } else {
                    authMessage.textContent = `Login error: ${data.detail || data.message}`;
                    authMessage.style.color = 'red';
                }
            } catch (error) {
                authMessage.textContent = `Login error: ${error.message}`;
                authMessage.style.color = 'red';
            }
        });
    }

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;

            if (!email || !password) {
                authMessage.textContent = 'Please fill in all fields.';
                authMessage.style.color = 'red';
                return;
            }

            try {
                const response = await fetch('http://auth-service:8001/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();
                if (response.ok) {
                    authMessage.textContent = data.message;
                    authMessage.style.color = 'green';
                    authSection.style.display = 'none';
                    checkerSection.style.display = 'block';
                } else {
                    authMessage.textContent = `Registration error: ${data.detail || data.message}`;
                    authMessage.style.color = 'red';
                }
            } catch (error) {
                authMessage.textContent = `Registration error: ${error.message}`;
                authMessage.style.color = 'red';
            }
        });
    }
=======
document.addEventListener('DOMContentLoaded', () => {
    const authMessage = document.getElementById('auth-message');
    const authSection = document.getElementById('auth-section');
    const checkerSection = document.getElementById('checker-section');

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            if (!email || !password) {
                authMessage.textContent = 'Please fill in all fields.';
                authMessage.style.color = 'red';
                return;
            }

            try {
                const response = await fetch('http://auth-service:8001/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();
                if (response.ok) {
                    authMessage.textContent = data.message;
                    authMessage.style.color = 'green';
                    authSection.style.display = 'none';
                    checkerSection.style.display = 'block';
                } else {
                    authMessage.textContent = `Login error: ${data.detail || data.message}`;
                    authMessage.style.color = 'red';
                }
            } catch (error) {
                authMessage.textContent = `Login error: ${error.message}`;
                authMessage.style.color = 'red';
            }
        });
    }

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;

            if (!email || !password) {
                authMessage.textContent = 'Please fill in all fields.';
                authMessage.style.color = 'red';
                return;
            }

            try {
                const response = await fetch('http://auth-service:8001/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();
                if (response.ok) {
                    authMessage.textContent = data.message;
                    authMessage.style.color = 'green';
                    authSection.style.display = 'none';
                    checkerSection.style.display = 'block';
                } else {
                    authMessage.textContent = `Registration error: ${data.detail || data.message}`;
                    authMessage.style.color = 'red';
                }
            } catch (error) {
                authMessage.textContent = `Registration error: ${error.message}`;
                authMessage.style.color = 'red';
            }
        });
    }
>>>>>>> 4aac0aa (Initial commit: IP Reputation Checker microservices + Kubernetes manifests)
});