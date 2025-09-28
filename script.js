// =================================================================
// SECTION 1: CONFIGURATION & GLOBAL VARIABLES
// =================================================================

// --- GOOGLE SHEETS API DETAILS (READ-ONLY) ---
const GOOGLE_SHEETS_API_KEY = 'AIzaSyBfMT1C-QnHZW5chpxSdIbPLGf1PUOcgcQ'; // Used only for reading the menu
const GOOGLE_SHEETS_SPREADSHEET_ID = '1Q5DLZod6z9Hcyc-EI2FbXlnxXW5Gs7TWD_rmcpaEvlM'; 
const MENU_SHEET_NAME = 'Menu'; // Sheet name for menu items
const ORDERS_SHEET_NAME = 'Orders'; // Sheet name for orders (Used by Apps Script)

// --- APPS SCRIPT CONFIGURATION (WRITE FIX) ---
// ⚠️ REPLACE THIS WITH THE URL COPIED AFTER DEPLOYING YOUR APPS SCRIPT WEB APP
const APPS_SCRIPT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxKhK8OJYVhqIPjNdO-750L1KiWCqk97tC75s-gn2BurNFX-77_xUulCttr4hHEQqGJ/exec'; 

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
const summaryTotalDisplay = document.getElementById("summaryTotalDisplay"); // FIXED: Removed duplicate assignment
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

// Function to read menu data from Google Sheets (API Key works for GET requests)
async function fetchMenuFromGoogleSheets() {
    try {
        const range = `${MENU_SHEET_NAME}!A:Z`; // Adjust range as needed
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_SPREADSHEET_ID}/values/${range}?key=${GOOGLE_SHEETS_API_KEY}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Google Sheets API Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        const rows = data.values;
        
        if (!rows || rows.length <= 1) {
            throw new Error('No menu data found in Google Sheets');
        }
        
        // Assuming first row contains headers: id, name, category, price, image
        const headers = rows[0].map(header => header.toLowerCase().trim());
        const menuData = [];
        
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const item = {};
            
            headers.forEach((header, index) => {
                if (row[index] !== undefined) {
                    if (header === 'id') {
                        item[header] = parseInt(row[index]) || i;
                    } else if (header === 'price') {
                        item[header] = parseFloat(row[index]) || 0;
                    } else {
                        item[header] = row[index];
                    }
                }
            });
            
            // Only add item if it has required fields
            if (item.name && item.price) {
                menuData.push(item);
            }
        }
        
        return menuData;
    } catch (error) {
        console.error('Error fetching menu from Google Sheets:', error);
        throw error;
    }
}

