// =================================================================
// SECTION 1: FIREBASE CONFIGURATION
// =================================================================

const firebaseConfig = {
    apiKey: "AIzaSyAhJI9z8Lma_GqTErImQrXPG6ZUDjTgE30",
    authDomain: "ajays-cafe-bot.firebaseapp.com",
    databaseURL: "https://ajays-cafe-bot-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "ajays-cafe-bot",
    storageBucket: "ajays-cafe-bot.firebasestorage.app",
    messagingSenderId: "849184384073",
    appId: "1:849184384073:web:f5a20f2d14b7aaf34c8b98",
    measurementId: "G-Z3PLG8E5X4"
};

// Firebase initialize
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// =================================================================
// SECTION 2: AIRTABLE CONFIGURATION & GLOBAL VARIABLES
// =================================================================

const AIRTABLE_TOKEN = 'patGHtMaDWo3zMYxm.729c6866f4a2a5d945a213af8ff68c7b48c41e439766e4a30486d1cd46ab463e';
const AIRTABLE_BASE_ID = 'appLgIPkiF7jORwe7';
const AIRTABLE_MENU_TABLE_NAME = 'Menu';

let initialFoods = [];
let foods = [];
let searchCategory = "All";
let userName = "";
let userPhone = "";

// =================================================================
// SECTION 3: DOM ELEMENT REFERENCES
// =================================================================

const menuContainer = document.getElementById("menuContainer");
const categoryContainer = document.getElementById("categoryContainer");
const totalDisplay = document.getElementById("totalDisplay");
const summaryModal = document.getElementById("summaryModal");
const summaryItemsContainer = document.getElementById("summaryItemsContainer");
const summaryTotalDisplay = document.getElementById("summaryTotalDisplay");
const messageModal = document.getElementById("messageModal");
const modalMessageText = document.getElementById("modalMessageText");
const nameModal = document.getElementById("nameModal");
const nameInput = document.getElementById("nameInput");
const phoneInput = document.getElementById("phoneInput");
const detailsModal = document.getElementById("detailsModal");
const tokenModal = document.getElementById("tokenModal");

// =================================================================
// SECTION 4: CORE FUNCTIONS
// =================================================================

function showModalMessage(message) {
    modalMessageText.textContent = message;
    messageModal.classList.remove("hidden");
}

function closeModal() {
    summaryModal.classList.add("hidden");
    messageModal.classList.add("hidden");
    nameModal.classList.add("hidden");
    detailsModal.classList.add("hidden");
    tokenModal.classList.add("hidden");
}

function computeTotal() {
    return foods.reduce((sum, food) => sum + (food.price * food.qty), 0);
}

function updateTotalDisplay() {
    totalDisplay.textContent = `₹${computeTotal()}`;
}

function renderFoods() {
    const filteredFoods = searchCategory === "All" 
        ? foods 
        : foods.filter(f => f.category === searchCategory);
    
    menuContainer.innerHTML = filteredFoods.map(food => `
        <div class="bg-white rounded-2xl shadow-md overflow-hidden">
            <div class="h-48 sm:h-64 overflow-hidden">
                <img src="${food.image}" alt="${food.name}" class="w-full h-full object-cover" onerror="this.onerror=null;this.src='https://placehold.co/400x300/e5e7eb/4b5563?text=Image+Not+Found';">
            </div>
            <div class="p-4 pt-2">
                <div class="flex justify-between items-start">
                    <div>
                        <h5 class="font-bold text-lg sm:text-2xl">${food.name}</h5>
                        <p class="text-xs text-gray-500">${food.category}</p>
                    </div>
                    <div class="text-rose-600 font-bold text-xl sm:text-2xl">₹${food.price}</div>
                </div>
                <div class="mt-4 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <button class="qty-btn px-4 py-2 rounded-full bg-gray-100 text-base sm:text-lg font-bold transition-all duration-300 hover:bg-gray-200" data-id="${food.id}" data-delta="-1">-</button>
                        <div class="w-6 text-center font-mono text-base sm:text-lg font-semibold" data-id="${food.id}-qty">${food.qty}</div>
                        <button class="qty-btn px-4 py-2 rounded-full bg-gray-100 text-base sm:text-lg font-bold transition-all duration-300 hover:bg-gray-200" data-id="${food.id}" data-delta="1">+</button>
                    </div>
                    <button class="add-btn px-6 py-2 rounded-full bg-rose-600 text-white text-base sm:text-lg font-semibold transition-all duration-300 hover:bg-rose-700" data-id="${food.id}">Add</button>
                </div>
            </div>
        </div>
    `).join('');
    
    updateTotalDisplay();
}

