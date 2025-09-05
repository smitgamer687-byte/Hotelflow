// =================================================================
// SECTION 1: CONFIGURATION & GLOBAL VARIABLES
// =================================================================

// --- GOOGLE SHEETS API DETAILS ---
const GOOGLE_SHEETS_API_KEY = 'AIzaSyDmbBjVa9JVkaPjhAQdplrOzyAGVfi7qMU';
const MENU_SHEET_ID = '1SU0-74evidhgKLCAgzxI7-ZapeLiNi-5EFq6wtzGEbU';
const ORDERS_SHEET_ID = '1W6AyucVZjLBhCxsVMLg-5AG_Lt8cCV1B5ZA1e5lWabc';
const MENU_RANGE = 'Sheet1!A2:E'; // Assuming data starts from row 2
const ORDERS_RANGE = 'Sheet1!A:G'; // Full range for orders

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
    const total = foods.reduce((sum, food) => {
        const itemTotal = (food.price * food.qty);
        console.log(`${food.name}: ${food.qty} x ${food.price} = ${itemTotal}`); // Debug log
        return sum + itemTotal;
    }, 0);
    console.log("Total computed:", total); // Debug log
    return total;
}

function updateTotalDisplay() {
    const total = computeTotal();
    totalDisplay.textContent = `₹${total}`;
    console.log("Total display updated to:", total); // Debug log
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

// Function to fetch menu data from Google Sheets
async function fetchMenuFromGoogleSheets() {
    try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${MENU_SHEET_ID}/values/${MENU_RANGE}?key=${GOOGLE_SHEETS_API_KEY}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Google Sheets API Error: ${response.statusText}`);
        }
        
        const data = await response.json();
        const rows = data.values || [];
        
        // Transform Google Sheets data to match your food object structure
        const menuItems = rows.map((row, index) => ({
            id: index + 1,
            name: row[0] || '',
            category: row[2] || '',
            price: parseFloat(row[3]) || 0,
            image: row[4] || 'https://placehold.co/400x300/e5e7eb/4b5563?text=Image+Not+Found',
            qty: 0
        })).filter(item => item.name); // Filter out empty rows
        
        return menuItems;
    } catch (error) {
        console.error("Error fetching menu from Google Sheets:", error);
        throw error;
    }
}

// Function to save order to Google Sheets
async function saveOrderToGoogleSheets() {
    try {
        const selectedFoods = foods.filter(f => f.qty > 0);
        const itemsString = selectedFoods.map(item => `${item.name} (Qty: ${item.qty})`).join('; ');
        const timestamp = new Date().toLocaleString('en-IN', { 
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        // Generate a simple token (you can make this more sophisticated)
        const token = 'TKN' + Date.now().toString().slice(-6);
        
        // Prepare the data to append
        const values = [[
            userName,
            userPhone,
            itemsString,
            computeTotal(),
            token,
            "Pending Acceptance",
            timestamp
        ]];
        
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${ORDERS_SHEET_ID}/values/Sheet1!A:G:append?valueInputOption=RAW&key=${GOOGLE_SHEETS_API_KEY}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                values: values
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Google Sheets API Error: ${JSON.stringify(errorData)}`);
        }
        
        return { success: true, token: token };
    } catch (error) {
        console.error("Error saving order to Google Sheets:", error);
        return { success: false, error: error.message };
    }
}

// =================================================================
// SECTION 5: EVENT HANDLERS & API INTERACTIONS
// =================================================================

