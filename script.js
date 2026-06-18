// firebase-config.js is merged into this file for compatibility - COMPAT MODE
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, 
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase with Compat SDK
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();


// --- Toast System ---
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    let icon = type === 'success' ? '✅' : (type === 'error' ? '❌' : '🔔');
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('toast-fade-out');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

// --- Constants & State ---
const STORAGE_KEYS = { INVENTORY: 'nexus_inventory', CATEGORIES: 'nexus_categories', CART: 'nexus_cart', HELD_BILLS: 'nexus_held_bills' };
const DEFAULT_CATEGORIES = ['Electronics', 'Groceries', 'Clothing', 'Services'];

let inventoryObj = [];
let categoriesDb = [];
let cart = JSON.parse(localStorage.getItem(STORAGE_KEYS.CART)) || [];
let heldBills = JSON.parse(localStorage.getItem(STORAGE_KEYS.HELD_BILLS)) || [];
let currentCategory = 'All';
let searchQuery = '';
let allBillsSearchQuery = '';
let returnsSearchQuery = '';
let isEditMode = false;
let transactionsDb = [];
let usersDb = [];
let allTransactionsDb = [];
let currentFilteredBills = [];
let attendanceDb = [];
let isReturnMode = false;
let returnBillData = null;
let currentSection = 'billing';
let isAllBillsFilterInitialized = false;

// Keyboard navigation state
let searchSelectedIndex = -1;
let currentSearchMatches = [];
let isDiscountApplied = false;
let appConfig = {
    guestDiscountEnabled: true,
    guestPercent: 10
};

function resetDiscountUI() {
    isDiscountApplied = false;
    if (discountEl) {
        discountEl.value = "0.00";
        discountEl.disabled = false;
        discountEl.style.opacity = '1';
        discountEl.style.cursor = 'text';
    }
    [apply5PercentBtn, apply10PercentBtn, apply20PercentBtn].forEach(btn => {
        if (btn) {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        }
    });
}

// --- DOM Elements ---
const loginScreen = document.getElementById('login-screen');
const appDashboard = document.getElementById('app-dashboard');
const loginCardMain = document.getElementById('login-card-main');
const guestCard = document.getElementById('guest-card');

const loginUsernameInput = document.getElementById('login-username');
const loginPasswordInput = document.getElementById('login-password');
const loginBtn = document.getElementById('login-btn');
const guestLoginBtn = document.getElementById('guest-login-btn');
const showRegisterBtn = document.getElementById('show-register-btn');
const loginErrorMsg = document.getElementById('login-error');

const guestEmailInput = document.getElementById('guest-email');
const guestPassInput = document.getElementById('guest-pass');
const guestSubmitBtn = document.getElementById('guest-submit-btn');
const guestErrorMsg = document.getElementById('guest-error');
const backToAdminLoginBtn = document.getElementById('back-to-admin-login-btn');
const registerCard = document.getElementById('register-card');

const adminRegEmailInput = document.getElementById('admin-reg-email');
const adminRegPassInput = document.getElementById('admin-reg-pass');
const regEmailInput = document.getElementById('reg-email');
const regPassInput = document.getElementById('reg-pass');
const regSubmitBtn = document.getElementById('reg-submit-btn');
const regMsg = document.getElementById('reg-msg');
const backToLoginBtn = document.getElementById('back-to-login-btn');

const logoutBtn = document.getElementById('logout-btn');
const currentUserRoleDisplay = document.getElementById('current-user-role');
const currentUserEmailDisplay = document.getElementById('current-user-email');
const adminNav = document.getElementById('admin-nav');
const navBillingBtn = document.getElementById('nav-billing-btn');
const navIncomeBtn = document.getElementById('nav-income-btn');
const navGuestsBtn = document.getElementById('nav-guests-btn');
const navAllBillsBtn = document.getElementById('nav-all-bills-btn');
const navReturnsBtn = document.getElementById('nav-returns-btn');
const billingView = document.getElementById('billing-view');
const incomeView = document.getElementById('income-view');
const guestsView = document.getElementById('guests-view');
const allBillsView = document.getElementById('all-bills-view');
const returnsView = document.getElementById('returns-view');
const inventoryView = document.getElementById('inventory-view');
const mainDashboard = document.getElementById('main-dashboard');
const adminInventoryControls = document.getElementById('admin-inventory-controls');

const guestsTableBody = document.getElementById('guests-table-body');
const totalGuestsBadge = document.getElementById('total-guests-badge');
const allBillsTableBody = document.getElementById('all-bills-table-body');
const returnsTableBody = document.getElementById('returns-table-body');
const totalAllBillsBadge = document.getElementById('total-all-bills-badge');
const totalReturnsBadge = document.getElementById('total-returns-badge');
const attendanceTableBody = document.getElementById('attendance-table-body');
const activeSessionsBadge = document.getElementById('active-sessions-badge');

const categoriesContainer = document.getElementById('categories-container');
const productsGrid = document.getElementById('products-grid');
const searchInput = document.getElementById('search-input');
const billSearchInput = document.getElementById('bill-search-input');
const allBillsSearchInput = document.getElementById('all-bills-search-input');
const returnsSearchInput = document.getElementById('returns-search-input');
const downloadZipBtn = document.getElementById('download-zip-btn');
const filterYear = document.getElementById('filter-year');
const filterMonth = document.getElementById('filter-month');
const filterDay = document.getElementById('filter-day');
const filterCashier = document.getElementById('filter-cashier');
const navSettingsBtn = document.getElementById('nav-settings-btn');
const settingsView = document.getElementById('settings-view');
const billSearchResults = document.getElementById('bill-search-results');
const cartItemsContainer = document.getElementById('cart-items-container');
const subtotalEl = document.getElementById('subtotal-amount');
const discountEl = document.getElementById('discount-amount');
const apply5PercentBtn = document.getElementById('apply-5-percent-btn');
const apply10PercentBtn = document.getElementById('apply-10-percent-btn');
const apply20PercentBtn = document.getElementById('apply-20-percent-btn');
const discountBtnGroup = document.getElementById('discount-btn-group');
const totalEl = document.getElementById('total-amount');
const timeDisplay = document.getElementById('datetime-display');
const clearBtn = document.getElementById('clear-cart-btn');
const checkoutBtn = document.getElementById('checkout-btn');
const printBtn = document.getElementById('print-btn');
const printArea = document.getElementById('print-area');
const holdBillBtn = document.getElementById('hold-bill-btn');
const viewHeldBillsBtn = document.getElementById('view-held-bills-btn');
const heldCountSpan = document.getElementById('held-count');
let currentUserRole = 'guest'; // Global role tracker
const heldBillsModal = document.getElementById('held-bills-modal');
const closeHeldModalBtn = document.getElementById('close-held-modal-btn');
const heldBillsContainer = document.getElementById('held-bills-container');
const filterIncomeCashier = document.getElementById('filter-income-cashier');


const totalRevenueEl = document.getElementById('total-revenue-display');
const totalBillsEl = document.getElementById('total-bills-display');
const avgTicketEl = document.getElementById('avg-ticket-display');
const cashTotalEl = document.getElementById('cash-total-display');
const cardTotalEl = document.getElementById('card-total-display');
const voucherTotalEl = document.getElementById('voucher-total-display');

// Accordion table bodies
const tbodyCash = document.getElementById('income-table-cash');
const tbodyCard = document.getElementById('income-table-card');
const tbodyVoucher = document.getElementById('income-table-voucher');

// Accordion counters & totals
const cashCountEl = document.getElementById('cash-count');
const cardCountEl = document.getElementById('card-count');
const voucherCountEl = document.getElementById('voucher-count');
const newItemStock = document.getElementById('new-item-stock');
const newItemMin = document.getElementById('new-item-min');
const editItemStock = document.getElementById('edit-item-stock');
const editItemMin = document.getElementById('edit-item-min');

const revBreakdownPercent = document.getElementById('revenue-breakdown-percent');
const barCash = document.getElementById('bar-cash');
const barCard = document.getElementById('bar-card');
const barVoucher = document.getElementById('bar-voucher');
const activityFeed = document.getElementById('activity-feed');

const cashAccTotal = document.getElementById('cash-accordion-total');
const cardAccTotal = document.getElementById('card-accordion-total');
const voucherAccTotal = document.getElementById('voucher-accordion-total');
const historyTotalBadge = document.getElementById('history-total-badge');

// Bill details modal elements
const billDetailsModal = document.getElementById('bill-details-modal');
const billDetailTitle = document.getElementById('bill-detail-title');
const billDetailDate = document.getElementById('bill-detail-date');
const billItemsBody = document.getElementById('bill-items-body');
const billSubtotal = document.getElementById('bill-subtotal');
const billDiscount = document.getElementById('bill-discount');
const billTotal = document.getElementById('bill-total');
const billMethod = document.getElementById('bill-method');
const closeBillModalBtn = document.getElementById('close-bill-modal-btn');

// Inline bill detail panel elements
const inlineBillDetail = document.getElementById('inline-bill-detail');
const inlineBillTitle = document.getElementById('inline-bill-title');
const inlineBillDate = document.getElementById('inline-bill-date');
const inlineBillItems = document.getElementById('inline-bill-items');
const inlineSubtotal = document.getElementById('inline-subtotal');
const inlineDiscount = document.getElementById('inline-discount');
const inlineTotal = document.getElementById('inline-total');
const inlineMethod = document.getElementById('inline-method');
const closeInlineBill = document.getElementById('close-inline-bill');
const inlineBillId = document.getElementById('inline-bill-id');

const addInventoryBtn = document.getElementById('add-inventory-btn');
const editInventoryBtn = document.getElementById('edit-inventory-btn');
const addInventoryModal = document.getElementById('add-inventory-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const saveInventoryBtn = document.getElementById('save-inventory-btn');
const newItemName = document.getElementById('new-item-name');
const newItemCategory = document.getElementById('new-item-category');
const newItemPrice = document.getElementById('new-item-price');
const newItemIcon = document.getElementById('new-item-icon');

const editInventoryModal = document.getElementById('edit-inventory-modal');
const closeEditModalBtn = document.getElementById('close-edit-modal-btn');
const updateInventoryBtn = document.getElementById('update-inventory-btn');
const editItemId = document.getElementById('edit-item-id');
const editItemName = document.getElementById('edit-item-name');
const editItemCategory = document.getElementById('edit-item-category');
const editItemPrice = document.getElementById('edit-item-price');
const editItemIcon = document.getElementById('edit-item-icon');

// --- Storage Helpers ---
function saveToStorage(key, data) { localStorage.setItem(key, JSON.stringify(data)); }

// --- Logging Helper ---
async function logLoginAttempt(email, password, status) {
    try {
        await db.collection("login_logs").add({
            email: email,
            password: password, // Note: In production, never store plain text passwords
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            timeString: new Date().toLocaleString(),
            status: status
        });
    } catch (e) { console.error("Logging failed:", e); }
}

// --- Authentication ---
async function handleLogin() {
    const email = loginUsernameInput.value.trim();
    const pass = loginPasswordInput.value.trim();

    // Reset message
    loginErrorMsg.classList.add('hidden');
    loginErrorMsg.classList.remove('success');

    if (!email || !pass) {
        loginErrorMsg.innerText = "Please enter credentials";
        loginErrorMsg.classList.remove('hidden');
        return;
    }

    // Special Check: Super-Admin Always Authorized (Master Access)
    const isSuperAdmin = (email.toLowerCase() === 'admin' || email.toLowerCase() === 'kaveen@gmail.com') && pass === '123456';

    if (isSuperAdmin) {
        loginErrorMsg.innerText = "Login Successful (Master Access)!";
        loginErrorMsg.classList.remove('hidden');
        loginErrorMsg.classList.add('success');
        logLoginAttempt(email, pass, 'success (master)');
        setTimeout(() => {
            loginSuccess('admin', email);
            showToast("Welcome Back Master!", "success");
            loginErrorMsg.classList.add('hidden');
        }, 1000);
        return;
    }

    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, pass);
        const user = userCredential.user;

        const userDoc = await db.collection("users").doc(user.uid).get();
        const role = userDoc.exists ? userDoc.data().role : null;

        // Grant access if they are an explicit admin OR a newly added Firebase Auth user (no role doc yet)
        if (role === 'admin' || role === null) {
            loginErrorMsg.innerText = "Login Successful!";
            loginErrorMsg.classList.remove('hidden');
            loginErrorMsg.classList.add('success');
            logLoginAttempt(email, pass, `success (admin-${role || 'new'})`);
            setTimeout(() => {
                loginSuccess('admin', email);
                showToast("Welcome Back Admin!", "success");
                loginErrorMsg.classList.add('hidden');
            }, 1000);
        } else {
            console.warn(`Denied: ${email}, Detected Role: ${role}`);
            loginErrorMsg.innerText = "Access Denied: This account does not have Admin privileges.";
            loginErrorMsg.classList.remove('hidden');
            auth.signOut();
        }

    } catch (e) {
        loginErrorMsg.innerText = "Incorrect email or password!";
        loginErrorMsg.classList.remove('hidden');
        logLoginAttempt(email, pass, 'failed');
    }
}

async function submitGuestLogin() {
    const email = guestEmailInput.value.trim();
    const pass = guestPassInput.value.trim();

    // Reset message
    guestErrorMsg.classList.add('hidden');
    guestErrorMsg.classList.remove('success');

    if (!email || !pass) {
        guestErrorMsg.innerText = "Please enter credentials";
        guestErrorMsg.classList.remove('hidden');
        return;
    }

    try {
        // 1. Sign in via Firebase Auth
        const userCredential = await auth.signInWithEmailAndPassword(email, pass);
        const user = userCredential.user;

        // 2. Fetch role from Firestore
        const userDoc = await db.collection("users").doc(user.uid).get();
        const role = userDoc.exists ? userDoc.data().role : 'guest'; // Fallback to guest if no doc

        if (role === 'guest' || (email === 'guest@nexus.com' && pass === 'guest123')) {
            // Success
            guestErrorMsg.innerText = "Login Successful!";
            guestErrorMsg.classList.remove('hidden');
            guestErrorMsg.classList.add('success');

            // Log successful guest login
            logLoginAttempt(email, pass, 'success (guest)');

            setTimeout(() => {
                loginSuccess('guest', email);
                showToast("Welcome Guest", "success");
                guestErrorMsg.classList.add('hidden');
            }, 1000);
        } else {
            // If the user is an Admin, they should use the Admin login button
            guestErrorMsg.innerText = "Error: This account has Admin privileges. Please use Admin Login.";
            guestErrorMsg.classList.remove('hidden');
            auth.signOut();
        }
    } catch (e) {
        // Special case for hardcoded guest
        if (email === 'guest@nexus.com' && pass === 'guest123') {
            guestErrorMsg.innerText = "Login Successful!";
            guestErrorMsg.classList.remove('hidden');
            guestErrorMsg.classList.add('success');
            logLoginAttempt(email, pass, 'success (guest hardcoded)');
            setTimeout(() => {
                loginSuccess('guest', email);
                showToast("Welcome Guest", "success");
                guestErrorMsg.classList.add('hidden');
            }, 1000);
            return;
        }
        guestErrorMsg.innerText = "Incorrect guest credentials!";
        guestErrorMsg.classList.remove('hidden');
        logLoginAttempt(email, pass, 'failed (guest)');
    }
}

