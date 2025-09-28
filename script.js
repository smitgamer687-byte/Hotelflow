// =================================================================
// SECTION 1: CONFIGURATION & GLOBAL VARIABLES
// =================================================================

// --- GOOGLE SHEETS API DETAILS ---
const GOOGLE_SHEETS_API_KEY = 'AIzaSyBfMT1C-QnHZW5chpxSdIbPLGf1PUOcgcQ';
const MENU_SPREADSHEET_ID = '1SU0-74evidhgKLCAgzxI7-ZapeLiNi-5EFq6wtzGEbU';
const ORDERS_SPREADSHEET_ID = '1W6AyucVZjLBhCxsVMLg-5AG_Lt8cCV1B5ZA1e5lWabc';
const MENU_SHEET_NAME = 'Menu'; // Sheet name for menu items
const ORDERS_SHEET_NAME = 'Orders sheet'; // Sheet name for orders

// --- GLOBAL STATE VARIABLES ---
let initialFoods = [];
let foods = [];
let searchCategory = "All";
let userName = "";
let userPhone = "";

// =================================================================
// SECTION 2: DOM ELEMENT REFERENCES
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
// SECTION 3: CORE FUNCTIONS
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
// SECTION 4: GOOGLE SHEETS API FUNCTIONS
// =================================================================

// Function to read menu data from Google Sheets
async function fetchMenuFromGoogleSheets() {
    try {
        const range = `${MENU_SHEET_NAME}!A:E`; // Columns A to E (name, id, category, price, image)
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${MENU_SPREADSHEET_ID}/values/${range}?key=${GOOGLE_SHEETS_API_KEY}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Google Sheets API Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        const rows = data.values;
        
        if (!rows || rows.length <= 1) {
            throw new Error('No menu data found in Google Sheets');
        }
        
        // Based on your sheet structure: name, id, category, price, image
        const menuData = [];
        
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row.length >= 4) { // Ensure we have at least name, id, category, price
                const item = {
                    name: row[0] || '',           // Column A: name
                    id: parseInt(row[1]) || i,    // Column B: id
                    category: row[2] || '',       // Column C: category
                    price: parseFloat(row[3]) || 0, // Column D: price
                    image: row[4] || ''           // Column E: image
                };
                
                // Only add item if it has required fields
                if (item.name && item.price) {
                    menuData.push(item);
                }
            }
        }
        
        return menuData;
    } catch (error) {
        console.error('Error fetching menu from Google Sheets:', error);
        throw error;
    }
}

// Function to append order data to Google Sheets
async function saveOrderToGoogleSheets() {
    try {
        const selectedFoods = foods.filter(f => f.qty > 0);
        const itemsString = selectedFoods.map(item => `${item.name} (Qty: ${item.qty})`).join('; ');
        const timestamp = new Date().toLocaleString();
        const orderToken = 'ORD-' + Date.now(); // Generate a simple order token
        
        // Based on your Orders sheet structure: Name, Phone, Items, Total, Token, Status, Timestamp
        const rowData = [
            userName,           // Column A: Name
            userPhone,          // Column B: Phone
            itemsString,        // Column C: Items
            computeTotal(),     // Column D: Total
            orderToken,         // Column E: Token
            "Pending Acceptance", // Column F: Status
            timestamp           // Column G: Timestamp
        ];
        
        const range = `${ORDERS_SHEET_NAME}!A:G`;
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${ORDERS_SPREADSHEET_ID}/values/${range}:append?valueInputOption=RAW&key=${GOOGLE_SHEETS_API_KEY}`;
        
        const payload = {
            values: [rowData]
        };
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Google Sheets API Error: ${JSON.stringify(errorData)}`);
        }
        
        return true; // Success
    } catch (error) {
        console.error("Error saving order to Google Sheets:", error);
        showModalMessage("Order saving failed. Please try again.");
        return false; // Failure
    }
}

// =================================================================
// SECTION 5: EVENT HANDLERS
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

async function confirmOrder() {
    if (!userName || !userPhone) {
        showModalMessage("Please enter your name and phone number first.");
        return;
    }
    
    // Disable confirm button to prevent multiple clicks
    const confirmBtn = document.getElementById('confirmOrderBtn');
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Saving...';

    const isOrderSaved = await saveOrderToGoogleSheets();

    // Re-enable confirm button
    confirmBtn.disabled = false;
    confirmBtn.textContent = 'Confirm Order';
    
    if (isOrderSaved) {
        closeModal();
        tokenModal.classList.remove("hidden"); // Show the thank you modal
    }
    // If saving fails, the error message is already shown by saveOrderToGoogleSheets
}

// =================================================================
// SECTION 6: INITIALIZATION & EVENT LISTENERS
// =================================================================

async function fetchMenu() {
    try {
        menuContainer.innerHTML = `<p class="text-center col-span-full">Loading menu...</p>`;
        
        const menuData = await fetchMenuFromGoogleSheets();
        initialFoods = menuData;
        foods = initialFoods.map(f => ({ ...f, qty: 0 }));

    } catch (e) {
        console.error("Error fetching menu:", e);
        showModalMessage("Could not load the menu. Please check Google Sheets API details.");
        menuContainer.innerHTML = `<p class="text-center text-red-600 col-span-full">Failed to load menu. Please check Google Sheets configuration.</p>`;
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
