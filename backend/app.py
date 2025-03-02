from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv
import openai
import bcrypt
import jwt as pyjwt
from datetime import datetime, timedelta
from functools import wraps
import time

load_dotenv()

app = Flask(__name__)

# Configure OpenAI and Go-UPC API keys
openai.api_key = os.getenv('OPENAI_API_KEY')
GOUPC_API_KEY = os.getenv('GOUPC_API_KEY')

# Rate limiting configuration for Go-UPC API (2 requests per second)
RATE_LIMIT_REQUESTS = 1  # requests per second
RATE_LIMIT_WINDOW = 1  # second
last_request_time = None
request_count = 0

# JWT Secret Key
JWT_SECRET = os.getenv('JWT_SECRET', 'your-secret-key')
JWT_EXPIRATION_HOURS = 24

# Predefined food categories
FOOD_CATEGORIES = [
    "Fruits & Vegetables",
    "Meat & Seafood",
    "Dairy & Eggs",
    "Bread & Bakery",
    "Pantry Staples",
    "Snacks",
    "Beverages",
    "Frozen Foods",
    "Canned Goods",
    "Condiments & Sauces",
    "Baking Supplies",
    "Breakfast Foods",
    "Pasta & Rice",
    "Herbs & Spices",
    "Ready-to-Eat Meals",
    "Baby Food & Formula",
    "Pet Food",
    "Other"
]

# Enable CORS for all routes with specific configuration
CORS(app, 
     resources={
         r"/*": {
             "origins": ["*"],
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
             "allow_headers": ["Content-Type", "Accept", "Authorization"],
             "max_age": 3600
         }
     })

# Authentication decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            
        if not token:
            return jsonify({
                'success': False,
                'error': 'Authentication token is missing',
                'status': 'AUTH_ERROR'
            }), 401
            
        try:
            data = pyjwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            current_user_id = data['user_id']
            
            # Verify user exists in database
            conn = get_db_connection()
            if not conn:
                return jsonify({
                    'success': False,
                    'error': 'Database connection failed',
                    'status': 'DB_ERROR'
                }), 503
            
            cur = conn.cursor()
            cur.execute("SELECT * FROM users WHERE userID = %s", (current_user_id,))
            user = cur.fetchone()
            cur.close()
            conn.close()
            
            if not user:
                return jsonify({
                    'success': False,
                    'error': 'User not found',
                    'status': 'AUTH_ERROR'
                }), 401
                
        except pyjwt.ExpiredSignatureError:
            return jsonify({
                'success': False,
                'error': 'Authentication token has expired',
                'status': 'AUTH_ERROR'
            }), 401
        except pyjwt.InvalidTokenError:
            return jsonify({
                'success': False,
                'error': 'Invalid authentication token',
                'status': 'AUTH_ERROR'
            }), 401
            
        return f(current_user_id, *args, **kwargs)
    
    return decorated

def get_days_to_expire(product_data):
    """Get the days to expire for a product
    call openai to get the days to expire for a product"""
    try:
        prompt = f"""You are a food expiration expert. Your task is to analyze product information and output ONLY a number representing days until expiry, or "n/a" for non-perishable items.
        Rules:
        1. Output ONLY a number (no text, units, or explanation) representing days until expiry
        2. Output ONLY "n/a" for non-perishable items or items with 2+ year shelf life
        3. If uncertain, use conservative estimates based on product category
        4. Consider these general guidelines:
        - Fresh produce: 3-14 days
        - Dairy: 7-21 days
        - Fresh meat: 3-7 days
        - Bread: 5-7 days
        - Ready meals: 3-5 days
        - Frozen foods: 180 days

        Product to analyze:
        {product_data}

        Remember: Output ONLY a number or "n/a". No other text."""

        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a precise food expiration expert, creating data for analysis. You only respond with numbers or 'n/a'."},
                {"role": "user", "content": prompt}
            ],
            temperature=0,
            max_tokens=10
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error getting days to expire: {e}")
        return "n/a"  # Fail safe default

def get_db_connection():
    try:
        conn = psycopg2.connect(
            dbname=os.getenv('DB_NAME', 'pantrydatabase'),
            user=os.getenv('DB_USER', 'postgres'),
            password=os.getenv('DB_PASSWORD', 'postgres'),
            host=os.getenv('DB_HOST', 'localhost'),
            port=os.getenv('DB_PORT', '5432')
        )
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        return None

def find_product_in_db(upc):
    """Check if product exists in database"""
    try:
        conn = get_db_connection()
        if not conn:
            return None, "Database connection failed"
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT * FROM products WHERE productUPC = %s", (upc,))
        product = cur.fetchone()
        cur.close()
        conn.close()
        return product, None
    except Exception as e:
        return None, str(e)