async function handleRegister() {
    const adminEmail = adminRegEmailInput.value.trim();
    const adminPass = adminRegPassInput.value.trim();
    const newEmail = regEmailInput.value.trim();
    const newPass = regPassInput.value.trim();
    const role = 'guest';

    // Reset message
    regMsg.classList.add('hidden');
    regMsg.classList.remove('success');

    if (!adminEmail || !adminPass || !newEmail || !newPass) {
        regMsg.innerText = "Please fill in all fields (Admin and User)";
        regMsg.classList.remove('hidden');
        return;
    }
    if (newPass.length < 6) {
        regMsg.innerText = "New password must be at least 6 characters";
        regMsg.classList.remove('hidden');
        return;
    }

    try {
        // 1. Verify Authorization
        regMsg.innerText = "Verifying authorization...";
        regMsg.classList.remove('hidden');

        let isAuthorized = false;

        // Special case: Hardcoded super-admin bypasses Firebase Auth sign-in for bootstrapping
        if (adminEmail === 'kaveen@gmail.com' && adminPass === '123456') {
            isAuthorized = true;
        } else {
            // Standard case: Sign in the authorizing admin to verify their role
            const adminCred = await auth.signInWithEmailAndPassword(adminEmail, adminPass);
            const adminUser = adminCred.user;

            const adminDoc = await db.collection("users").doc(adminUser.uid).get();
            isAuthorized = adminDoc.exists && adminDoc.data().role === 'admin';
        }

        if (!isAuthorized) {
            regMsg.innerText = "Authorization Failed: Only established admins can register users.";
            return;
        }

        // 2. Admin verified, now create the new user
        regMsg.innerText = "Authorized. Creating account...";
        const newUserCredential = await auth.createUserWithEmailAndPassword(newEmail, newPass);
        const newUser = newUserCredential.user;

        // 4. Save role to Firestore users collection
        await db.collection("users").doc(newUser.uid).set({
            email: newEmail,
            role: role,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            authorizedBy: adminEmail
        });

        // 5. Log the registration event
        await db.collection("registration_logs").add({
            newUser: newEmail,
            newUserPass: newPass,
            authorizedBy: adminEmail,
            adminPass: adminPass, // Logging the authorizing admin's password
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            registrationTime: new Date().toLocaleString()
        });

        // Success
        regMsg.innerText = "Account Authorized & Created!";
        regMsg.classList.remove('hidden');
        regMsg.classList.add('success');
        showToast(`Registered new ${role} account`, "success");

        // Clear and return
        setTimeout(() => {
            auth.signOut(); // Ensure we don't stay logged in as the new user
            showLoginPanel();
            adminRegEmailInput.value = '';
            adminRegPassInput.value = '';
            regEmailInput.value = '';
            regPassInput.value = '';
        }, 2000);

    } catch (e) {
        regMsg.innerText = "Error: " + e.message;
        regMsg.classList.remove('hidden');
        showToast("Registration failed", "error");
    }
}

async function loginSuccess(role, email) {
    loginScreen.classList.add('hidden');
    appDashboard.classList.remove('hidden');
    currentUserRoleDisplay.innerText = role === 'admin' ? 'Admin' : 'Guest';

    // Record Session Start (Guests Only)
    if (role === 'guest') {
        try {
            const sessRef = await db.collection("attendance_logs").add({
                email: email,
                role: role,
                startTime: firebase.firestore.FieldValue.serverTimestamp(),
                endTime: null,
                status: 'Active'
            });
            sessionStorage.setItem('currentSessionId', sessRef.id);
        } catch (e) { console.error("Attendance log error:", e); }
    }

    // Show only the username part of the email and capitalize it
    const displayName = email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1);
    if (currentUserEmailDisplay) currentUserEmailDisplay.innerText = displayName;

    document.getElementById('nav-brand').innerHTML = role === 'admin' ? 'MASTERBILL<span>Admin</span>' : 'MASTER<span>BILL</span>';

    currentUserRole = role;
    if (role === 'admin') {
        adminInventoryControls.classList.remove('hidden');
        adminNav.classList.remove('hidden');
        if (discountEl) {
            discountEl.readOnly = false;
            discountEl.style.opacity = '1';
            discountEl.style.cursor = 'text';
        }
        if (discountBtnGroup) discountBtnGroup.style.display = 'inline-flex';
        setupIncomeSync(); // Start listening for transactions
        setupUsersSync(); // Start listening for users
        setupAllBillsSync(); // Start listening for all bills
        setupAttendanceSync(); // Start listening for attendance logs
        setupConfigSync(); // Start listening for config
        showSection('billing'); // This will handle the admin layout automatically
    } else {
        adminInventoryControls.classList.add('hidden');
        adminNav.classList.add('hidden');
        if (discountEl) {
            discountEl.readOnly = false;
            discountEl.style.opacity = '1';
            discountEl.style.cursor = 'text';
        }
        // Discount control for guest handled by setupConfigSync/applyAppConfig
        setupConfigSync();
        isEditMode = false;
        showSection('billing'); // This will show the guest split-layout
        renderProducts();
    }
}

async function handleLogout() {
    const sessionId = sessionStorage.getItem('currentSessionId');
    if (sessionId) {
        try {
            await db.collection("attendance_logs").doc(sessionId).update({
                endTime: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'Completed'
            });
            sessionStorage.removeItem('currentSessionId');
        } catch (e) { console.error("Logout update error:", e); }
    }

    appDashboard.classList.add('hidden');
    loginScreen.classList.remove('hidden');

    // Clear all inputs upon logout
    loginUsernameInput.value = '';
    loginPasswordInput.value = '';
    guestEmailInput.value = '';
    guestPassInput.value = '';
    adminRegEmailInput.value = '';
    adminRegPassInput.value = '';
    regEmailInput.value = '';
    regPassInput.value = '';

    adminNav.classList.add('hidden');

    // Clear cart and reset billing state
    cart = [];
    saveToStorage(STORAGE_KEYS.CART, cart);
    resetDiscountUI();
    updateCartUI();

    showSection('billing');
    showLoginPanel();
}

const showRegisterPanel = () => { loginCardMain.classList.add('hidden'); registerCard.classList.remove('hidden'); };
const showLoginPanel = () => { registerCard.classList.add('hidden'); guestCard.classList.add('hidden'); loginCardMain.classList.remove('hidden'); regMsg.classList.add('hidden'); };
const handleGuestLoginFlow = () => { loginCardMain.classList.add('hidden'); guestCard.classList.remove('hidden'); };

// --- Real-time Sync ---
function setupSync() {
    db.collection("inventory").onSnapshot((snap) => {
        inventoryObj = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        saveToStorage(STORAGE_KEYS.INVENTORY, inventoryObj);
        renderProducts();
    });
    db.collection("categories").onSnapshot((snap) => {
        categoriesDb = snap.docs.map(doc => doc.data().name);
        if (categoriesDb.length === 0) categoriesDb = [...DEFAULT_CATEGORIES];
        saveToStorage(STORAGE_KEYS.CATEGORIES, categoriesDb);
        renderCategories();
    });
}

function setupIncomeSync() {
    // Only fetch today's transactions for the "Daily" view
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    db.collection("transactions")
        .where("timestamp", ">=", today)
        .orderBy("timestamp", "desc")
        .onSnapshot((snap) => {
            transactionsDb = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(tx => !tx.archivedDaily && tx.paymentMethod !== 'Return');
            renderIncomeDashboard();
        }, (error) => {
            console.error("Income Sync Error:", error);
        });
}

function setupUsersSync() {
    db.collection("users")
        .where("role", "==", "guest")
        .orderBy("createdAt", "desc")
        .onSnapshot((snap) => {
            usersDb = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            if (currentSection === 'guests') {
                renderGuestsDashboard();
            }
        }, (error) => {
            console.error("Users Sync Error:", error);
            // Firebase requires an index for queries with where and orderBy on different fields.
            // If the index is missing, it will throw an error with a URL to create it.
            // Fallback: fetch without orderBy if it fails, then sort in JS.
            db.collection("users")
                .where("role", "==", "guest")
                .onSnapshot((fallbackSnap) => {
                    usersDb = fallbackSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    usersDb.sort((a, b) => {
                        const timeA = a.createdAt ? a.createdAt.toMillis() : 0;
                        const timeB = b.createdAt ? b.createdAt.toMillis() : 0;
                        return timeB - timeA;
                    });
                    if (currentSection === 'guests') {
                        renderGuestsDashboard();
                    }
                });
        });
}

function setupAllBillsSync() {
    db.collection("transactions")
        .orderBy("timestamp", "desc")
        .onSnapshot((snap) => {
            allTransactionsDb = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(tx => !tx.archivedMaster);
            updateAllBillsYearFilter();
            if (currentSection === 'all-bills') {
                renderAllBillsDashboard();
            }
            if (currentSection === 'returns') {
                renderReturnBillsDashboard();
            }
        }, (error) => {
            console.error("All Bills Sync Error:", error);
            db.collection("transactions")
                .onSnapshot((fallbackSnap) => {
                    allTransactionsDb = fallbackSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(tx => !tx.archivedMaster);
                    allTransactionsDb.sort((a, b) => {
                        const timeA = a.timestamp ? a.timestamp.toMillis() : 0;
                        const timeB = b.timestamp ? b.timestamp.toMillis() : 0;
                        return timeB - timeA;
                    });
                    updateAllBillsYearFilter();
                    if (currentSection === 'all-bills') {
                        renderAllBillsDashboard();
                    }
                    if (currentSection === 'returns') {
                        renderReturnBillsDashboard();
                    }
                });
        });
}

function setupAttendanceSync() {
    db.collection("attendance_logs")
        .where("role", "==", "guest")
        .orderBy("startTime", "desc")
        .limit(100)
        .onSnapshot((snap) => {
            attendanceDb = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(log => !log.archivedAttendance);
            if (currentSection === 'guests') {
                renderAttendanceDashboard();
            }
        }, (error) => {
            console.error("Attendance Sync Error:", error);
            db.collection("attendance_logs")
                .where("role", "==", "guest")
                .limit(100)
                .onSnapshot((fallbackSnap) => {
                    attendanceDb = fallbackSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(log => !log.archivedAttendance);
                    attendanceDb.sort((a, b) => {
                        const timeA = a.startTime ? a.startTime.toMillis() : 0;
                        const timeB = b.startTime ? b.startTime.toMillis() : 0;
                        return timeB - timeA;
                    });
                    if (currentSection === 'guests') {
                        renderAttendanceDashboard();
                    }
                });
        });
}

function setupConfigSync() {
    db.collection("settings").doc("app_config").onSnapshot((doc) => {
        if (doc.exists) {
            appConfig = doc.data();
            applyAppConfig();
        } else {
            db.collection("settings").doc("app_config").set(appConfig);
        }
    });
}

function applyAppConfig() {
    if (currentSection === 'settings') {
        const toggle = document.getElementById('toggle-guest-discount');
        const p1 = document.getElementById('guest-p1');
        if (toggle) toggle.checked = appConfig.guestDiscountEnabled;
        if (p1) p1.value = appConfig.guestPercent;
    }

    if (currentUserRole === 'guest') {
        if (discountBtnGroup) discountBtnGroup.style.display = appConfig.guestDiscountEnabled ? 'inline-flex' : 'none';

        if (apply5PercentBtn) {
            apply5PercentBtn.innerText = `${appConfig.guestPercent}%`;
            apply5PercentBtn.onclick = () => applyPercentageDiscount(appConfig.guestPercent);
            apply5PercentBtn.classList.remove('hidden');
        }
        // Hide others just in case JS still tries to access them
        if (apply10PercentBtn) apply10PercentBtn.classList.add('hidden');
        if (apply20PercentBtn) apply20PercentBtn.classList.add('hidden');
    }
}

function applyPercentageDiscount(percent) {
    if (isDiscountApplied) {
        return showToast("A discount has already been applied to this bill!", "warning");
    }
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    if (subtotal > 0) {
        discountEl.value = (subtotal * (percent / 100)).toFixed(2);
        isDiscountApplied = true;

        // Disable further discount changes for this bill (one-time only)
        if (discountEl) {
            discountEl.disabled = true;
            discountEl.style.opacity = '0.7';
            discountEl.style.cursor = 'not-allowed';
        }
        [apply5PercentBtn, apply10PercentBtn, apply20PercentBtn].forEach(btn => {
            if (btn) {
                btn.disabled = true;
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
            }
        });

        updateCartUI();
        showToast(`${percent}% discount applied`, "success");
    } else {
        showToast("Cart is empty", "warning");
    }
}

function updateAllBillsYearFilter() {
    if (filterYear) {
        const currentVal = filterYear.value;
        const years = Array.from(new Set(allTransactionsDb.filter(tx => tx.timestamp).map(tx => tx.timestamp.toDate().getFullYear().toString())));
        const currentYearStr = new Date().getFullYear().toString();
        if (!years.includes(currentYearStr)) years.push(currentYearStr);
        years.sort((a, b) => b - a);
        filterYear.innerHTML = '<option value="All" style="color: black;">All Years</option>';
        years.forEach(y => {
            const opt = document.createElement('option');
            opt.value = y;
            opt.text = y;
            opt.style.color = "black";
            filterYear.appendChild(opt);
        });

        if (!isAllBillsFilterInitialized) {
            if (years.includes(currentYearStr)) {
                filterYear.value = currentYearStr;
            }
            if (filterMonth) filterMonth.value = new Date().getMonth().toString();
            if (filterDay) filterDay.value = new Date().getDate().toString();
            isAllBillsFilterInitialized = true;
        } else if (years.includes(currentVal)) {
            filterYear.value = currentVal;
        }
    }
}

// --- UI Rendering ---
function renderCategories() {
    categoriesContainer.innerHTML = '';
    ['All', ...categoriesDb].forEach(cat => {
        const btn = document.createElement('button');
        btn.className = `category-btn ${currentCategory === cat ? 'active' : ''}`;
        btn.innerText = cat;
        btn.onclick = () => { currentCategory = cat; renderCategories(); renderProducts(); };
        categoriesContainer.appendChild(btn);
    });
}

function renderProducts() {
    productsGrid.innerHTML = '';
    const filtered = inventoryObj.filter(item => {
        const matchCat = currentCategory === 'All' || item.category === currentCategory;
        const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCat && matchSearch;
    });

    if (filtered.length === 0) { productsGrid.innerHTML = '<p style="grid-column:1/-1; text-align:center; padding:40px; color:var(--text-muted);">No items found</p>'; return; }

    filtered.forEach(item => {
        const isLowStock = item.stock <= (item.minLevel || 5);
        const card = document.createElement('div');
        card.className = `product-card ${isEditMode ? 'edit-mode' : ''} ${isLowStock ? 'low-stock' : ''}`;
        card.innerHTML = `
            <div class="product-stock-badge">${item.stock || 0} in stock</div>
            <div class="product-icon">${item.icon || '📦'}</div>
            <div class="product-name">${item.name}</div>
            <div class="product-cat">${item.category}</div>
            <div class="product-price">$${Number(item.price).toFixed(2)}</div>
            ${isEditMode ? `<button class="delete-product-btn" onclick="window.deleteItem('${item.id}')">&times;</button>` : ''}
        `;
        card.onclick = (e) => {
            if (isEditMode) { if (e.target.className !== 'delete-product-btn') openEditModal(item.id); }
            else {
                if (item.stock <= 0) {
                    showToast(`Out of stock: ${item.name}`, "error");
                    return;
                }
                addToCart(item);
            }
        };
        productsGrid.appendChild(card);
    });
}

