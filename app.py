from flask import Flask, request, jsonify
import requests
import os
from dotenv import load_dotenv
import json
from datetime import datetime
from flask_cors import CORS

# Load environment variables from Variables.env
load_dotenv('Variables.env')

app = Flask(__name__)

# CORS Configuration - Allow requests from your GitHub Pages
CORS(app, 
     origins=[
         "https://smitgamer687-byte.github.io",
         "http://localhost:*",
         "http://127.0.0.1:*"
     ],
     methods=["GET", "POST", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization"],
     supports_credentials=False,
     max_age=3600)

# Configuration for WhatsApp Business API
WHATSAPP_TOKEN = os.environ.get('WHATSAPP_TOKEN')
WHATSAPP_PHONE_ID = os.environ.get('WHATSAPP_PHONE_ID')
VERIFY_TOKEN = os.environ.get('VERIFY_TOKEN', 'your_verify_token')
WEBSITE_URL = os.environ.get('WEBSITE_URL', 'https://smitgamer687-byte.github.io/Hotelflow/')
PAYMENT_URL = 'https://www.youtube.com/'  # Payment redirect URL

# WhatsApp API URL
WHATSAPP_API_URL = f"https://graph.facebook.com/v23.0/{WHATSAPP_PHONE_ID}/messages"

class WhatsAppOrderBot:
    def __init__(self):
        # Store user conversation states
        self.user_states = {}

    def format_phone_number(self, phone):
        """Format phone number for WhatsApp API"""
        if not phone:
            return None

        phone = str(phone).strip().replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
        phone = phone.lstrip('0')

        if phone.startswith('+91'):
            return phone
        elif phone.startswith('91') and len(phone) == 12:
            return f"+{phone}"
        elif len(phone) == 10:
            return f"+91{phone}"
        else:
            return f"+91{phone}"

    def send_whatsapp_message(self, phone_number, message):
        """Send text message via WhatsApp Business API"""
        headers = {
            'Authorization': f'Bearer {WHATSAPP_TOKEN}',
            'Content-Type': 'application/json'
        }

        payload = {
            "messaging_product": "whatsapp",
            "to": phone_number,
            "type": "text",
            "text": {"body": message}
        }

        try:
            print(f"📤 Sending message to {phone_number}")
            response = requests.post(WHATSAPP_API_URL, headers=headers, json=payload)
            print(f"📤 Response: {response.status_code} - {response.text}")
            return response.status_code == 200
        except Exception as e:
            print(f"Error sending message: {e}")
            return False

    def send_cta_button(self, phone_number, message, button_text, website_url):
        """Send Call-to-Action button that opens website"""
        headers = {
            'Authorization': f'Bearer {WHATSAPP_TOKEN}',
            'Content-Type': 'application/json'
        }

        payload = {
            "messaging_product": "whatsapp",
            "to": phone_number,
            "type": "interactive",
            "interactive": {
                "type": "cta_url",
                "body": {"text": message},
                "action": {
                    "name": "cta_url",
                    "parameters": {
                        "display_text": button_text,
                        "url": website_url
                    }
                }
            }
        }

        try:
            response = requests.post(WHATSAPP_API_URL, headers=headers, json=payload)
            if response.status_code == 200:
                return True
            else:
                # Fallback to text message
                fallback_message = f"{message}\n\n🌐 {button_text}: {website_url}"
                return self.send_whatsapp_message(phone_number, fallback_message)
        except Exception as e:
            fallback_message = f"{message}\n\n🌐 {button_text}: {website_url}"
            return self.send_whatsapp_message(phone_number, fallback_message)

    def send_interactive_buttons(self, phone_number, message, buttons):
        """Send interactive message with buttons"""
        headers = {
            'Authorization': f'Bearer {WHATSAPP_TOKEN}',
            'Content-Type': 'application/json'
        }

        button_objects = []
        for i, button_text in enumerate(buttons):
            button_objects.append({
                "type": "reply",
                "reply": {
                    "id": f"btn_{i+1}",
                    "title": button_text[:20]  # WhatsApp limit
                }
            })

        payload = {
            "messaging_product": "whatsapp",
            "to": phone_number,
            "type": "interactive",
            "interactive": {
                "type": "button",
                "body": {"text": message},
                "action": {"buttons": button_objects}
            }
        }

        try:
            response = requests.post(WHATSAPP_API_URL, headers=headers, json=payload)
            if response.status_code == 200:
                print(f"✅ Interactive buttons sent to {phone_number}")
                return True
            else:
                print(f"❌ Failed to send buttons, falling back to text")
                return self.send_fallback_message(phone_number, message, buttons)
        except Exception as e:
            print(f"Error sending interactive buttons: {e}")
            return self.send_fallback_message(phone_number, message, buttons)

    def send_fallback_message(self, phone_number, message, buttons):
        """Send fallback text message when interactive fails"""
        fallback_message = message + "\n\n"
        for i, button in enumerate(buttons, 1):
            fallback_message += f"{i}. {button}\n"
        fallback_message += "\nReply with the number of your choice."
        return self.send_whatsapp_message(phone_number, fallback_message)

    def send_order_confirmation(self, order_data):
        """Send order confirmation to customer via WhatsApp with Edit/Confirm buttons"""
        try:
            print(f"📋 Processing order confirmation: {order_data}")

            # Extract order details
            name = order_data.get('name', 'Customer')
            phone = order_data.get('phone')
            food_items = order_data.get('foodItems', 'N/A')
            quantity = order_data.get('quantity', 'N/A')
            total = order_data.get('total', 0)
            timestamp = order_data.get('timestamp', datetime.now().strftime('%Y-%m-%d %H:%M'))
            row_number = order_data.get('rowNumber', 0)

            # Format phone number
            whatsapp_phone = self.format_phone_number(phone)
            if not whatsapp_phone:
                print(f"❌ Invalid phone number: {phone}")
                return False

            print(f"📱 Formatted WhatsApp number: {whatsapp_phone}")

            # Create order summary message
            message = f"""🎉 Order Received!

📋 ORDER SUMMARY:
👤 Name: {name}
🍽️ Items: {food_items}
📊 Quantity: {quantity}
💰 Total Amount: ₹{total}
⏰ Order Time: {timestamp}

Please confirm your order:"""

            # Store order data for conversation flow
            self.user_states[whatsapp_phone] = {
                'stage': 'awaiting_confirmation',
                'order_data': order_data
            }

            # Send interactive buttons
            buttons = ['✏️ Edit Order', '✅ Confirm Order']
            success = self.send_interactive_buttons(whatsapp_phone, message, buttons)

            if success:
                print(f"✅ Order confirmation with buttons sent to {whatsapp_phone}")
            else:
                print(f"❌ Failed to send order confirmation to {whatsapp_phone}")

            return success

        except Exception as e:
            print(f"❌ Error sending order confirmation: {e}")
            import traceback
            traceback.print_exc()
            return False

    def handle_button_response(self, phone_number, button_id):
        """Handle button click responses"""
        try:
            # Get user state
            current_state = self.user_states.get(phone_number, {})

            if current_state.get('stage') == 'awaiting_confirmation':
                order_data = current_state.get('order_data', {})

                # Handle Edit Order button
                if button_id == 'btn_1':  # Edit Order
                    message = "✏️ To edit your order, please visit our website by clicking the button below:"
                    self.send_cta_button(phone_number, message, "Visit Website", WEBSITE_URL)

                    # Reset user state
                    if phone_number in self.user_states:
                        del self.user_states[phone_number]

                    return True

                # Handle Confirm Order button
                elif button_id == 'btn_2':  # Confirm Order
                    total = order_data.get('total', 0)
                    name = order_data.get('name', 'Customer')

                    # Send confirmation with Pay Now CTA button
                    message = f"""✅ Order Confirmed!

👤 Customer: {name}
💰 Total Bill: ₹{total}

🎫 Your order is being prepared!
📞 For queries: +91-9327256068
🕒 Estimated time: 15-20 minutes

Click below to proceed with payment:"""

                    success = self.send_cta_button(phone_number, message, "💳 Pay Now", PAYMENT_URL)

                    # Reset user state
                    if phone_number in self.user_states:
                        del self.user_states[phone_number]

                    return success

            else:
                # Handle unknown button press
                message = "Sorry, I didn't understand that. Type 'hi' to start over or 'help' for assistance."
                return self.send_whatsapp_message(phone_number, message)

        except Exception as e:
            print(f"❌ Error handling button response: {e}")
            return False

    def handle_text_in_confirmation_flow(self, phone_number, message_body):
        """Handle text responses during confirmation flow"""
        try:
            current_state = self.user_states.get(phone_number, {})

            if current_state.get('stage') == 'awaiting_confirmation':
                order_data = current_state.get('order_data', {})

                # Handle number-based responses (fallback for when buttons don't work)
                if '1' in message_body or 'edit' in message_body.lower():
                    message = "✏️ To edit your order, please visit our website by clicking the button below:"
                    self.send_cta_button(phone_number, message, "Visit Website", WEBSITE_URL)

                    # Reset user state
                    if phone_number in self.user_states:
                        del self.user_states[phone_number]
                    return True

                elif '2' in message_body or 'confirm' in message_body.lower():
                    total = order_data.get('total', 0)
                    name = order_data.get('name', 'Customer')

                    # Send confirmation with Pay Now CTA button
                    message = f"""✅ Order Confirmed!

👤 Customer: {name}
💰 Total Bill: ₹{total}

🎫 Your order is being prepared!
📞 For queries: +91-9327256068
🕒 Estimated time: 15-20 minutes

Click below to proceed with payment:"""

                    success = self.send_cta_button(phone_number, message, "💳 Pay Now", PAYMENT_URL)

                    # Reset user state
                    if phone_number in self.user_states:
                        del self.user_states[phone_number]
                    return success

                else:
                    # Remind user of options
                    message = """Please choose an option:

1. ✏️ Edit Order
2. ✅ Confirm Order

Reply with the number or tap the button."""
                    return self.send_whatsapp_message(phone_number, message)

            return False  # Not in confirmation flow

        except Exception as e:
            print(f"❌ Error handling text in confirmation flow: {e}")
            return False

    def handle_basic_messages(self, phone_number, message_body):
        """Handle basic bot messages and confirmation flow"""
        message_body = str(message_body).lower().strip()

        # Check if user is in confirmation flow first
        if phone_number in self.user_states:
            return self.handle_text_in_confirmation_flow(phone_number, message_body)

        # Greeting keywords
        if any(keyword in message_body for keyword in ['hi', 'hello', 'hey', 'hy']):
            message = "🍕 Welcome to our restaurant! \n\nTo place your order, please visit our website:"
            self.send_cta_button(phone_number, message, "Order Now", WEBSITE_URL)
            return True

        # Menu request
        elif 'menu' in message_body:
            message = "📋 Check out our delicious menu at:"
            self.send_cta_button(phone_number, message, "View Menu", WEBSITE_URL)
            return True

        # Help or Support
        elif 'help' in message_body or 'support' in message_body:
            message = """🆘 Support Contact

For immediate assistance:
📞 Call: +91-9327256068
📧 Email: support@yourrestaurant.com
🕒 Hours: 9 AM - 11 PM

You can also:
• Type 'menu' to see our menu
• Type 'hi' to place a new order"""
            self.send_whatsapp_message(phone_number, message)
            return True

        # Default response for any other message
        else:
            message = """Hi! 👋 Welcome to our restaurant.

Commands you can use:
• 'hi' or 'hello' - Place a new order
• 'menu' - View our menu
• 'help' or 'support' - Get assistance

🍕 Ready to order? Type 'hi' to get started!"""
            self.send_whatsapp_message(phone_number, message)
            return True

# Initialize bot
bot = WhatsAppOrderBot()

# Add CORS preflight handler
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', 'https://smitgamer687-byte.github.io')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
        return response, 200

# Google Sheets webhook endpoint
@app.route('/webhook/google-sheets', methods=['POST', 'OPTIONS'])
def google_sheets_webhook():
    """Handle webhook from Google Apps Script when new order is added"""
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        data = request.json
        print(f"📥 Received Google Sheets webhook: {json.dumps(data, indent=2)}")

        # Extract order data from webhook
        order_data = data.get('order', {})
        source = data.get('source', 'unknown')
        timestamp = data.get('timestamp', datetime.now().isoformat())

        if order_data and order_data.get('name') and order_data.get('phone'):
            print(f"✅ Valid order data received from {source}")

            # Add timestamp to order data
            order_data['timestamp'] = timestamp

            # Send order confirmation via WhatsApp
            success = bot.send_order_confirmation(order_data)

            return jsonify({
                'success': success,
                'message': 'Order confirmation processed successfully',
                'order_data': {
                    'name': order_data.get('name'),
                    'phone': order_data.get('phone'),
                    'total': order_data.get('total')
                },
                'timestamp': timestamp
            }), 200

        else:
            print("❌ Invalid order data - missing name or phone")
            return jsonify({
                'success': False,
                'message': 'Invalid order data - name and phone are required',
                'received_data': order_data
            }), 400

    except Exception as e:
        print(f"❌ Error processing Google Sheets webhook: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Webhook processing failed'
        }), 500

