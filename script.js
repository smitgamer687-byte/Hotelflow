// =================================================================
// SECTION 1: CONFIGURATION & GLOBAL VARIABLES
// =================================================================

// --- GOOGLE SHEETS API DETAILS ---
const GOOGLE_SHEETS_API_KEY = 'AIzaSyDmbBjVa9JVkaPjhAQdplrOzyAGVfi7qMU';
const MENU_SHEET_ID = '1SU0-74evidhgKLCAgzxI7-ZapeLiNi-5EFq6wtzGEbU';
const ORDERS_SHEET_ID = '1W6AyucVZjLBhCxsVMLg-5AG_Lt8cCV1B5ZA1e5lWabc';
const MENU_RANGE = 'Sheet1!A2:E';
const ORDERS_RANGE = 'Sheet1!A:G';

// --- GLOBAL STATE VARIABLES ---
let initialFoods = [];
let foods = [];
let searchCategory = "All";
let userName = "";
let userPhone = "";

// =================================================================
// DEBUG HELPER FUNCTION
// =================================================================
function debugCartState() {
    console.log("=== CART DEBUG INFO ===");
    console.log("Total foods:", foods.length);
    const itemsWithQty = foods.filter(f => f.qty > 0);
    console.log("Items with quantity > 0:", itemsWithQty.length);
    itemsWithQty.forEach(item => {
        console.log(`- ${item.name}: qty=${item.qty}, price=${item.price}, total=${item.qty * item.price}`);
    });
    const total = computeTotal();
    console.log("Computed total:", total);
    console.log("========================");
    return { itemsWithQty, total };
}

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
    console.log("Showing modal message:", message);
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
    if (!foods || foods.length === 0) {
        console.log("computeTotal: No foods array");
        return 0;
    }
    
    const total = foods.reduce((sum, food) => {
        if (!food) return sum;
        const qty = parseInt(food.qty) || 0;
        const price = parseFloat(food.price) || 0;
        const itemTotal = qty * price;
        if (qty > 0) {
            console.log(`computeTotal: ${food.name} - qty:${qty} × price:${price} = ${itemTotal}`);
        }
        return sum + itemTotal;
    }, 0);
    
    console.log("computeTotal: Final total =", total);
    return total;
}

function updateTotalDisplay() {
    const total = computeTotal();
    if (totalDisplay) {
        totalDisplay.textContent = `₹${total}`;
        console.log("Updated total display to:", total);
    }
}

function renderFoods() {
    const filteredFoods = searchCategory === "All" 
        ? foods 
        : foods.filter(f => f.category === searchCategory);
    
    console.log("Rendering foods. Count:", filteredFoods.length);
    
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
                        <div class="w-6 text-center font-mono text-base sm:text-lg font-semibold qty-display" data-id="${food.id}">${food.qty}</div>
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
    console.log("Clearing cart");
    foods = initialFoods.map(f => ({ ...f, qty: 0 }));
    userName = "";
    userPhone = "";
    if (nameInput) nameInput.value = "";
    if (phoneInput) phoneInput.value = "";
    renderFoods();
    updateTotalDisplay();
}

// =================================================================
// SECTION 4: GOOGLE SHEETS API FUNCTIONS
// =================================================================