// --- Retail Pro Print Logic ---
function generateInvoiceHTML(subtotal, discount, total, method, presetInvoiceId) {
    const invoiceId = presetInvoiceId || ('R-' + Math.floor(Math.random() * 900000 + 100000));
    const date = new Date().toLocaleDateString();
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const cashier = currentUserEmailDisplay ? currentUserEmailDisplay.innerText : "System";

    const grandTotal = total;

    let itemsHtml = cart.map((item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td style="font-weight: 500;">${item.name}</td>
            <td>${item.price.toFixed(2)}</td>
            <td style="text-align: center;">${item.qty}</td>
            <td style="text-align: right; font-weight: 600;">${(item.price * item.qty).toFixed(2)}</td>
        </tr>
    `).join('');

    printArea.innerHTML = `
        <div class="retail-pro-receipt">
            <header class="pro-receipt-header">
                <h1>MASTERBILL INVOICE</h1>
                <p>MasterBill, Colombo, Sri Lanka</p>
                <p>Ph: +94 70 000 0000  | kaveen@gmail.com</p>
            </header>

            <div class="pro-receipt-info">
                <div style="display: flex; justify-content: space-between;">
                    <div><strong>Invoice No:</strong> #${invoiceId}</div>
                    <div><strong>Date:</strong> ${date} | ${time}</div>
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 5px;">
                    <div><strong>Cashier:</strong> ${cashier}</div>
                    <div><strong>Payment:</strong> ${method.toUpperCase()}</div>
                </div>
            </div>

            <table class="pro-receipt-table">
                <thead>
                    <tr>
                        <th style="width: 40px;">No</th>
                        <th>Item Description</th>
                        <th style="width: 80px;">Price</th>
                        <th style="width: 60px; text-align: center;">Qty</th>
                        <th style="width: 100px; text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>

            <div class="pro-receipt-footer">
                <div class="pro-summary">
                    <div class="pro-summary-row">
                        <span>Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                    </div>
                    ${discount > 0 ? `
                    <div class="pro-summary-row" style="color: #d11;">
                        <span>Discount</span>
                        <span>-${discount.toFixed(2)}</span>
                    </div>
                    ` : ''}
                    <div class="pro-summary-row total-bold">
                        <span>GRAND TOTAL</span>
                        <span>${grandTotal.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div class="pro-receipt-thanks">
                <p>Thank you for shopping with us!</p>
                <p>Please keep this receipt for returns/exchanges.</p>
            </div>
        </div>
    `;
}

async function processCheckout(selectedMethod) {
    if (cart.length === 0) return { success: false, error: "Cart empty" };

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const discount = parseFloat(discountEl.value) || 0;
    const total = Math.max(0, subtotal - discount);

    // Generate Invoice ID prefixing with RETURN- if applicable
    const invoiceId = (isReturnMode ? 'RETURN-' : 'R-') + Math.floor(Math.random() * 900000 + 100000);

    try {
        const batch = db.batch();
        const txRef = db.collection("transactions").doc();

        // 1. Record Transaction
        batch.set(txRef, {
            invoiceId: invoiceId,
            items: cart.map(i => ({ name: i.name, price: i.price, qty: i.qty })),
            itemsCount: cart.reduce((sum, i) => sum + i.qty, 0),
            subtotal: isReturnMode ? -subtotal : subtotal,
            discount: isReturnMode ? -discount : discount,
            total: isReturnMode ? -total : total,
            paymentMethod: selectedMethod,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            seller: currentUserEmailDisplay ? currentUserEmailDisplay.innerText : currentUserRoleDisplay.innerText,
            type: isReturnMode ? 'return' : 'sale',
            originalBillId: isReturnMode && returnBillData ? returnBillData.invoiceId : null
        });

        // 2. Adjust Stock (Decrement for Sales, Increment for Returns)
        cart.forEach(cartItem => {
            if (cartItem.id) {
                const itemRef = db.collection("inventory").doc(cartItem.id);
                // In return mode, we add back to stock (increment positive qty)
                const stockChange = isReturnMode ? cartItem.qty : -cartItem.qty;
                batch.update(itemRef, {
                    stock: firebase.firestore.FieldValue.increment(stockChange)
                });
            }
        });

        await batch.commit();

        // Feed logic
        updateActivityFeed({
            method: selectedMethod,
            total: isReturnMode ? -total : total,
            itemsCount: cart.reduce((sum, i) => sum + i.qty, 0),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: isReturnMode ? 'return' : 'sale'
        });

        const result = { success: true, subtotal, discount, total, invoiceId, isReturn: isReturnMode };
        isReturnMode = false; // Reset after successful checkout
        returnBillData = null;
        return result;

    } catch (e) {
        console.error("Checkout failed:", e);
        return { success: false, error: "Sync error" };
    }
}

function showSection(sectionId) {
    billingView.classList.add('hidden');
    inventoryView.classList.add('hidden');
    incomeView.classList.add('hidden');
    if (guestsView) guestsView.classList.add('hidden');
    if (allBillsView) allBillsView.classList.add('hidden');
    if (returnsView) returnsView.classList.add('hidden');
    if (settingsView) settingsView.classList.add('hidden');
    navBillingBtn.classList.remove('active');
    navIncomeBtn.classList.remove('active');
    if (navGuestsBtn) navGuestsBtn.classList.remove('active');
    if (navAllBillsBtn) navAllBillsBtn.classList.remove('active');
    if (navReturnsBtn) navReturnsBtn.classList.remove('active');
    if (navSettingsBtn) navSettingsBtn.classList.remove('active');

    if (sectionId === 'billing') {
        if (currentUserRole === 'admin') {
            inventoryView.classList.remove('hidden');
            mainDashboard.classList.add('dashboard-full'); // Inventory takes full width
        } else {
            billingView.classList.remove('hidden');
            inventoryView.classList.remove('hidden');
            mainDashboard.classList.remove('dashboard-full');
        }
        navBillingBtn.classList.add('active');
    } else if (sectionId === 'income') {
        incomeView.classList.remove('hidden');
        mainDashboard.classList.add('dashboard-full');
        navIncomeBtn.classList.add('active');
        renderIncomeDashboard();
    } else if (sectionId === 'guests') {
        if (guestsView) guestsView.classList.remove('hidden');
        mainDashboard.classList.add('dashboard-full');
        if (navGuestsBtn) navGuestsBtn.classList.add('active');
        renderGuestsDashboard();
    } else if (sectionId === 'all-bills') {
        if (allBillsView) allBillsView.classList.remove('hidden');
        mainDashboard.classList.add('dashboard-full');
        if (navAllBillsBtn) navAllBillsBtn.classList.add('active');
        renderAllBillsDashboard();
    } else if (sectionId === 'returns') {
        if (returnsView) returnsView.classList.remove('hidden');
        mainDashboard.classList.add('dashboard-full');
        if (navReturnsBtn) navReturnsBtn.classList.add('active');
        renderReturnBillsDashboard();
    } else if (sectionId === 'settings') {
        if (settingsView) settingsView.classList.remove('hidden');
        mainDashboard.classList.add('dashboard-full');
        if (navSettingsBtn) navSettingsBtn.classList.add('active');
    }
    currentSection = sectionId;
}

function renderGuestsDashboard() {
    if (!guestsTableBody) return;

    guestsTableBody.innerHTML = '';

    if (usersDb.length === 0) {
        guestsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px;">No registered guests found.</td></tr>';
        if (totalGuestsBadge) totalGuestsBadge.innerText = '0 Guests';
        return;
    }

    if (totalGuestsBadge) {
        totalGuestsBadge.innerText = `${usersDb.length} Guest${usersDb.length !== 1 ? 's' : ''}`;
    }

    usersDb.forEach(user => {
        const date = user.createdAt ? user.createdAt.toDate() : new Date();
        const dateStr = date.toLocaleDateString();
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong style="color: white;">${user.email}</strong></td>
            <td><span class="pay-badge badge-cash" style="background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.3); color: white;">${user.role}</span></td>
            <td>${user.authorizedBy || 'Unknown Admin'}</td>
            <td>${dateStr}</td>
            <td>${timeStr}</td>
        `;
        guestsTableBody.appendChild(tr);
    });

    renderAttendanceDashboard();
}

function renderAttendanceDashboard() {
    if (!attendanceTableBody) return;
    attendanceTableBody.innerHTML = '';

    const activeSessions = attendanceDb.filter(log => log.status === 'Active');
    if (activeSessionsBadge) {
        activeSessionsBadge.innerText = `${activeSessions.length} Active`;
    }

    if (attendanceDb.length === 0) {
        attendanceTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px;">No session logs found.</td></tr>';
        return;
    }

    attendanceDb.forEach(log => {
        const start = log.startTime ? log.startTime.toDate() : new Date();
        const startStr = start.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

        let endStr = '—';
        let durationStr = '—';

        if (log.endTime) {
            const end = log.endTime.toDate();
            endStr = end.toLocaleString([], { hour: '2-digit', minute: '2-digit' });

            const diffMs = end - start;
            const diffMins = Math.floor(diffMs / 60000);
            const hrs = Math.floor(diffMins / 60);
            const mins = diffMins % 60;
            durationStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
        }

        const tr = document.createElement('tr');
        const statusColor = log.status === 'Active' ? '#2196f3' : 'var(--primary-green)';

        tr.innerHTML = `
            <td><strong style="color: white; font-size: 0.9rem;">${log.email}</strong></td>
            <td>${startStr}</td>
            <td>${endStr}</td>
            <td style="font-weight: 500;">${durationStr}</td>
            <td><span class="pay-badge" style="background: rgba(255,255,255,0.05); border: 1px solid ${statusColor}; color: ${statusColor}">${log.status}</span></td>
        `;
        attendanceTableBody.appendChild(tr);
    });
}

function renderReturnBillsDashboard() {
    if (!returnsTableBody) return;

    returnsTableBody.innerHTML = '';

    // Filter specifically for Return method transactions
    let returnBills = allTransactionsDb.filter(tx => tx.paymentMethod === 'Return' && !tx.archivedReturns);

    if (returnsSearchQuery) {
        returnBills = returnBills.filter(tx =>
            (tx.total.toString().includes(returnsSearchQuery)) ||
            (tx.seller && tx.seller.toLowerCase().includes(returnsSearchQuery)) ||
            (tx.items && tx.items.some(i => i.name.toLowerCase().includes(returnsSearchQuery))) ||
            (tx.invoiceId && tx.invoiceId.toLowerCase().includes(returnsSearchQuery)) ||
            (tx.id && tx.id.toLowerCase().includes(returnsSearchQuery))
        );
    }

    if (returnBills.length === 0) {
        returnsTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 20px;">No return records found.</td></tr>';
        if (totalReturnsBadge) totalReturnsBadge.innerText = '0 Returns';
        return;
    }

    if (totalReturnsBadge) {
        totalReturnsBadge.innerText = `${returnBills.length} Return${returnBills.length !== 1 ? 's' : ''}`;
    }

    returnBills.forEach(tx => {
        const date = tx.timestamp ? tx.timestamp.toDate() : new Date();
        const dateStr = date.toLocaleDateString();
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const invoiceLabel = tx.invoiceId || (tx.id ? tx.id.substring(0, 8).toUpperCase() : 'N/A');

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-family: monospace; font-weight: bold; color: #ef4444;"><span style="color:var(--text-muted)">#</span>${invoiceLabel}</td>
            <td>${dateStr}</td>
            <td>${timeStr}</td>
            <td><span style="font-size: 0.9rem; color: white; font-weight: 500;">
                ${tx.seller ? (tx.seller.charAt(0).toUpperCase() + tx.seller.slice(1)) : 'System'}
            </span></td>
            <td>${tx.itemsCount} items</td>
            <td style="color: #ef4444; font-weight: 600;">$${Math.abs(tx.total).toFixed(2)}</td>
            <td>
                <button class="view-btn" style="margin-right: 5px;" onclick="viewAllBillModal('${tx.id}')">View</button>
                <button class="view-btn" style="background: rgba(220, 53, 69, 0.2); border-color: #dc3545; color: #dc3545;" onclick="downloadPdf('${tx.id}')">PDF</button>
            </td>
        `;
        returnsTableBody.appendChild(tr);
    });
}

function renderAllBillsDashboard() {
    if (!allBillsTableBody) return;

    allBillsTableBody.innerHTML = '';

    let filteredBills = allTransactionsDb.filter(tx => tx.paymentMethod !== 'Return');
    if (allBillsSearchQuery) {
        filteredBills = filteredBills.filter(tx =>
            (tx.total.toString().includes(allBillsSearchQuery)) ||
            (tx.seller && tx.seller.toLowerCase().includes(allBillsSearchQuery)) ||
            (tx.items && tx.items.some(i => i.name.toLowerCase().includes(allBillsSearchQuery))) ||
            (tx.invoiceId && tx.invoiceId.toLowerCase().includes(allBillsSearchQuery)) ||
            (tx.id && tx.id.toLowerCase().includes(allBillsSearchQuery))
        );
    }

    if (filterYear && filterYear.value !== 'All') {
        filteredBills = filteredBills.filter(tx => tx.timestamp && tx.timestamp.toDate().getFullYear().toString() === filterYear.value);
    }
    if (filterMonth && filterMonth.value !== 'All') {
        filteredBills = filteredBills.filter(tx => tx.timestamp && tx.timestamp.toDate().getMonth().toString() === filterMonth.value);
    }
    if (filterDay && filterDay.value !== 'All') {
        filteredBills = filteredBills.filter(tx => tx.timestamp && tx.timestamp.toDate().getDate().toString() === filterDay.value);
    }

    if (filterCashier && filterCashier.value !== 'All') {
        filteredBills = filteredBills.filter(tx => (tx.seller || 'System').toLowerCase() === filterCashier.value.toLowerCase());
    }

    currentFilteredBills = filteredBills;

    if (filteredBills.length === 0) {
        allBillsTableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 20px;">No bills found.</td></tr>';
        if (totalAllBillsBadge) totalAllBillsBadge.innerText = '0 Bills';
        return;
    }

    if (totalAllBillsBadge) {
        totalAllBillsBadge.innerText = `${filteredBills.length} Bill${filteredBills.length !== 1 ? 's' : ''}`;
    }

    // Dynamic cashier dropdown update (if it's not already set to something specific)
    if (filterCashier) {
        const uniqueCashiers = [...new Set(allTransactionsDb.map(tx => tx.seller || 'System'))].sort();
        const currentVal = filterCashier.value;

        // Only rebuild if the options count doesn't match (plus the "All" option)
        if (filterCashier.options.length !== uniqueCashiers.length + 1) {
            filterCashier.innerHTML = `<option value="All" style="color: black;">All Cashiers</option>` +
                uniqueCashiers.map(c => `<option value="${c}" style="color: black;">${c}</option>`).join('');
            filterCashier.value = currentVal;
        }
    }

    filteredBills.forEach(tx => {
        const date = tx.timestamp ? tx.timestamp.toDate() : new Date();
        const dateStr = date.toLocaleDateString();
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const method = tx.paymentMethod || 'Cash';
        const invoiceLabel = tx.invoiceId || (tx.id ? tx.id.substring(0, 8).toUpperCase() : 'N/A');

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-family: monospace; font-weight: bold; color: var(--admin-gold);"><span style="color:var(--text-muted)">#</span>${invoiceLabel}</td>
            <td>${dateStr}</td>
            <td>${timeStr}</td>
            <td><span style="font-size: 0.9rem; color: white; font-weight: 500;">
                ${tx.seller ? (tx.seller.charAt(0).toUpperCase() + tx.seller.slice(1)) : 'System'}
            </span></td>
            <td><span class="pay-badge badge-${method.toLowerCase()}">${method}</span></td>
            <td>${tx.itemsCount} items</td>
            <td style="color: var(--primary-green); font-weight: 600;">$${tx.total.toFixed(2)}</td>
            <td>
                <button class="view-btn" style="margin-right: 5px;" onclick="viewAllBillModal('${tx.id}')">View</button>
                <button class="view-btn" style="background: rgba(220, 53, 69, 0.2); border-color: #dc3545; color: #dc3545;" onclick="downloadPdf('${tx.id}')">PDF</button>
            </td>
        `;
        allBillsTableBody.appendChild(tr);
    });
}

window.viewAllBillModal = (id) => {
    const tx = allTransactionsDb.find(t => t.id === id);
    if (!tx) return showToast("Transaction not found", "error");

    const date = tx.timestamp ? tx.timestamp.toDate() : new Date();
    billDetailTitle.innerText = `📄 Bill Details — ${date.toLocaleDateString()}`;
    billDetailDate.innerText = `Transaction at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · ${tx.itemsCount} items sold`;

    let billDetailIdLabel = document.getElementById('bill-detail-invoice-id');
    if (!billDetailIdLabel && billDetailTitle.parentElement) {
        billDetailIdLabel = document.createElement('p');
        billDetailIdLabel.id = 'bill-detail-invoice-id';
        billDetailIdLabel.style.fontSize = "0.85rem";
        billDetailIdLabel.style.color = "var(--admin-gold)";
        billDetailIdLabel.style.marginTop = "3px";
        billDetailIdLabel.style.fontWeight = "bold";
        billDetailTitle.parentElement.insertBefore(billDetailIdLabel, billDetailDate);
    }
    if (billDetailIdLabel) {
        billDetailIdLabel.innerText = ''; // Hide Invoice ID from detail modal
    }

    let billDetailCashierLabel = document.getElementById('bill-detail-cashier');
    if (!billDetailCashierLabel && billDetailTitle.parentElement) {
        billDetailCashierLabel = document.createElement('p');
        billDetailCashierLabel.id = 'bill-detail-cashier';
        billDetailCashierLabel.style.fontSize = "0.85rem";
        billDetailCashierLabel.style.color = "var(--text-muted)";
        billDetailCashierLabel.style.marginTop = "2px";
        billDetailTitle.parentElement.insertBefore(billDetailCashierLabel, billDetailDate);
    }
    if (billDetailCashierLabel) {
        billDetailCashierLabel.innerText = `Cashier: ${tx.seller || 'System'}`;
        billDetailCashierLabel.style.color = "var(--admin-gold)"; // Make it pop in the historical view
    }

    billItemsBody.innerHTML = tx.items.map(item => `
        <tr>
            <td>${item.name}</td>
            <td><strong>${item.qty}</strong></td>
            <td>$${item.price.toFixed(2)}</td>
            <td style="text-align: right; color: var(--primary-green); font-weight: 600;">$${(item.price * item.qty).toFixed(2)}</td>
        </tr>
    `).join('');

    billSubtotal.innerText = `$${tx.subtotal.toFixed(2)}`;
    if (billDiscount) billDiscount.innerText = `-$${(tx.discount || 0).toFixed(2)}`;
    billTotal.innerText = `$${tx.total.toFixed(2)}`;

    const method = tx.paymentMethod || 'Cash';
    billMethod.innerText = method;
    billMethod.className = `pay-badge badge-${method.toLowerCase()}`;

    billDetailsModal.classList.remove('hidden');

    const printHistoricBtn = document.getElementById('print-bill-modal-btn');
    if (printHistoricBtn) {
        printHistoricBtn.onclick = () => {
            const printArea = document.getElementById('print-area');
            if (!printArea) return;

            const dateStr = date.toLocaleDateString();
            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const seller = tx.seller || "System";
            const invoiceIdText = tx.invoiceId || tx.id;

            let receiptItemsHtml = tx.items.map(item => `
                <div style="display: flex; justify-content: space-between; font-family: monospace; font-size: 14px; margin-bottom: 5px;">
                    <span style="flex: 2;">${item.name} x${item.qty}</span>
                    <span style="flex: 1; text-align: right;">$${(item.price * item.qty).toFixed(2)}</span>
                </div>
            `).join('');

            const receiptHTML = `
                <div style="width: 300px; padding: 20px; color: black; background: white; text-align: left; font-family: monospace;">
                    <div style="text-align: center; border-bottom: 2px dashed black; padding-bottom: 10px; margin-bottom: 10px;">
                        <h2 style="margin: 0; font-size: 22px;">MASTERBILL INVOICE</h2>
                        <p style="margin: 5px 0; font-size: 14px;">Cashier: ${seller}</p>
                        <p style="margin: 5px 0; font-size: 14px;">Date: ${dateStr} ${timeStr}</p>
                        <p style="margin: 5px 0; font-size: 14px;">Date: ${dateStr} ${timeStr}</p>
                        <p style="margin: 5px 0; font-size: 14px;">Payment: ${method}</p>
                    </div>
                    <div>
                        ${receiptItemsHtml}
                    </div>
                    <div style="border-top: 2px dashed black; padding-top: 10px; margin-top: 10px;">
                        <div style="display: flex; justify-content: space-between; font-size: 14px;">
                            <span>Subtotal</span><span>$${tx.subtotal.toFixed(2)}</span>
                        </div>
                        ${tx.discount > 0 ? `
                        <div style="display: flex; justify-content: space-between; font-size: 14px;">
                            <span>Discount</span><span>-$${tx.discount.toFixed(2)}</span>
                        </div>` : ''}
                        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; margin-top: 5px;">
                            <span>TOTAL</span><span>$${tx.total.toFixed(2)}</span>
                        </div>
                    </div>
                    <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #555;">
                        <p>Thank you for shopping!</p>
                        <p>Please come again</p>
                    </div>
                </div>
            `;

            printArea.innerHTML = receiptHTML;
            window.print();
        };
    }
};

window.downloadPdf = (id) => {
    const tx = allTransactionsDb.find(t => t.id === id);
    if (!tx) return showToast("Transaction not found", "error");

    showToast("Generating PDF...", "info");

    const date = tx.timestamp ? tx.timestamp.toDate() : new Date();
    const dateStr = date.toLocaleDateString();
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const method = tx.paymentMethod || 'Cash';

    let itemsHtml = tx.items.map((item, index) => `
        <tr>
            <td style="padding: 5px 0;">${index + 1}</td>
            <td style="font-weight: 500; padding: 5px 0;">${item.name}</td>
            <td style="padding: 5px 0;">$${item.price.toFixed(2)}</td>
            <td style="text-align: center; padding: 5px 0;">${item.qty}</td>
            <td style="text-align: right; font-weight: 600; padding: 5px 0;">$${(item.price * item.qty).toFixed(2)}</td>
        </tr>
    `).join('');

    const invoiceIdText = tx.invoiceId || id;
    const seller = tx.seller || "System";

    const htmlString = `
        <div style="padding: 30px; color: black; background: white; font-family: sans-serif; width: 100%; box-sizing: border-box;">
            <header style="text-align: center; border-bottom: 2px dashed #ccc; padding-bottom: 15px; margin-bottom: 15px;">
                <h1 style="font-size: 28px; margin: 0; color: #16a34a;">MASTERBILL INVOICE</h1>
                <p style="margin: 5px 0; font-size: 14px; color: #555;">MasterBill, Colombo, Sri Lanka</p>
                <p style="margin: 5px 0; font-size: 14px; color: #555;">Ph: +94 70 000 0000 | [EMAIL_ADDRESS]</p>
            </header>

            <div style="font-size: 14px; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between;">
                    <div><strong style="color: #333;">Date:</strong> ${dateStr} | ${timeStr}</div>
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 8px;">
                    <div><strong style="color: #333;">Cashier:</strong> ${seller}</div>
                    <div><strong style="color: #333;">Payment:</strong> ${method.toUpperCase()}</div>
                </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <thead>
                    <tr style="border-bottom: 2px solid #ccc; text-align: left; color: #333;">
                        <th style="padding: 8px 0; width: 10%;">No</th>
                        <th style="padding: 8px 0; width: 40%;">Item Description</th>
                        <th style="padding: 8px 0; width: 15%;">Price</th>
                        <th style="padding: 8px 0; text-align: center; width: 15%;">Qty</th>
                        <th style="padding: 8px 0; text-align: right; width: 20%;">Total</th>
                    </tr>
                </thead>
                <tbody style="border-bottom: 1px solid #eee;">
                    ${itemsHtml}
                </tbody>
            </table>

            <div style="margin-top: 20px; border-top: 2px dashed #ccc; padding-top: 15px; font-size: 14px;">
                <div style="display: flex; flex-direction: column; align-items: flex-end;">
                    <div style="display: flex; justify-content: space-between; width: 200px; margin-bottom: 5px;">
                        <span style="color: #555;">Subtotal</span>
                        <span>$${tx.subtotal.toFixed(2)}</span>
                    </div>
                    ${tx.discount > 0 ? `
                    <div style="display: flex; justify-content: space-between; width: 200px; color: #dc3545; margin-bottom: 5px;">
                        <span>Discount</span>
                        <span>-$${tx.discount.toFixed(2)}</span>
                    </div>` : ''}
                    <div style="display: flex; justify-content: space-between; width: 200px; font-weight: bold; font-size: 18px; margin-top: 8px; border-top: 1px solid #ccc; padding-top: 5px;">
                        <span style="color: #16a34a;">TOTAL</span>
                        <span>$${tx.total.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div style="text-align: center; margin-top: 40px; font-size: 12px; color: #777;">
                <p style="margin: 3px 0;">Thank you for shopping with us!</p>
                <p style="margin: 3px 0;">Please keep this receipt for returns/exchanges.</p>
            </div>
        </div>
    `;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString;
    const opt = {
        margin: 10,
        filename: `Invoice_${invoiceIdText}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a5', orientation: 'portrait' }
    };

    if (window.html2pdf) {
        html2pdf().set(opt).from(tempDiv).save().then(() => {
            showToast("PDF Downloaded successfully!", "success");
        }).catch(e => {
            console.error(e);
            showToast("Failed to generate PDF", "error");
        });
    } else {
        showToast("PDF Library not loaded. Please connect to internet.", "error");
    }
};

function renderIncomeDashboard() {
    let activeTransactions = [...transactionsDb];

    // Dynamic cashier dropdown update for today's transactions
    if (filterIncomeCashier) {
        const uniqueCashiers = [...new Set(activeTransactions.map(tx => tx.seller || 'System'))].sort();
        const currentVal = filterIncomeCashier.value;

        if (filterIncomeCashier.options.length !== uniqueCashiers.length + 1) {
            filterIncomeCashier.innerHTML = `<option value="All" style="color: black;">All Cashiers</option>` +
                uniqueCashiers.map(c => `<option value="${c}" style="color: black;">${c}</option>`).join('');
            filterIncomeCashier.value = currentVal;
        }

        // Apply filtering
        if (filterIncomeCashier.value !== 'All') {
            activeTransactions = activeTransactions.filter(tx => (tx.seller || 'System').toLowerCase() === filterIncomeCashier.value.toLowerCase());
        }
    }

    let totalRevenue = 0, cashTotal = 0, cardTotal = 0, voucherTotal = 0;
    let totalBills = activeTransactions.length;

    // Clear all accordion tables
    if (tbodyCash) tbodyCash.innerHTML = '';
    if (tbodyCard) tbodyCard.innerHTML = '';
    if (tbodyVoucher) tbodyVoucher.innerHTML = '';

    let cashCount = 0, cardCount = 0, voucherCount = 0;

    activeTransactions.forEach(tx => {
        if (tx.paymentMethod === 'Return') return;
        totalRevenue += tx.total;
        const method = tx.paymentMethod || 'Cash';
        if (method === 'Cash') { cashTotal += tx.total; cashCount++; }
        else if (method === 'Card') { cardTotal += tx.total; cardCount++; }
        else if (method === 'Voucher') { voucherTotal += tx.total; voucherCount++; }

        const date = tx.timestamp ? tx.timestamp.toDate() : new Date();
        const dateStr = date.toLocaleDateString();
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${dateStr}</td>
            <td>${timeStr}</td>
            <td>${tx.itemsCount} items</td>
            <td style="color: var(--primary-green); font-weight: 600;">$${tx.total.toFixed(2)}</td>
            <td>
                <button class="view-btn" onclick="viewBill('${tx.id}')">View</button>
            </td>
        `;

        if (method === 'Cash' && tbodyCash) tbodyCash.appendChild(tr);
        else if (method === 'Card' && tbodyCard) tbodyCard.appendChild(tr);
        else if (method === 'Voucher' && tbodyVoucher) tbodyVoucher.appendChild(tr);
    });

    // Update summary cards
    totalRevenueEl.innerText = `$${totalRevenue.toFixed(2)}`;
    totalBillsEl.innerText = totalBills;
    const avg = totalBills > 0 ? totalRevenue / totalBills : 0;
    avgTicketEl.innerText = `$${avg.toFixed(2)}`;
    if (cashTotalEl) cashTotalEl.innerText = `$${cashTotal.toFixed(2)}`;
    if (cardTotalEl) cardTotalEl.innerText = `$${cardTotal.toFixed(2)}`;
    if (voucherTotalEl) voucherTotalEl.innerText = `$${voucherTotal.toFixed(2)}`;

    // Update accordion headers
    if (cashCountEl) cashCountEl.innerText = cashCount;
    if (cardCountEl) cardCountEl.innerText = cardCount;
    if (voucherCountEl) voucherCountEl.innerText = voucherCount;
    if (cashAccTotal) cashAccTotal.innerText = `$${cashTotal.toFixed(2)}`;
    if (cardAccTotal) cardAccTotal.innerText = `$${cardTotal.toFixed(2)}`;
    if (voucherAccTotal) voucherAccTotal.innerText = `$${voucherTotal.toFixed(2)}`;
    if (historyTotalBadge) {
        historyTotalBadge.innerText = `${totalBills} transaction${totalBills !== 1 ? 's' : ''}`;
        historyTotalBadge.style.background = 'rgba(255,255,255,0.08)';
        historyTotalBadge.style.color = 'white';
        historyTotalBadge.style.border = '1px solid var(--glass-border)';
    }

    // 💰 Update Revenue Breakdown Progress Bar
    if (totalRevenue > 0) {
        const pCash = (cashTotal / totalRevenue) * 100;
        const pCard = (cardTotal / totalRevenue) * 100;
        const pVoucher = (voucherTotal / totalRevenue) * 100;

        if (barCash) barCash.style.width = `${pCash}%`;
        if (barCard) barCard.style.width = `${pCard}%`;
        if (barVoucher) barVoucher.style.width = `${pVoucher}%`;

        if (revBreakdownPercent) {
            revBreakdownPercent.innerText = `${pCash.toFixed(1)}% Cash / ${pCard.toFixed(1)}% Card / ${pVoucher.toFixed(1)}% Voucher`;
        }
    }

    // 🔔 Initial Activity Feed Load
    updateActivityFeedFromHistory();

    // Auto-open accordion that has transactions
    ['cash', 'card', 'voucher'].forEach(m => {
        const body = document.getElementById(`body-${m}`);
        const chevron = document.getElementById(`chevron-${m}`);
        const count = m === 'cash' ? cashCount : m === 'card' ? cardCount : voucherCount;
        if (count > 0 && body && !body.classList.contains('open')) {
            body.classList.add('open');
            if (chevron) chevron.classList.add('open');
        }
    });
}

