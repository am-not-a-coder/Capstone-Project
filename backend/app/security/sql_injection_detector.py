"""
SQL Injection Detection Module
Detects and logs potential SQL injection attempts in user inputs
"""

import re
from functools import wraps
from flask import current_app, request, jsonify
from datetime import datetime

# Common SQL injection patterns
SQL_INJECTION_PATTERNS = [
    r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)",
    r"(--|\#|\/\*|\*\/)",  # SQL comments
    r"(\bOR\b.*=.*|'\s*OR\s*'1'\s*=\s*'1)",  # OR 1=1 patterns
    r"(;.*DROP|;.*DELETE|;.*UPDATE)",  # Command injection
    r"(\bAND\b.*=.*|'\s*AND\s*'1'\s*=\s*'1)",  # AND patterns
    r"(\\x[0-9a-fA-F]{2})",  # Hex encoding
    r"(\bunion\b.*\bselect\b)",  # UNION SELECT
    r"(char\(|concat\(|group_concat\()",  # SQL functions
    r"(benchmark\(|sleep\(|waitfor\s+delay)",  # Time-based injection
    r"(load_file\(|into\s+outfile|into\s+dumpfile)",  # File operations
]

def detect_sql_injection(input_string, field_name="unknown"):
    """
    Detects potential SQL injection patterns in input strings
    
    Args:
        input_string: The user input to check
        field_name: Name of the field being checked (for logging)
        
    Returns:
        dict: {
            'is_suspicious': bool,
            'matched_patterns': list,
            'risk_level': str ('low', 'medium', 'high')
        }
    """
    if not input_string or not isinstance(input_string, str):
        return {
            'is_suspicious': False,
            'matched_patterns': [],
            'risk_level': 'none'
        }
    
    matched_patterns = []
    
    # Check each pattern
    for pattern in SQL_INJECTION_PATTERNS:
        if re.search(pattern, input_string, re.IGNORECASE):
            matched_patterns.append(pattern)
    
    # Determine risk level based on number of matches
    risk_level = 'none'
    if len(matched_patterns) == 1:
        risk_level = 'low'
    elif len(matched_patterns) == 2:
        risk_level = 'medium'
    elif len(matched_patterns) >= 3:
        risk_level = 'high'
    
    is_suspicious = len(matched_patterns) > 0
    
    if is_suspicious:
        current_app.logger.warning(
            f"SQL Injection attempt detected in field '{field_name}': "
            f"{input_string[:100]} | Risk: {risk_level} | Patterns: {len(matched_patterns)}"
        )
    
    return {
        'is_suspicious': is_suspicious,
        'matched_patterns': matched_patterns,
        'risk_level': risk_level
    }

def scan_request_data(data, excluded_fields=None):
    """
    Scans all fields in request data for SQL injection patterns
    
    Args:
        data: Dictionary of request data
        excluded_fields: List of field names to skip (e.g., passwords)
        
    Returns:
        dict: {
            'has_threats': bool,
            'threats': list of detected threats
        }
    """
    if excluded_fields is None:
        excluded_fields = ['password', 'otpcode', 'token']
    
    threats = []
    
    if not isinstance(data, dict):
        return {'has_threats': False, 'threats': []}
    
    for field_name, field_value in data.items():
        # Skip excluded fields
        if field_name in excluded_fields:
            continue
            
        # Only check string values
        if isinstance(field_value, str):
            result = detect_sql_injection(field_value, field_name)
            if result['is_suspicious']:
                threats.append({
                    'field': field_name,
                    'value': field_value[:100],  # Limit length for logging
                    'risk_level': result['risk_level'],
                    'patterns_matched': len(result['matched_patterns'])
                })
    
    return {
        'has_threats': len(threats) > 0,
        'threats': threats
    }

def log_sql_injection_attempt(ip_address, employee_id, endpoint, threat_data):
    """
    Logs a SQL injection attempt with details
    
    Args:
        ip_address: IP address of the attacker
        employee_id: Employee ID (if available)
        endpoint: API endpoint being targeted
        threat_data: Data about the detected threat
    """
    current_app.logger.error(
        f"🚨 SQL INJECTION ATTEMPT DETECTED 🚨\n"
        f"IP: {ip_address}\n"
        f"Employee ID: {employee_id or 'Unknown'}\n"
        f"Endpoint: {endpoint}\n"
        f"Threats: {threat_data['threats']}\n"
        f"Time: {datetime.utcnow()}"
    )

def protect_against_sql_injection(f):
    """
    Decorator to protect routes from SQL injection attempts
    Scans request data and blocks suspicious requests
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Import here to avoid circular imports
        from app.security.anti_brute_force import get_client_ip
        
        # Get request data
        data = None
        if request.is_json:
            data = request.get_json()
        elif request.form:
            data = request.form.to_dict()
        
        if data:
            # Scan for SQL injection
            scan_result = scan_request_data(data)
            
            if scan_result['has_threats']:
                ip_address = get_client_ip()
                employee_id = data.get('employeeID', None)
                
                # Log the attempt
                log_sql_injection_attempt(
                    ip_address=ip_address,
                    employee_id=employee_id,
                    endpoint=request.endpoint,
                    threat_data=scan_result
                )
                
                # Return error response
                return jsonify({
                    'success': False,
                    'message': 'Invalid input detected. This incident has been logged.'
                }), 400
        
        return f(*args, **kwargs)
    
    return decorated_function
