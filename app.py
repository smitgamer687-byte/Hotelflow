from flask import Flask, render_template_string, request, jsonify
import requests
import json
import re
from datetime import datetime

# =================================================================
# SECTION 1: CONFIGURATION & GLOBAL VARIABLES  
# =================================================================

# --- AIRTABLE API DETAILS ---
AIRTABLE_TOKEN = 'patGHtMaDWo3zMYxm.729c6866f4a2a5d945a213af8ff68c7b48c41e439766e4a30486d1cd46ab463e'
AIRTABLE_BASE_ID = 'appLgIPkiF7jORwe7'
AIRTABLE_MENU_TABLE_NAME = 'Menu'
AIRTABLE_ORDERS_TABLE_NAME = 'Orders'

# --- GLOBAL STATE VARIABLES ---
initialFoods = []
foods = []
searchCategory = "All"
userName = ""
userPhone = ""

app = Flask(__name__)

# =================================================================
# HTML TEMPLATE
# =================================================================

HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AJAYS Cafe</title>
    
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
    
    <style>
        /* =================================
           GLOBAL & FONT STYLES
           ================================= */
        body {
            font-family: 'Inter', sans-serif;
        }
        /* =================================
           CUSTOM SCROLLBAR STYLES
           ================================= */
        .custom-scrollbar::-webkit-scrollbar {
            height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: #f0f0f0;
            border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: #fca5a5; /* A light red color */
            border-radius: 10px;
        }
    </style>