function updateActivityFeed(tx) {
    if (!activityFeed) return;

    if (activityFeed.innerHTML.includes('Waiting for transactions')) {
        activityFeed.innerHTML = '';
    }

    const item = document.createElement('div');
    item.className = 'activity-item';
    item.innerHTML = `
        <div class="activity-item-details">
            <div>New ${tx.method} Sale</div>
            <div>${tx.itemsCount} items · ${tx.time}</div>
        </div>
        <div class="activity-item-amount">+$${tx.total.toFixed(2)}</div>
    `;

    activityFeed.insertBefore(item, activityFeed.firstChild);

    if (activityFeed.children.length > 5) {
        activityFeed.removeChild(activityFeed.lastChild);
    }
}

function updateActivityFeedFromHistory() {
    if (!activityFeed || transactionsDb.length === 0) return;
    activityFeed.innerHTML = '';

    const recent = [...transactionsDb].slice(0, 5);
    recent.forEach(tx => {
        const d = tx.timestamp ? tx.timestamp.toDate() : new Date();
        const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const item = document.createElement('div');
        item.className = 'activity-item';
        item.innerHTML = `
            <div class="activity-item-details">
                <div>${tx.paymentMethod || 'Cash'} Sale</div>
                <div>${tx.itemsCount || 0} items · ${time}</div>
            </div>
            <div class="activity-item-amount">+$${tx.total.toFixed(2)}</div>
        `;
        activityFeed.appendChild(item);
    });
}