function handleFoodItemClick(e) {
    const target = e.target;
    const id = parseInt(target.dataset.id);
    const food = foods.find(f => f.id === id);

    if (!food) {
        console.log("Food item not found for ID:", id); // Debug log
        return;
    }

    console.log("Before click - Food:", food.name, "Qty:", food.qty, "Price:", food.price); // Debug log

    if (target.classList.contains("qty-btn")) {
        const delta = parseInt(target.dataset.delta);
        food.qty = Math.max(0, food.qty + delta);
        console.log("Quantity changed by:", delta, "New qty:", food.qty); // Debug log
    } else if (target.classList.contains("add-btn")) {
        food.qty++;
        console.log("Add button clicked, new qty:", food.qty); // Debug log
    }

    // Update the quantity display
    const qtyElement = document.querySelector(`[data-id="${id}-qty"]`);
    if (qtyElement) {
        qtyElement.textContent = food.qty;
        console.log("Updated quantity display for", food.name, "to:", food.qty); // Debug log
    } else {
        console.log("Could not find quantity element for ID:", id); // Debug log
    }
    
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
    console.log("Opening order summary, selected foods:", selectedFoods); // Debug log
    
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
    const selectedFoods = foods.filter(f => f.qty > 0);
    const total = computeTotal();
    
    console.log("Opening name modal - Selected foods:", selectedFoods); // Debug log
    console.log("Opening name modal - Current total:", total); // Debug log
    console.log("All foods with quantities:", foods.filter(f => f.qty > 0)); // Debug log
    
    // Fixed condition: Check if we have selected foods OR if total is greater than 0
    if (selectedFoods.length === 0 || total <= 0) {
        console.log("Cart validation failed - Empty cart or zero total"); // Debug log
        showModalMessage("Your cart is empty. Please add items to order.");
        return;
    }
    
    console.log("Opening name modal - validation passed"); // Debug log
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

// Updated confirm order function to work with Google Sheets
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

    const result = await saveOrderToGoogleSheets();

    // Re-enable confirm button
    if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Confirm Order';
    }
    
    if (result.success) {
        // Update the token modal with the generated token
        const tokenDisplay = document.getElementById('tokenDisplay');
        if (tokenDisplay) {
            tokenDisplay.textContent = result.token;
        }
        closeModal();
        tokenModal.classList.remove("hidden");
    } else {
        showModalMessage("Order saving failed. Please try again. Error: " + result.error);
    }
}

// =================================================================
// SECTION 6: INITIALIZATION & EVENT LISTENERS
// =================================================================

async function fetchMenu() {
    try {
        menuContainer.innerHTML = `<p class="text-center col-span-full">Loading menu...</p>`;
        
        const menuItems = await fetchMenuFromGoogleSheets();
        
        initialFoods = menuItems;
        foods = initialFoods.map(f => ({ ...f, qty: 0 }));
        
        console.log("Menu loaded successfully:", foods); // Debug log

    } catch (e) {
        console.error("Error fetching menu:", e);
        showModalMessage("Could not load the menu. Please check Google Sheets API configuration.");
        menuContainer.innerHTML = `<p class="text-center text-red-600 col-span-full">Failed to load menu. Please check Google Sheets configuration.</p>`;
    }
}

function setupEventListeners() {
    // Check if elements exist before adding listeners
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

    if (viewMenuBtn) viewMenuBtn.addEventListener("click", () => document.getElementById("menuContainer").scrollIntoView({ behavior: 'smooth' }));
    if (knowMoreBtn) knowMoreBtn.addEventListener("click", () => detailsModal.classList.remove("hidden"));
    if (orderBtn) orderBtn.addEventListener("click", openNameModal);
    if (clearBtn) clearBtn.addEventListener("click", clearCart);
    if (closeSummaryBtn) closeSummaryBtn.addEventListener("click", closeModal);
    if (confirmOrderBtn) confirmOrderBtn.addEventListener("click", confirmOrder);
    if (closeMessageModalBtn) closeMessageModalBtn.addEventListener("click", closeModal);
    if (modalMessageOkayBtn) modalMessageOkayBtn.addEventListener("click", closeModal);
    if (closeDetailsModalBtn) closeDetailsModalBtn.addEventListener("click", closeModal);
    if (submitNameBtn) submitNameBtn.addEventListener("click", submitName);
    if (finalOkayBtn) finalOkayBtn.addEventListener("click", () => {
        clearCart();
        closeModal();
    });

    // Main event listeners
    menuContainer.addEventListener("click", handleFoodItemClick);
    categoryContainer.addEventListener("click", handleCategoryClick);

    const enterKeyHandler = (event) => {
        if (event.key === "Enter") {
            submitName();
        }
    };
    
    if (nameInput) nameInput.addEventListener("keydown", enterKeyHandler);
    if (phoneInput) phoneInput.addEventListener("keydown", enterKeyHandler);
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
