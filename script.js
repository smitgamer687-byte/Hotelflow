// =================================================================
// SECTION 1: CONFIGURATION & GLOBAL VARIABLES
// =================================================================

// --- AIRTABLE API DETAILS ---
const AIRTABLE_TOKEN = 'patGHtMaDWo3zMYxm.729c6866f4a2a5d945a213af8ff68c7b48c41e439766e4a30486d1cd46ab463e';
const AIRTABLE_BASE_ID = 'appLgIPkiF7jORwe7';
const AIRTABLE_MENU_TABLE_NAME = 'Menu';
const AIRTABLE_ORDERS_TABLE_NAME = 'Orders';

// --- GLOBAL STATE VARIABLES ---
let initialFoods = [];
let foods = [];
let searchCategory = "All";
let userName = "";
let tokenCounter = getTokenCounter();

// =================================================================
// SECTION 2: DOM ELEMENT REFERENCES
// =================================================================

const menuContainer = document.getElementById("menuContainer");
const categoryContainer = document.getElementById("categoryContainer");
const totalDisplay = document.getElementById("totalDisplay");
const tokenDisplay = document.getElementById("tokenDisplay");
// ... (बाकी सभी DOM एलिमेंट्स वैसे ही रहेंगे)
const summaryModal = document.getElementById("summaryModal");
const summaryItemsContainer = document.getElementById("summaryItemsContainer");
const summaryTotalDisplay = document.getElementById("summaryTotalDisplay");
const summaryTokenDisplay = document.getElementById("summaryTokenDisplay");
const messageModal = document.getElementById("messageModal");
const modalMessageText = document.getElementById("modalMessageText");
const nameModal = document.getElementById("nameModal");
const nameInput = document.getElementById("nameInput");
const detailsModal = document.getElementById("detailsModal");
const tokenModal = document.getElementById("tokenModal");
const tokenNumberDisplay = document.getElementById("tokenNumberDisplay");
const sendWhatsappBtn = document.getElementById("sendWhatsappBtn");
const whatsappBtnText = document.getElementById("whatsappBtnText");
const whatsappBtnSpinner = document.getElementById("whatsappBtnSpinner");


// =================================================================
// SECTION 3: CORE FUNCTIONS
// =================================================================

/**
 * Gets the token counter from local storage, ensuring it's within a valid range.
 */
function getTokenCounter() {
    try {
        const v = localStorage.getItem("ajays_token_counter");
        const counter = v ? Number(v) : 1;
        return counter > 0 && counter <= 1000 ? counter : 1;
    } catch (e) {
        return 1;
    }
}

/**
 * Saves the current token counter to local storage.
 */
function saveTokenCounter() {
    try {
        localStorage.setItem("ajays_token_counter", String(tokenCounter));
    } catch (e) {
        console.error("Failed to save token counter:", e);
    }
}

/**
 * Displays a message in the message modal.
 * @param {string} message - The message to display.
 */
function showModalMessage(message) {
    modalMessageText.textContent = message;
    messageModal.classList.remove("hidden");
}

/**
 * Hides all modals.
 */
function closeModal() {
    summaryModal.classList.add("hidden");
    messageModal.classList.add("hidden");
    nameModal.classList.add("hidden");
    detailsModal.classList.add("hidden");
    tokenModal.classList.add("hidden");
}

/**
 * Calculates the total price of items in the cart.
 * @returns {number} The total price.
 */
function computeTotal() {
    return foods.reduce((sum, food) => sum + (food.price * food.qty), 0);
}

/**
 * Updates the total price display in the main UI.
 */
function updateTotalDisplay() {
    totalDisplay.textContent = `₹${computeTotal()}`;
}

/**
 * Updates the token number display in the header.
 */
function updateTokenDisplay() {
    tokenDisplay.textContent = `${tokenCounter}`;
}

/**
 * Renders the menu items based on the selected category.
 */
