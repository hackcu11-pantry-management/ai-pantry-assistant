from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)

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

@app.route('/api/lookup-upc', methods=['GET'])
def lookup_upc():
    try:
        upc = request.args.get('upc')
        
        if not upc:
            return jsonify({'error': 'UPC is required'}), 400

        # Make request to UPC database API
        url = 'https://api.upcitemdb.com/prod/trial/lookup'
        
        response = requests.get(
            url,
            params={'upc': upc},
            headers={
                'User-Agent': 'Mozilla/5.0',
                'Accept': 'application/json'
            }
        )
        
        # Check if the response was successful
        if response.status_code != 200:
            return jsonify({
                'error': f'UPC lookup failed with status code: {response.status_code}'
            }), response.status_code
            
        return jsonify(response.json())
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Run on port 5001 to avoid conflicts
    app.run(debug=True, port=5001)
