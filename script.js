// =================================================================
// SECTION 1: CONFIGURATION & GLOBAL VARIABLES
// =================================================================

// --- GOOGLE SHEETS API DETAILS ---
const GOOGLE_SHEETS_API_KEY = 'AIzaSyDmbBjVa9JVkaPjhAQdplrOzyAGVfi7qMU';
const GOOGLE_SHEET_ID = '1yJMz6BFvR1r2v0TyJAHb7W0yYAzwSo8DfuQNgFp8E_I';
const MENU_SHEET_NAME = 'Menu';
const ORDERS_SHEET_NAME = 'Restaurant Orders';

// Service Account Configuration
const SERVICE_ACCOUNT_CONFIG = {
    type: "service_account",
    project_id: "whatsapp-chatbot-471004",
    private_key_id: "80c87c17a5aaf6b4e890363e82dd22a115f3cf9e",
    private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDlmD6rUTPIuhVU\nxebSiMY4ePaQTNmL+i6lZhjPZJSeqmN72XwSL8NnsV8pr91ZVt0aO9eK10RYxLq0\nOZDiuTgWvua3PG1kvV2PKSsKo7E7K1wS5SPERu+l/1jMoQwquqve+9hSUavf+EdT\nGt8sAQK9iheHJAzcgdLDCLj92xrTBqik2oCWu9rFkQ5KrUTjZ7WNLExeR7asGPKM\ne4OdqLDvpQH1fJm61uR9qPtiaA+hNzaihBEF0LlLUHKRAw7Kp1nNakinG29oqUPY\nj+b58HxkkAOh1wBafd190odxT6Q+pS9Ic1YOcibfpPJOdX0IM3UbkvvWm30Vv4Wb\nJ5VYAHiLAgMBAAECggEARy5024tw6R4cJ+y1W/eQsQh7tRBGcDnwBVKKhZ4S38BG\n2Kp8Z20MgZUBwnxmPWELaqs7760+4OCZW+/vBgPTqmWkRRIEfnOhUpW6ZPGMLKKM\nSMVm2d7+RLJOdx7FFWhLifX9wsPUbDte7ZqKr2tezKHIGptoK2NKkzIcnIO2JM84\n2Ma8eEte/nCNb1vv9g2LmtcluBwvmYk1vS/oHgxZBI2w1/mGAvzjIHuufbAZl3SB\ni/DWxEKJZaHAemRsThlQMQRIHC4oFVGHUJN9GH88TaNqPr0+HYjpNr6kFzdObvIJ\nZ4DvqVAQENPGAsnG33e8iXKYFfS+kKmS8Rs4gvQ/RQKBgQD16+45Aae2IfWvT+ss\nZOPNwDoCqd4sKIfVRUuIb3H3bFfbYIo8JZ9KrlDlhjps+yRe68SoygDGsw80xojW\nXP6f/HlDfaXsiXzUuNIZn6PDmFo+HSQzat98k7nEt2YGZzroNwsRlzHzHDMtGlAI\ndCwcn7MwQvMa3gbfZQu5R3CZ3QKBgQDvAQWQPHNVe52w3SUfYT8y/rXxSrRyqRpM\niiA/PiigCcpiH9GJwY47h9UiYq55C4KBIB4WtVEQWJNpuRqqF9mE/T28bSVM5xp8\nD+znFkv7JCT9nXM1BaeUSusVcVqrL/OBYJcHIqSu/8dIwLa0fEI1s3eavBj3BgV4\n9v2E1k/ZhwKBgQCJdU663on37BN/4pP5RItwvjmus3RUCnOiahFGOcTiH9Ub8mJS\nLFVVUQo2wUh3EgnKZM6P6hl09zFQtohWCbTpiB3f86ODC3aTEJufZvQKqGYIwhEy\nDFLPN2Nm6XxFp/3tPpcZRgHNeb3BQCvsDcN6XGm0WDe6lNASnlBnR99QoQKBgQDC\nGplTF9UvQpLB9ghVINx75OMM0PgV+wIx0Sf5VNkXiHwGDwNVFo4WCO3u3CgIhHF7\nvwLQvHbWiKlH/p4KMA5ndGf0JMxbVYFr6l8jGjehAizMkFflYu9Df0jHBGV3jBz+\nINznXZpTycUmb+SyVgxLorJrR4Ia9JfzMtyYSplU9wKBgQC0LyRftnkHlfbXx8c9\n3rmFYue029aAHeOql7BbWzguKXpJAWJYsTmV3OvS2kAwZAmYausRUEkkbuchoFP8\nXss85z56cge3mGphUfCFzwHDsoFlFe77gzf6wYm6f4ztAs/H47o2hv/5HIkU4Nn4\nXCkCLgtD40XZ7MN2XFyF2WdgXQ==\n-----END PRIVATE KEY-----\n",
    client_email: "whatsapp-bot-sheets@whatsapp-chatbot-471004.iam.gserviceaccount.com",
    client_id: "114818674736682471635",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/whatsapp-bot-sheets%40whatsapp-chatbot-471004.iam.gserviceaccount.com",
    universe_domain: "googleapis.com"
};