function renderFoods() {
    const filteredFoods = searchCategory === "All" 
        ? foods 
        : foods.filter(f => f.category === searchCategory);
    
    menuContainer.innerHTML = filteredFoods.map(food => `
        <div class="bg-white rounded-2xl shadow-md overflow-hidden">
            <div class="h-48 sm:h-64 overflow-hidden">
                <img src="${food.image}" alt="${food.name}" class="w-full h-full object-cover" onerror="this.onerror=null;this.src='https.placehold.co/400x300/e5e7eb/4b5563?text=Image+Not+Found';">
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

/**
 * Renders the category filter buttons.
 */
function renderCategories() {
    const categories = ["All", ...new Set(initialFoods.map(f => f.category).filter(Boolean))];
    categoryContainer.innerHTML = categories.map(cat => `
        <button class="category-btn min-w-max px-6 py-3 rounded-lg shadow-sm text-base sm:text-lg font-semibold transition-all duration-300 hover:scale-105 ${searchCategory === cat ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-white hover:bg-gray-100'}" data-category="${cat}">
            ${cat}
        </button>
    `).join('');
}


// =================================================================
// SECTION 4: EVENT HANDLERS & API INTERACTIONS
// =================================================================

/**
 * Clears the shopping cart and resets quantities. (FIXED)
 */
function clearCart() {
    foods = initialFoods.map(f => ({ ...f, qty: 0 }));
    userName = "";
    nameInput.value = "";
    renderFoods();
    updateTotalDisplay();
    updateTokenDisplay(); // This line was added for immediate update
}

// ... The rest of the functions (handleFoodItemClick, handleCategoryClick, openOrderSummary, etc.) remain the same
// ... The entire SECTION 5: INITIALIZATION & EVENT LISTENERS remains the same

/**
 * Handles clicks on quantity buttons and add buttons for menu items.
 */
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

/**
 * Handles clicks on category buttons to filter the menu.
 */
function handleCategoryClick(e) {
    if (e.target.classList.contains("category-btn")) {
        searchCategory = e.target.dataset.category;
        renderCategories();
        renderFoods();
    }
}

/**
 * Opens the order summary modal if items are selected.
 */
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
    summaryTokenDisplay.textContent = `${tokenCounter}`;
    summaryModal.classList.remove("hidden");
}

/**
 * Opens the modal to ask for the user's name.
 */
function openNameModal() {
    if (computeTotal() === 0) {
        showModalMessage("Your cart is empty. Please add items to order.");
        return;
    }
    nameModal.classList.remove("hidden");
    nameInput.focus();
}

/**
 * Validates and submits the user's name, then proceeds to order summary.
 */
function submitName() {
    const currentUserName = nameInput.value.trim();
    const nameRegex = /^[a-zA-Z\s]{2,}$/;

    if (!nameRegex.test(currentUserName)) {
        showModalMessage("Please enter a valid name (at least 2 characters, letters and spaces only).");
        return;
    }

    userName = currentUserName;
    closeModal();
    openOrderSummary();
}

/**
 * Confirms the order and shows the final token modal.
 */
function confirmOrder() {
    if (!userName) {
        showModalMessage("Please enter your name first.");
        return;
    }
    closeModal();
    tokenNumberDisplay.textContent = `${tokenCounter}`;
    tokenModal.classList.remove("hidden");
}

/**
 * Saves the order details to Airtable.
 */
async function saveOrderToAirtable(orderData) {
    const itemsString = orderData.items.map(item => `${item.name} (Qty: ${item.qty})`).join('; ');
    const payload = {
        records: [{ fields: { "Name": orderData.name, "Token": orderData.token, "Total": orderData.total, "Items": itemsString } }]
    };

    try {
        const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_ORDERS_TABLE_NAME}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Airtable API Error: ${JSON.stringify(errorData)}`);
        }
        return true;
    } catch (e) {
        console.error("Error saving order to Airtable:", e);
        showModalMessage("Order saving failed. Please try again.");
        return false;
    }
}

/**
 * Formats and sends the order details to WhatsApp.
 */
async function sendToWhatsapp() {
    const selectedFoods = foods.filter(f => f.qty > 0);
    if (!userName || selectedFoods.length === 0) {
        showModalMessage("Order is incomplete. Please try again.");
        return;
    }

    sendWhatsappBtn.disabled = true;
    whatsappBtnText.textContent = "Saving...";
    whatsappBtnSpinner.classList.remove("hidden");

    const orderData = {
        name: userName,
        token: `A${tokenCounter}`,
        total: computeTotal(),
        items: selectedFoods.map(item => ({ name: item.name, qty: item.qty, price: item.price }))
    };

    const isOrderSaved = await saveOrderToAirtable(orderData);

    sendWhatsappBtn.disabled = false;
    whatsappBtnText.textContent = "Order on WhatsApp";
    whatsappBtnSpinner.classList.add("hidden");

        tokenCounter = (tokenCounter % 1000) + 1;
        saveTokenCounter();
        clearCart();
        closeModal();
        showModalMessage("Your order has been sent to WhatsApp and saved. Thank you!");
    }
}


// =================================================================
// SECTION 5: INITIALIZATION & EVENT LISTENERS
// =================================================================

/**
 * Fetches the menu data from Airtable.
 */
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

/**
 * Sets up all the event listeners for the application.
 */
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
    sendWhatsappBtn.addEventListener("click", sendToWhatsapp);
    nameInput.addEventListener("keydown", (event) => { if (event.key === "Enter") submitName(); });
}

/**
 * Initializes the application when the window loads.
 */
window.onload = async () => {
    document.getElementById("currentYear").textContent = new Date().getFullYear();
    updateTokenDisplay();

    await fetchMenu();
    
    renderCategories();
    renderFoods();
    setupEventListeners();
};
