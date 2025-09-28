import requests
import json
import re
from typing import List, Dict, Optional
from datetime import datetime

class RestaurantOrderingSystem:
    """
    Python version of the restaurant ordering system that interacts with Airtable
    """
    
    def __init__(self):
        # =================================================================
        # SECTION 1: CONFIGURATION & GLOBAL VARIABLES
        # =================================================================
        
        # --- AIRTABLE API DETAILS ---
        self.AIRTABLE_TOKEN = 'patGHtMaDWo3zMYxm.729c6866f4a2a5d945a213af8ff68c7b48c41e439766e4a30486d1cd46ab463e'
        self.AIRTABLE_BASE_ID = 'appLgIPkiF7jORwe7'
        self.AIRTABLE_MENU_TABLE_NAME = 'Menu'
        self.AIRTABLE_ORDERS_TABLE_NAME = 'Orders'
        
        # --- GLOBAL STATE VARIABLES ---
        self.initial_foods: List[Dict] = []
        self.foods: List[Dict] = []
        self.search_category: str = "All"
        self.user_name: str = ""
        self.user_phone: str = ""
        
        # API Headers
        self.headers = {
            'Authorization': f'Bearer {self.AIRTABLE_TOKEN}',
            'Content-Type': 'application/json'
        }
    
    def show_modal_message(self, message: str) -> None:
        """Display a modal message (in CLI, just print)"""
        print(f"📢 MESSAGE: {message}")
    
    def compute_total(self) -> float:
        """Calculate total price of items in cart"""
        return sum(food.get('price', 0) * food.get('qty', 0) for food in self.foods)
    
    def get_filtered_foods(self) -> List[Dict]:
        """Get foods filtered by category"""
        if self.search_category == "All":
            return self.foods
        return [f for f in self.foods if f.get('category') == self.search_category]
    
    def get_categories(self) -> List[str]:
        """Get unique categories from foods"""
        categories = ["All"]
        unique_cats = set(f.get('category', '') for f in self.initial_foods if f.get('category'))
        categories.extend(sorted(unique_cats))
        return categories
    
    def display_menu(self) -> None:
        """Display the current menu"""
        filtered_foods = self.get_filtered_foods()
        
        print(f"\n{'='*60}")
        print(f"🍽️  MENU - Category: {self.search_category}")
        print(f"{'='*60}")
        
        if not filtered_foods:
            print("No items found in this category.")
            return
        
        for food in filtered_foods:
            name = food.get('name', 'Unknown')
            category = food.get('category', 'Unknown')
            price = food.get('price', 0)
            qty = food.get('qty', 0)
            
            print(f"\n🍽️  {name}")
            print(f"   Category: {category}")
            print(f"   Price: ₹{price}")
            print(f"   In Cart: {qty}")
            print(f"   ID: {food.get('id', 'N/A')}")
        
        print(f"\n💰 Current Total: ₹{self.compute_total()}")
    
    def display_categories(self) -> None:
        """Display available categories"""
        categories = self.get_categories()
        print(f"\n📂 Available Categories:")
        for i, cat in enumerate(categories, 1):
            marker = "👉" if cat == self.search_category else "  "
            print(f"{marker} {i}. {cat}")
    
    def add_to_cart(self, food_id: int, quantity: int = 1) -> bool:
        """Add items to cart"""
        food = next((f for f in self.foods if f.get('id') == food_id), None)
        if not food:
            self.show_modal_message(f"Food item with ID {food_id} not found.")
            return False
        
        food['qty'] = max(0, food.get('qty', 0) + quantity)
        print(f"✅ Updated {food.get('name', 'Unknown')} quantity to {food['qty']}")
        return True
    
    def remove_from_cart(self, food_id: int, quantity: int = 1) -> bool:
        """Remove items from cart"""
        return self.add_to_cart(food_id, -quantity)
    
    def clear_cart(self) -> None:
        """Clear the entire cart"""
        self.foods = [dict(f, qty=0) for f in self.initial_foods]
        self.user_name = ""
        self.user_phone = ""
        print("🗑️  Cart cleared successfully!")
    
    def get_selected_foods(self) -> List[Dict]:
        """Get foods with quantity > 0"""
        return [f for f in self.foods if f.get('qty', 0) > 0]
    
    def display_cart_summary(self) -> None:
        """Display current cart contents"""
        selected_foods = self.get_selected_foods()
        
        if not selected_foods:
            print("\n🛒 Your cart is empty!")
            return
        
        print(f"\n{'='*50}")
        print("🛒 CART SUMMARY")
        print(f"{'='*50}")
        
        for item in selected_foods:
            name = item.get('name', 'Unknown')
            qty = item.get('qty', 0)
            price = item.get('price', 0)
            subtotal = qty * price
            print(f"• {name}")
            print(f"  {qty} x ₹{price} = ₹{subtotal}")
        
        print(f"\n💰 TOTAL: ₹{self.compute_total()}")
        
        if self.user_name:
            print(f"👤 Customer: {self.user_name}")
        if self.user_phone:
            print(f"📞 Phone: {self.user_phone}")
    
    def set_customer_info(self, name: str, phone: str) -> bool:
        """Set customer name and phone with validation"""
        # Name validation
        name_pattern = r'^[a-zA-Z\s]{2,}$'
        if not re.match(name_pattern, name.strip()):
            self.show_modal_message("Please enter a valid name (letters and spaces only, minimum 2 characters).")
            return False
        
        # Phone validation
        phone_pattern = r'^[0-9]{10}$'
        if not re.match(phone_pattern, phone.strip()):
            self.show_modal_message("Please enter a valid 10-digit phone number.")
            return False
        
        self.user_name = name.strip()
        self.user_phone = phone.strip()
        print(f"✅ Customer info set: {self.user_name}, {self.user_phone}")
        return True
    
    async def fetch_menu(self) -> bool:
        """Fetch menu from Airtable"""
        try:
            print("📡 Loading menu from Airtable...")
            
            url = f"https://api.airtable.com/v0/{self.AIRTABLE_BASE_ID}/{self.AIRTABLE_MENU_TABLE_NAME}"
            response = requests.get(url, headers=self.headers)
            
            if not response.ok:
                raise Exception(f"Network response was not ok: {response.status_code} - {response.text}")
            
            data = response.json()
            self.initial_foods = [record['fields'] for record in data.get('records', [])]
            
            # Add IDs and initialize quantities
            for i, food in enumerate(self.initial_foods):
                food['id'] = i + 1
                food['qty'] = 0
            
            self.foods = [dict(f) for f in self.initial_foods]
            
            print(f"✅ Menu loaded successfully! {len(self.initial_foods)} items found.")
            return True
            
        except Exception as e:
            print(f"❌ Error fetching menu: {e}")
            self.show_modal_message("Could not load the menu. Please check API details.")
            return False
    
    def fetch_menu_sync(self) -> bool:
        """Synchronous version of fetch_menu"""
        try:
            print("📡 Loading menu from Airtable...")
            
            url = f"https://api.airtable.com/v0/{self.AIRTABLE_BASE_ID}/{self.AIRTABLE_MENU_TABLE_NAME}"
            response = requests.get(url, headers=self.headers)
            
            if not response.ok:
                raise Exception(f"Network response was not ok: {response.status_code} - {response.text}")
            
            data = response.json()
            self.initial_foods = [record['fields'] for record in data.get('records', [])]
            
            # Add IDs and initialize quantities
            for i, food in enumerate(self.initial_foods):
                food['id'] = i + 1
                food['qty'] = 0
            
            self.foods = [dict(f) for f in self.initial_foods]
            
            print(f"✅ Menu loaded successfully! {len(self.initial_foods)} items found.")
            return True
            
        except Exception as e:
            print(f"❌ Error fetching menu: {e}")
            self.show_modal_message("Could not load the menu. Please check API details.")
            return False
    
    def save_order_to_airtable(self) -> bool:
        """Save order to Airtable Orders table"""
        selected_foods = self.get_selected_foods()
        
        if not selected_foods:
            self.show_modal_message("No items in cart to save.")
            return False
        
        # Create items string
        items_string = '; '.join([
            f"{item.get('name', 'Unknown')} (Qty: {item.get('qty', 0)})" 
            for item in selected_foods
        ])
        
        payload = {
            "records": [{
                "fields": {
                    "Name": self.user_name,
                    "Phone": self.user_phone,
                    "Items": items_string,
                    "Total": self.compute_total(),
                    "Status": "Pending Acceptance"
                }
            }]
        }
        
        try:
            print("💾 Saving order to Airtable...")
            
            url = f"https://api.airtable.com/v0/{self.AIRTABLE_BASE_ID}/{self.AIRTABLE_ORDERS_TABLE_NAME}"
            response = requests.post(url, headers=self.headers, json=payload)
            
            if not response.ok:
                error_data = response.json() if response.text else {"error": "Unknown error"}
                raise Exception(f"Airtable API Error: {response.status_code} - {json.dumps(error_data)}")
            
            print("✅ Order saved successfully!")
            return True
            
        except Exception as e:
            print(f"❌ Error saving order to Airtable: {e}")
            self.show_modal_message("Order saving failed. Please try again.")
            return False
    
    def confirm_order(self) -> bool:
        """Confirm and save the order"""
        if not self.user_name or not self.user_phone:
            self.show_modal_message("Please enter your name and phone number first.")
            return False
        
        selected_foods = self.get_selected_foods()
        if not selected_foods:
            self.show_modal_message("Your cart is empty. Please add items to order.")
            return False
        
        print("🔄 Processing order...")
        
        is_order_saved = self.save_order_to_airtable()
        
        if is_order_saved:
            print("\n🎉 ORDER CONFIRMED!")
            print("Thank you for your order. We'll contact you soon!")
            self.display_cart_summary()
            return True
        
        return False
    
    def change_category(self, category: str) -> bool:
        """Change the current category filter"""
        categories = self.get_categories()
        if category in categories:
            self.search_category = category
            print(f"📂 Category changed to: {category}")
            return True
        else:
            self.show_modal_message(f"Category '{category}' not found.")
            return False
    
    def run_cli_interface(self) -> None:
        """Run a simple command-line interface"""
        print("🍽️  Welcome to Restaurant Ordering System!")
        print("=" * 50)
        
        # Load menu
        if not self.fetch_menu_sync():
            print("Failed to load menu. Exiting.")
            return
        
        while True:
            print(f"\n{'='*30}")
            print("🎯 MAIN MENU")
            print("=" * 30)
            print("1. View Menu")
            print("2. View Categories") 
            print("3. Change Category")
            print("4. Add Item to Cart")
            print("5. Remove Item from Cart")
            print("6. View Cart")
            print("7. Set Customer Info")
            print("8. Confirm Order")
            print("9. Clear Cart")
            print("0. Exit")
            
            try:
                choice = input("\nEnter your choice (0-9): ").strip()
                
                if choice == '0':
                    print("👋 Thank you for using our ordering system!")
                    break
                elif choice == '1':
                    self.display_menu()
                elif choice == '2':
                    self.display_categories()
                elif choice == '3':
                    self.display_categories()
                    cat_input = input("Enter category name: ").strip()
                    self.change_category(cat_input)
                elif choice == '4':
                    self.display_menu()
                    try:
                        item_id = int(input("Enter item ID: ").strip())
                        qty = int(input("Enter quantity to add (default 1): ").strip() or "1")
                        self.add_to_cart(item_id, qty)
                    except ValueError:
                        self.show_modal_message("Please enter valid numbers.")
                elif choice == '5':
                    self.display_menu()
                    try:
                        item_id = int(input("Enter item ID: ").strip())
                        qty = int(input("Enter quantity to remove (default 1): ").strip() or "1")
                        self.remove_from_cart(item_id, qty)
                    except ValueError:
                        self.show_modal_message("Please enter valid numbers.")
                elif choice == '6':
                    self.display_cart_summary()
                elif choice == '7':
                    name = input("Enter your name: ").strip()
                    phone = input("Enter your phone number: ").strip()
                    self.set_customer_info(name, phone)
                elif choice == '8':
                    self.confirm_order()
                elif choice == '9':
                    self.clear_cart()
                else:
                    self.show_modal_message("Invalid choice. Please try again.")
                    
            except KeyboardInterrupt:
                print("\n👋 Thank you for using our ordering system!")
                break
            except Exception as e:
                print(f"❌ An error occurred: {e}")


# =================================================================
# USAGE EXAMPLE
# =================================================================

if __name__ == "__main__":
    # Create an instance of the ordering system
    restaurant = RestaurantOrderingSystem()
    
    # Run the CLI interface
    restaurant.run_cli_interface()
    
    # Or use programmatically:
    # restaurant.fetch_menu_sync()
    # restaurant.display_menu()
    # restaurant.add_to_cart(1, 2)  # Add 2 of item ID 1
    # restaurant.set_customer_info("John Doe", "1234567890")
    # restaurant.confirm_order()