</head>
<body class="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-indigo-100">

    <header class="max-w-6xl mx-auto p-4 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-8">
        <div class="flex items-center gap-2 sm:gap-4">
            <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-lg shadow-lg flex items-center justify-center bg-white/60">
                <h1 class="text-lg sm:text-xl font-bold text-rose-600">AJ</h1>
            </div>
            <div>
                <h2 class="text-xl sm:text-2xl font-extrabold tracking-tight">AJAYS Cafe</h2>
                <p class="text-xs sm:text-sm text-gray-600">Stylish. Tasty. Fast.</p>
            </div>
        </div>
        </header>

    <main class="max-w-6xl mx-auto p-4 md:p-6">
        <section class="bg-gradient-to-r from-rose-100 to-yellow-50 rounded-2xl p-4 md:p-6 shadow-md flex flex-col items-center text-center">
            <div class="flex-1">
                <h3 class="text-2xl sm:text-3xl font-extrabold">Welcome to AJAYS Cafe</h3>
                <p class="mt-2 text-sm sm:text-base text-gray-700">Delicious food, handpicked for you. Select quantity and place your order easily.</p>
                <div class="mt-4 flex flex-wrap gap-3 justify-center">
                    <button id="viewMenuBtn" class="px-4 py-2 rounded-lg bg-rose-600 text-white font-semibold text-sm sm:text-base transition-all duration-300 hover:scale-105 hover:bg-rose-700">View Menu</button>
                    <button id="knowMoreBtn" class="px-4 py-2 rounded-lg border font-semibold text-sm sm:text-base transition-all duration-300 hover:bg-gray-100 hover:scale-105">Know More</button>
                </div>
            </div>
        </section>
        <section class="mt-6">
            <h4 class="font-semibold mb-2 text-lg">Categories</h4>
            <div id="categoryContainer" class="flex gap-3 overflow-x-auto py-2 custom-scrollbar"></div>
        </section>
        <section class="mt-6">
            <h4 class="font-semibold mb-4 text-lg">Menu</h4>
            <div id="menuContainer" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"></div>
        </section>
    </main>

    <div class="fixed left-0 right-0 bottom-0 sm:bottom-4 flex justify-center pointer-events-none p-4 sm:p-0">
        <div class="max-w-6xl w-full sm:px-6 pointer-events-auto">
            <div class="bg-white/90 backdrop-blur-sm rounded-t-2xl sm:rounded-3xl p-4 shadow-lg flex items-center justify-between">
                <div>
                    <div class="text-xs sm:text-sm text-gray-600">Current total</div>
                    <div id="totalDisplay" class="text-lg sm:text-xl font-bold">₹0</div>
                </div>
                <div class="flex gap-2 sm:gap-3">
                    <button id="orderBtn" class="px-6 py-3 sm:px-8 sm:py-4 rounded-lg bg-rose-600 text-white font-semibold text-sm sm:text-base transition-all duration-300 hover:scale-105 hover:bg-rose-700">Order</button>
                    <button id="clearBtn" class="px-3 py-2 sm:px-4 sm:py-2 rounded-lg border text-sm sm:text-base transition-all duration-300 hover:bg-gray-100 hover:scale-105">Clear</button>
                </div>
            </div>
        </div>
    </div>

    <div id="summaryModal" class="hidden fixed inset-0 bg-black/40 flex items-center justify-center z-40">
        <div class="bg-white rounded-2xl w-11/12 md:w-2/3 lg:w-1/2 p-6 shadow-xl">
            <h4 class="text-xl font-bold">Order Summary</h4>
            <div id="summaryItemsContainer" class="mt-4 max-h-64 overflow-auto"></div>
            <div class="mt-4 flex items-center justify-between">
                <div class="text-lg font-bold">Total: <span id="summaryTotalDisplay">₹0</span></div>
                <div class="flex gap-3">
                    <button id="closeSummaryBtn" class="px-4 py-2 rounded-lg border transition-all duration-300 hover:bg-gray-100">Back</button>
                    <button id="confirmOrderBtn" class="px-4 py-2 rounded-lg bg-rose-600 text-white transition-all duration-300 hover:bg-rose-700">Confirm Order</button>
                </div>
            </div>
        </div>
    </div>

    <div id="nameModal" class="hidden fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div class="bg-white rounded-2xl w-11/12 md:w-1/3 p-6 shadow-xl relative">
            <div class="flex flex-col items-center text-center">
                <h4 class="text-xl font-bold">Your Details</h4>
                <p class="mt-2 text-sm text-gray-600">Please enter your name and number to confirm.</p>
                <input id="nameInput" placeholder="Enter name" class="mt-4 w-full text-lg px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-rose-300" />
                <input id="phoneInput" type="tel" placeholder="Enter 10-digit phone number" class="mt-4 w-full text-lg px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-rose-300" />
                <button id="submitNameBtn" class="mt-6 px-6 py-2 rounded-lg bg-rose-600 text-white font-semibold transition-all duration-300 hover:bg-rose-700">Submit</button>
            </div>
        </div>
    </div>
    
    <div id="tokenModal" class="hidden fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div class="bg-white rounded-2xl w-11/12 md:w-1/3 p-6 shadow-xl relative flex flex-col items-center text-center">
            <h4 class="text-xl font-bold">Order Confirmed!</h4>
            <p class="mt-2 text-sm text-gray-600">Thank you for your order. Please proceed to the counter.</p>
            <button id="finalOkayBtn" class="mt-6 px-6 py-2 rounded-lg bg-rose-600 text-white font-semibold transition-all duration-300 hover:bg-rose-700">
                Okay
            </button>
        </div>
    </div>
    
    <div id="messageModal" class="hidden fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div class="bg-white rounded-2xl w-11/12 md:w-1/3 p-6 shadow-xl relative">
             <button id="closeMessageModalBtn" class="absolute top-4 right-4 text-gray-500 hover:text-gray-900 transition-all duration-300 hover:scale-110">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div class="flex flex-col items-center text-center">
                <p id="modalMessageText" class="mt-4 text-lg font-semibold"></p>
                <button id="modalMessageOkayBtn" class="mt-6 px-6 py-2 rounded-lg bg-rose-600 text-white font-semibold transition-all duration-300 hover:bg-rose-700">Okay</button>
            </div>
        </div>
    </div>

    <div id="detailsModal" class="hidden fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div class="bg-white rounded-2xl w-11/12 md:w-1/3 p-6 shadow-xl relative">
            <button id="closeDetailsModalBtn" class="absolute top-4 right-4 text-gray-500 hover:text-gray-900 transition-all duration-300 hover:scale-110">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div class="flex flex-col items-center text-center">
                <h4 class="text-xl font-bold">AJAYS Cafe Details</h4>
                <div class="mt-4 text-left w-full space-y-2">
                    <p class="text-sm"><span class="font-semibold">Address:</span> 123 Cafe Street, Food City, 56789</p>
                    <p class="text-sm"><span class="font-semibold">Mobile Number:</span> +91 98247 80507</p>
                    <p class="text-sm"><span class="font-semibold">Email:</span> ajayscafe@example.com</p>
                    <p class="text-sm"><span class="font-semibold">Opening Time:</span> 9:00 AM</p>
                    <p class="text-sm"><span class="font-semibold">Closing Time:</span> 10:00 PM</p>
                </div>
            </div>
        </div>
    </div>
    
    <footer class="mt-12 pb-24 sm:pb-32 text-center text-xs sm:text-sm text-gray-600">
        © <span id="currentYear"></span> AJAYS Cafe — Crafted with love
    </footer>

    <script>
        // =================================================================
        // SECTION 1: CONFIGURATION & GLOBAL VARIABLES
        // =================================================================

        // --- AIRTABLE API DETAILS ---
        const AIRTABLE_TOKEN = 'patGHtMaDWo3zMYxm.729c6866f4a2a5d945a213af8ff68c7b48c41e439766e4a30486d1cd46ab463e';
        const AIRTABLE_BASE_ID = 'appLgIPkiF7jORwe7';
        const AIRTABLE_MENU_TABLE_NAME = 'Menu';
        const AIRTABLE_ORDERS_TABLE_NAME = 'Orders'; // <<-- Iska istemal dobara karenge

        // --- GLOBAL STATE VARIABLES ---
        let initialFoods = [];
        let foods = [];
        let searchCategory = "All";
        let userName = "";
        let userPhone = ""; // New variable for phone number

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
        // SECTION 4: EVENT HANDLERS & API INTERACTIONS
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
            const nameRegex = /^[a-zA-Z\\s]{2,}$/;
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

        // <<-- NAYA FUNCTION: Order ko Airtable mein save karne ke liye -->>
        async function saveOrderToAirtable() {
            const selectedFoods = foods.filter(f => f.qty > 0);
            const itemsString = selectedFoods.map(item => `${item.name} (Qty: ${item.qty})`).join('; ');
            
            const payload = {
                records: [{ 
                    fields: { 
                        "Name": userName, 
                        "Phone": userPhone,
                        "Items": itemsString,
                        "Total": computeTotal(),
                        "Status": "Pending Acceptance" // Default status set karna
                    } 
                }]
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
                return true; // Success
            } catch (e) {
                console.error("Error saving order to Airtable:", e);
                showModalMessage("Order saving failed. Please try again.");
                return false; // Failure
            }
        }


        // <<-- PURANA FUNCTION UPDATE KIYA GAYA HAI -->>
        async function confirmOrder() {
            if (!userName || !userPhone) {
                showModalMessage("Please enter your name and phone number first.");
                return;
            }
            
            // Disable confirm button to prevent multiple clicks
            const confirmBtn = document.getElementById('confirmOrderBtn');
            confirmBtn.disabled = true;
            confirmBtn.textContent = 'Saving...';

            const isOrderSaved = await saveOrderToAirtable();

            // Re-enable confirm button
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Confirm Order';
            
            if (isOrderSaved) {
                closeModal();
                tokenModal.classList.remove("hidden"); // Show the thank you modal
            }
            // If saving fails, the error message is already shown by saveOrderToAirtable
        }


        // =================================================================
        // SECTION 5: INITIALIZATION & EVENT LISTENERS
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
    </script>
