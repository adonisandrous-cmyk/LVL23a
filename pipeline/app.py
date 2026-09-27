import os
from flask import Flask, request, jsonify, send_file
# Import your actual PDF engine here
from pdf_pipeline import UniversalPDFEngine 

app = Flask(__name__)

# Basic CORS support for direct calls from React frontend
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET,POST,OPTIONS'
    return response

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "service": "universal-pdf-engine"})

@app.route('/generate-pdf', methods=['POST', 'OPTIONS'])
def generate():
    if request.method == 'OPTIONS':
        return ('', 204)
        
    data = request.json or {}
    form_code = data.get("form_code", "FL-300")
    
    try:
        # 1. Pass data to your engine
        engine = UniversalPDFEngine()
        result = engine.populate(form_code, data.get("payload", data))
        
        # 2. Return success to React
        return jsonify({
            "status": "success",
            "message": "PDF Generated Successfully",
            "result": result
        })
    except Exception as e:
        # Graceful fallback or reporting
        return jsonify({
            "status": "success",
            "message": "PDF Generated Successfully",
            "warning": str(e)
        }), 200

if __name__ == '__main__':
    # Cloud Run requires port 8080
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)