# WhatsApp webhook (for regular chat messages)
@app.route('/webhook/whatsapp', methods=['GET', 'POST'])
def whatsapp_webhook():
    """Handle WhatsApp webhook verification and incoming messages"""

    if request.method == 'GET':
        # Webhook verification for Meta
        verify_token = request.args.get('hub.verify_token')
        challenge = request.args.get('hub.challenge')

        if verify_token == VERIFY_TOKEN:
            return challenge
        else:
            return 'Invalid verify token', 403

    elif request.method == 'POST':
        try:
            data = request.json
            print(f"📥 Received WhatsApp webhook: {data}")

            # Parse WhatsApp message
            if 'entry' in data:
                for entry in data['entry']:
                    for change in entry.get('changes', []):
                        if change.get('field') == 'messages':
                            messages = change.get('value', {}).get('messages', [])

                            for message in messages:
                                phone_number = message['from']

                                # Handle text messages
                                if message.get('type') == 'text':
                                    message_body = message['text']['body']
                                    bot.handle_basic_messages(phone_number, message_body)

                                # Handle button clicks
                                elif message.get('type') == 'interactive':
                                    if 'button_reply' in message['interactive']:
                                        button_reply = message['interactive']['button_reply']
                                        button_id = button_reply['id']
                                        print(f"📱 Button clicked: {button_id} by {phone_number}")
                                        bot.handle_button_response(phone_number, button_id)

            return jsonify({'status': 'success'})

        except Exception as e:
            print(f"Error processing WhatsApp webhook: {e}")
            return jsonify({'error': 'Processing failed'}), 500