function renderCategories() {
    const categories = ["All", ...new Set(initialFoods.map(f => f.category).filter(Boolean))];
    categoryContainer.innerHTML = categories.map(cat => `
        <button class="category-btn min-w-max px-6 py-3 rounded-lg shadow-sm text-base sm:text-lg font-semibold transition-all duration-300 hover:scale-105 ${searchCategory === cat ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-white hover:bg-gray-100'}" data-category="${cat}">
            ${cat}
        </button>
    `).join('');
}

function clearCart() {
    foods = initialFoods.map(f => ({ ...f, qty: 0 }));
    userName = "";
    userPhone = "";
    nameInput.value = "";
    phoneInput.value = "";
    renderFoods();
    updateTotalDisplay();
}

// =================================================================
// SECTION 5: EVENT HANDLERS & API INTERACTIONS
// =================================================================

function handleFoodItemClick(e) {
    const target = e.target;
    const id = parseInt(target.dataset.id);
    const food = foods.find(f => f.id === id);

    if (!food) return;

    if (target.classList.contains("qty-btn")) {
        const delta = parseInt(target.dataset.delta);
        food.qty = Math.max(0, food.qty + delta);
    } else if (target.classList.contains("add-btn")) {
        food.qty++;
    }

    const qtyElement = document.querySelector(`[data-id="${id}-qty"]`);
    if (qtyElement) qtyElement.textContent = food.qty;
    
    updateTotalDisplay();
}

function handleCategoryClick(e) {
    if (e.target.classList.contains("category-btn")) {
        searchCategory = e.target.dataset.category;
        renderCategories();
        renderFoods();
    }
}

function openOrderSummary() {
    const selectedFoods = foods.filter(f => f.qty > 0);
    if (selectedFoods.length === 0) {
        showModalMessage("Please add items to your order first.");
        return;
    }

    summaryItemsContainer.innerHTML = selectedFoods.map(item => `
        <div class="flex items-center justify-between py-2 border-b">
            <div>
                <div class="font-semibold">${item.name}</div>
                <div class="text-sm text-gray-500">${item.qty} x ₹${item.price}</div>
            </div>
            <div class="font-semibold">₹${item.qty * item.price}</div>
        </div>
    `).join('');

    summaryTotalDisplay.textContent = `₹${computeTotal()}`;
    summaryModal.classList.remove("hidden");
}

function openNameModal() {
    if (computeTotal() === 0) {
        showModalMessage("Your cart is empty. Please add items to order.");
        return;
    }
    nameModal.classList.remove("hidden");
    nameInput.focus();
}

function submitName() {
    const currentUserName = nameInput.value.trim();
    const currentUserPhone = phoneInput.value.trim();
    const nameRegex = /^[a-zA-Z\s]{2,}$/;
    const phoneRegex = /^[0-9]{10}$/;

    if (!nameRegex.test(currentUserName)) {
        showModalMessage("Please enter a valid name.");
        return;
    }
    
    if (!phoneRegex.test(currentUserPhone)) {
        showModalMessage("Please enter a valid 10-digit phone number.");
        return;
    }

    userName = currentUserName;
    userPhone = currentUserPhone;
    closeModal();
    openOrderSummary();
}

// Firebase mein order save karne ka function (ise abhi istemal nahi kar rahe)
async function saveOrderToFirebase() {
    const selectedFoods = foods.filter(f => f.qty > 0);
    const itemsArray = selectedFoods.map(item => ({
        name: item.name,
        quantity: item.qty,
        price: item.price,
        subtotal: item.qty * item.price
    }));
    
    const orderData = {
        customerName: userName,
        phoneNumber: userPhone,
        items: itemsArray,
        totalAmount: computeTotal(),
        status: "Pending",
        timestamp: Date.now(),
        orderDate: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    };

    try {
        const newOrderRef = database.ref('orders').push();
        await newOrderRef.set(orderData);
        return true;
    } catch (e) {
        console.error("Error saving order to Firebase:", e);
        showModalMessage("Order saving failed. Please try again.");
        return false;
    }
}