def get_gpt_category(product_data):
    """Use GPT to categorize a food product based on available information"""
    try:
        # Construct a detailed prompt with product information
        product_info = f"""
Product Name: {product_data.get('title', '')}
Brand: {product_data.get('brand', '')}
Description: {product_data.get('description', '')}
"""
        
        prompt = f"""Based on the following product information, categorize this food item into EXACTLY ONE of these categories: {', '.join(FOOD_CATEGORIES)}. 
Respond with ONLY the category name, nothing else.

Product Information:
{product_info}

Remember:
1. Respond with EXACTLY ONE category from the list
2. Do not add any explanation or additional text
3. If unsure, use the most specific category that fits, or 'Other' as last resort"""

        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a precise food categorization assistant. You only respond with exact category names from the provided list."},
                {"role": "user", "content": prompt}
            ],
            temperature=0,
            max_tokens=20
        )
        
        category = response.choices[0].message.content.strip()
        
        # Validate the response is in our category list
        if category not in FOOD_CATEGORIES:
            return "Other"
            
        return category
    except Exception as e:
        print(f"GPT categorization error: {e}")
        return "Other"

def map_category(category, product_data):
    """Map API category to our enum values with GPT enhancement for food items"""
    category = category.lower()
    return get_gpt_category(product_data)