// Function to append order data to Google Sheets
// MODIFIED: This function now sends a POST request to the Google Apps Script Web App URL.
async function saveOrderToGoogleSheets() {
    try {
        if (!APPS_SCRIPT_WEB_APP_URL || APPS_SCRIPT_WEB_APP_URL.includes('PASTE_YOUR_COPIED_WEB_APP_URL_HERE')) {
             throw new Error("Apps Script URL is not configured. Cannot save order.");
        }
        
        const selectedFoods = foods.filter(f => f.qty > 0);
        const itemsString = selectedFoods.map(item => `${item.name} (Qty: ${item.qty})`).join('; ');
        
        // Create a hidden form for submission
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = APPS_SCRIPT_WEB_APP_URL;
        form.target = 'hidden_iframe';
        form.style.display = 'none';
        
        // Create form fields
        const fields = {
            userName: userName,
            userPhone: userPhone,
            itemsString: itemsString,
            total: computeTotal()
        };
        
        Object.keys(fields).forEach(key => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = fields[key];
            form.appendChild(input);
        });
        
        // Create hidden iframe
        let iframe = document.getElementById('hidden_iframe');
        if (!iframe) {
            iframe = document.createElement('iframe');
            iframe.id = 'hidden_iframe';
            iframe.name = 'hidden_iframe';
            iframe.style.display = 'none';
            document.body.appendChild(iframe);
        }
        
        // Add form to page and submit
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
        
        // Assume success (we can't read the response with this method)
        return new Promise(resolve => {
            setTimeout(() => resolve(true), 2000); // Wait 2 seconds
        });

    } catch (error) {
        console.error("Error saving order via form submission:", error);
        showModalMessage("Order saving failed. Please check Apps Script configuration.");
        return false;
    }
}
    try {
        if (!APPS_SCRIPT_WEB_APP_URL || APPS_SCRIPT_WEB_APP_URL.includes('PASTE_YOUR_COPIED_WEB_APP_URL_HERE')) {
             throw new Error("Apps Script URL is not configured. Cannot save order.");
        }
        
        const selectedFoods = foods.filter(f => f.qty > 0);
        const itemsString = selectedFoods.map(item => `${item.name} (Qty: ${item.qty})`).join('; ');
        
        // Prepare the payload to send to the Apps Script
        const payload = {
            userName: userName,
            userPhone: userPhone,
            itemsString: itemsString,
            total: computeTotal(),
        };

        // Send the POST request to the Apps Script Web App URL
        const response = await fetch(APPS_SCRIPT_WEB_APP_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain', // Changed to text/plain to avoid CORS preflight
            },
            body: JSON.stringify(payload),
            mode: 'no-cors' // Changed to no-cors to avoid CORS issues
        });

        // Note: With no-cors mode, we can't read the response
        // We'll assume success if no error is thrown
        if (response.type === 'opaque') {
            // Request completed (though we can't read the response)
            return true;
        }

        if (!response.ok) {
            throw new Error(`Apps Script Network Error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result.result === 'success') {
            return true; // Success
        } else {
            // If Apps Script returns an error message
            throw new Error(result.message || "Apps Script failed to save data.");
        }

    } catch (error) {
        console.error("Error saving order via Apps Script:", error);
        showModalMessage("Order saving failed. Please check Apps Script configuration.");
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
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Saving...';
    }

    const isOrderSaved = await saveOrderToGoogleSheets();

    // Re-enable confirm button
    if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Confirm Order';
    }
    
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
    // Add null checks for elements that might not exist
    const viewMenuBtn = document.getElementById("viewMenuBtn");
    const knowMoreBtn = document.getElementById("knowMoreBtn");
    const orderBtn = document.getElementById("orderBtn");
    const clearBtn = document.getElementById("clearBtn");
    const closeSummaryBtn = document.getElementById("closeSummaryBtn");
    const confirmOrderBtn = document.getElementById("confirmOrderBtn");
    const closeMessageModalBtn = document.getElementById("closeMessageModalBtn");
    const modalMessageOkayBtn = document.getElementById("modalMessageOkayBtn");
    const closeDetailsModalBtn = document.getElementById("closeDetailsModalBtn");
    const submitNameBtn = document.getElementById("submitNameBtn");
    const finalOkayBtn = document.getElementById("finalOkayBtn");

    if (viewMenuBtn) {
        viewMenuBtn.addEventListener("click", () => document.getElementById("menuContainer").scrollIntoView({ behavior: 'smooth' }));
    }
    if (knowMoreBtn) {
        knowMoreBtn.addEventListener("click", () => detailsModal.classList.remove("hidden"));
    }
    if (orderBtn) {
        orderBtn.addEventListener("click", openNameModal);
    }
    if (clearBtn) {
        clearBtn.addEventListener("click", clearCart);
    }
    
    menuContainer.addEventListener("click", handleFoodItemClick);
    categoryContainer.addEventListener("click", handleCategoryClick);
    
    if (closeSummaryBtn) {
        closeSummaryBtn.addEventListener("click", closeModal);
    }
    if (confirmOrderBtn) {
        confirmOrderBtn.addEventListener("click", confirmOrder);
    }
    if (closeMessageModalBtn) {
        closeMessageModalBtn.addEventListener("click", closeModal);
    }
    if (modalMessageOkayBtn) {
        modalMessageOkayBtn.addEventListener("click", closeModal);
    }
    if (closeDetailsModalBtn) {
        closeDetailsModalBtn.addEventListener("click", closeModal);
    }
    if (submitNameBtn) {
        submitNameBtn.addEventListener("click", submitName);
    }
    if (finalOkayBtn) {
        finalOkayBtn.addEventListener("click", () => {
            clearCart();
            closeModal();
        });
    }

    const enterKeyHandler = (event) => {
        if (event.key === "Enter") {
            submitName();
        }
    };
    
    if (nameInput) {
        nameInput.addEventListener("keydown", enterKeyHandler);
    }
    if (phoneInput) {
        phoneInput.addEventListener("keydown", enterKeyHandler);
    }
}

window.onload = async () => {
    const currentYearElement = document.getElementById("currentYear");
    if (currentYearElement) {
        currentYearElement.textContent = new Date().getFullYear();
    }
    
    await fetchMenu();
    
    renderCategories();
    renderFoods();
    setupEventListeners();
};