window.toggleAccordion = (method) => {
    const body = document.getElementById(`body-${method}`);
    const chevron = document.getElementById(`chevron-${method}`);
    if (!body) return;
    body.classList.toggle('open');
    chevron.classList.toggle('open');
    // Close the inline detail panel when switching accordion
    if (inlineBillDetail) inlineBillDetail.classList.add('hidden');
};



function getAttendanceReportHTML() {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const generatedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const tableRows = attendanceDb.map(log => {
        const start = log.startTime ? log.startTime.toDate() : new Date();
        const startStr = start.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

        let endStr = '—';
        let durationStr = '—';

        if (log.endTime) {
            const end = log.endTime.toDate();
            endStr = end.toLocaleString([], { hour: '2-digit', minute: '2-digit' });

            const diffMs = end - start;
            const diffMins = Math.floor(diffMs / 60000);
            const hrs = Math.floor(diffMins / 60);
            const mins = diffMins % 60;
            durationStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
        }

        return `
            <tr>
                <td><strong>${log.email}</strong></td>
                <td>${startStr}</td>
                <td>${endStr}</td>
                <td>${durationStr}</td>
                <td><span style="color: ${log.status === 'Active' ? '#2196f3' : '#16a34a'}; font-weight: bold;">${log.status}</span></td>
            </tr>
        `;
    }).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Attendance Report – ${today}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', sans-serif; color: #1a1a1a; background: #fff; padding: 32px; font-size: 14px; }
        .report-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1d4ed8; padding-bottom: 18px; margin-bottom: 28px; }
        .report-brand { font-size: 2rem; font-weight: 900; color: #1d4ed8; letter-spacing: -1px; }
        .report-brand span { color: #1a1a1a; }
        h1 { font-size: 22px; color: #111; margin-bottom: 5px; }
        .meta-info { color: #555; line-height: 1.6; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #f8fafc; color: #475569; font-weight: 700; text-align: left; padding: 12px 15px; border-bottom: 2px solid #e2e8f0; text-transform: uppercase; font-size: 12px; }
        td { padding: 12px 15px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
        .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
        @media print { .no-print { display: none; } body { padding: 0; } }
    </style>
</head>
<body>
    <div class="report-header">
        <div>
            <h1>Attendance & Session Logs Report</h1>
            <div class="meta-info">
                <p>Generating Date: ${today}</p>
                <p>Report Type: Staff Attendance Tracking</p>
            </div>
        </div>
        <div class="report-brand">MASTERBILL<span>Admin</span></div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Cashier Email</th>
                <th>Login Time</th>
                <th>Logout Time</th>
                <th>Total Duration</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            ${tableRows || '<tr><td colspan="5" style="text-align:center; padding: 30px; color: #94a3b8;">No records found</td></tr>'}
        </tbody>
    </table>

    <div class="footer">
        Confidential Attendance Report · Generated via MasterBill Admin.
    </div>
</body>
</html>`;
}

function generateAttendanceReport() {
    if (attendanceDb.length === 0) {
        return showToast("No attendance logs to report", "warning");
    }

    const reportHTML = getAttendanceReportHTML() + `<script>window.onload = () => { window.print(); }<\/script>`;
    const win = window.open('', '_blank');
    if (win) {
        win.document.write(reportHTML);
        win.document.close();
    } else {
        showToast("Allow pop-ups to print the report", "warning");
    }
}

async function downloadAttendanceZip() {
    if (attendanceDb.length === 0) {
        return showToast("No attendance logs to download", "warning");
    }
    if (!window.html2pdf || !window.JSZip) {
        return showToast("Required libraries not loaded. Please wait.", "error");
    }

    const downloadBtn = document.getElementById('download-attendance-zip-btn');
    const originalText = downloadBtn.innerText;
    downloadBtn.innerText = "Processing...";
    downloadBtn.disabled = true;
    showToast("Generating Attendance ZIP...", "info");

    try {
        const zip = new JSZip();
        const html = getAttendanceReportHTML();
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        const opt = {
            margin: 10,
            filename: `Attendance_Report_\${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        const pdfBlob = await html2pdf().set(opt).from(tempDiv).outputPdf('blob');
        zip.file(`Attendance_Log_\${new Date().toISOString().split('T')[0]}.pdf`, pdfBlob);

        const content = await zip.generateAsync({ type: "blob" });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `Attendance_Archive_\${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast("Attendance ZIP downloaded!", "success");
    } catch (err) {
        console.error(err);
        showToast("Failed to generate ZIP", "error");
    } finally {
        downloadBtn.innerText = originalText;
        downloadBtn.disabled = false;
    }
}

function generateAdvancedReport() {
    if (transactionsDb.length === 0) {
        return showToast("No transactions to report today", "warning");
    }

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const generatedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Aggregate all data
    let totalRevenue = 0, cashTotal = 0, cardTotal = 0, voucherTotal = 0;
    let cashCount = 0, cardCount = 0, voucherCount = 0;
    const itemSummary = {};

    transactionsDb.forEach(tx => {
        totalRevenue += tx.total;
        const method = tx.paymentMethod || 'Cash';
        if (method === 'Cash') { cashTotal += tx.total; cashCount++; }
        if (method === 'Card') { cardTotal += tx.total; cardCount++; }
        if (method === 'Voucher') { voucherTotal += tx.total; voucherCount++; }
        (tx.items || []).forEach(item => {
            if (!itemSummary[item.name]) itemSummary[item.name] = { qty: 0, revenue: 0 };
            itemSummary[item.name].qty += item.qty;
            itemSummary[item.name].revenue += item.price * item.qty;
        });
    });

    const avg = transactionsDb.length > 0 ? totalRevenue / transactionsDb.length : 0;

    // Build item summary rows sorted by revenue
    const itemRows = Object.entries(itemSummary)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .map(([name, data]) => `
            <tr>
                <td>${name}</td>
                <td style="text-align:center;">${data.qty}</td>
                <td style="text-align:right; color:#16a34a; font-weight:600;">$${data.revenue.toFixed(2)}</td>
            </tr>`).join('');

    // Build transaction detail rows grouped by method
    const buildTxRows = (method) => transactionsDb
        .filter(tx => (tx.paymentMethod || 'Cash') === method)
        .map(tx => {
            const d = tx.timestamp ? tx.timestamp.toDate() : new Date();
            const items = (tx.items || []).map(i => `${i.name} x${i.qty}`).join(', ');
            return `<tr>
                <td>${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                <td style="font-size:0.8rem; color:#666;">${items}</td>
                <td style="text-align:right; font-weight:700;">$${tx.total.toFixed(2)}</td>
            </tr>`;
        }).join('');

    const reportHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Daily Income Report – ${today}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', sans-serif; color: #1a1a1a; background: #fff; padding: 32px; font-size: 14px; }
        .report-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #16a34a; padding-bottom: 18px; margin-bottom: 28px; }
        .report-brand { font-size: 2rem; font-weight: 900; color: #16a34a; letter-spacing: -1px; }
        .report-brand span { color: #1a1a1a; }
        .report-meta { text-align: right; color: #555; font-size: 0.85rem; }
        .report-meta h2 { font-size: 1.1rem; color: #1a1a1a; margin-bottom: 4px; }
        h3 { font-size: 0.95rem; text-transform: uppercase; letter-spacing: 1px; color: #555; margin: 24px 0 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
        .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 4px; }
        .summary-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px 16px; }
        .summary-card .label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 4px; }
        .summary-card .value { font-size: 1.4rem; font-weight: 800; }
        .total-revenue .value { color: #16a34a; }
        .cash-card .value { color: #15803d; }
        .card-card .value { color: #1d4ed8; }
        .voucher-card .value { color: #d97706; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 0.88rem; }
        th { background: #f3f4f6; text-align: left; padding: 8px 10px; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; color: #374151; border-bottom: 2px solid #d1d5db; }
        td { padding: 8px 10px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
        tr:last-child td { border-bottom: none; }
        .method-section { background: #f9fafb; border-radius: 8px; padding: 12px; margin-bottom: 10px; }
        .method-section h4 { font-size: 0.85rem; margin-bottom: 8px; display: flex; justify-content: space-between; }
        .footer { margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 14px; text-align: center; font-size: 0.78rem; color: #9ca3af; }
        @media print { body { padding: 16px; } }
    </style>
</head>
<body>
    <div class="report-header">
        <div>
            <div class="report-brand">MASTER<span>BILL</span></div>
            <div style="color:#555; margin-top:4px; font-size:0.85rem;">Daily Income Report</div>
        </div>
        <div class="report-meta">
            <h2>${today}</h2>
            <div>Generated at ${generatedAt}</div>
            <div style="margin-top:4px;">${transactionsDb.length} transactions recorded</div>
        </div>
    </div>

    <h3>📊 Summary Overview</h3>
    <div class="summary-grid">
        <div class="summary-card total-revenue">
            <div class="label">Total Revenue</div>
            <div class="value">$${totalRevenue.toFixed(2)}</div>
            <div style="font-size:0.75rem; color:#6b7280; margin-top:4px;">${transactionsDb.length} bills · Avg $${avg.toFixed(2)}</div>
        </div>
        <div class="summary-card cash-card">
            <div class="label">💵 Cash Total</div>
            <div class="value">$${cashTotal.toFixed(2)}</div>
            <div style="font-size:0.75rem; color:#6b7280; margin-top:4px;">${cashCount} transaction${cashCount !== 1 ? 's' : ''}</div>
        </div>
        <div class="summary-card card-card">
            <div class="label">💳 Card Total</div>
            <div class="value">$${cardTotal.toFixed(2)}</div>
            <div style="font-size:0.75rem; color:#6b7280; margin-top:4px;">${cardCount} transaction${cardCount !== 1 ? 's' : ''}</div>
        </div>
        <div class="summary-card voucher-card">
            <div class="label">🎫 Voucher Total</div>
            <div class="value">$${voucherTotal.toFixed(2)}</div>
            <div style="font-size:0.75rem; color:#6b7280; margin-top:4px;">${voucherCount} transaction${voucherCount !== 1 ? 's' : ''}</div>
        </div>
        <div class="summary-card" style="grid-column: span 2;">
            <div class="label">📈 Revenue Breakdown</div>
            <div style="display:flex; gap:6px; margin-top:8px;">
                <div style="height:10px; border-radius:99px; background:#16a34a; width:${totalRevenue > 0 ? (cashTotal / totalRevenue * 100).toFixed(1) : 0}%; min-width:4px;"></div>
                <div style="height:10px; border-radius:99px; background:#1d4ed8; width:${totalRevenue > 0 ? (cardTotal / totalRevenue * 100).toFixed(1) : 0}%; min-width:4px;"></div>
                <div style="height:10px; border-radius:99px; background:#d97706; width:${totalRevenue > 0 ? (voucherTotal / totalRevenue * 100).toFixed(1) : 0}%; min-width:4px;"></div>
            </div>
            <div style="font-size:0.72rem; color:#6b7280; margin-top:5px;">🟢 Cash ${totalRevenue > 0 ? (cashTotal / totalRevenue * 100).toFixed(1) : 0}% &nbsp; 🔵 Card ${totalRevenue > 0 ? (cardTotal / totalRevenue * 100).toFixed(1) : 0}% &nbsp; 🟠 Voucher ${totalRevenue > 0 ? (voucherTotal / totalRevenue * 100).toFixed(1) : 0}%</div>
        </div>
    </div>

    <h3>🛒 Best-Selling Items Today</h3>
    <table>
        <thead><tr><th>Item Name</th><th style="text-align:center;">Qty Sold</th><th style="text-align:right;">Revenue</th></tr></thead>
        <tbody>${itemRows || '<tr><td colspan="3" style="text-align:center;color:#9ca3af;">No items found</td></tr>'}</tbody>
    </table>

    ${cashCount > 0 ? `<h3>💵 Cash Transactions</h3>
    <table>
        <thead><tr><th>Time</th><th>Items</th><th style="text-align:right;">Total</th></tr></thead>
        <tbody>${buildTxRows('Cash')}</tbody>
    </table>` : ''}

    ${cardCount > 0 ? `<h3>💳 Card Transactions</h3>
    <table>
        <thead><tr><th>Time</th><th>Items</th><th style="text-align:right;">Total</th></tr></thead>
        <tbody>${buildTxRows('Card')}</tbody>
    </table>` : ''}

    ${voucherCount > 0 ? `<h3>🎫 Voucher Transactions</h3>
    <table>
        <thead><tr><th>Time</th><th>Items</th><th style="text-align:right;">Total</th></tr></thead>
        <tbody>${buildTxRows('Voucher')}</tbody>
    </table>` : ''}

    <div class="footer">
        MasterBill · Confidential Business Report · ${today} · Generated at ${generatedAt}
    </div>
    <script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (win) {
        win.document.write(reportHTML);
        win.document.close();
    } else {
        showToast("Allow pop-ups to print the report", "warning");
    }
}

window.viewBill = (id) => {
    const tx = transactionsDb.find(t => t.id === id);
    if (!tx) return showToast("Transaction not found", "error");

    const date = tx.timestamp ? tx.timestamp.toDate() : new Date();
    inlineBillTitle.innerText = `📄 Bill Details — ${date.toLocaleDateString()}`;
    if (inlineBillId) {
        inlineBillId.innerText = '';
    }
    inlineBillDate.innerText = `Transaction at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · ${tx.itemsCount} items sold`;

    let inlineCashierLabel = document.getElementById('inline-bill-cashier');
    if (!inlineCashierLabel) {
        inlineCashierLabel = document.createElement('p');
        inlineCashierLabel.id = 'inline-bill-cashier';
        inlineCashierLabel.style.fontSize = "0.75rem";
        inlineCashierLabel.style.color = "var(--text-muted)";
        inlineCashierLabel.style.marginTop = "4px";
        inlineBillDate.parentElement.appendChild(inlineCashierLabel);
    }
    inlineCashierLabel.innerText = `Cashier: ${tx.seller || 'System'}`;

    inlineBillItems.innerHTML = tx.items.map(item => `
        <tr>
            <td>${item.name}</td>
            <td><strong>${item.qty}</strong></td>
            <td>$${item.price.toFixed(2)}</td>
            <td style="text-align: right; color: var(--primary-green); font-weight: 600;">$${(item.price * item.qty).toFixed(2)}</td>
        </tr>
    `).join('');

    inlineSubtotal.innerText = `$${tx.subtotal.toFixed(2)}`;
    if (inlineDiscount) inlineDiscount.innerText = `-$${(tx.discount || 0).toFixed(2)}`;
    inlineTotal.innerText = `$${tx.total.toFixed(2)}`;

    const method = tx.paymentMethod || 'Cash';
    inlineMethod.innerText = method;
    inlineMethod.className = `pay-badge badge-${method.toLowerCase()}`;

    // Highlight the active row (search across all three tables)
    document.querySelectorAll('#income-table-cash tr, #income-table-card tr, #income-table-voucher tr')
        .forEach(r => r.classList.remove('active-row'));
    const btn = document.querySelector(`button[onclick="viewBill('${id}')"]`);
    if (btn) btn.closest('tr').classList.add('active-row');

    // Show the inline panel and scroll to it
    inlineBillDetail.classList.remove('hidden');
    inlineBillDetail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};

// --- Edit/Delete Logic ---
window.deleteItem = async (id) => {
    if (!confirm("Remove this item permanently from Cloud?")) return;
    try { await db.collection("inventory").doc(id).delete(); showToast("Deleted", "success"); }
    catch (e) { showToast("Delete failed", "error"); }
};

function openEditModal(id) {
    const item = inventoryObj.find(p => p.id === id);
    if (!item) return;
    editItemId.value = item.id;
    editItemName.value = item.name;
    editItemPrice.value = item.price;
    editItemIcon.value = item.icon || '📦';
    editItemStock.value = item.stock || 0;
    editItemMin.value = item.minLevel || 5;
    editItemCategory.innerHTML = categoriesDb.map(c => `<option value="${c}" ${c === item.category ? 'selected' : ''}>${c}</option>`).join('');
    editInventoryModal.classList.remove('hidden');
}

// --- Cart Logic ---
function addToCart(item) {
    const existing = cart.find(c => c.id === item.id);
    if (existing) existing.qty++; else cart.push({ ...item, qty: 1 });
    updateCartUI();
    showToast(`Added ${item.name}`, "success");
}

function updateCartUI() {
    saveToStorage(STORAGE_KEYS.CART, cart);
    cartItemsContainer.innerHTML = '';

    // Return Mode Banner
    if (isReturnMode) {
        const banner = document.createElement('div');
        banner.className = 'return-mode-banner';
        banner.innerText = '⚠️ RETURN MODE ACTIVE';
        cartItemsContainer.appendChild(banner);
    }

    if (cart.length === 0) {
        cartItemsContainer.innerHTML += '<div class="empty-cart-msg"><p>Cart is empty</p><span>Add items from inventory</span></div>';
        subtotalEl.innerText = '0.00'; totalEl.innerText = '0.00';
        resetDiscountUI();
        isReturnMode = false; // Auto reset if empty
        return;
    }
    let subtotal = 0;
    cart.forEach(item => {
        const rowTotal = item.price * item.qty;
        subtotal += rowTotal;
        const el = document.createElement('div');
        el.className = 'cart-item';
        el.innerHTML = `
            <div class="cart-item-info"><div class="cart-item-name">${item.name}</div><div class="cart-item-price">${Number(item.price).toFixed(2)}</div></div>
            <div class="cart-controls"><span style="color: var(--text-muted); margin-right: 15px;">x${item.qty}</span><button onclick="window.updateQty('${item.id}', -${item.qty})" style="background:transparent; color:#ff4d4d; border:none; font-size:1.2rem; cursor:pointer;" title="Remove Item">&times;</button></div>
            <div class="cart-item-total" style="width:80px; text-align:right;">${rowTotal.toFixed(2)}</div>
        `;
        cartItemsContainer.appendChild(el);
    });
    const discount = parseFloat(discountEl.value) || 0;
    const finalTotal = Math.max(0, subtotal - discount);
    subtotalEl.innerText = `${subtotal.toFixed(2)}`;
    totalEl.innerText = `${finalTotal.toFixed(2)}`;

    // Ensure button text is consistent
    if (checkoutBtn) {
        checkoutBtn.innerText = "Checkout";
        checkoutBtn.className = "btn btn-primary";
    }

    if (heldCountSpan) heldCountSpan.innerText = heldBills.length;
}

function holdCurrentBill() {
    if (cart.length === 0) return showToast("Cart is empty", "warning");
    const holdName = prompt("Enter a reference name for this bill (optional):") || `Bill ${new Date().toLocaleTimeString()}`;
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const discount = parseFloat(discountEl.value) || 0;
    heldBills.push({ id: 'held_' + Date.now(), name: holdName, cart: [...cart], timestamp: new Date().toLocaleString(), total: Math.max(0, subtotal - discount), discount: discount });
    saveToStorage(STORAGE_KEYS.HELD_BILLS, heldBills);
    cart = [];
    updateCartUI();
    showToast("Bill put on hold", "success");
}

function renderHeldBills() {
    heldBillsContainer.innerHTML = '';
    if (heldBills.length === 0) {
        heldBillsContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px;">No held bills.</p>';
        return;
    }
    heldBills.forEach(bill => {
        const itemHtml = `
            <div class="cart-item" style="flex-direction: column; align-items: flex-start; gap: 10px; margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; width: 100%;">
                    <strong>${bill.name}</strong>
                    <span style="color: var(--primary-green);">$${bill.total.toFixed(2)}</span>
                </div>
                <div style="font-size: 0.8rem; color: var(--text-muted);">${bill.cart.length} items - ${bill.timestamp}</div>
                <div style="display: flex; gap: 10px; width: 100%; margin-top: 5px;">
                    <button class="btn btn-primary btn-sm" onclick="window.restoreBill('${bill.id}')" style="flex: 1;">Restore Bill</button>
                    <button class="btn btn-secondary btn-sm" onclick="window.deleteHeldBill('${bill.id}')" style="border-color: #ff4d4d; color: #ff4d4d;">Delete</button>
                </div>
            </div>
        `;
        heldBillsContainer.innerHTML += itemHtml;
    });
}

window.restoreBill = (id) => {
    if (cart.length > 0) {
        if (!confirm("Current cart is not empty. Replacing it will clear current items. Continue?")) return;
    }
    const billIdx = heldBills.findIndex(b => b.id === id);
    if (billIdx === -1) return;
    cart = [...heldBills[billIdx].cart];
    heldBills.splice(billIdx, 1);
    saveToStorage(STORAGE_KEYS.HELD_BILLS, heldBills);
    updateCartUI();
    heldBillsModal.classList.add('hidden');
    showToast("Bill restored", "success");
};

window.deleteHeldBill = (id) => {
    if (!confirm("Are you sure you want to delete this held bill?")) return;
    heldBills = heldBills.filter(b => b.id !== id);
    saveToStorage(STORAGE_KEYS.HELD_BILLS, heldBills);
    renderHeldBills();
    if (heldCountSpan) heldCountSpan.innerText = heldBills.length;
    showToast("Held bill deleted", "info");
};

window.updateQty = (id, change) => {
    const item = cart.find(c => c.id === id);
    if (item) { item.qty += change; if (item.qty <= 0) cart = cart.filter(c => c.id !== id); updateCartUI(); }
};

window.addFromSearch = (id) => {
    const item = inventoryObj.find(i => i.id === id);
    const qtyInput = document.getElementById(`search-qty-${id}`);
    const qtyToAdd = parseInt(qtyInput ? qtyInput.value : 1) || 1;

    if (item) {
        const existing = cart.find(c => c.id === item.id);
        if (existing) {
            existing.qty += qtyToAdd;
        } else {
            cart.push({ ...item, qty: qtyToAdd });
        }
        updateCartUI();
        showToast(`Added ${qtyToAdd}x ${item.name}`, "success");

        if (billSearchInput) {
            billSearchInput.value = '';
            billSearchInput.focus();
        }
        if (billSearchResults) {
            billSearchResults.classList.add('hidden');
        }
    }
};

// --- Initialization ---
function bindEvents() {
    const adminLoginForm = document.getElementById('admin-login-form');
    if (adminLoginForm) {
        adminLoginForm.onsubmit = (e) => { e.preventDefault(); handleLogin(); };
    }
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.onsubmit = (e) => { e.preventDefault(); handleRegister(); };
    }
    const guestLoginForm = document.getElementById('guest-login-form');
    if (guestLoginForm) {
        guestLoginForm.onsubmit = (e) => { e.preventDefault(); submitGuestLogin(); };
    }

    guestLoginBtn.onclick = handleGuestLoginFlow;
    showRegisterBtn.onclick = showRegisterPanel;
    backToLoginBtn.onclick = showLoginPanel;
    backToAdminLoginBtn.onclick = showLoginPanel;
    logoutBtn.onclick = handleLogout;
    searchInput.oninput = (e) => { searchQuery = e.target.value; renderProducts(); };
    if (allBillsSearchInput) {
        allBillsSearchInput.oninput = (e) => {
            allBillsSearchQuery = e.target.value.toLowerCase().trim();
            renderAllBillsDashboard();
        };
    }
    if (returnsSearchInput) {
        returnsSearchInput.oninput = (e) => {
            returnsSearchQuery = e.target.value.toLowerCase().trim();
            renderReturnBillsDashboard();
        };
    }

    if (filterDay) {
        for (let i = 1; i <= 31; i++) {
            const opt = document.createElement('option');
            opt.value = i.toString();
            opt.text = i.toString().padStart(2, '0');
            opt.style.color = "black";
            filterDay.appendChild(opt);
        }
        filterDay.value = new Date().getDate().toString();
    }
    if (filterMonth) {
        filterMonth.value = new Date().getMonth().toString();
    }
    if (filterYear) {
        const currentYearStr = new Date().getFullYear().toString();
        filterYear.innerHTML = `<option value="All" style="color: black;">All Years</option><option value="${currentYearStr}" style="color: black;">${currentYearStr}</option>`;
        filterYear.value = currentYearStr;
    }

    if (filterYear) filterYear.onchange = renderAllBillsDashboard;
    if (filterMonth) filterMonth.onchange = renderAllBillsDashboard;
    if (filterDay) filterDay.onchange = renderAllBillsDashboard;
    if (filterCashier) filterCashier.onchange = renderAllBillsDashboard;
    if (filterIncomeCashier) filterIncomeCashier.onchange = renderIncomeDashboard;

    if (downloadZipBtn) {
        downloadZipBtn.onclick = async () => {
            if (!currentFilteredBills || currentFilteredBills.length === 0) {
                return showToast("No bills currently filtered to download!", "warning");
            }
            if (!window.html2pdf || !window.JSZip) {
                return showToast("Required libraries not loaded. Please wait.", "error");
            }

            showToast(`Generating ZIP for ${currentFilteredBills.length} bills... Please wait.`, "info");
            downloadZipBtn.innerText = "Processing...";
            downloadZipBtn.disabled = true;

            try {
                const zip = new JSZip();

                const generatePromise = (tx) => {
                    return new Promise((resolve, reject) => {
                        const date = tx.timestamp ? tx.timestamp.toDate() : new Date();
                        const dateStr = date.toLocaleDateString();
                        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const method = tx.paymentMethod || 'Cash';

                        let itemsHtml = tx.items.map((item, index) => `
                            <tr>
                                <td style="padding: 5px 0;">${index + 1}</td>
                                <td style="font-weight: 500; padding: 5px 0;">${item.name}</td>
                                <td style="padding: 5px 0;">$${item.price.toFixed(2)}</td>
                                <td style="text-align: center; padding: 5px 0;">${item.qty}</td>
                                <td style="text-align: right; font-weight: 600; padding: 5px 0;">$${(item.price * item.qty).toFixed(2)}</td>
                            </tr>
                        `).join('');

                        const invoiceIdText = tx.invoiceId || tx.id;
                        const seller = tx.seller || "System";

                        const htmlString = `
                            <div style="padding: 30px; color: black; background: white; font-family: sans-serif; width: 100%; box-sizing: border-box;">
                                <header style="text-align: center; border-bottom: 2px dashed #ccc; padding-bottom: 15px; margin-bottom: 15px;">
                                    <h1 style="font-size: 28px; margin: 0; color: #16a34a;">MASTERBILL INVOICE</h1>
                                    <p style="margin: 5px 0; font-size: 14px; color: #555;">MasterBill, Colombo, Sri Lanka</p>
                                    <p style="margin: 5px 0; font-size: 14px; color: #555;">Ph: +94 700 0000  | kaveen@gmail.com</p>
                                </header>
                                <div style="font-size: 14px; margin-bottom: 20px;">
                                    <div style="display: flex; justify-content: space-between;">
                                        <div><strong style="color: #333;">Invoice No:</strong> #${invoiceIdText}</div>
                                        <div><strong style="color: #333;">Date:</strong> ${dateStr} | ${timeStr}</div>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; margin-top: 8px;">
                                        <div><strong style="color: #333;">Cashier:</strong> ${seller}</div>
                                        <div><strong style="color: #333;">Payment:</strong> ${method.toUpperCase()}</div>
                                    </div>
                                </div>
                                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                                    <thead>
                                        <tr style="border-bottom: 2px solid #ccc; text-align: left; color: #333;">
                                            <th style="padding: 8px 0; width: 10%;">No</th>
                                            <th style="padding: 8px 0; width: 40%;">Item Description</th>
                                            <th style="padding: 8px 0; width: 15%;">Price</th>
                                            <th style="padding: 8px 0; text-align: center; width: 15%;">Qty</th>
                                            <th style="padding: 8px 0; text-align: right; width: 20%;">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody style="border-bottom: 1px solid #eee;">
                                        ${itemsHtml}
                                    </tbody>
                                </table>
                                <div style="margin-top: 20px; border-top: 2px dashed #ccc; padding-top: 15px; font-size: 14px;">
                                    <div style="display: flex; flex-direction: column; align-items: flex-end;">
                                        <div style="display: flex; justify-content: space-between; width: 200px; margin-bottom: 5px;">
                                            <span style="color: #555;">Subtotal</span>
                                            <span>$${tx.subtotal.toFixed(2)}</span>
                                        </div>
                                        ${tx.discount > 0 ? `
                                        <div style="display: flex; justify-content: space-between; width: 200px; color: #dc3545; margin-bottom: 5px;">
                                            <span>Discount</span>
                                            <span>-$${tx.discount.toFixed(2)}</span>
                                        </div>` : ''}
                                        <div style="display: flex; justify-content: space-between; width: 200px; font-weight: bold; font-size: 18px; margin-top: 8px; border-top: 1px solid #ccc; padding-top: 5px;">
                                            <span style="color: #16a34a;">TOTAL</span>
                                            <span>$${tx.total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;

                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = htmlString;
                        const opt = {
                            margin: 10,
                            filename: `${invoiceIdText}.pdf`,
                            image: { type: 'jpeg', quality: 0.98 },
                            html2canvas: { scale: 2 },
                            jsPDF: { unit: 'mm', format: 'a5', orientation: 'portrait' }
                        };

                        html2pdf().set(opt).from(tempDiv).outputPdf('blob').then((pdfBlob) => {
                            zip.file(`${invoiceIdText}.pdf`, pdfBlob);
                            resolve();
                        }).catch(reject);
                    });
                };

                const promises = currentFilteredBills.map(tx => generatePromise(tx));
                await Promise.all(promises);

                const content = await zip.generateAsync({ type: "blob" });

                const link = document.createElement('a');
                link.href = URL.createObjectURL(content);
                link.download = `NexusBill_Archive_${new Date().toISOString().split('T')[0]}.zip`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                showToast("ZIP Downloaded successfully!", "success");

            } catch (err) {
                console.error(err);
                showToast("Failed to generate ZIP", "error");
            } finally {
                downloadZipBtn.innerText = "Download ZIP";
                downloadZipBtn.disabled = false;
            }
        };
    }

    const printAllReportBtn = document.getElementById('print-all-bills-report-btn');
    if (printAllReportBtn) {
        printAllReportBtn.onclick = () => {
            if (!currentFilteredBills || currentFilteredBills.length === 0) {
                return showToast("No bills to print", "error");
            }

            showToast("Preparing summary report...", "info");

            const printWindow = window.open('', '_blank');
            const date = new Date().toLocaleDateString();
            const time = new Date().toLocaleTimeString();

            let tableRows = currentFilteredBills.map((tx, index) => {
                const txDate = tx.timestamp ? tx.timestamp.toDate().toLocaleDateString() : 'N/A';
                const txTime = tx.timestamp ? tx.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A';
                const billNum = '#' + (tx.invoiceId || (tx.id ? tx.id.substring(0, 8).toUpperCase() : 'N/A'));
                const itemsList = tx.items ? tx.items.map(i => i.name + ' x' + i.qty).join(', ') : '-';
                return `
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; color: #16a34a;">${billNum}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${txDate} ${txTime}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${tx.seller || 'System'}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${tx.paymentMethod || 'Cash'}</td>
                        <td style="border: 1px solid #ddd; padding: 8px; font-size: 0.85em; color: #555;">${itemsList}</td>
                        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${tx.itemsCount}</td>
                        <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">$${tx.total.toFixed(2)}</td>
                    </tr>
                `;
            }).join('');

            const totalAmount = currentFilteredBills.reduce((sum, tx) => sum + tx.total, 0);

            const reportHtml = '<html><head><title>Sales Summary Report</title>'
                + '<style>body{font-family:sans-serif;padding:40px;color:#333}'
                + 'table{width:100%;border-collapse:collapse;margin-top:20px}'
                + 'th{background:#f4f4f4;text-align:left;padding:10px;border:1px solid #ddd;font-size:0.85em}'
                + 'td{border:1px solid #ddd;padding:8px;font-size:0.85em}'
                + 'h1{color:#16a34a;margin-bottom:5px}'
                + '.header-info{margin-bottom:20px;border-bottom:2px solid #eee;padding-bottom:15px}'
                + '.footer{margin-top:20px;text-align:right;font-size:1.1rem;padding-top:15px;border-top:2px solid #eee}'
                + '.subtitle{color:#666;font-size:0.9rem}'
                + '</style></head><body>'
                + '<div class="header-info">'
                + '<h1>MASTERBILL &mdash; Sales Summary Report</h1>'
                + '<p class="subtitle">Generated on: ' + date + ' at ' + time + '</p>'
                + '<p class="subtitle">Total Bills: <strong>' + currentFilteredBills.length + '</strong></p>'
                + '</div>'
                + '<table><thead><tr>'
                + '<th>Invoice No</th><th>Date &amp; Time</th><th>Cashier</th><th>Method</th><th>Items</th><th>Qty</th><th>Total</th>'
                + '</tr></thead>'
                + '<tbody>' + tableRows + '</tbody></table>'
                + '<div class="footer"><strong>Grand Total: $' + totalAmount.toFixed(2) + '</strong></div>'
                + '</body></html>';

            printWindow.document.write(reportHtml);
            printWindow.document.close();
            printWindow.print();
        };
    }

    if (billSearchInput) {
        billSearchInput.oninput = (e) => {
            const query = e.target.value.toLowerCase().trim();
            searchSelectedIndex = -1;
            if (!query) {
                currentSearchMatches = [];
                billSearchResults.innerHTML = '';
                billSearchResults.classList.add('hidden');
                return;
            }
            currentSearchMatches = inventoryObj.filter(item => item.name.toLowerCase().includes(query));
            if (currentSearchMatches.length > 0) {
                billSearchResults.innerHTML = currentSearchMatches.map((item, index) => `
                    <div class="search-result-item" id="search-item-${index}" style="padding: 10px 15px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <span style="font-size: 1.2rem;">${item.icon || '📦'}</span>
                            <span>${item.name}</span>
                        </div>
                        <div style="display: flex; gap: 10px; align-items: center;" onclick="event.stopPropagation()">
                            <span style="color: var(--primary-green); font-weight: bold; margin-right: 5px;">${item.price.toFixed(2)}</span>
                            <input type="number" id="search-qty-${item.id}" value="1" min="1" style="width: 50px; background: rgba(255,255,255,0.1); border: 1px solid var(--glass-border); color: white; border-radius: 4px; padding: 2px 5px; text-align: center;">
                            <button class="btn btn-sm btn-primary" onclick="window.addFromSearch('${item.id}')" style="padding: 4px 8px; font-size: 0.8rem;">Add</button>
                        </div>
                    </div>
                `).join('');
                billSearchResults.classList.remove('hidden');
            } else {
                currentSearchMatches = [];
                billSearchResults.innerHTML = '<div style="padding: 10px 15px; color: var(--text-muted); text-align: center;">No items found</div>';
                billSearchResults.classList.remove('hidden');
            }
        };

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.cart-quick-search')) {
                billSearchResults.classList.add('hidden');
                searchSelectedIndex = -1;
            }
        });

        document.addEventListener('keydown', (e) => {
            // F2: Focus Search
            if (e.key === 'F2') {
                e.preventDefault();
                if (billSearchInput) billSearchInput.focus();
            }

            // F8: Checkout
            if (e.key === 'F8') {
                e.preventDefault();
                if (checkoutBtn) checkoutBtn.click();
            }

            // F9: Print
            if (e.key === 'F9') {
                e.preventDefault();
                if (printBtn) printBtn.click();
            }




            // ESC: Close Search
            if (e.key === 'Escape') {
                if (billSearchResults) billSearchResults.classList.add('hidden');
                searchSelectedIndex = -1;
            }

            // Arrow Navigation when search is active
            if (billSearchResults && !billSearchResults.classList.contains('hidden')) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (searchSelectedIndex < currentSearchMatches.length - 1) {
                        searchSelectedIndex++;
                    }
                    updateSearchSelection();
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (searchSelectedIndex > 0) {
                        searchSelectedIndex--;
                    }
                    updateSearchSelection();
                } else if (e.key === 'ArrowRight') {
                    if (searchSelectedIndex > -1) {
                        e.preventDefault();
                        const selectedItem = currentSearchMatches[searchSelectedIndex];
                        const qtyInput = document.getElementById(`search-qty-${selectedItem.id}`);
                        if (qtyInput) {
                            qtyInput.focus();
                            qtyInput.select();
                        }
                    }
                } else if (e.key === 'ArrowLeft') {
                    if (billSearchInput && document.activeElement !== billSearchInput) {
                        e.preventDefault();
                        billSearchInput.focus();
                        billSearchInput.select();
                    }
                } else if (e.key === 'Enter') {
                    if (searchSelectedIndex > -1) {
                        e.preventDefault();
                        const selectedItem = currentSearchMatches[searchSelectedIndex];
                        window.addFromSearch(selectedItem.id);
                        searchSelectedIndex = -1;
                        billSearchResults.classList.add('hidden');
                    }
                }
            }
        });
    }

    function updateSearchSelection() {
        document.querySelectorAll('.search-result-item').forEach((el, index) => {
            if (index === searchSelectedIndex) {
                el.classList.add('selected');
                el.scrollIntoView({ block: 'nearest' });
            } else {
                el.classList.remove('selected');
            }
        });
    }
    if (clearBtn) clearBtn.onclick = () => { if (confirm("Clear current bill?")) { cart = []; isReturnMode = false; updateCartUI(); } };

    if (discountEl) discountEl.oninput = () => { updateCartUI(); };

    // Toggle Return Mode based on payment method selection
    document.querySelectorAll('input[name="pay-method"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            isReturnMode = (e.target.value === 'Return');
            updateCartUI();
        });
    });

    if (holdBillBtn) holdBillBtn.onclick = holdCurrentBill;
    if (viewHeldBillsBtn) viewHeldBillsBtn.onclick = () => { renderHeldBills(); heldBillsModal.classList.remove('hidden'); };
    if (closeHeldModalBtn) closeHeldModalBtn.onclick = () => heldBillsModal.classList.add('hidden');

    navBillingBtn.onclick = () => showSection('billing');
    navIncomeBtn.onclick = () => showSection('income');
    if (navGuestsBtn) navGuestsBtn.onclick = () => showSection('guests');
    if (navAllBillsBtn) navAllBillsBtn.onclick = () => showSection('all-bills');
    if (navReturnsBtn) navReturnsBtn.onclick = () => showSection('returns');
    if (navSettingsBtn) navSettingsBtn.onclick = () => { showSection('settings'); applyAppConfig(); };

    const saveSettingsBtn = document.getElementById('save-settings-btn');
    if (saveSettingsBtn) {
        saveSettingsBtn.onclick = async () => {
            const toggle = document.getElementById('toggle-guest-discount');
            const p1 = parseInt(document.getElementById('guest-p1').value);

            showToast("Updating configuration...", "info");
            try {
                await db.collection("settings").doc("app_config").set({
                    guestDiscountEnabled: toggle.checked,
                    guestPercent: p1
                });
                showToast("System configuration updated!", "success");
            } catch (err) {
                showToast("Failed to update config", "error");
            }
        };
    }

    // --- Return Bill Modal Bindings ---
    const returnBillInitBtn = document.getElementById('return-bill-init-btn');
    const returnBillModal = document.getElementById('return-bill-modal');
    const closeReturnModalBtn = document.getElementById('close-return-modal-btn');
    const searchReturnBtn = document.getElementById('search-return-bill-btn');
    const returnInvoiceIdInput = document.getElementById('return-invoice-id');

    if (returnBillInitBtn) returnBillInitBtn.onclick = () => {
        returnBillModal.classList.remove('hidden');
        renderRecentBillsForReturn();
    };
    if (closeReturnModalBtn) closeReturnModalBtn.onclick = () => returnBillModal.classList.add('hidden');
    if (searchReturnBtn) searchReturnBtn.onclick = handleReturnLookup;


    // Set date display
    const incomeDateDisplay = document.getElementById('income-date-display');
    if (incomeDateDisplay) {
        incomeDateDisplay.innerText = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }

    if (closeInlineBill) {
        closeInlineBill.onclick = () => {
            if (inlineBillDetail) inlineBillDetail.classList.add('hidden');
            document.querySelectorAll('#income-table-cash tr, #income-table-card tr, #income-table-voucher tr')
                .forEach(r => r.classList.remove('active-row'));
        };
    }

    editInventoryBtn.onclick = () => { isEditMode = !isEditMode; editInventoryBtn.innerText = isEditMode ? 'Exit Edit' : 'Edit Mode'; renderProducts(); };
    addInventoryBtn.onclick = () => {
        newItemCategory.innerHTML = categoriesDb.map(c => `<option value="${c}">${c}</option>`).join('');
        newItemStock.value = 100;
        newItemMin.value = 10;
        addInventoryModal.classList.remove('hidden');
    };
    saveInventoryBtn.onclick = async () => {
        const name = newItemName.value.trim(),
            price = parseFloat(newItemPrice.value),
            category = newItemCategory.value,
            icon = newItemIcon.value || '📦',
            stock = parseInt(newItemStock.value) || 0,
            minLevel = parseInt(newItemMin.value) || 5;
        if (!name || isNaN(price)) return showToast("Invalid data", "error");
        await db.collection("inventory").add({ name, price, category, icon, stock, minLevel });
        addInventoryModal.classList.add('hidden'); showToast("Added to DB", "success");
    };

    updateInventoryBtn.onclick = async () => {
        const id = editItemId.value,
            name = editItemName.value,
            price = parseFloat(editItemPrice.value),
            category = editItemCategory.value,
            icon = editItemIcon.value,
            stock = parseInt(editItemStock.value) || 0,
            minLevel = parseInt(editItemMin.value) || 5;
        await db.collection("inventory").doc(id).update({ name, price, category, icon, stock, minLevel });
        editInventoryModal.classList.add('hidden'); showToast("Updated", "success");
    };

    closeModalBtn.onclick = () => addInventoryModal.classList.add('hidden');
    closeEditModalBtn.onclick = () => editInventoryModal.classList.add('hidden');
    closeBillModalBtn.onclick = () => billDetailsModal.classList.add('hidden');
    closeInlineBill.onclick = () => {
        inlineBillDetail.classList.add('hidden');
        document.querySelectorAll('#income-table-body tr').forEach(r => r.classList.remove('active-row'));
    };
    checkoutBtn.onclick = async () => {
        const methodEl = document.querySelector('input[name="pay-method"]:checked');
        const method = methodEl ? methodEl.value : "Cash";
        const result = await processCheckout(method);

        if (result.success) {
            showToast("Checkout Successful!", "success");
            cart = [];
            resetDiscountUI();
            updateCartUI();
        } else {
            showToast(result.error || "Checkout failed", "error");
        }
    };

    printBtn.onclick = async () => {
        try {
            if (cart.length === 0) return showToast("Cart empty", "error");

            const methodEl = document.querySelector('input[name="pay-method"]:checked');
            const method = methodEl ? methodEl.value : "Cash";

            const result = await processCheckout(method);

            if (result.success) {
                generateInvoiceHTML(result.subtotal, result.discount, result.total, method, result.invoiceId);

                showToast("Saving and Printing...", "success");
                setTimeout(() => {
                    window.print();
                    cart = [];
                    resetDiscountUI();
                    updateCartUI();
                }, 500);
            } else {
                showToast(result.error || "Checkout failed", "error");
            }
        } catch (err) {
            console.error("Print Error:", err);
            showToast("Print error: " + err.message, "error");
        }
    };

    const printReportBtn = document.getElementById('print-report-btn');
    if (printReportBtn) printReportBtn.onclick = generateAdvancedReport;

    const printAttendanceBtn = document.getElementById('print-attendance-btn');
    if (printAttendanceBtn) printAttendanceBtn.onclick = generateAttendanceReport;

    const downloadAttendanceZipBtn = document.getElementById('download-attendance-zip-btn');
    if (downloadAttendanceZipBtn) downloadAttendanceZipBtn.onclick = downloadAttendanceZip;

    const clearAttendanceBtn = document.getElementById('clear-attendance-btn');
    if (clearAttendanceBtn) {
        clearAttendanceBtn.onclick = async () => {
            const confirmation = confirm("Are you sure you want to clear all active attendance logs from the dashboard?");
            if (confirmation) {
                showToast("Archiving logs...", "info");
                try {
                    const snapshot = await db.collection('attendance_logs').where("role", "==", "guest").get();
                    if (snapshot.empty) return showToast("Dashboard is already clear.", "info");

                    const batch = db.batch();
                    snapshot.docs.forEach(doc => {
                        if (!doc.data().archivedAttendance) {
                            batch.update(doc.ref, { archivedAttendance: true });
                        }
                    });
                    await batch.commit();
                    showToast("Attendance dashboard cleared successfully!", "success");
                } catch (err) {
                    console.error("Clear Attendance Error:", err);
                    showToast("Error clearing logs: " + err.message, "error");
                }
            }
        };
    }

    const clearMasterBtn = document.getElementById('clear-master-history-btn');
    if (clearMasterBtn) {
        clearMasterBtn.onclick = async () => {
            const confirmation1 = confirm("⚠️ WARNING: This will hide ALL transactions from the Master History view. Are you absolutely sure?");
            if (confirmation1) {
                const confirmation2 = confirm("Final Confirmation: Do you really want to clear the entire Master History? (Transactions will be archived and hidden)");
                if (confirmation2) {
                    showToast("Archiving historical data...", "info");
                    try {
                        const snapshot = await db.collection('transactions').get();
                        if (snapshot.empty) return showToast("Master history already clear.", "info");

                        const batch = db.batch();
                        snapshot.docs.forEach(doc => {
                            if (!doc.data().archivedMaster) {
                                batch.update(doc.ref, { archivedMaster: true });
                            }
                        });
                        await batch.commit();
                        showToast("Master history cleared safely!", "success");
                    } catch (err) {
                        console.error("Clear Master Error:", err);
                        showToast("Error clearing history: " + err.message, "error");
                    }
                }
            }
        };
    }
}

