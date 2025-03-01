from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv
import openai

load_dotenv()

app = Flask(__name__)

# Configure OpenAI
openai.api_key = os.getenv('OPENAI_API_KEY')

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
        conn = get_db_connection()
        if not conn:
            return False, "Database connection failed"
        
        # Map the category with enhanced food categorization
        raw_category = product_data.get('category', '')
        mapped_category = map_category(raw_category, product_data)
        
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
            product_data['upc'],
            product_data.get('title', ''),
            product_data.get('description', '')[:515],
            product_data.get('brand', ''),
            mapped_category,
            product_data.get('lowest_recorded_price', 0.0),
            product_data.get('highest_recorded_price', 0.0),
            product_data.get('currency', 'USD'),
            product_data.get('images', []),
            product_data.get('model', ''),
            product_data.get('color', ''),
            product_data.get('size', ''),
            product_data.get('dimension', ''),
            product_data.get('weight', '')
        ))
        conn.commit()
        cur.close()
        conn.close()
        return True, None
    except Exception as e:
        print(f"Failed to cache product: {str(e)}")
        return False, str(e)

@app.route('/api/lookup-upc', methods=['GET'])
def lookup_upc():
    """
    Master route to handle backend of product search.
    First checks local database, then falls back to API if needed.
    
    Standard Response Format:
    {
        "success": boolean,
        "source": "database" | "api" | null,
        "cached": boolean,
        "items": array | null,
        "error": string | null,
        "status": string | null,
        "details": string | null
    }
    """
    try:
        upc = request.args.get('upc')
        
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

        # First, check our database
        product, db_error = find_product_in_db(upc)
        
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
            return jsonify({
                "success": True,
                "source": "database",
                "cached": True,
                "items": [product],
                "error": None,
                "status": None,
                "details": None
            })

        # If not in database, try the API
        url = 'https://api.upcitemdb.com/prod/trial/lookup'
        print(f"Hitting API for UPC: {upc}")
        response = requests.get(
            url,
            params={'upc': upc},
            headers={
                'User-Agent': 'Mozilla/5.0',
                'Accept': 'application/json'
            }
        )
        
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
        
        # If API found the product, save it to our database
        if api_data.get('items'):
            product_data = api_data['items'][0]
            success, save_error = save_product_to_db(product_data)
            
            if not success:
                print(f"Failed to cache product: {save_error}")
                return jsonify({
                    "success": True,
                    "source": "api",
                    "cached": False,
                    "items": api_data['items'],
                    "error": None,
                    "status": None,
                    "details": f"Failed to cache: {save_error}"
                })

            return jsonify({
                "success": True,
                "source": "api",
                "cached": True,
                "items": api_data['items'],
                "error": None,
                "status": None,
                "details": None
            })
        
        # If API didn't find the product
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
