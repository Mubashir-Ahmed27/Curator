// script.js - Interactive logic for Curator app

document.addEventListener('DOMContentLoaded', function() {
    // Check session on all pages
    checkSession();

    // Detect current page
    const currentPage = getCurrentPage();

    // Initialize page-specific logic
    switch(currentPage) {
        case 'index':
            initSignUpPage();
            break;
        case 'sign-up':
            initSignInPage();
            break;
        case 'home':
            initHomePage();
            break;
        case 'drafts':
            initDraftsPage();
            break;
        case 'profile':
            initProfilePage();
            break;
        case 'settings':
            initSettingsPage();
            break;
        case 'side-navbar':
            initSideNavbarPage();
            break;
    }

    // Global utilities
    initGlobalFeatures();
});

// Get current page based on URL or title
function getCurrentPage() {
    const path = window.location.pathname;
    const title = document.title.toLowerCase();

    if (path.includes('index.html') || title.includes('create account')) return 'index';
    if (path.includes('sign-up.html') || title.includes('sign in')) return 'sign-up';
    if (path.includes('home.html') || title.includes('all posts')) return 'home';
    if (path.includes('drafts.html') || title.includes('drafts')) return 'drafts';
    if (path.includes('profile.html') || title.includes('creator profile')) return 'profile';
    if (path.includes('settings.html') || title.includes('settings')) return 'settings';
    if (path.includes('side-navbar.html')) return 'side-navbar';

    return 'unknown';
}

// Session management functions
function checkSession() {
    const loggedInUser = localStorage.getItem('loggedInUser');
    const currentPage = getCurrentPage();

    // If user is logged in and on auth pages, redirect to home
    if (loggedInUser && (currentPage === 'index' || currentPage === 'sign-up')) {
        showNotification('You are already logged in!', 'info');
        setTimeout(() => {
            window.location.href = currentPage === 'index' ? 'Curator Pages/home.html' : 'home.html';
        }, 1500);
        return;
    }

    // If user is not logged in and on protected pages, redirect to sign-in
    if (!loggedInUser && ['home', 'drafts', 'profile', 'settings', 'side-navbar'].includes(currentPage)) {
        showNotification('Please sign in to access this page', 'warning');
        setTimeout(() => {
            window.location.href = currentPage === 'index' ? 'Curator Pages/sign-up.html' : '../Curator Pages/sign-up.html';
        }, 1500);
        return;
    }

    // Update UI with logged in user info
    if (loggedInUser) {
        updateUIForLoggedInUser(loggedInUser);
    }
}

function updateUIForLoggedInUser(email) {
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const user = users[email];

    if (user) {
        // Update profile elements with user data
        const profileNames = document.querySelectorAll('.profile-name');
        const profileHandles = document.querySelectorAll('.profile-handle');
        const profileEmails = document.querySelectorAll('.row-value');

        profileNames.forEach(el => el.textContent = user.name);
        profileHandles.forEach(el => {
            if (el.textContent.includes('@')) {
                el.textContent = `@${user.name.toLowerCase().replace(/\s+/g, '_')}`;
            }
        });

        // Update email in settings
        profileEmails.forEach(el => {
            if (el.textContent.includes('@')) {
                el.textContent = email;
            }
        });
    }
}

function logout() {
    localStorage.removeItem('loggedInUser');
    showNotification('Logged out successfully', 'success');
    setTimeout(() => {
        window.location.href = getCurrentPage() === 'index' ? 'Curator Pages/sign-up.html' : '../Curator Pages/sign-up.html';
    }, 1000);
}

// User data management
function saveUserData(name, email, password) {
    const users = JSON.parse(localStorage.getItem('users') || '{}');

    if (users[email]) {
        throw new Error('User already exists with this email');
    }

    users[email] = {
        name: name,
        email: email,
        password: password, // In real app, this should be hashed
        createdAt: new Date().toISOString(),
        posts: [],
        settings: {
            theme: 'light',
            notifications: {
                newPosts: true,
                directMessages: true,
                editorialUpdates: false
            }
        }
    };

    localStorage.setItem('users', JSON.stringify(users));
    return users[email];
}

function authenticateUser(email, password) {
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const user = users[email];

    if (!user) {
        throw new Error('User not found');
    }

    if (user.password !== password) {
        throw new Error('Invalid password');
    }

    return user;
}

function getCurrentUser() {
    const email = localStorage.getItem('loggedInUser');
    if (!email) return null;

    const users = JSON.parse(localStorage.getItem('users') || '{}');
    return users[email] || null;
}

