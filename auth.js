// Auth state
let currentUser = null;

// DOM Elements
const loginModal = document.getElementById('loginModal');
const signupModal = document.getElementById('signupModal');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');

// Modal functions
function showLoginModal() {
    document.getElementById('loginModal').classList.add('show');
    document.getElementById('signupModal').classList.remove('show');
    document.getElementById('forgotPasswordModal').classList.remove('show');
}

function showSignupModal() {
    document.getElementById('signupModal').classList.add('show');
    document.getElementById('loginModal').classList.remove('show');
    document.getElementById('forgotPasswordModal').classList.remove('show');
}

function showForgotPassword() {
    document.getElementById('forgotPasswordModal').classList.add('show');
    document.getElementById('loginModal').classList.remove('show');
    document.getElementById('signupModal').classList.remove('show');
}

function closeModals() {
    document.getElementById('loginModal').classList.remove('show');
    document.getElementById('signupModal').classList.remove('show');
    document.getElementById('forgotPasswordModal').classList.remove('show');
}

// Switch between login and signup
function switchToSignup() {
    showSignupModal();
}

function switchToLogin() {
    showLoginModal();
}

// Ensure Firebase is initialized
document.addEventListener('DOMContentLoaded', function() {
    // Check if Firebase Auth is available
    if (typeof firebase === 'undefined') {
        console.error('Firebase is not initialized. Please check your configuration.');
        return;
    }

    // Set up auth state observer
    firebase.auth().onAuthStateChanged((user) => {
        currentUser = user;
        if (user) {
            console.log('User is signed in:', user.email);
            updateUIForLoggedInUser(user);
        } else {
            console.log('No user is signed in.');
            resetAuthButtons();
        }
    });
});

// Form handling functions
async function handleLogin(event) {
    event.preventDefault();
    
    if (typeof firebase === 'undefined') {
        showNotification('Authentication service is not available. Please try again later.', 'error');
        return;
    }

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        showNotification(`Welcome back, ${userCredential.user.displayName || userCredential.user.email}!`, 'success');
        closeModals();
        updateUIForLoggedInUser(userCredential.user);
    } catch (error) {
        console.error('Login error:', error);
        let errorMessage = 'An error occurred during login.';
        
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email.';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Incorrect password.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address.';
                break;
            case 'auth/user-disabled':
                errorMessage = 'This account has been disabled.';
                break;
        }
        
        showNotification(errorMessage, 'error');
    }
}


async function handleSignup(event) {
    event.preventDefault();
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }

    try {
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        // Update user profile with first and last name
        await userCredential.user.updateProfile({
            displayName: `${firstName} ${lastName}`
        });
        showNotification('Account created successfully!', 'success');
        closeModals();
        updateUIForLoggedInUser(userCredential.user);
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function handleForgotPassword(event) {
    event.preventDefault();
    const email = document.getElementById('resetEmail').value;

    try {
        await firebase.auth().sendPasswordResetEmail(email);
        showNotification('Password reset email sent!', 'success');
        closeModals();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function handleSignup(event) {
    event.preventDefault();
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }

    try {
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Update Auth profile
        await user.updateProfile({
            displayName: `${firstName} ${lastName}`
        });

        // Save full details in Firestore
        await firebase.firestore().collection("users").doc(user.uid).set({
            firstName: firstName,
            lastName: lastName,
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        showNotification('Account created successfully!', 'success');
        closeModals();
        updateUIForLoggedInUser(user);
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// UI update functions
async function updateUIForLoggedInUser(user) {
    const authButtons = document.querySelector('.auth-buttons');
    if (!authButtons) return;

    let displayName = user.displayName || user.email.split('@')[0];
    const photoURL = user.photoURL || 'https://via.placeholder.com/30';
    

    try {
        // Try to load user data from Firestore
        const userDoc = await firebase.firestore().collection("users").doc(user.uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            displayName = `${userData.firstName} ${userData.lastName}`;
        }
    } catch (err) {
        console.error("Error fetching Firestore user profile:", err);
    }

    authButtons.innerHTML = `
        <div class="user-menu">
            <button class="user-profile-btn">
                <img src="${photoURL}" alt="Profile" class="avatar">
                <span>${displayName}</span>
            </button>
            <div class="dropdown-menu">
                <a href="#profile">Profile</a>
                <a href="#settings">Settings</a>
                <a href onclick="handleLogout()">Logout</a>
            </div>
        </div>
    `;
}

async function handleLogout() {
    try {
        await firebase.auth().signOut();
        showNotification('Logged out successfully', 'success');
        resetAuthButtons();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

function resetAuthButtons() {
    const authButtons = document.querySelector('.auth-buttons');
    authButtons.innerHTML = `
        <button type="button" class="login-btn" onclick="showLoginModal()">
            <i class="fas fa-sign-in-alt"></i>Login
        </button>
        <button type="button" class="signup-btn" onclick="showSignupModal()">
            <i class="fas fa-user-plus"></i>Sign Up
        </button>
    `;
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Mobile menu functionality
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const navLinks = document.querySelector('.nav-links');
const authButtons = document.querySelector('.auth-buttons');

mobileMenuBtn.addEventListener('click', () => {
    navLinks.classList.toggle('show');
    authButtons.classList.toggle('show');
    mobileMenuBtn.setAttribute('aria-expanded', 
        mobileMenuBtn.getAttribute('aria-expanded') === 'false' ? 'true' : 'false'
    );
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (!navLinks.contains(e.target) && 
        !authButtons.contains(e.target) && 
        !mobileMenuBtn.contains(e.target)) {
        navLinks.classList.remove('show');
        authButtons.classList.remove('show');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
    }
});

// Close mobile menu when window is resized above mobile breakpoint
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        navLinks.classList.remove('show');
        authButtons.classList.remove('show');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
    }
});

// Close modals when clicking outside
window.addEventListener('click', (event) => {
    if (event.target === loginModal || event.target === signupModal) {
        closeModals();
    }
});
async function handleContactSubmit(event) {
    event.preventDefault();

    const name = document.getElementById('contactName').value.trim();
    const number = document.getElementById('contactNumber').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const inquiryType = document.getElementById('inquiryType').value;
    const message = document.getElementById('contactMessage').value.trim();

    if (!name || !email || !message) {
        alert("Please fill in all fields.");
        return;
    }

    try {
        await firebase.firestore().collection("feedback").add({
            name: name,
            number: number,
            email: email,
            inquiryType: inquiryType,
            message: message,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            userId: currentUser ? currentUser.uid : null // optional: link to logged-in user
        });

        alert("Your message has been sent successfully!");
        document.getElementById('contactForm').reset();
    } catch (error) {
        console.error("Error submitting feedback:", error);
        alert("Error submitting your message. Please try again.");
    }
}