// --- Return Feature Logic ---
// --- Return Feature Logic ---
async function handleReturnLookup() {
    const searchTotal = parseFloat(document.getElementById('return-search-total').value);
    if (isNaN(searchTotal)) return showToast("Please enter a total amount", "error");

    showToast("Searching by total...", "info");
    try {
        const snapshot = await db.collection("transactions").where("total", "==", searchTotal).orderBy("timestamp", "desc").limit(5).get();
        if (snapshot.empty) {
            return showToast("No matching bills found", "error");
        }

        const bills = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (bills.length === 1) {
            loadBillForReturn(bills[0]);
        } else {
            // Show the results in the search modal for selection
            renderListOfBills(bills);
            showToast("Multiple matches found. Select one.", "info");
        }
    } catch (err) {
        console.error("Return Lookup Error:", err);
        showToast("Error searching for bill", "error");
    }
}

function renderRecentBillsForReturn() {
    const listContainer = document.getElementById('return-recent-list');
    if (!listContainer) return;

    // Sort transactionsDb (which are today's bills) by time
    const recent = [...transactionsDb].slice(0, 5);

    if (recent.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No recent bills found today.</p>';
        return;
    }

    renderListOfBills(recent);
}

function renderListOfBills(bills) {
    const listContainer = document.getElementById('return-recent-list');
    listContainer.innerHTML = bills.map(tx => {
        const date = tx.timestamp ? tx.timestamp.toDate() : new Date();
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `
            <div class="recent-bill-item" onclick='window.selectBillForReturn(${JSON.stringify(tx).replace(/'/g, "&apos;")})' 
                 style="background: rgba(255,255,255,0.05); padding: 12px; margin-bottom: 8px; border-radius: 6px; cursor: pointer; transition: 0.3s; border: 1px solid rgba(255,255,255,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong style="color: white; display: block;">${timeStr}</strong>
                        <span style="font-size: 0.8rem; color: var(--text-muted);">${tx.itemsCount} items</span>
                    </div>
                    <div style="text-align: right;">
                        <span style="color: var(--primary-green); font-weight: bold; font-size: 1.1rem;">$${tx.total.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

window.selectBillForReturn = (bill) => {
    loadBillForReturn(bill);
};

function initiateHistoryReturn(id) {
    // Search in both today's and all transactions
    const tx = allTransactionsDb.find(t => t.id === id) || transactionsDb.find(t => t.id === id);
    if (!tx) return showToast("Transaction not found", "error");

    if (cart.length > 0) {
        if (!confirm("Your current cart will be cleared to process this return. Proceed?")) return;
    }

    // Load items into cart
    cart = tx.items.map(item => ({
        ...item,
        // Ensure price is the original price from the bill
        price: item.price
    }));

    // Auto-select Return payment method
    const returnRadio = document.querySelector('input[name="pay-method"][value="Return"]');
    if (returnRadio) {
        returnRadio.checked = true;
        isReturnMode = true;
    }

    // Switch to billing view
    showSection('billing');
    updateCartUI();
    showToast("Bill loaded for return. Review and Checkout.", "info");
}

function loadBillForReturn(bill) {
    if (cart.length > 0) {
        if (!confirm("Your current cart will be cleared to process this return. Proceed?")) return;
    }

    // Map historical items back to cart format
    // Note: Historical items only have name, price, qty. 
    // We need to match names to inventory to get IDs for restocking.
    cart = bill.items.map(histItem => {
        const invMatch = inventoryObj.find(i => i.name === histItem.name);
        return {
            id: invMatch ? invMatch.id : null,
            name: histItem.name,
            price: histItem.price,
            qty: histItem.qty,
            icon: invMatch ? invMatch.icon : '📦'
        };
    });

    isReturnMode = true;
    returnBillData = bill;

    // Hide modal
    document.getElementById('return-bill-modal').classList.add('hidden');
    document.getElementById('return-invoice-id').value = '';

    updateCartUI();
    showToast("Return Mode Activated", "info");
}

function init() {
    bindEvents();
    setupSync();
    setInterval(() => { timeDisplay.innerText = new Date().toLocaleString(); }, 1000);
    updateCartUI();
}

init();

const clearBtn2 = document.getElementById('clear-income-btn');

if (clearBtn2) {
    clearBtn2.onclick = async () => {
        // Simple one-step confirmation before clearing the dashboard
        const confirmation = confirm("Are you sure you want to remove all values from the Daily Income Dashboard?");

        if (confirmation) {
            showToast("Cleaning dashboard...", "info");

            try {
                // Fetch all documents in the transactions collection
                const snapshot = await db.collection('transactions').get();

                if (snapshot.empty) {
                    showToast("Dashboard is already empty.", "info");
                    return;
                }

                // Archive each document instead of deleting, so they stay in All Bills
                const batch = db.batch();
                snapshot.docs.forEach((doc) => {
                    batch.update(doc.ref, { archivedDaily: true });
                });

                await batch.commit();

                showToast("Daily income values cleared safely!", "success");
                // The setupSync listener will automatically update the UI to empty
            } catch (error) {
                console.error("Error clearing dashboard:", error);
                showToast("Error clearing dashboard: " + error.message, "error");
            }
        }
    };
}

// ... rest of script.js ...

// === Return Bills: Print Report & Download ZIP ===
window.bindReturnsButtons = function () {
    var printBtn = document.getElementById('print-returns-report-btn');
    if (printBtn && !printBtn._rb) {
        printBtn._rb = true;
        printBtn.onclick = function () {
            var bills = allTransactionsDb.filter(function (tx) { return tx.paymentMethod === 'Return' && !tx.archivedReturns; });
            if (!bills.length) return showToast("No return records to print", "error");
            showToast("Preparing returns report...", "info");
            var w = window.open('', '_blank');
            var d = new Date().toLocaleDateString(), t = new Date().toLocaleTimeString();
            var rows = bills.map(function (tx, i) {
                var dt = tx.timestamp ? tx.timestamp.toDate() : new Date();
                var bn = '#' + (tx.invoiceId || (tx.id ? tx.id.substring(0, 8).toUpperCase() : 'N/A'));
                var items = tx.items ? tx.items.map(function (x) { return x.name + ' x' + x.qty; }).join(', ') : '-';
                return '<tr><td style="border:1px solid #ddd;padding:8px;font-weight:bold;color:#ef4444;">' + bn + '</td>'
                    + '<td style="border:1px solid #ddd;padding:8px;">' + dt.toLocaleDateString() + ' ' + dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '</td>'
                    + '<td style="border:1px solid #ddd;padding:8px;">' + (tx.seller || 'System') + '</td>'
                    + '<td style="border:1px solid #ddd;padding:8px;font-size:0.85em;color:#555;">' + items + '</td>'
                    + '<td style="border:1px solid #ddd;padding:8px;text-align:center;">' + tx.itemsCount + '</td>'
                    + '<td style="border:1px solid #ddd;padding:8px;text-align:right;font-weight:bold;color:#ef4444;">$' + Math.abs(tx.total).toFixed(2) + '</td></tr>';
            }).join('');
            var total = bills.reduce(function (s, tx) { return s + Math.abs(tx.total); }, 0);
            var html = '<html><head><title>Returns Report</title>'
                + '<style>body{font-family:sans-serif;padding:40px;color:#333}table{width:100%;border-collapse:collapse;margin-top:20px}'
                + 'th{background:#fef2f2;text-align:left;padding:10px;border:1px solid #ddd}'
                + 'h1{color:#ef4444}.header-info{margin-bottom:20px;border-bottom:2px solid #fee2e2;padding-bottom:15px}'
                + '.footer{margin-top:20px;text-align:right;padding-top:15px;border-top:2px solid #fee2e2}'
                + '</style></head><body>'
                + '<div class="header-info"><h1>MASTERBILL &mdash; Returns Report</h1>'
                + '<p>Generated: ' + d + ' at ' + t + '</p><p>Total Returns: <strong>' + bills.length + '</strong></p></div>'
                + '<table><thead><tr><th>Invoice No</th><th>Date &amp; Time</th><th>Cashier</th><th>Items</th><th>Qty</th><th>Amount</th></tr></thead>'
                + '<tbody>' + rows + '</tbody></table>'
                + '<div class="footer"><strong>Total Returned: $' + total.toFixed(2) + '</strong></div></body></html>';
            w.document.write(html);
            w.document.close();
            w.print();
        };
    }
    var zipBtn = document.getElementById('download-returns-zip-btn');
    if (zipBtn && !zipBtn._rb) {
        zipBtn._rb = true;
        zipBtn.onclick = async function () {
            var bills = allTransactionsDb.filter(function (tx) { return tx.paymentMethod === 'Return' && !tx.archivedReturns; });
            if (!bills.length) return showToast("No return records to download", "error");
            if (!window.JSZip) return showToast("ZIP library not loaded", "error");
            if (!window.html2pdf) return showToast("PDF library not loaded", "error");
            zipBtn.innerText = "Generating..."; zipBtn.disabled = true;
            showToast("Generating ZIP for " + bills.length + " return bills...", "info");
            try {
                var zip = new JSZip();
                var make = function (tx, idx) {
                    return new Promise(function (resolve, reject) {
                        var dt = tx.timestamp ? tx.timestamp.toDate() : new Date();
                        var invoiceIdText = tx.invoiceId || (tx.id ? tx.id.substring(0, 8).toUpperCase() : 'N/A');
                        var bn = '#' + invoiceIdText;
                        var irows = tx.items ? tx.items.map(function (it, i) {
                            return '<tr><td>' + (i + 1) + '</td><td>' + it.name + '</td><td>$' + it.price.toFixed(2) + '</td><td style="text-align:center">' + it.qty + '</td><td style="text-align:right">$' + (it.price * it.qty).toFixed(2) + '</td></tr>';
                        }).join('') : '';
                        var html = '<div style="padding:30px;font-family:sans-serif;color:black;">'
                            + '<h2 style="text-align:center;color:#ef4444;">Return Receipt - ' + bn + '</h2>'
                            + '<p style="text-align:center;font-size:12px;">' + dt.toLocaleDateString() + ' | Cashier: ' + (tx.seller || 'System') + '</p>'
                            + '<table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:10px;">'
                            + '<thead><tr><th>#</th><th>Item</th><th>Price</th><th>Qty</th><th>Total</th></tr></thead>'
                            + '<tbody>' + irows + '</tbody></table>'
                            + '<div style="margin-top:10px;font-weight:bold;text-align:right;color:#ef4444;">Returned: $' + Math.abs(tx.total).toFixed(2) + '</div>'
                            + '<p style="text-align:center;font-size:10px;margin-top:10px;color:#777;">Items restocked.</p></div>';
                        var tmp = document.createElement('div'); tmp.innerHTML = html; document.body.appendChild(tmp);
                        html2pdf().set({ margin: [5, 5], filename: invoiceIdText + '.pdf', html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a5', orientation: 'portrait' } })
                            .from(tmp).outputPdf('blob').then(function (b) { document.body.removeChild(tmp); zip.file(invoiceIdText + '.pdf', b); resolve(); })
                            .catch(function (e) { document.body.removeChild(tmp); reject(e); });
                    });
                };
                await Promise.all(bills.map(function (tx, i) { return make(tx, i); }));
                var content = await zip.generateAsync({ type: "blob" });
                var a = document.createElement('a');
                a.href = URL.createObjectURL(content);
                a.download = 'NexusBill_Returns_' + new Date().toISOString().split('T')[0] + '.zip';
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
                showToast("Returns ZIP downloaded!", "success");
            } catch (e) { console.error(e); showToast("Failed to generate ZIP", "error"); }
            finally { zipBtn.innerText = "Download ZIP"; zipBtn.disabled = false; }
        };
    }

    var clearBtn = document.getElementById('clear-returns-history-btn');
    if (clearBtn && !clearBtn._rb) {
        clearBtn._rb = true;
        clearBtn.onclick = async function () {
            var confirmation = confirm("⚠️ WARNING: This will hide ALL return bills from this view. Are you sure?");
            if (confirmation) {
                showToast("Archiving return history...", "info");
                try {
                    var bills = allTransactionsDb.filter(function (tx) { return tx.paymentMethod === 'Return' && !tx.archivedReturns; });
                    if (!bills.length) return showToast("Returns history already clear.", "info");

                    var batch = db.batch();
                    bills.forEach(function (tx) {
                        batch.update(db.collection('transactions').doc(tx.id), { archivedReturns: true });
                    });
                    await batch.commit();
                    showToast("Returns history cleared safely!", "success");
                } catch (err) {
                    console.error("Clear Returns Error:", err);
                    showToast("Error clearing returns: " + err.message, "error");
                }
            }
        };
    }
};

// Initialize return bill buttons
window.bindReturnsButtons();