// =========================================================================
// === YAHAN BADLAV KIYA GAYA HAI / CHANGE HAS BEEN MADE HERE ===
// =========================================================================
async function confirmOrder() {
    if (!userName || !userPhone) {
        showModalMessage("Please enter your name and phone number first.");
        return;
    }

    const confirmBtn = document.getElementById('confirmOrderBtn');
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Sending...';

    // Data ko Python bot ke anusaar format karein
    const selectedFoods = foods.filter(f => f.qty > 0);
    const foodItemsStr = selectedFoods.map(item => item.name).join(', ');
    const quantityStr = selectedFoods.map(item => item.qty).join(', ');
    const totalAmount = computeTotal();

    // Ye 'order' object Python code ke 'order_data' se match karna chahiye
    const orderPayload = {
        order: {
            name: userName,
            phone: userPhone,
            foodItems: foodItemsStr,
            quantity: quantityStr,
            total: totalAmount
        },
        source: "WebsiteDirect"
    };

    try {
        // ▼▼▼ YAHAN APNA PYTHONANYWHERE USERNAME DAALEIN ▼▼▼
        // Example: https://mybot123.pythonanywhere.com/webhook/google-sheets
        const BOT_WEBHOOK_URL = 'https://smitgamer687.pythonanywhere.com/webhook/google-sheets';

        const response = await fetch(webhookURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderPayload)
        });

        if (!response.ok) {
            // Agar server se error aaye to message dikhayein
            throw new Error(`Server error: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Response from bot:', result);

        // Order safal hone par Token Modal dikhayein
        closeModal();
        tokenModal.classList.remove("hidden");

    } catch (error) {
        console.error('Webhook Error:', error);
        showModalMessage("Failed to send order to the bot. Please try again.");
    }

    confirmBtn.disabled = false;
    confirmBtn.textContent = 'Confirm Order';
}
// =========================================================================
// === BADLAV YAHAN KHATAM HOTA HAI / CHANGE ENDS HERE ===
// =========================================================================


// =================================================================
// SECTION 6: INITIALIZATION & EVENT LISTENERS
// =================================================================

async function fetchMenu() {
    try {
        menuContainer.innerHTML = `<p class="text-center col-span-full">Loading menu...</p>`;
        const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_MENU_TABLE_NAME}`, {
            headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }
        });

        if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
        
        const data = await response.json();
        initialFoods = data.records.map(record => record.fields);
        foods = initialFoods.map(f => ({ ...f, qty: 0 }));

    } catch (e) {
        console.error("Error fetching menu:", e);
        showModalMessage("Could not load the menu. Please check API details.");
        menuContainer.innerHTML = `<p class="text-center text-red-600 col-span-full">Failed to load menu. Please check Airtable details.</p>`;
    }
}

function setupEventListeners() {
    document.getElementById("viewMenuBtn").addEventListener("click", () => document.getElementById("menuContainer").scrollIntoView({ behavior: 'smooth' }));
    document.getElementById("knowMoreBtn").addEventListener("click", () => detailsModal.classList.remove("hidden"));
    document.getElementById("orderBtn").addEventListener("click", openNameModal);
    document.getElementById("clearBtn").addEventListener("click", clearCart);
    menuContainer.addEventListener("click", handleFoodItemClick);
    categoryContainer.addEventListener("click", handleCategoryClick);
    document.getElementById("closeSummaryBtn").addEventListener("click", closeModal);
    document.getElementById("confirmOrderBtn").addEventListener("click", confirmOrder);
    document.getElementById("closeMessageModalBtn").addEventListener("click", closeModal);
    document.getElementById("modalMessageOkayBtn").addEventListener("click", closeModal);
    document.getElementById("closeDetailsModalBtn").addEventListener("click", closeModal);
    document.getElementById("submitNameBtn").addEventListener("click", submitName);
    document.getElementById("finalOkayBtn").addEventListener("click", () => {
        clearCart();
        closeModal();
    });

    const enterKeyHandler = (event) => {
        if (event.key === "Enter") {
            submitName();
        }
    };
    nameInput.addEventListener("keydown", enterKeyHandler);
    phoneInput.addEventListener("keydown", enterKeyHandler);
}

window.onload = async () => {
    document.getElementById("currentYear").textContent = new Date().getFullYear();
    
    await fetchMenu();
    
    renderCategories();
    renderFoods();
    setupEventListeners();
};
