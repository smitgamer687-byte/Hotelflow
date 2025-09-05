// =================================================================
// SIMPLIFIED FOOD ORDERING SYSTEM - DEBUG VERSION
// =================================================================

console.log("🔄 Loading JavaScript...");

// --- CONFIGURATION ---
const GOOGLE_SHEETS_API_KEY = 'AIzaSyDmbBjVa9JVkaPjhAQdplrOzyAGVfi7qMU';
const MENU_SHEET_ID = '1SU0-74evidhgKLCAgzxI7-ZapeLiNi-5EFq6wtzGEbU';
const ORDERS_SHEET_ID = '1W6AyucVZjLBhCxsVMLg-5AG_Lt8cCV1B5ZA1e5lWabc';
const MENU_RANGE = 'Sheet1!A2:E';

// --- GLOBAL VARIABLES ---
let foods = [];
let initialFoods = [];
let searchCategory = "All";
let userName = "";
let userPhone = "";

// --- FALLBACK DATA (in case Google Sheets fails) ---
const fallbackData = [
    { id: 1, name: "Classic Burger", category: "Burger", price: 250, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400", qty: 0 },
    { id: 2, name: "Onion Rings", category: "Sides", price: 180, image: "https://images.unsplash.com/photo-1639024471283-03518883512d?w=400", qty: 0 },
    { id: 3, name: "Pepperoni Pizza", category: "Pizza", price: 450, image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400", qty: 0 },
    { id: 4, name: "Masala Dosa", category: "Dosa", price: 120, image: "https://images.unsplash.com/photo-1630851840516-732042715b31?w=400", qty: 0 }
];

// --- DOM REFERENCES ---
let menuContainer, totalDisplay, nameModal, messageModal, summaryModal;
let nameInput, phoneInput, modalMessageText, summaryItemsContainer, summaryTotalDisplay;

// =================================================================
// UTILITY FUNCTIONS
// =================================================================

function initializeDOM() {
    console.log("🔄 Initializing DOM references...");
    menuContainer = document.getElementById("menuContainer");
    totalDisplay = document.getElementById("totalDisplay");
    nameModal = document.getElementById("nameModal");
    messageModal = document.getElementById("messageModal");
    summaryModal = document.getElementById("summaryModal");
    nameInput = document.getElementById("nameInput");
    phoneInput = document.getElementById("phoneInput");
    modalMessageText = document.getElementById("modalMessageText");
    summaryItemsContainer = document.getElementById("summaryItemsContainer");
    summaryTotalDisplay = document.getElementById("summaryTotalDisplay");
    
    console.log("✅ DOM references initialized");
}

function showMessage(message) {
    console.log("📢 Showing message:", message);
    if (modalMessageText && messageModal) {
        modalMessageText.textContent = message;
        messageModal.classList.remove("hidden");
    } else {
        alert(message); // Fallback
    }
}

function closeAllModals() {
    console.log("❌ Closing all modals");
    [summaryModal, messageModal, nameModal].forEach(modal => {
        if (modal) modal.classList.add("hidden");
    });
}

// =================================================================
// CART FUNCTIONS
// =================================================================

function computeTotal() {
    if (!Array.isArray(foods)) {
        console.log("❌ foods is not an array:", foods);
        return 0;
    }
    
    let total = 0;
    foods.forEach(food => {
        if (food && food.qty > 0) {
            const itemTotal = food.qty * food.price;
            console.log(`💰 ${food.name}: ${food.qty} × ₹${food.price} = ₹${itemTotal}`);
            total += itemTotal;
        }
    });
    
    console.log(`💰 TOTAL: ₹${total}`);
    return ₹total;
}

function updateTotalDisplay() {
    const total = computeTotal();
    if (totalDisplay) {
        totalDisplay.textContent = ₹total;
        console.log("💰 Total display updated to:", ₹total);
    }
}

function getCartItems() {
    const items = foods.filter(f => f && f.qty > 0);
    console.log("🛒 Cart items:", items.length);
    return items;
}

function debugCart() {
    console.log("=== 🛒 CART DEBUG ===");
    console.log("Foods array:", foods);
    console.log("Foods length:", foods.length);
    const cartItems = getCartItems();
    console.log("Items in cart:", cartItems);
    console.log("Total:", computeTotal());
    console.log("====================");
    return { foods, cartItems, total: computeTotal() };
}

// Make debugCart available globally
window.debugCart = debugCart;

// =================================================================
// RENDERING FUNCTIONS
// =================================================================

function renderFoods() {
    console.log("🎨 Rendering foods...");
    
    if (!menuContainer) {
        console.log("❌ Menu container not found");
        return;
    }
    
    if (!Array.isArray(foods) || foods.length === 0) {
        console.log("❌ No foods to render");
        menuContainer.innerHTML = '<p class="text-center">No menu items available</p>';
        return;
    }
    
    const filteredFoods = searchCategory === "All" 
        ? foods 
        : foods.filter(f => f.category === searchCategory);
    
    console.log(`🎨 Rendering ${filteredFoods.length} foods`);
    
    menuContainer.innerHTML = filteredFoods.map(food => `
        <div class="bg-white rounded-2xl shadow-md overflow-hidden">
            <div class="h-48 sm:h-64 overflow-hidden">
                <img src="${food.image}" alt="${food.name}" class="w-full h-full object-cover" 
                     onerror="this.src='https://placehold.co/400x300/e5e7eb/4b5563?text=No+Image';">
            </div>
            <div class="p-4">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h5 class="font-bold text-lg">${food.name}</h5>
                        <p class="text-xs text-gray-500">${food.category}</p>
                    </div>
                    <div class="text-rose-600 font-bold text-xl">₹${food.price}</div>
                </div>
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <button class="qty-btn w-10 h-10 rounded-full bg-gray-100 font-bold hover:bg-gray-200" 
                                data-id="${food.id}" data-action="decrease">-</button>
                        <span class="qty-display w-8 text-center font-bold text-lg" data-id="${food.id}">${food.qty}</span>
                        <button class="qty-btn w-10 h-10 rounded-full bg-gray-100 font-bold hover:bg-gray-200" 
                                data-id="${food.id}" data-action="increase">+</button>
                    </div>
                    <button class="add-btn px-6 py-2 rounded-full bg-rose-600 text-white font-semibold hover:bg-rose-700" 
                            data-id="${food.id}">Add</button>
                </div>
            </div>
        </div>
    `).join('');
    
    updateTotalDisplay();
}

// =================================================================
// EVENT HANDLERS
// =================================================================

function handleMenuClick(event) {
    const target = event.target;
    console.log("🖱️ Menu clicked:", target.className);
    
    const foodId = parseInt(target.dataset.id);
    if (!foodId) {
        console.log("❌ No food ID found");
        return;
    }
    
    const food = foods.find(f => f.id === foodId);
    if (!food) {
        console.log("❌ Food not found for ID:", foodId);
        return;
    }
    
    console.log("🖱️ Food found:", food.name, "Current qty:", food.qty);
    
    let qtyChanged = false;
    
    if (target.classList.contains("qty-btn")) {
        const action = target.dataset.action;
        console.log("🖱️ Quantity button:", action);
        
        if (action === "increase") {
            food.qty++;
            qtyChanged = true;
        } else if (action === "decrease" && food.qty > 0) {
            food.qty--;
            qtyChanged = true;
        }
    } else if (target.classList.contains("add-btn")) {
        console.log("🖱️ Add button clicked");
        food.qty++;
        qtyChanged = true;
    }
    
    if (qtyChanged) {
        console.log("✅ Quantity changed to:", food.qty);
        
        // Update display
        const qtyDisplay = document.querySelector(`[data-id="${foodId}"].qty-display`);
        if (qtyDisplay) {
            qtyDisplay.textContent = food.qty;
        }
        
        updateTotalDisplay();
        debugCart();
    }
}

function openOrderModal() {
    console.log("🚪 Opening order modal...");
    debugCart();
    
    const cartItems = getCartItems();
    const total = computeTotal();
    
    if (cartItems.length === 0 || total <= 0) {
        console.log("❌ Cart is empty or total is 0");
        showMessage("Your cart is empty. Please add items to order.");
        return;
    }
    
    console.log("✅ Opening name modal");
    if (nameModal) {
        nameModal.classList.remove("hidden");
        if (nameInput) nameInput.focus();
    }
}

function submitName() {
    console.log("📝 Submitting name...");
    
    const name = nameInput?.value?.trim() || "";
    const phone = phoneInput?.value?.trim() || "";
    
    if (name.length < 2) {
        showMessage("Please enter a valid name (at least 2 characters).");
        return;
    }
    
    if (!/^\d{10}$/.test(phone)) {
        showMessage("Please enter a valid 10-digit phone number.");
        return;
    }
    
    userName = name;
    userPhone = phone;
    
    console.log("✅ Name and phone validated");
    closeAllModals();
    openOrderSummary();
}

function openOrderSummary() {
    console.log("📋 Opening order summary...");
    
    const cartItems = getCartItems();
    const total = computeTotal();
    
    if (summaryItemsContainer) {
        summaryItemsContainer.innerHTML = cartItems.map(item => `
            <div class="flex justify-between py-2 border-b">
                <div>
                    <div class="font-semibold">${item.name}</div>
                    <div class="text-sm text-gray-500">${item.qty} × ₹${item.price}</div>
                </div>
                <div class="font-semibold">₹${item.qty * item.price}</div>
            </div>
        `).join('');
    }
    
    if (summaryTotalDisplay) {
        summaryTotalDisplay.textContent = `₹${total}`;
    }
    
    if (summaryModal) {
        summaryModal.classList.remove("hidden");
    }
}

// =================================================================
// DATA LOADING
// =================================================================

async function loadMenuData() {
    console.log("📥 Loading menu data...");
    
    try {
        // Try to load from Google Sheets
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${MENU_SHEET_ID}/values/${MENU_RANGE}?key=${GOOGLE_SHEETS_API_KEY}`;
        console.log("📡 Fetching from:", url);
        
        const response = await fetch(url);
        console.log("📡 Response status:", response.status);
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("📡 API Response:", data);
        
        const rows = data.values || [];
        console.log("📊 Rows received:", rows.length);
        
        if (rows.length === 0) {
            throw new Error("No data received from Google Sheets");
        }
        
        const menuItems = rows.map((row, index) => {
            const item = {
                id: index + 1,
                name: row[0] || `Item ${index + 1}`,
                category: row[2] || 'Other',
                price: parseFloat(row[3]) || 0,
                image: row[4] || 'https://placehold.co/400x300/e5e7eb/4b5563?text=No+Image',
                qty: 0
            };
            console.log(`📦 Item ${index + 1}:`, item);
            return item;
        }).filter(item => item.name && item.name.trim() !== '');
        
        console.log("✅ Menu loaded from Google Sheets:", menuItems.length, "items");
        return menuItems;
        
    } catch (error) {
        console.log("❌ Google Sheets failed:", error.message);
        console.log("🔄 Using fallback data");
        return fallbackData;
    }
}

// =================================================================
// INITIALIZATION
// =================================================================

function setupEventListeners() {
    console.log("🎧 Setting up event listeners...");
    
    // Menu clicks
    if (menuContainer) {
        menuContainer.addEventListener('click', handleMenuClick);
        console.log("✅ Menu click listener added");
    }
    
    // Order button
    const orderBtn = document.getElementById('orderBtn');
    if (orderBtn) {
        orderBtn.addEventListener('click', openOrderModal);
        console.log("✅ Order button listener added");
    } else {
        console.log("❌ Order button not found");
    }
    
    // Submit name button
    const submitNameBtn = document.getElementById('submitNameBtn');
    if (submitNameBtn) {
        submitNameBtn.addEventListener('click', submitName);
        console.log("✅ Submit name button listener added");
    }
    
    // Close modal buttons
    const closeButtons = document.querySelectorAll('[id$="ModalBtn"], [id$="OkayBtn"]');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });
    console.log(`✅ ${closeButtons.length} close button listeners added`);
    
    // Enter key for name input
    if (nameInput) {
        nameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') submitName();
        });
    }
    if (phoneInput) {
        phoneInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') submitName();
        });
    }
    
    console.log("✅ Event listeners setup complete");
}

async function initialize() {
    console.log("🚀 Initializing application...");
    
    try {
        // 1. Initialize DOM
        initializeDOM();
        
        // 2. Load menu data
        const menuData = await loadMenuData();
        initialFoods = menuData;
        foods = [...menuData]; // Create a copy
        
        console.log("✅ Foods initialized:", foods.length, "items");
        
        // 3. Render initial UI
        renderFoods();
        
        // 4. Setup event listeners
        setupEventListeners();
        
        console.log("✅ Application initialized successfully!");
        console.log("💡 You can debug the cart by typing 'debugCart()' in the console");
        
    } catch (error) {
        console.error("❌ Initialization failed:", error);
        showMessage("Application failed to load. Please refresh the page.");
    }
}

// =================================================================
// START APPLICATION
// =================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}

console.log("✅ JavaScript loaded successfully!");