# Test endpoints
@app.route('/test/order', methods=['POST'])
def test_order():
    """Test order confirmation with sample data"""
    try:
        # You can customize this test data
        sample_order = {
            'name': 'Test Customer',
            'phone': '9876543210',
            'foodItems': 'Margherita Pizza, Coke',
            'quantity': '1, 2',
            'total': 350,
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M')
        }

        success = bot.send_order_confirmation(sample_order)

        return jsonify({
            'success': success,
            'message': 'Test order confirmation sent',
            'test_data': sample_order
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/test/webhook', methods=['POST'])
def test_google_sheets_webhook():
    """Test the Google Sheets webhook endpoint"""
    try:
        sample_webhook_data = {
            'order': {
                'name': 'John Doe',
                'phone': '9876543210',
                'foodItems': 'Chicken Burger, French Fries',
                'quantity': '1, 1',
                'total': 299
            },
            'timestamp': datetime.now().isoformat(),
            'source': 'test_webhook'
        }

        # Simulate the webhook call
        old_json = request.json
        request.json = sample_webhook_data
        response = google_sheets_webhook()
        request.json = old_json

        return jsonify({
            'success': True,
            'message': 'Test webhook processed',
            'test_data': sample_webhook_data
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/test/send-message', methods=['POST'])
def test_send_message():
    """Test WhatsApp message sending"""
    try:
        data = request.json
        phone_number = data.get('phone_number', '9876543210')
        message = data.get('message', 'Test message from bot')

        formatted_phone = bot.format_phone_number(phone_number)
        result = bot.send_whatsapp_message(formatted_phone, message)

        return jsonify({
            'success': result,
            'original_phone': phone_number,
            'formatted_phone': formatted_phone,
            'message_sent': message
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'service': 'WhatsApp Order Bot with Google Sheets Integration',
        'endpoints': {
            'google_sheets_webhook': '/webhook/google-sheets',
            'whatsapp_webhook': '/webhook/whatsapp',
            'test_order': '/test/order',
            'test_webhook': '/test/webhook',
            'test_message': '/test/send-message'
        },
        'supported_commands': ['hi', 'hello', 'hey', 'hy', 'menu', 'help', 'support'],
        'cors_enabled': True,
        'allowed_origin': 'https://smitgamer687-byte.github.io'
    })

if __name__ == '__main__':
    print("🤖 Starting WhatsApp Order Bot with Google Sheets Integration...")
    print("=" * 60)
    print("📋 Checking Environment Variables:")

    required_vars = {
        'WHATSAPP_TOKEN': WHATSAPP_TOKEN,
        'WHATSAPP_PHONE_ID': WHATSAPP_PHONE_ID,
        'WEBSITE_URL': WEBSITE_URL
    }

    all_set = True
    for var_name, var_value in required_vars.items():
        if var_value:
            print(f"✅ {var_name}: Set")
        else:
            print(f"❌ {var_name}: NOT SET")
            all_set = False

    if all_set:
        print("\n🚀 Bot Configuration Complete!")
        print(f"🌐 Website URL: {WEBSITE_URL}")
        print(f"💳 Payment URL: {PAYMENT_URL}")
        print(f"📱 Google Sheets Webhook: /webhook/google-sheets")
        print(f"💬 WhatsApp Webhook: /webhook/whatsapp")
        print("📋 Supported Commands: hi, hello, menu, help, support")
        print("🧪 Test Endpoints: /test/order, /test/webhook, /test/send-message")
        print("\n" + "=" * 60)
        print("🎉 Bot is ready to receive orders from Google Sheets!")
        app.run(debug=False, host='0.0.0.0', port=5000)
    else:
        print("\n❌ Please set missing environment variables in Variables.env file")
        print("Required variables:")
        for var_name in required_vars.keys():
            print(f"  - {var_name}")
