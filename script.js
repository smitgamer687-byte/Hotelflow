// =================================================================
// SECTION 1: CONFIGURATION & GLOBAL VARIABLES
// =================================================================

// --- GOOGLE SHEETS API DETAILS ---
const GOOGLE_SHEETS_API_KEY = 'AIzaSyC5v4vDHCoHtwpV6uhctVj70iREvuOVxOo';
const MENU_SPREADSHEET_ID = '1smEjMFME5KM0-nZXDry9yFiYC3DYzIXDfEDLNvSNRPI';
const ORDERS_SPREADSHEET_ID = '1GLwvcbyPAih1PCTn43XeiVlqNajsRIlSw6zXO0aZ53U';
const MENU_SHEET_NAME = 'Sheet1'; // Name of the sheet containing menu items
const ORDERS_SHEET_NAME = 'Sheet1'; // Name of the sheet to store orders

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
 * Clears the shopping cart and resets quantities.
 */
function clearCart() {
    foods = initialFoods.map(f => ({ ...f, qty: 0 }));
    userName = "";
    nameInput.value = "";
    renderFoods();
    updateTotalDisplay();
    updateTokenDisplay();
}

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
 * Confirms the order and saves it to Google Sheets.
 */
async function confirmOrder() {
    if (!userName) {
        showModalMessage("Please enter your name first.");
        return;
    }

    const selectedFoods = foods.filter(f => f.qty > 0);
    if (selectedFoods.length === 0) {
        showModalMessage("Your cart is empty. Please add items to order.");
        return;
    }

    // Show loading state
    const confirmBtn = document.getElementById("confirmOrderBtn");
    const originalText = confirmBtn.textContent;
    confirmBtn.disabled = true;
    confirmBtn.textContent = "Saving Order...";

    const orderData = {
        name: userName,
        token: `A${tokenCounter}`,
        total: computeTotal(),
        items: selectedFoods.map(item => ({ name: item.name, qty: item.qty, price: item.price }))
    };

    const isOrderSaved = await saveOrderToGoogleSheets(orderData);

    // Reset button state
    confirmBtn.disabled = false;
    confirmBtn.textContent = originalText;

    if (isOrderSaved) {
        closeModal();
        tokenNumberDisplay.textContent = `A${tokenCounter}`;
        tokenModal.classList.remove("hidden");
        
        // Increment token counter for next order
        tokenCounter = (tokenCounter % 1000) + 1;
        saveTokenCounter();
        updateTokenDisplay();
    }
}

/**

 * Saves the order details by sending them to a Google Apps Script Web App.

 */

async function saveOrderToGoogleSheets(orderData) {

    // !!! IMPORTANT: Paste your Web App URL from Step 2 here !!!

    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyEG3pOK6G3TyM8dg2P9P-fCpO-oMDR_OsLReAhfdZORjYwEoT-KvPxadkWPlGV1UNapw/exec";



    try {

        const response = await fetch(SCRIPT_URL, {

            method: 'POST',

            mode: 'cors', // Required for cross-origin requests

            headers: {

                'Content-Type': 'application/json',

            },

            // The body must be a string, so we stringify the order data.

            // The Apps Script expects a specific format, so we pass orderData directly.

            body: JSON.stringify(orderData) 

        });



        if (!response.ok) {

            throw new Error(`Network response was not ok: ${response.statusText}`);

        }



        const result = await response.json();



        if (result.result !== 'success') {

            throw new Error(`Script error: ${result.message}`);

        }



        console.log('Order saved successfully via Apps Script');

        return true;



    } catch (e) {

        console.error("Error saving order via Apps Script:", e);

        showModalMessage("Order saving failed. Please try again.");

        return false;

    }

}
/**
 * Completes the order process and resets the cart.
 */
function completeOrder() {
    clearCart();
    closeModal();
    showModalMessage("Your order has been saved successfully. Thank you!");
}

// =================================================================
// SECTION 5: INITIALIZATION & EVENT LISTENERS
// =================================================================

/**
 * Fetches the menu data from Google Sheets.
 */
async function fetchMenu() {
    try {
        menuContainer.innerHTML = `<p class="text-center col-span-full">Loading menu...</p>`;
        
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${MENU_SPREADSHEET_ID}/values/${MENU_SHEET_NAME}?key=${GOOGLE_SHEETS_API_KEY}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.values || data.values.length === 0) {
            throw new Error("No data found in the sheet");
        }
        
        // Assuming the first row contains headers: id, name, category, price, image
        const headers = data.values[0];
        const rows = data.values.slice(1);
        
        initialFoods = rows.map((row, index) => {
            const food = {};
            headers.forEach((header, i) => {
                if (header.toLowerCase() === 'price') {
                    food[header.toLowerCase()] = parseFloat(row[i] || 0);
                } else if (header.toLowerCase() === 'id') {
                    food[header.toLowerCase()] = parseInt(row[i] || index + 1);
                } else {
                    food[header.toLowerCase()] = row[i] || '';
                }
            });
            return food;
        });
        
        foods = initialFoods.map(f => ({ ...f, qty: 0 }));

    } catch (e) {
        console.error("Error fetching menu:", e);
        showModalMessage("Could not load the menu. Please check Google Sheets API details.");
        menuContainer.innerHTML = `<p class="text-center text-red-600 col-span-full">Failed to load menu. Please check Google Sheets configuration.</p>`;
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
    nameInput.addEventListener("keydown", (event) => { if (event.key === "Enter") submitName(); });
    
    // Add event listener for completing order from token modal
    const completeOrderBtn = document.getElementById("completeOrderBtn");
    if (completeOrderBtn) {
        completeOrderBtn.addEventListener("click", completeOrder);
    }
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