// Sign-up page logic
function initSignUpPage() {
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            // Basic validation
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            if (!name || !email || !password) {
                showNotification('Please fill in all fields', 'error');
                return;
            }

            if (password.length < 8) {
                showNotification('Password must be at least 8 characters long', 'error');
                return;
            }

            try {
                // Save user data
                const user = saveUserData(name, email, password);

                // Auto-login the user
                localStorage.setItem('loggedInUser', email);

                showNotification('Account created successfully!', 'success');
                setTimeout(() => {
                    window.location.href = 'Curator Pages/home.html';
                }, 1500);
            } catch (error) {
                showNotification(error.message, 'error');
            }
        });
    }
}

// Sign-in page logic
function initSignInPage() {
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            if (!email || !password) {
                showNotification('Please enter email and password', 'error');
                return;
            }

            try {
                // Authenticate user
                const user = authenticateUser(email, password);

                // Set logged in user
                localStorage.setItem('loggedInUser', email);

                showNotification('Logged in successfully!', 'success');
                setTimeout(() => {
                    window.location.href = 'home.html';
                }, 1500);
            } catch (error) {
                showNotification(error.message, 'error');
            }
        });
    }
}

// Home page logic
function initHomePage() {
    // Load user posts
    loadUserPosts();

    // Filter buttons
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');

            // Filter posts (simplified - would need actual filtering logic)
            const filterType = this.textContent.toLowerCase();
            console.log('Filtering by:', filterType);
        });
    });

    // Action buttons (edit/delete)
    const editBtns = document.querySelectorAll('.action-btn.edit');
    const deleteBtns = document.querySelectorAll('.action-btn.delete');

    editBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const postCard = this.closest('.post-card');
            const postId = postCard.dataset.postId;
            const title = postCard.querySelector('.card-title').textContent;
            alert(`Editing: ${title}`);
            // Could redirect to drafts page with pre-filled content
            if (postId) {
                loadPostForEditing(postId);
            }
            window.location.href = 'drafts.html';
        });
    });

    deleteBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const postCard = this.closest('.post-card');
            const postId = postCard.dataset.postId;

            if (confirm('Are you sure you want to delete this post?')) {
                if (postId) {
                    deletePost(postId);
                }
                postCard.remove();
                showNotification('Post deleted', 'success');
            }
        });
    });

    // Bottom navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all items
            navItems.forEach(i => i.classList.remove('active'));
            // Add active class to clicked item
            this.classList.add('active');
        });
    });
}

// Home page helper functions
function loadUserPosts() {
    const user = getCurrentUser();
    if (!user || !user.posts || user.posts.length === 0) return;

    // For now, just log the posts. In a real implementation, you'd dynamically create post cards
    console.log('User posts:', user.posts);
}

function deletePost(postId) {
    const email = localStorage.getItem('loggedInUser');
    if (!email) return;

    const users = JSON.parse(localStorage.getItem('users') || '{}');
    if (!users[email] || !users[email].posts) return;

    users[email].posts = users[email].posts.filter(post => post.id !== postId);
    localStorage.setItem('users', JSON.stringify(users));
}

function loadPostForEditing(postId) {
    const user = getCurrentUser();
    if (!user || !user.posts) return;

    const post = user.posts.find(p => p.id === postId);
    if (post) {
        // Save to draft for editing
        saveDraft(post.title, post.content);
    }
}

// Drafts page logic
function initDraftsPage() {
    const titleInput = document.querySelector('.title-input');
    const contentTextarea = document.querySelector('.content-textarea');
    const saveBtn = document.querySelector('.save-btn');
    const mobileSaveBtn = document.querySelector('.mobile-save-btn');

    // Load existing draft if any
    loadDraft();

    // Auto-save functionality (simulate)
    let autoSaveTimeout;
    function autoSave() {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(() => {
            const title = titleInput ? titleInput.value : '';
            const content = contentTextarea ? contentTextarea.value : '';

            // Save draft to localStorage
            saveDraft(title, content);

            console.log('Draft auto-saved');
        }, 1000);
    }

    if (titleInput) {
        titleInput.addEventListener('input', autoSave);
    }

    if (contentTextarea) {
        contentTextarea.addEventListener('input', autoSave);
    }

    // Save buttons
    function handleSave() {
        const title = titleInput ? titleInput.value.trim() : '';
        const content = contentTextarea ? contentTextarea.value.trim() : '';

        if (!title && !content) {
            showNotification('Please add some content before saving', 'warning');
            return;
        }

        // Save post to user's posts
        savePost(title, content);

        // Clear draft
        clearDraft();

        showNotification('Post saved successfully!', 'success');
        setTimeout(() => {
            window.location.href = 'home.html';
        }, 1500);
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', handleSave);
    }

    if (mobileSaveBtn) {
        mobileSaveBtn.addEventListener('click', handleSave);
    }

    // Character counter for content
    if (contentTextarea) {
        const charCounter = document.createElement('div');
        charCounter.className = 'char-counter';
        charCounter.style.cssText = 'font-size: 0.75rem; color: #666; margin-top: 0.5rem;';
        contentTextarea.parentNode.appendChild(charCounter);

        function updateCounter() {
            const count = contentTextarea.value.length;
            charCounter.textContent = `${count} characters`;
        }

        contentTextarea.addEventListener('input', updateCounter);
        updateCounter(); // Initial count
    }
}

