"""
Security Monitoring Module
Centralized security event logging and monitoring
"""

from datetime import datetime, timedelta
from flask import current_app
from app import redis_client
import json

class SecurityMonitor:
    """Centralized security event monitoring"""
    
    EVENT_TYPES = {
        'BRUTE_FORCE': 'brute_force_attempt',
        'SQL_INJECTION': 'sql_injection_attempt',
        'ANOMALY': 'anomaly_detected',
        'UNAUTHORIZED_ACCESS': 'unauthorized_access',
        'SUSPICIOUS_DOWNLOAD': 'suspicious_download',
        'IP_BLOCKED': 'ip_blocked',
        'ACCOUNT_LOCKED': 'account_locked'
    }
    
    @staticmethod
    def get_current_time():
        """Get current time formatted for display"""
        return datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')
    
    @staticmethod
    def log_security_event(event_type, employee_id=None, ip_address=None, details=None):
        """
        Logs a security event to Redis for real-time monitoring
        
        Args:
            event_type: Type of security event (use EVENT_TYPES)
            employee_id: Employee ID involved (if applicable)
            ip_address: IP address involved
            details: Additional details about the event
        """
        event = {
            'type': event_type,
            'employee_id': employee_id,
            'ip_address': ip_address,
            'timestamp': datetime.utcnow().isoformat(),
            'details': details or {}
        }
        
        # Store in Redis list (keep last 1000 events)
        redis_client.lpush('security_events', json.dumps(event))
        redis_client.ltrim('security_events', 0, 999)
        
        # Also increment counter for this event type
        key = f"security_count:{event_type}"
        redis_client.incr(key)
        redis_client.expire(key, 86400)  # Keep for 24 hours
        
        # Log to application logger
        current_app.logger.warning(
            f"Security Event: {event_type} | "
            f"Employee: {employee_id or 'N/A'} | "
            f"IP: {ip_address or 'N/A'} | "
            f"Details: {details}"
        )
    
    @staticmethod
    def get_recent_events(limit=50):
        """
        Retrieves recent security events
        
        Args:
            limit: Number of events to retrieve
            
        Returns:
            list: Recent security events
        """
        events = redis_client.lrange('security_events', 0, limit - 1)
        return [json.loads(event) for event in events]
    
    @staticmethod
    def get_event_statistics(hours=24):
        """
        Gets statistics about security events
        
        Args:
            hours: Time window in hours
            
        Returns:
            dict: Statistics for each event type
        """
        stats = {}
        
        for event_name, event_key in SecurityMonitor.EVENT_TYPES.items():
            key = f"security_count:{event_key}"
            count = redis_client.get(key)
            stats[event_name] = int(count) if count else 0
        
        return stats
    
    @staticmethod
    def get_blocked_ips():
        """
        Gets list of currently blocked IPs
        
        Returns:
            list: Currently blocked IP addresses
        """
        # Scan for all ip_blocked keys
        blocked_ips = []
        cursor = 0
        
        while True:
            cursor, keys = redis_client.scan(cursor, match='ip_blocked:*', count=100)
            
            for key in keys:
                # Extract IP from key (format: ip_blocked:x.x.x.x)
                ip = key.decode('utf-8').replace('ip_blocked:', '')
                ttl = redis_client.ttl(key)
                
                blocked_ips.append({
                    'ip': ip,
                    'expires_in_seconds': ttl
                })
            
            if cursor == 0:
                break
        
        return blocked_ips
    
    @staticmethod
    def check_threat_level():
        """
        Calculates overall threat level based on recent events
        
        Returns:
            dict: {
                'level': 'low'|'medium'|'high'|'critical',
                'score': int,
                'recommendations': list
            }
        """
        stats = SecurityMonitor.get_event_statistics()
        
        # Calculate threat score
        score = 0
        score += stats.get('BRUTE_FORCE', 0) * 3
        score += stats.get('SQL_INJECTION', 0) * 5
        score += stats.get('ANOMALY', 0) * 2
        score += stats.get('UNAUTHORIZED_ACCESS', 0) * 4
        score += stats.get('SUSPICIOUS_DOWNLOAD', 0) * 3
        
        # Determine threat level
        if score == 0:
            level = 'low'
            recommendations = ['System is secure', 'Continue normal monitoring']
        elif score < 10:
            level = 'low'
            recommendations = ['Minor suspicious activity detected', 'Continue monitoring']
        elif score < 25:
            level = 'medium'
            recommendations = [
                'Moderate security events detected',
                'Review recent security logs',
                'Consider increasing monitoring'
            ]
        elif score < 50:
            level = 'high'
            recommendations = [
                'Significant security threats detected',
                'Review all blocked IPs',
                'Investigate unusual patterns',
                'Consider notifying security team'
            ]
        else:
            level = 'critical'
            recommendations = [
                '⚠️ CRITICAL: System under active attack',
                'Immediate investigation required',
                'Review all security logs',
                'Consider temporary lockdown',
                'Notify security team immediately'
            ]
        
        return {
            'level': level,
            'score': score,
            'recommendations': recommendations,
            'event_counts': stats
        }
