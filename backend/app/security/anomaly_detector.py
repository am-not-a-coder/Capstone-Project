"""
Anomaly Detection System
Detects unusual user behavior and security threats
"""

from datetime import datetime, timedelta
from flask import current_app
from app import redis_client

class AnomalyDetector:
    """Detects anomalous user behavior patterns"""
    
    # Thresholds
    MAX_REQUESTS_PER_MINUTE = 60
    MAX_FAILED_ACTIONS_PER_HOUR = 10
    MAX_DIFFERENT_IPS_PER_DAY = 5
    
    @staticmethod
    def track_request_rate(employee_id, ip_address):
        """
        Tracks request rate per user
        Returns True if rate is suspicious
        """
        key = f"request_rate:{employee_id}:{ip_address}"
        count = redis_client.incr(key)
        
        # Set expiry on first request
        if count == 1:
            redis_client.expire(key, 60)  # 1 minute window
        
        if count > AnomalyDetector.MAX_REQUESTS_PER_MINUTE:
            current_app.logger.warning(
                f"⚠️ High request rate detected: {employee_id} from {ip_address} "
                f"({count} requests/min)"
            )
            return True
        
        return False
    
    @staticmethod
    def track_failed_action(employee_id, action_type):
        """
        Tracks failed actions (failed file uploads, failed deletions, etc.)
        Returns True if failures are suspicious
        """
        key = f"failed_actions:{employee_id}:{action_type}"
        count = redis_client.incr(key)
        
        # Set expiry on first failure
        if count == 1:
            redis_client.expire(key, 3600)  # 1 hour window
        
        if count > AnomalyDetector.MAX_FAILED_ACTIONS_PER_HOUR:
            current_app.logger.warning(
                f"⚠️ Multiple failed {action_type} attempts: {employee_id} "
                f"({count} failures in past hour)"
            )
            return True
        
        return False
    
    @staticmethod
    def track_ip_changes(employee_id, ip_address):
        """
        Tracks IP address changes for a user
        Returns True if user is accessing from too many different IPs
        """
        key = f"user_ips:{employee_id}"
        
        # Add IP to set
        redis_client.sadd(key, ip_address)
        
        # Set expiry on first IP
        redis_client.expire(key, 86400)  # 24 hours
        
        # Get count of unique IPs
        ip_count = redis_client.scard(key)
        
        if ip_count > AnomalyDetector.MAX_DIFFERENT_IPS_PER_DAY:
            current_app.logger.warning(
                f"⚠️ Multiple IP addresses detected for {employee_id}: "
                f"{ip_count} different IPs in 24 hours"
            )
            return True
        
        return False
    
    @staticmethod
    def detect_unusual_access_time(employee_id):
        """
        Detects access during unusual hours (e.g., 2 AM - 5 AM)
        Returns True if access time is unusual
        """
        current_hour = datetime.now().hour
        
        # Flag access between 2 AM and 5 AM as unusual
        if 2 <= current_hour < 5:
            current_app.logger.info(
                f"ℹ️ Unusual access time: {employee_id} accessing at {current_hour}:00"
            )
            return True
        
        return False
    
    @staticmethod
    def detect_rapid_downloads(employee_id, ip_address):
        """
        Detects rapid file downloads (potential data exfiltration)
        Returns True if download rate is suspicious
        """
        key = f"downloads:{employee_id}:{ip_address}"
        count = redis_client.incr(key)
        
        # Set expiry on first download
        if count == 1:
            redis_client.expire(key, 300)  # 5 minute window
        
        # More than 20 downloads in 5 minutes is suspicious
        if count > 20:
            current_app.logger.error(
                f"🚨 RAPID DOWNLOAD DETECTED: {employee_id} from {ip_address} "
                f"({count} downloads in 5 minutes) - Possible data exfiltration"
            )
            return True
        
        return False
    
    @staticmethod
    def check_all_anomalies(employee_id, ip_address, action_type=None):
        """
        Runs all anomaly checks and returns a summary
        
        Returns:
            dict: {
                'is_anomalous': bool,
                'anomalies': list of detected anomalies
            }
        """
        anomalies = []
        
        # Check request rate
        if AnomalyDetector.track_request_rate(employee_id, ip_address):
            anomalies.append('high_request_rate')
        
        # Check IP changes
        if AnomalyDetector.track_ip_changes(employee_id, ip_address):
            anomalies.append('multiple_ips')
        
        # Check access time
        if AnomalyDetector.detect_unusual_access_time(employee_id):
            anomalies.append('unusual_time')
        
        # Check failed actions if provided
        if action_type and AnomalyDetector.track_failed_action(employee_id, action_type):
            anomalies.append(f'failed_{action_type}')
        
        return {
            'is_anomalous': len(anomalies) > 0,
            'anomalies': anomalies
        }