// --- GLOBAL STATE VARIABLES ---
let initialFoods = [];
let foods = [];
let searchCategory = "All";
let userName = "";
let userPhone = "";
let accessToken = null; // For service account authentication

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
// SECTION 3: GOOGLE SHEETS AUTHENTICATION & API FUNCTIONS
// =================================================================

// JWT Helper Functions
function base64UrlEscape(str) {
    return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64UrlEncode(str) {
    return base64UrlEscape(btoa(str));
}

async function createJWT() {
    const header = {
        alg: 'RS256',
        typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
        iss: SERVICE_ACCOUNT_CONFIG.client_email,
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        aud: SERVICE_ACCOUNT_CONFIG.token_uri,
        exp: now + 3600,
        iat: now
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const unsignedToken = `${encodedHeader}.${encodedPayload}`;

    // Import the private key
    const pemHeader = "-----BEGIN PRIVATE KEY-----";
    const pemFooter = "-----END PRIVATE KEY-----";
    const pemContents = SERVICE_ACCOUNT_CONFIG.private_key
        .replace(pemHeader, "")
        .replace(pemFooter, "")
        .replace(/\s/g, "");

    const binaryDerString = atob(pemContents);
    const binaryDer = new Uint8Array(binaryDerString.length);
    for (let i = 0; i < binaryDerString.length; i++) {
        binaryDer[i] = binaryDerString.charCodeAt(i);
    }

    const key = await crypto.subtle.importKey(
        "pkcs8",
        binaryDer,
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        false,
        ["sign"]
    );

    const signature = await crypto.subtle.sign(
        "RSASSA-PKCS1-v1_5",
        key,
        new TextEncoder().encode(unsignedToken)
    );

    const base64Signature = base64UrlEscape(btoa(String.fromCharCode(...new Uint8Array(signature))));
    return `${unsignedToken}.${base64Signature}`;
}

// Get access token using JWT
async function getAccessToken() {
    try {
        const jwt = await createJWT();
        
        const response = await fetch(SERVICE_ACCOUNT_CONFIG.token_uri, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
        });

        if (!response.ok) {
            throw new Error(`Token request failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.access_token;
    } catch (error) {
        console.error('Error getting access token:', error);
        throw error;
    }
}

// Function to read data from Google Sheets using API key
async function readGoogleSheet(sheetName, range = '') {
    const fullRange = range ? `${sheetName}!${range}` : sheetName;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/${fullRange}?key=${GOOGLE_SHEETS_API_KEY}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Google Sheets API Error: ${response.statusText}`);
        
        const data = await response.json();
        return data.values || [];
    } catch (error) {
        console.error('Error reading Google Sheet:', error);
        throw error;
    }
}

// Function to append data to Google Sheets using service account
async function appendToGoogleSheet(sheetName, values) {
    try {
        // Get fresh access token if needed
        if (!accessToken) {
            accessToken = await getAccessToken();
        }

        const url = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/${sheetName}:append?valueInputOption=USER_ENTERED`;
        
        const payload = {
            values: [values]
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            // If token expired, try to get a new one
            if (response.status === 401) {
                accessToken = await getAccessToken();
                return appendToGoogleSheet(sheetName, values); // Retry with new token
            }
            
            const errorData = await response.json();
            throw new Error(`Google Sheets API Error: ${JSON.stringify(errorData)}`);
        }
        
        return true;
    } catch (error) {
        console.error('Error writing to Google Sheet:', error);
        throw error;
    }
}

// Function to convert sheet rows to menu items
function parseMenuData(rows) {
    if (rows.length === 0) return [];
    
    // Assuming first row contains headers: id, name, price, category, image
    const headers = rows[0];
    const menuItems = [];
    
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length === 0) continue;
        
        const item = {};
        headers.forEach((header, index) => {
            if (header && row[index] !== undefined) {
                // Convert price to number if it's the price column
                if (header.toLowerCase() === 'price') {
                    item[header] = parseFloat(row[index]) || 0;
                } else if (header.toLowerCase() === 'id') {
                    item[header] = parseInt(row[index]) || i;
                } else {
                    item[header] = row[index];
                }
            }
        });
        
        // Ensure required fields exist
        if (item.name && item.price !== undefined) {
            menuItems.push(item);
        }
    }
    
    return menuItems;
}

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
                <img src="${food.image || 'https://placehold.co/400x300/e5e7eb/4b5563?text=Image+Not+Found'}" alt="${food.name}" class="w-full h-full object-cover" onerror="this.onerror=null;this.src='https://placehold.co/400x300/e5e7eb/4b5563?text=Image+Not+Found';">
            </div>
            <div class="p-4 pt-2">
                <div class="flex justify-between items-start">
                    <div>
                        <h5 class="font-bold text-lg sm:text-2xl">${food.name}</h5>
                        <p class="text-xs text-gray-500">${food.category || 'No Category'}</p>
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

// Function to save order to Google Sheets
async function saveOrderToGoogleSheets() {
    const selectedFoods = foods.filter(f => f.qty > 0);
    const itemsString = selectedFoods.map(item => `${item.name} (Qty: ${item.qty})`).join('; ');
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    
    // Prepare the row data to append - matching your sheet structure
    const orderData = [
        userName,        // Column A: Name
        userPhone,       // Column B: Phone
        itemsString,     // Column C: Items
        computeTotal(),  // Column D: Total
        "",              // Column E: Token (empty for now)
        "Pending Acceptance", // Column F: Status
        timestamp        // Column G: Timestamp
    ];

    try {
        const success = await appendToGoogleSheet(ORDERS_SHEET_NAME, orderData);
        return success;
    } catch (error) {
        console.error("Error saving order to Google Sheets:", error);
        showModalMessage("Order saving failed. Please try again.");
        return false;
    }
}

// Updated confirm order function
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
        
        // Read menu data from Google Sheets
        const rows = await readGoogleSheet(MENU_SHEET_NAME);
        
        if (rows.length === 0) {
            throw new Error("No menu data found");
        }
        
        // Parse the data
        initialFoods = parseMenuData(rows);
        foods = initialFoods.map(f => ({ ...f, qty: 0 }));

    } catch (error) {
        console.error("Error fetching menu:", error);
        showModalMessage("Could not load the menu. Please check Google Sheets configuration.");
        menuContainer.innerHTML = `<p class="text-center text-red-600 col-span-full">Failed to load menu. Please check Google Sheets details.</p>`;
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
