from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv
import openai
import time
from datetime import datetime, timedelta

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
             "origins": ["http://localhost:3000"],
             "methods": ["GET", "OPTIONS"],
             "allow_headers": ["Content-Type", "Accept"],
             "max_age": 3600
         }
     })


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
            dbname=os.getenv('DB_NAME', 'pantryDatabase'),
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

if __name__ == '__main__':
    # Run on port 5001 to avoid conflicts
    app.run(debug=True, port=5001)