// Draft helper functions
function loadDraft() {
    const draft = localStorage.getItem('currentDraft');
    if (draft) {
        const { title, content } = JSON.parse(draft);
        const titleInput = document.querySelector('.title-input');
        const contentTextarea = document.querySelector('.content-textarea');

        if (titleInput) titleInput.value = title || '';
        if (contentTextarea) contentTextarea.value = content || '';
    }
}

function saveDraft(title, content) {
    const draft = { title, content, timestamp: Date.now() };
    localStorage.setItem('currentDraft', JSON.stringify(draft));
}

function clearDraft() {
    localStorage.removeItem('currentDraft');
}

function savePost(title, content) {
    const email = localStorage.getItem('loggedInUser');
    if (!email) return;

    const users = JSON.parse(localStorage.getItem('users') || '{}');
    if (!users[email]) return;

    const post = {
        id: Date.now().toString(),
        title: title,
        content: content,
        createdAt: new Date().toISOString(),
        category: 'Journal' // Default category
    };

    if (!users[email].posts) {
        users[email].posts = [];
    }

    users[email].posts.unshift(post); // Add to beginning
    localStorage.setItem('users', JSON.stringify(users));
}

// Profile page logic
function initProfilePage() {
    // Bottom navigation buttons
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            navBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
        });
    });
}

// Settings page logic
function initSettingsPage() {
    // Load user settings
    const user = getCurrentUser();
    if (user && user.settings) {
        // Set theme
        if (user.settings.theme) {
            document.documentElement.setAttribute('data-theme', user.settings.theme);
            const themeBtns = document.querySelectorAll('.theme-btn');
            themeBtns.forEach(btn => {
                if (btn.textContent.toLowerCase() === user.settings.theme) {
                    btn.classList.add('active');
                }
            });
        }

        // Set notification toggles
        if (user.settings.notifications) {
            const toggles = document.querySelectorAll('.toggle-input');
            toggles.forEach(toggle => {
                const label = toggle.closest('.toggle-row').querySelector('.toggle-label').textContent;
                const settingKey = label.toLowerCase().replace(/\s+/g, '');
                if (user.settings.notifications[settingKey] !== undefined) {
                    toggle.checked = user.settings.notifications[settingKey];
                }
            });
        }
    }

    // Toggle switches
    const toggles = document.querySelectorAll('.toggle-input');
    toggles.forEach(toggle => {
        toggle.addEventListener('change', function() {
            const label = this.closest('.toggle-row').querySelector('.toggle-label');
            const setting = label.textContent;
            const status = this.checked ? 'enabled' : 'disabled';

            // Save to user settings
            saveUserSetting('notifications', setting.toLowerCase().replace(/\s+/g, ''), this.checked);

            console.log(`${setting}: ${status}`);
        });
    });

    // Theme buttons
    const themeBtns = document.querySelectorAll('.theme-btn');
    themeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all theme buttons
            themeBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');

            const theme = this.textContent.toLowerCase();
            document.documentElement.setAttribute('data-theme', theme);

            // Save theme preference
            saveUserSetting('theme', theme);

            console.log(`Theme changed to: ${theme}`);
        });
    });

    // Edit profile button
    const editBtn = document.querySelector('.btn-edit');
    if (editBtn) {
        editBtn.addEventListener('click', function() {
            // Already has onclick in HTML, but can add additional logic here
            console.log('Edit profile clicked');
        });
    }

    // Language selector (simplified)
    const langSelect = document.querySelector('.lang-select');
    if (langSelect) {
        langSelect.addEventListener('click', function() {
            alert('Language selection would open a dropdown in a real app');
        });
    }

    // Support links
    const supportRows = document.querySelectorAll('.support-row');
    supportRows.forEach(row => {
        row.addEventListener('click', function() {
            const label = this.querySelector('.label').textContent;
            alert(`${label} - This would open in a real app`);
        });
    });

    // Danger zone - Logout
    const logoutBtn = document.querySelector('.danger-row[href*="index.html"]');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }

    // Danger zone - Delete account
    const deleteBtn = document.querySelector('.danger-row.delete');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                deleteUserAccount();
            }
        });
    }
}