async function fetchMenuFromGoogleSheets() {
    try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${MENU_SHEET_ID}/values/${MENU_RANGE}?key=${GOOGLE_SHEETS_API_KEY}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Google Sheets API Error: ${response.statusText}`);
        }
        
        const data = await response.json();
        const rows = data.values || [];
        
        const menuItems = rows.map((row, index) => ({
            id: index + 1,
            name: row[0] || '',
            category: row[2] || '',
            price: parseFloat(row[3]) || 0,
            image: row[4] || 'https://placehold.co/400x300/e5e7eb/4b5563?text=Image+Not+Found',
            qty: 0
        })).filter(item => item.name);
        
        console.log("Menu items loaded:", menuItems);
        return menuItems;
    } catch (error) {
        console.error("Error fetching menu from Google Sheets:", error);
        throw error;
    }
}

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
        
        const token = 'TKN' + Date.now().toString().slice(-6);
        
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
    console.log("Click detected on:", e.target);
    console.log("Target classes:", e.target.classList.toString());
    console.log("Target dataset:", e.target.dataset);
    
    const target = e.target;
    const id = parseInt(target.dataset.id);
    
    console.log("Parsed ID:", id);
    
    if (isNaN(id)) {
        console.log("Invalid ID, stopping");
        return;
    }
    
    const food = foods.find(f => f.id === id);
    console.log("Found food:", food);

    if (!food) {
        console.log("Food item not found for ID:", id);
        return;
    }

    console.log("BEFORE: Food name:", food.name, "Qty:", food.qty, "Price:", food.price);

    let qtyChanged = false;

    if (target.classList.contains("qty-btn")) {
        const delta = parseInt(target.dataset.delta);
        console.log("Quantity button clicked with delta:", delta);
        const newQty = Math.max(0, food.qty + delta);
        console.log("Old qty:", food.qty, "New qty:", newQty);
        food.qty = newQty;
        qtyChanged = true;
    } else if (target.classList.contains("add-btn")) {
        console.log("Add button clicked");
        food.qty++;
        qtyChanged = true;
    }

    console.log("AFTER: Food qty:", food.qty);

    if (qtyChanged) {
        // Update all quantity displays for this food item
        const qtyDisplays = document.querySelectorAll(`[data-id="${id}"]`);
        console.log("Found quantity displays:", qtyDisplays.length);
        
        qtyDisplays.forEach(display => {
            if (display.classList.contains('qty-display')) {
                display.textContent = food.qty;
                console.log("Updated display to:", food.qty);
            }
        });
        
        updateTotalDisplay();
        debugCartState();
    }
}

function handleCategoryClick(e) {
    if (e.target.classList.contains("category-btn")) {
        searchCategory = e.target.dataset.category;
        renderCategories();
        renderFoods();
    }
}

function openOrderSummary() {
    console.log("Opening order summary...");
    debugCartState();
    
    const selectedFoods = foods.filter(f => f.qty > 0);
    console.log("Selected foods for summary:", selectedFoods);
    
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
    console.log("=== OPENING NAME MODAL ===");
    
    const { itemsWithQty, total } = debugCartState();
    
    if (itemsWithQty.length === 0 || total <= 0) {
        console.log("❌ Cart validation FAILED - Empty cart or zero total");
        console.log("Items with qty:", itemsWithQty.length);
        console.log("Total:", total);
        showModalMessage("Your cart is empty. Please add items to order.");
        return;
    }
    
    console.log("✅ Cart validation PASSED - Opening name modal");
    nameModal.classList.remove("hidden");
    if (nameInput) nameInput.focus();
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
    
    const confirmBtn = document.getElementById('confirmOrderBtn');
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Saving...';
    }

    const result = await saveOrderToGoogleSheets();

    if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Confirm Order';
    }
    
    if (result.success) {
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
        
        console.log("✅ Menu initialized successfully");
        console.log("Initial foods count:", initialFoods.length);
        console.log("Foods array:", foods);

    } catch (e) {
        console.error("❌ Error fetching menu:", e);
        showModalMessage("Could not load the menu. Please check Google Sheets API configuration.");
        menuContainer.innerHTML = `<p class="text-center text-red-600 col-span-full">Failed to load menu. Please check Google Sheets configuration.</p>`;
    }
}

function setupEventListeners() {
    console.log("Setting up event listeners...");
    
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

    // Add event listeners with logging
    if (viewMenuBtn) {
        viewMenuBtn.addEventListener("click", () => {
            console.log("View menu button clicked");
            document.getElementById("menuContainer").scrollIntoView({ behavior: 'smooth' });
        });
    }
    
    if (orderBtn) {
        orderBtn.addEventListener("click", () => {
            console.log("Order button clicked");
            openNameModal();
        });
    } else {
        console.log("❌ Order button not found!");
    }
    
    if (clearBtn) clearBtn.addEventListener("click", clearCart);
    if (knowMoreBtn) knowMoreBtn.addEventListener("click", () => detailsModal.classList.remove("hidden"));
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
    
    console.log("✅ Event listeners setup complete");
}

// Add a global debug function
window.debugCart = debugCartState;

window.onload = async () => {
    console.log("🚀 Application starting...");
    
    const currentYearElement = document.getElementById("currentYear");
    if (currentYearElement) {
        currentYearElement.textContent = new Date().getFullYear();
    }
    
    await fetchMenu();
    
    renderCategories();
    renderFoods();
    setupEventListeners();
    
    console.log("✅ Application loaded successfully");
    console.log("You can debug the cart by typing 'debugCart()' in the console");
};