def save_product_to_db(product_data):
    """Save product to database"""
    try:
        print(f"Attempting to save product data: {product_data}")  # Debug log
        conn = get_db_connection()
        if not conn:
            return False, "Database connection failed"
        
        # Map the category with enhanced food categorization
        raw_category = product_data.get('category', '')
        mapped_category = map_category(raw_category, product_data)
        
        # Extract values with detailed logging
        upc = product_data.get('upc', '')
        title = product_data.get('title', '')
        description = product_data.get('description', '')[:515] if product_data.get('description') else ''
        brand = product_data.get('brand', '')
        lowest_price = float(product_data.get('lowest_recorded_price', 0.0))
        highest_price = float(product_data.get('highest_recorded_price', 0.0))
        currency = product_data.get('currency', 'USD')
        images = product_data.get('images', [])
        model = product_data.get('model', '')
        color = product_data.get('color', '')
        size = product_data.get('size', '')
        dimension = product_data.get('dimension', '')
        weight = product_data.get('weight', '')

        print(f"Processed values for DB insert:")  # Debug log
        print(f"UPC: {upc}")
        print(f"Title: {title}")
        print(f"Brand: {brand}")
        print(f"Category: {mapped_category}")
        
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO products (
                productUPC, productName, productDescription, productBrand,
                productCategory, productLowestPrice, productHighestPrice,
                productCurrency, productImages, productModel, productColor,
                productSize, productDimension, productWeight
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (productUPC) DO UPDATE SET
                productName = EXCLUDED.productName,
                productDescription = EXCLUDED.productDescription,
                productBrand = EXCLUDED.productBrand,
                productCategory = EXCLUDED.productCategory,
                productLowestPrice = EXCLUDED.productLowestPrice,
                productHighestPrice = EXCLUDED.productHighestPrice,
                productCurrency = EXCLUDED.productCurrency,
                productImages = EXCLUDED.productImages,
                productModel = EXCLUDED.productModel,
                productColor = EXCLUDED.productColor,
                productSize = EXCLUDED.productSize,
                productDimension = EXCLUDED.productDimension,
                productWeight = EXCLUDED.productWeight
        """, (
            upc,
            title,
            description,
            brand,
            mapped_category,
            lowest_price,
            highest_price,
            currency,
            images,
            model,
            color,
            size,
            dimension,
            weight
        ))
        conn.commit()
        cur.close()
        conn.close()
        return True, None
    except Exception as e:
        print(f"Failed to cache product: {str(e)}")
        print(f"Full product data that caused error: {product_data}")  # Debug log
        return False, str(e)

def call_upc_api(upc):
    """Call the Go-UPC API with rate limiting"""
    global last_request_time, request_count
    
    if not GOUPC_API_KEY:
        print("Error: GOUPC_API_KEY not found in environment variables")
        return None
    
    current_time = time.time()
    
    # Reset counter if window has passed
    if last_request_time and current_time - last_request_time > RATE_LIMIT_WINDOW:
        request_count = 0
    
    # Check if we're at the rate limit
    if request_count >= RATE_LIMIT_REQUESTS:
        wait_time = RATE_LIMIT_WINDOW - (current_time - last_request_time)
        if wait_time > 0:
            time.sleep(wait_time)
            request_count = 0
    
    # Make the API call - try both authentication methods
    base_url = 'https://go-upc.com/api/v1/code'
    
    # First try with query parameter
    try:
        url = f'{base_url}/{upc}?key={GOUPC_API_KEY}'
        print(f"Attempting API call to: {url}")  # Debug log
        
        response = requests.get(
            url,
            headers={
                'Accept': 'application/json'
            },
            timeout=10
        )
        
        # Update rate limit tracking
        last_request_time = time.time()
        request_count += 1
        
        # Log the response for debugging
        print(f"API Response Status: {response.status_code}")
        if response.status_code != 200:
            print(f"API Error Response: {response.text}")
        
        if response.status_code == 429:
            # If rate limited, wait and retry once
            time.sleep(RATE_LIMIT_WINDOW)
            
            # Retry the request
            response = requests.get(
                url,
                headers={
                    'Accept': 'application/json'
                },
                timeout=10
            )
            print(f"Retry Response Status: {response.status_code}")
        
        return response
        
    except requests.exceptions.RequestException as e:
        print(f"API request error with query parameter method: {e}")
        
        # Try with Bearer token as fallback
        try:
            url = f'{base_url}/{upc}'
            print(f"Attempting API call with Bearer token to: {url}")  # Debug log
            
            response = requests.get(
                url,
                headers={
                    'Authorization': f'Bearer {GOUPC_API_KEY}',
                    'Accept': 'application/json'
                },
                timeout=10
            )
            
            # Log the response for debugging
            print(f"Bearer token API Response Status: {response.status_code}")
            if response.status_code != 200:
                print(f"Bearer token API Error Response: {response.text}")
            
            return response
            
        except requests.exceptions.RequestException as e:
            print(f"API request error with Bearer token method: {e}")
            return None

def validate_upc(upc):
    """Validate UPC format"""
    try:
        # Remove any non-digit characters
        clean_upc = ''.join(filter(str.isdigit, upc))
        # Convert to integer to ensure it's a valid number
        int(clean_upc)
        # Check length (UPC-A is 12 digits, UPC-E is 8 digits)
        if len(clean_upc) not in [8, 12]:
            return False, "Invalid UPC length. Must be 8 or 12 digits."
        return True, clean_upc
    except (ValueError, TypeError):
        return False, "Invalid UPC format. Must contain only digits."

@app.route('/api/lookup-upc', methods=['GET'])
def lookup_upc():
    try:
        upc = request.args.get('upc')
        print(f"\nProcessing UPC lookup request for: {upc}")  # Debug log
        
        if not upc:
            return jsonify({
                "success": False,
                "source": None,
                "cached": False,
                "items": None,
                "error": "UPC is required",
                "status": "VALIDATION_ERROR",
                "details": None
            }), 400

        # Validate UPC format
        is_valid, result = validate_upc(upc)
        print(f"UPC validation result: valid={is_valid}, result={result}")  # Debug log
        
        if not is_valid:
            return jsonify({
                "success": False,
                "source": None,
                "cached": False,
                "items": None,
                "error": "Invalid UPC format",
                "status": "VALIDATION_ERROR",
                "details": result
            }), 400

        # Use the cleaned UPC for all operations
        upc = result

        # First, check our database
        product, db_error = find_product_in_db(upc)
        print(f"Database lookup result: found={bool(product)}, error={db_error}")  # Debug log
        
        if db_error:
            return jsonify({
                "success": False,
                "source": None,
                "cached": False,
                "items": None,
                "error": "Database error",
                "status": "DB_ERROR",
                "details": db_error
            }), 503

        if product:
            # Normalize the data structure
            normalized_product = {
                "title": product["productname"],
                "brand": product["productbrand"],
                "category": product["productcategory"],
                "description": product["productdescription"],
                "lowest_recorded_price": product["productlowestprice"],
                "highest_recorded_price": product["producthighestprice"],
                "currency": product["productcurrency"],
                "images": product["productimages"],
                "model": product["productmodel"],
                "color": product["productcolor"],
                "size": product["productsize"],
                "dimension": product["productdimension"],
                "weight": product["productweight"],
                "upc": product["productupc"]
            }

            # Enrich the data with GPT category and days to expire
            gptCategory = get_gpt_category(normalized_product)
            daysToExpire = get_days_to_expire(normalized_product)
            currentDate = datetime.now().strftime("%Y-%m-%d")
            
            if daysToExpire == "n/a":
                expiryDate_ = (datetime.strptime(currentDate, "%Y-%m-%d") + timedelta(days=730)).strftime("%Y-%m-%d")
            else:
                expiryDate_ = (datetime.strptime(currentDate, "%Y-%m-%d") + timedelta(days=int(daysToExpire))).strftime("%Y-%m-%d")
            
            normalized_product["category"] = gptCategory
            normalized_product["expiryDate"] = expiryDate_
            normalized_product["purchaseDate"] = currentDate

            return jsonify({
                "success": True,
                "source": "database",
                "cached": True,
                "items": [normalized_product],
                "error": None,
                "status": None,
                "details": None
            })

        # If not in database, try the API
        print(f"Hitting API for UPC: {upc}")
        response = call_upc_api(upc)
        
        if not response:
            return jsonify({
                "success": False,
                "source": "api",
                "cached": False,
                "items": None,
                "error": "API request failed",
                "status": "API_ERROR",
                "details": "Failed to connect to UPC API"
            }), 503
            
        if response.status_code != 200:
            return jsonify({
                "success": False,
                "source": "api",
                "cached": False,
                "items": None,
                "error": "UPC lookup failed",
                "status": "API_ERROR",
                "details": f"API returned status code: {response.status_code}"
            }), response.status_code

        api_data = response.json()
        print(f"API Response data: {api_data}")  # Debug log
        
        # If API found the product, save it to our database
        if api_data.get('product'):
            gptCategory = get_gpt_category(api_data['product'])
            currentDate = datetime.now().strftime("%Y-%m-%d")
            daysToExpire = get_days_to_expire(api_data['product'])
            
            # Handle non-perishable items
            if daysToExpire == "n/a":
                # Set expiry date to 2 years from now for non-perishable items
                expiryDate_ = (datetime.strptime(currentDate, "%Y-%m-%d") + timedelta(days=730)).strftime("%Y-%m-%d")
            else:
                expiryDate_ = (datetime.strptime(currentDate, "%Y-%m-%d") + timedelta(days=int(daysToExpire))).strftime("%Y-%m-%d")
            
            # Transform Go-UPC response format to our format
            product_data = {
                'upc': api_data.get('code'),
                'title': api_data['product'].get('name'),
                'brand': api_data['product'].get('brand'),
                'category': gptCategory,
                'description': api_data['product'].get('description'),
                'images': [api_data['product'].get('imageUrl')] if api_data['product'].get('imageUrl') else [],
                'model': '',  # Not provided by Go-UPC
                'color': next((spec[1] for spec in api_data['product'].get('specs', []) if spec[0] == 'Color'), ''),
                'size': next((spec[1] for spec in api_data['product'].get('specs', []) if spec[0] == 'Size'), ''),
                'dimension': next((f"{spec[1]}" for spec in api_data['product'].get('specs', []) if any(dim in spec[0].lower() for dim in ['height', 'width', 'length'])), ''),
                'weight': next((spec[1] for spec in api_data['product'].get('specs', []) if 'weight' in spec[0].lower()), ''),
                'lowest_recorded_price': 0.0,  # Not provided by Go-UPC
                'highest_recorded_price': 0.0,  # Not provided by Go-UPC
                'currency': 'USD',  # Default currency
                'purchaseDate': currentDate,
                'expiryDate': expiryDate_,
            }
            
            print(f"Transformed product data: {product_data}")  # Debug log
            success, save_error = save_product_to_db(product_data)
            
            if not success:
                print(f"Failed to cache product: {save_error}")
                return jsonify({
                    "success": True,
                    "source": "api",
                    "cached": False,
                    "items": [product_data],
                    "error": None,
                    "status": None,
                    "details": f"Failed to cache: {save_error}"
                })

            return jsonify({
                "success": True,
                "source": "api",
                "cached": True,
                "items": [product_data],
                "error": None,
                "status": None,
                "details": None
            })
        
        # If API didn't find the product
        print("API found no items for this UPC")  # Debug log
        return jsonify({
            "success": False,
            "source": "api",
            "cached": False,
            "items": None,
            "error": "Product not found",
            "status": "NOT_FOUND",
            "details": None
        }), 404
    
    except Exception as e:
        print(f"Server error in lookup_upc: {str(e)}")  # Add logging
        print(f"Full error details: ", e.__dict__)  # More detailed error info
        return jsonify({
            "success": False,
            "source": None,
            "cached": False,
            "items": None,
            "error": "Server error",
            "status": "SERVER_ERROR",
            "details": str(e)
        }), 500
    
from datetime import datetime

@app.route('/api/get-recipes', methods=['POST'])
def get_recipes():
    """
    Gets recipe recommendations based on user's pantry items.
    Pantry items are provided in the request body.
    """
    try:
        # Get user ID from request (optional, depending on your use case)
        user_id = request.args.get('user_id')
        
        # Get pantry items from the request body
        request_data = request.get_json()
        if not request_data or 'pantryItems' not in request_data:
            return jsonify({
                "success": False,
                "error": "Pantry items are required in the request body",
                "status": "VALIDATION_ERROR",
            }), 400

        pantry_items = request_data['pantryItems']
        
        if not pantry_items:
            return jsonify({
                "success": False,
                "error": "No pantry items provided",
                "status": "NOT_FOUND",
            }), 404
            
        # Sort pantry items by expiration date (earliest first)
        pantry_items.sort(key=lambda x: datetime.strptime(x.get('expirationDate', '9999-12-31'), '%Y-%m-%d'))

        # Format pantry items for the prompt
        pantry_list = ""
        for item in pantry_items:
            quantity_str = f"{item.get('quantity', 'some')} {item.get('quantityType', '')}".strip()
            expiration_date = item.get('expirationDate', 'unknown')
            pantry_list += f"- {quantity_str} {item.get('productName', 'Unknown')} (Category: {item.get('productCategory', 'Unknown')}, Expires: {expiration_date})\n"
            
        # Generate recipes using GPT
        prompt = f"""Based on these ingredients in my pantry, suggest 4 different recipes I could make. 
The first two recipes should prioritize recipes that use ingredients with the earliest expiration dates, while maintaining recipe quality. The other two, dont need to prioritize expiration date.

Here are my pantry items, sorted by expiration date (earliest first):
{pantry_list}

For each recipe, provide the following information in EXACTLY this format:

1. Recipe name: [Name of the recipe]
2. Brief description: [A short description of the recipe]
3. Ingredients: [List of ingredients with amounts]
4. Instructions: [Step-by-step instructions]
5. Cooking time: [Approximate cooking time]
6. Urgency: [Either "Urgent" or "Not Urgent"]

Here is an example of the expected format:

1. Recipe name: Cheese and Tomato Omelette
2. Brief description: A quick and easy omelette using cheese and tomatoes.
3. Ingredients: 
   - 2 eggs
   - 1/2 cup shredded cheese
   - 1 tomato, diced
4. Instructions:
   - Beat the eggs in a bowl.
   - Heat a non-stick pan over medium heat.
   - Pour the eggs into the pan and cook until set.
   - Add the cheese and tomatoes, then fold the omelette in half.
5. Cooking time: 10 minutes
6. Urgency: Urgent

Now, suggest 4 recipes following the exact format above.

Format each recipe as a distinct section, with the urgent recipes coming first. If you need common pantry staples not listed (salt, pepper, oil, etc.), you can assume I have those. This doesn't include items like sugar, flour 
"""

        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful cooking assistant that creates recipes based on available ingredients. Prioritize recipes that use ingredients with the earliest expiration dates. You must follow the exact format provided by the user."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1500
        )
        
        recipe_text = response.choices[0].message.content.strip()
        
        # Parse the recipe text into structured data using GPT
        parser_prompt = f"""Parse the following recipe text into a structured JSON format with an array of recipe objects.
Each recipe object should have fields for: name, description, ingredients (as an array), instructions (as an array of steps), cookingTime, and mealType.

Recipe text:
{recipe_text}

Respond with ONLY valid JSON, no explanation or additional text.
"""

        parser_response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a precise JSON parser that converts recipe text to structured data."},
                {"role": "user", "content": parser_prompt}
            ],
            temperature=0,
            response_format={"type": "json_object"},
            max_tokens=1500
        )
        
        parsed_recipes = parser_response.choices[0].message.content.strip()
        
        return jsonify({
            "success": True,
            "recipes": parsed_recipes,
            "pantryItems": pantry_items
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": "Server error",
            "status": "SERVER_ERROR",
            "details": str(e)
        }), 500

# User Authentication Endpoints
@app.route('/api/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        print("Received data:", data)
        
        # Validate required fields
        required_fields = ['userFirstName', 'userLastName', 'username', 'email', 'password']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({
                    'success': False,
                    'error': f'{field} is required',
                    'status': 'VALIDATION_ERROR'
                }), 400
        
        userFirstName = data['userFirstName']
        userLastName = data['userLastName']
        username = data['username']
        email = data['email']
        password = data['password']
        
        # Check if user already exists
        conn = get_db_connection()
        if not conn:
            return jsonify({
                'success': False,
                'error': 'Database connection failed',
                'status': 'DB_ERROR'
            }), 503
        
        cur = conn.cursor()
        cur.execute("SELECT * FROM users WHERE email = %s OR username = %s", (email, username))
        existing_user = cur.fetchone()
        
        if existing_user:
            cur.close()
            conn.close()
            return jsonify({
                'success': False,
                'error': 'User with this email or username already exists',
                'status': 'DUPLICATE_USER'
            }), 409
        
        # Hash the password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Insert new user - FIX: Correct column order to match table definition
        cur.execute(
            "INSERT INTO users (userLastName, userFirstName, username, email, password_hash) VALUES (%s, %s, %s, %s, %s) RETURNING userID",
            (userLastName, userFirstName, username, email, hashed_password)
        )
        user_id = cur.fetchone()[0]
        conn.commit()
        
        # Generate JWT token
        token = pyjwt.encode({
            'user_id': user_id,
            'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
        }, JWT_SECRET, algorithm="HS256")
        
        cur.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'userID': user_id,
            'token': token,
            'username': username
        })
        
    except Exception as e:
        print(f"Signup error: {str(e)}")  # Add detailed logging
        return jsonify({
            'success': False,
            'error': 'Server error',
            'status': 'SERVER_ERROR',
            'details': str(e)
        }), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or 'username' not in data or 'password' not in data:
            return jsonify({
                'success': False,
                'error': 'Email and password are required',
                'status': 'VALIDATION_ERROR'
            }), 400
        
        username = data['username']
        password = data['password']
        
        # Get user from database
        conn = get_db_connection()
        if not conn:
            return jsonify({
                'success': False,
                'error': 'Database connection failed',
                'status': 'DB_ERROR'
            }), 503
        
        cur = conn.cursor()
        cur.execute("SELECT userID, username, password_hash FROM users WHERE username = %s", (username,))
        user = cur.fetchone()
        
        # Check if user exists and password is correct
        if not user or not bcrypt.checkpw(password.encode('utf-8'), user[2].encode('utf-8')):
            cur.close()
            conn.close()
            return jsonify({
                'success': False,
                'error': 'Invalid username or password',
                'status': 'INVALID_CREDENTIALS'
            }), 401
        
        user_id = user[0]
        username = user[1]
        
        # Generate JWT token - FIX: Use pyjwt instead of jwt
        token = pyjwt.encode({
            'user_id': user_id,
            'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
        }, JWT_SECRET, algorithm="HS256")
        
        cur.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'userID': user_id,
            'token': token,
            'username': username
        })
        
    except Exception as e:
        print(f"Login error: {str(e)}")  # Add detailed logging
        import traceback
        traceback.print_exc()  # Print the full stack trace
        return jsonify({
            'success': False,
            'error': 'Server error',
            'status': 'SERVER_ERROR',
            'details': str(e)
        }), 500

# Product Management Endpoints
@app.route('/api/products', methods=['POST'])
@token_required
def add_product(current_user_id):
    try:
        data = request.get_json()
        
        # Validate required fields
        if 'productUPC' not in data or not data['productUPC']:
            return jsonify({
                'success': False,
                'error': 'Product UPC is required',
                'status': 'VALIDATION_ERROR'
            }), 400
            
        if 'productName' not in data or not data['productName']:
            return jsonify({
                'success': False,
                'error': 'Product name is required',
                'status': 'VALIDATION_ERROR'
            }), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({
                'success': False,
                'error': 'Database connection failed',
                'status': 'DB_ERROR'
            }), 503
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Check if product already exists
        cur.execute("SELECT * FROM products WHERE productUPC = %s", (data['productUPC'],))
        existing_product = cur.fetchone()
        
        if existing_product:
            # Update existing product
            update_fields = []
            update_values = []
            
            # Build dynamic update query based on provided fields
            for key, value in data.items():
                if key != 'productUPC':  # Skip the UPC as it's the identifier
                    update_fields.append(f"{key} = %s")
                    update_values.append(value)
            
            update_values.append(data['productUPC'])  # Add UPC for WHERE clause
            
            update_query = f"""
                UPDATE products 
                SET {', '.join(update_fields)}
                WHERE productUPC = %s
                RETURNING *
            """
            
            cur.execute(update_query, update_values)
            
        else:
            # Insert new product
            fields = []
            placeholders = []
            values = []
            
            for key, value in data.items():
                fields.append(key)
                placeholders.append("%s")
                values.append(value)
            
            insert_query = f"""
                INSERT INTO products ({', '.join(fields)})
                VALUES ({', '.join(placeholders)})
                RETURNING *
            """
            
            cur.execute(insert_query, values)
        
        product = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'product': product
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Server error',
            'status': 'SERVER_ERROR',
            'details': str(e)
        }), 500


@app.route('/api/products/<int:product_upc>', methods=['GET'])
@token_required
def get_product_by_upc(current_user_id, product_upc):
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({
                'success': False,
                'error': 'Database connection failed',
                'status': 'DB_ERROR'
            }), 503
        
        cur = conn.cursor()
        
        # Query to get product by UPC
        cur.execute("""
            SELECT 
                productUPC, 
                productName, 
                productDescription, 
                productBrand, 
                productModel, 
                productColor, 
                productSize, 
                productDimension, 
                productWeight, 
                productCategory, 
                productLowestPrice, 
                productHighestPrice, 
                productCurrency, 
                productImages
            FROM products 
            WHERE productUPC = %s
        """, (product_upc,))
        
        product = cur.fetchone()
        
        if not product:
            cur.close()
            conn.close()
            return jsonify({
                'success': False,
                'error': 'Product not found',
                'status': 'NOT_FOUND'
            }), 404
        
        # Format product data
        product_data = {
            'productUPC': product[0],
            'productName': product[1],
            'productDescription': product[2],
            'productBrand': product[3],
            'productModel': product[4],
            'productColor': product[5],
            'productSize': product[6],
            'productDimension': product[7],
            'productWeight': product[8],
            'productCategory': product[9],
            'productLowestPrice': float(product[10]) if product[10] is not None else None,
            'productHighestPrice': float(product[11]) if product[11] is not None else None,
            'productCurrency': product[12],
            'productImages': product[13] if product[13] else []
        }
        
        cur.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'product': product_data
        })
        
    except Exception as e:
        print(f"Error getting product by UPC: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Server error',
            'status': 'SERVER_ERROR',
            'details': str(e)
        }), 500
# User Products Endpoints
@app.route('/api/pantry', methods=['POST'])
@token_required
def add_to_pantry(current_user_id):
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['productUPC', 'quantity']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'{field} is required',
                    'status': 'VALIDATION_ERROR'
                }), 400
        
        # Convert productUPC to string to handle large numbers properly
        product_upc = str(data['productUPC'])
        quantity = data['quantity']
        quantity_type = data.get('quantityType', 'items')  # Default to 'items' if not provided
        date_purchased = data.get('date_purchased')
        expiration_date = data.get('expiration_date')
        
        # Connect to database
        conn = get_db_connection()
        if not conn:
            return jsonify({
                'success': False,
                'error': 'Database connection failed',
                'status': 'DB_ERROR'
            }), 503
        
        cur = conn.cursor()
        
        # First, check if the product exists
        cur.execute("SELECT productUPC FROM products WHERE productUPC = %s", (product_upc,))
        product = cur.fetchone()
        
        if not product:
            cur.close()
            conn.close()
            return jsonify({
                'success': False,
                'error': 'Product not found',
                'status': 'NOT_FOUND'
            }), 404
        
        # Insert into usersProducts (not pantry)
        cur.execute("""
            INSERT INTO usersProducts 
            (userID, productUPC, quantity, quantityType, date_purchased, expiration_date) 
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING pantryID
        """, (current_user_id, product_upc, quantity, quantity_type, date_purchased, expiration_date))
        
        # Get the newly created pantry item ID
        new_pantry_id = cur.fetchone()[0]
        conn.commit()
        
        # Get the complete pantry item details
        cur.execute("""
            SELECT 
                up.pantryID, 
                up.userID, 
                up.productUPC, 
                up.quantity, 
                up.quantityType, 
                up.date_purchased, 
                up.expiration_date,
                p.productName,
                p.productBrand
            FROM usersProducts up
            JOIN products p ON up.productUPC = p.productUPC
            WHERE up.pantryID = %s
        """, (new_pantry_id,))
        
        pantry_item = cur.fetchone()
        cur.close()
        conn.close()
        
        if not pantry_item:
            return jsonify({
                'success': False,
                'error': 'Failed to retrieve added pantry item',
                'status': 'SERVER_ERROR'
            }), 500
        
        # Format the response
        pantry_data = {
            'pantryID': pantry_item[0],
            'userID': pantry_item[1],
            'productUPC': pantry_item[2],
            'quantity': pantry_item[3],
            'quantityType': pantry_item[4],
            'date_purchased': pantry_item[5].isoformat() if pantry_item[5] else None,
            'expiration_date': pantry_item[6].isoformat() if pantry_item[6] else None,
            'productName': pantry_item[7],
            'productBrand': pantry_item[8]
        }
        
        return jsonify({
            'success': True,
            'message': 'Product added to pantry successfully',
            'pantryItem': pantry_data
        })
        
    except Exception as e:
        print(f"Error adding to pantry: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': 'Server error',
            'status': 'SERVER_ERROR',
            'details': str(e)
        }), 500

@app.route('/api/pantry/<int:pantry_id>', methods=['PUT'])
@token_required
def update_pantry_item(current_user_id, pantry_id):
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No update data provided',
                'status': 'VALIDATION_ERROR'
            }), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({
                'success': False,
                'error': 'Database connection failed',
                'status': 'DB_ERROR'
            }), 503
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Verify pantry item exists and belongs to user
        cur.execute(
            "SELECT * FROM usersProducts WHERE pantryID = %s AND userID = %s",
            (pantry_id, current_user_id)
        )
        pantry_item = cur.fetchone()
        
        if not pantry_item:
            cur.close()
            conn.close()
            return jsonify({
                'success': False,
                'error': 'Pantry item not found or does not belong to user',
                'status': 'NOT_FOUND'
            }), 404
        
        # Build update query
        update_fields = []
        update_values = []
        
        for key, value in data.items():
            if key in ['quantity', 'quantityType', 'expiration_date', 'date_purchased']:
                update_fields.append(f"{key} = %s")
                update_values.append(value)
        
        if not update_fields:
            cur.close()
            conn.close()
            return jsonify({
                'success': False,
                'error': 'No valid fields to update',
                'status': 'VALIDATION_ERROR'
            }), 400
        
        # Add pantry_id for WHERE clause
        update_values.append(pantry_id)
        
        update_query = f"""
            UPDATE usersProducts 
            SET {', '.join(update_fields)}
            WHERE pantryID = %s
            RETURNING *
        """
        
        cur.execute(update_query, update_values)
        updated_item = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'pantry_item': updated_item
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Server error',
            'status': 'SERVER_ERROR',
            'details': str(e)
        }), 500

@app.route('/api/pantry/<int:pantry_id>', methods=['DELETE'])
@token_required
def remove_from_pantry(current_user_id, pantry_id):
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({
                'success': False,
                'error': 'Database connection failed',
                'status': 'DB_ERROR'
            }), 503
        
        cur = conn.cursor()
        
        # Verify pantry item exists and belongs to user
        cur.execute(
            "SELECT * FROM usersProducts WHERE pantryID = %s AND userID = %s",
            (pantry_id, current_user_id)
        )
        pantry_item = cur.fetchone()
        
        if not pantry_item:
            cur.close()
            conn.close()
            return jsonify({
                'success': False,
                'error': 'Pantry item not found or does not belong to user',
                'status': 'NOT_FOUND'
            }), 404
        
        # Delete the pantry item
        cur.execute(
            "DELETE FROM usersProducts WHERE pantryID = %s",
            (pantry_id,)
        )
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Item removed from pantry'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Server error',
            'status': 'SERVER_ERROR',
            'details': str(e)
        }), 500

@app.route('/api/pantry', methods=['GET'])
@token_required
def get_user_pantry(current_user_id):
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({
                'success': False,
                'error': 'Database connection failed',
                'status': 'DB_ERROR'
            }), 503
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get all pantry items for the user with product details
        cur.execute("""
            SELECT up.*, p.productName, p.productBrand, p.productCategory, p.productImages
            FROM usersProducts up
            JOIN products p ON up.productUPC = p.productUPC
            WHERE up.userID = %s
            ORDER BY up.date_purchased DESC
        """, (current_user_id,))
        
        pantry_items = cur.fetchall()
        cur.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'pantry_items': pantry_items
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Server error',
            'status': 'SERVER_ERROR',
            'details': str(e)
        }), 500

@app.route('/api/pantry/product/<product_upc>', methods=['GET'])
@token_required
def get_pantry_item_by_upc(current_user_id, product_upc):
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({
                'success': False,
                'error': 'Database connection failed',
                'status': 'DB_ERROR'
            }), 503
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get pantry item for the user with specific UPC
        cur.execute("""
            SELECT up.*, p.productName, p.productBrand, p.productCategory, p.productImages
            FROM usersProducts up
            JOIN products p ON up.productUPC = p.productUPC
            WHERE up.userID = %s AND up.productUPC = %s
        """, (current_user_id, product_upc))
        
        pantry_item = cur.fetchone()
        cur.close()
        conn.close()
        
        if not pantry_item:
            return jsonify({
                'success': False,
                'error': 'Product not found in user pantry',
                'status': 'NOT_FOUND'
            }), 404
        
        return jsonify({
            'success': True,
            'pantry_item': pantry_item
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Server error',
            'status': 'SERVER_ERROR',
            'details': str(e)
        }), 500



if __name__ == '__main__':
    # Run on port 5001 to avoid conflicts
    app.run(debug=True, port=5001)