function saveUserSetting(category, key, value) {
    const email = localStorage.getItem('loggedInUser');
    if (!email) return;

    const users = JSON.parse(localStorage.getItem('users') || '{}');
    if (!users[email]) return;

    if (!users[email].settings) {
        users[email].settings = {};
    }

    if (category === 'theme') {
        users[email].settings.theme = value;
    } else if (category === 'notifications') {
        if (!users[email].settings.notifications) {
            users[email].settings.notifications = {};
        }
        users[email].settings.notifications[key] = value;
    }

    localStorage.setItem('users', JSON.stringify(users));
}

function deleteUserAccount() {
    const email = localStorage.getItem('loggedInUser');
    if (!email) return;

    const users = JSON.parse(localStorage.getItem('users') || '{}');
    delete users[email];
    localStorage.setItem('users', JSON.stringify(users));

    localStorage.removeItem('loggedInUser');
    showNotification('Account deleted successfully', 'success');

    setTimeout(() => {
        window.location.href = getCurrentPage() === 'index' ? 'Curator Pages/sign-up.html' : '../Curator Pages/sign-up.html';
    }, 1500);
}

// Side navbar page logic
function initSideNavbarPage() {
    // Menu button
    const menuBtn = document.querySelector('.menu-btn');
    if (menuBtn) {
        menuBtn.addEventListener('click', function() {
            // Toggle sidebar (simplified - would need actual sidebar logic)
            alert('Menu would toggle sidebar in a real app');
        });
    }

    // Avatar click (already has onclick in HTML)
    const avatar = document.querySelector('.header-avatar');
    if (avatar) {
        avatar.addEventListener('click', function() {
            // Additional logic if needed
            console.log('Avatar clicked');
        });
    }
}

// Global features
function initGlobalFeatures() {
    // Smooth scrolling for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add loading states to buttons
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Add loading state briefly
            if (!this.classList.contains('loading')) {
                this.classList.add('loading');
                this.disabled = true;

                setTimeout(() => {
                    this.classList.remove('loading');
                    this.disabled = false;
                }, 1000);
            }
        });
    });

    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        // ESC key handling
        if (e.key === 'Escape') {
            // Close modals, go back, etc.
            const backBtn = document.querySelector('.back-btn, .close-btn');
            if (backBtn) {
                backBtn.click();
            }
        }
    });

    // Touch gestures for mobile (simplified)
    let touchStartX = 0;
    let touchEndX = 0;

    document.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
    });

    document.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });

    function handleSwipe() {
        const swipeThreshold = 50;
        const swipeDistance = touchEndX - touchStartX;

        if (Math.abs(swipeDistance) > swipeThreshold) {
            if (swipeDistance > 0) {
                // Swipe right - go back
                const backBtn = document.querySelector('.back-btn, .close-btn');
                if (backBtn) backBtn.click();
            } else {
                // Swipe left - go forward or open menu
                const menuBtn = document.querySelector('.menu-btn');
                if (menuBtn) menuBtn.click();
            }
        }
    }
}

// Utility functions
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--color-primary);
        color: white;
        padding: 1rem;
        border-radius: 0.5rem;
        z-index: 1000;
        animation: slideInRight 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add some basic CSS for notifications and loading states
const style = document.createElement('style');
style.textContent = `
    .notification {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    button.loading {
        opacity: 0.7;
        cursor: not-allowed;
    }

    button.loading::after {
        content: '';
        display: inline-block;
        width: 12px;
        height: 12px;
        border: 2px solid #ffffff;
        border-radius: 50%;
        border-top-color: transparent;
        animation: spin 1s ease-in-out infinite;
        margin-left: 0.5rem;
    }

    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }

    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    .char-counter {
        text-align: right;
    }
`;
document.head.appendChild(style);