</body>
</html>
"""

# =================================================================
# PYTHON BACKEND FUNCTIONS
# =================================================================

def show_modal_message(message):
    """Display a modal message"""
    print(f"MESSAGE: {message}")

def close_modal():
    """Close all modals"""
    global summaryModal, messageModal, nameModal, detailsModal, tokenModal
    summaryModal = "hidden"
    messageModal = "hidden" 
    nameModal = "hidden"
    detailsModal = "hidden"
    tokenModal = "hidden"

def compute_total():
    """Calculate total price"""
    return sum(food.get('price', 0) * food.get('qty', 0) for food in foods)

def update_total_display():
    """Update total display"""
    return f"₹{compute_total()}"

def render_foods():
    """Render foods based on category filter"""
    global foods, searchCategory
    if searchCategory == "All":
        filtered_foods = foods
    else:
        filtered_foods = [f for f in foods if f.get('category') == searchCategory]
    return filtered_foods

def render_categories():
    """Render category buttons"""
    global initialFoods
    categories = ["All"] + list(set(f.get('category', '') for f in initialFoods if f.get('category')))
    return categories

def clear_cart():
    """Clear the cart"""
    global foods, userName, userPhone, initialFoods
    foods = [dict(f, qty=0) for f in initialFoods]
    userName = ""
    userPhone = ""

def handle_food_item_click(food_id, delta=None, is_add=False):
    """Handle food item click events"""
    global foods
    food = next((f for f in foods if f.get('id') == food_id), None)
    if not food:
        return False
        
    if delta is not None:
        food['qty'] = max(0, food.get('qty', 0) + delta)
    elif is_add:
        food['qty'] = food.get('qty', 0) + 1
    return True

def handle_category_click(category):
    """Handle category click"""
    global searchCategory
    searchCategory = category

def open_order_summary():
    """Open order summary"""
    selected_foods = [f for f in foods if f.get('qty', 0) > 0]
    if not selected_foods:
        return {"error": "Please add items to your order first."}
    return {"selected_foods": selected_foods, "total": compute_total()}

def open_name_modal():
    """Open name modal"""
    if compute_total() == 0:
        return {"error": "Your cart is empty. Please add items to order."}
    return {"success": True}

def submit_name(current_user_name, current_user_phone):
    """Submit name and phone"""
    global userName, userPhone
    import re
    
    name_regex = r'^[a-zA-Z\s]{2,}$'
    phone_regex = r'^[0-9]{10}$'
    
    if not re.match(name_regex, current_user_name.strip()):
        return {"error": "Please enter a valid name."}
    
    if not re.match(phone_regex, current_user_phone.strip()):
        return {"error": "Please enter a valid 10-digit phone number."}
    
    userName = current_user_name.strip()
    userPhone = current_user_phone.strip()
    return {"success": True}

def save_order_to_airtable():
    """Save order to Airtable"""
    global foods, userName, userPhone
    selected_foods = [f for f in foods if f.get('qty', 0) > 0]
    items_string = '; '.join([f"{item.get('name', 'Unknown')} (Qty: {item.get('qty', 0)})" for item in selected_foods])
    
    payload = {
        "records": [{ 
            "fields": { 
                "Name": userName, 
                "Phone": userPhone,
                "Items": items_string,
                "Total": compute_total(),
                "Status": "Pending Acceptance"
            } 
        }]
    }

    try:
        headers = {
            'Authorization': f'Bearer {AIRTABLE_TOKEN}',
            'Content-Type': 'application/json'
        }
        response = requests.post(
            f"https://api.airtable.com/v0/{AIRTABLE_BASE_ID}/{AIRTABLE_ORDERS_TABLE_NAME}",
            headers=headers,
            json=payload
        )

        if not response.ok:
            error_data = response.json() if response.text else {}
            raise Exception(f"Airtable API Error: {json.dumps(error_data)}")
        return True
    except Exception as e:
        print(f"Error saving order to Airtable: {e}")
        return False

def confirm_order():
    """Confirm and save order"""
    global userName, userPhone
    if not userName or not userPhone:
        return {"error": "Please enter your name and phone number first."}
    
    is_order_saved = save_order_to_airtable()
    
    if is_order_saved:
        return {"success": True}
    else:
        return {"error": "Order saving failed. Please try again."}

def fetch_menu():
    """Fetch menu from Airtable"""
    global initialFoods, foods
    try:
        headers = {'Authorization': f'Bearer {AIRTABLE_TOKEN}'}
        response = requests.get(
            f"https://api.airtable.com/v0/{AIRTABLE_BASE_ID}/{AIRTABLE_MENU_TABLE_NAME}",
            headers=headers
        )

        if not response.ok:
            raise Exception(f"Network response was not ok: {response.status_text}")
        
        data = response.json()
        initialFoods = [record['fields'] for record in data.get('records', [])]
        
        # Add IDs and initialize quantities
        for i, food in enumerate(initialFoods):
            food['id'] = i + 1
            food['qty'] = 0
            
        foods = [dict(f) for f in initialFoods]
        return True
        
    except Exception as e:
        print(f"Error fetching menu: {e}")
        return False

# =================================================================
# FLASK ROUTES
# =================================================================

@app.route('/')
def index():
    """Main page"""
    return render_template_string(HTML_TEMPLATE)

@app.route('/api/fetch_menu')
def api_fetch_menu():
    """API endpoint to fetch menu"""
    success = fetch_menu()
    if success:
        return jsonify({"success": True, "foods": foods, "initialFoods": initialFoods})
    else:
        return jsonify({"success": False, "error": "Could not load the menu. Please check API details."})

@app.route('/api/update_quantity', methods=['POST'])
def api_update_quantity():
    """API endpoint to update food quantity"""
    data = request.get_json()
    food_id = data.get('food_id')
    delta = data.get('delta')
    is_add = data.get('is_add', False)
    
    success = handle_food_item_click(food_id, delta, is_add)
    if success:
        return jsonify({"success": True, "total": compute_total()})
    else:
        return jsonify({"success": False, "error": "Food item not found"})

@app.route('/api/change_category', methods=['POST'])
def api_change_category():
    """API endpoint to change category"""
    data = request.get_json()
    category = data.get('category')
    handle_category_click(category)
    filtered_foods = render_foods()
    return jsonify({"success": True, "foods": filtered_foods, "categories": render_categories()})

@app.route('/api/order_summary')
def api_order_summary():
    """API endpoint to get order summary"""
    result = open_order_summary()
    return jsonify(result)

@app.route('/api/submit_name', methods=['POST'])
def api_submit_name():
    """API endpoint to submit customer name and phone"""
    data = request.get_json()
    name = data.get('name', '')
    phone = data.get('phone', '')
    result = submit_name(name, phone)
    return jsonify(result)

@app.route('/api/confirm_order', methods=['POST'])
def api_confirm_order():
    """API endpoint to confirm order"""
    result = confirm_order()
    return jsonify(result)

@app.route('/api/clear_cart', methods=['POST'])
def api_clear_cart():
    """API endpoint to clear cart"""
    clear_cart()
    return jsonify({"success": True, "total": compute_total()})

@app.route('/api/get_current_state')
def api_get_current_state():
    """API endpoint to get current application state"""
    return jsonify({
        "foods": foods,
        "initialFoods": initialFoods,
        "searchCategory": searchCategory,
        "userName": userName,
        "userPhone": userPhone,
        "total": compute_total()
    })

# =================================================================
# MAIN EXECUTION
# =================================================================

if __name__ == '__main__':
    print("🍽️  Starting AJAYS Cafe Python Web Application...")
    print("=" * 50)
    
    # Initialize menu on startup
    if fetch_menu():
        print(f"✅ Menu loaded successfully! {len(initialFoods)} items found.")
    else:
        print("❌ Failed to load menu on startup.")
    
    print("\n🌐 Starting Flask server...")
    print("📱 Access the application at: http://127.0.0.1:5000")
    print("🔧 API endpoints available at /api/*")
    print("\n" + "=" * 50)
    
    app.run(debug=True, host='127.0.0.1', port=5000)