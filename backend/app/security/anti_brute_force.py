import ipaddress
from flask import request, current_app
from app import redis_client, mail
from app.security.security_monitor import SecurityMonitor
from flask_mail import Message as MailMessage


def get_client_ip():
    if request.headers.get('X-Forwarded-For'):
        ip_addr = request.headers.get('X-Forwarded-For').split(',')[0]
        return ip_addr
    else:
        ip_addr = request.remote_addr
        return ip_addr

def track_failed_login(ip_address):
    key = f"failed_login_ip:{ip_address}"

    attempts = redis_client.incr(key)
    redis_client.expire(key, 900)
    return attempts

def is_ip_blocked(ip_address):
    block_key = f"ip_blocked:{ip_address}"
    is_exist = redis_client.exists(block_key) > 0
    return is_exist

def block_ip(ip_address, duration_seconds=1800, employee_id=None):
    block_key = f"ip_blocked:{ip_address}"
    redis_client.set(block_key, "blocked")
    redis_client.expire(block_key, duration_seconds)
    
    # Log security event
    SecurityMonitor.log_security_event(
        event_type=SecurityMonitor.EVENT_TYPES['IP_BLOCKED'],
        employee_id=employee_id,
        ip_address=ip_address,
        details={'duration_seconds': duration_seconds, 'reason': 'brute_force'}
    )
    
    # Send email alert to admin
    send_security_alert_email(ip_address, employee_id, duration_seconds)

def clear_failed_attempts(ip_address):
    """Clear failed login attempts for an IP (called on successful login)"""
    key = f"failed_login_ip:{ip_address}"
    redis_client.delete(key)

def send_security_alert_email(ip_address, employee_id, duration_seconds):
    """Send email alert to admin when IP is blocked"""
    try:
        from app.models import Employee
        
        # Get all admin users
        admins = Employee.query.filter_by(isAdmin=True).all()
        
        if not admins:
            current_app.logger.warning("No admin users found to send security alert")
            return
        
        admin_emails = [admin.email for admin in admins if admin.email]
        
        if not admin_emails:
            current_app.logger.warning("No admin email addresses found")
            return
        
        # Email subject and body
        subject = "🚨 UDMS Security Alert: IP Blocked"
        
        duration_minutes = duration_seconds // 60
        
        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                <h2 style="color: #d9534f; border-bottom: 2px solid #d9534f; padding-bottom: 10px;">
                    🚨 Security Alert: Brute Force Attack Blocked
                </h2>
                
                <p>A potential brute force attack has been detected and blocked on the UDMS system.</p>
                
                <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #d9534f; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Incident Details:</h3>
                    <ul style="list-style: none; padding: 0;">
                        <li><strong>🌐 Blocked IP:</strong> {ip_address}</li>
                        <li><strong>👤 Attempted Employee ID:</strong> {employee_id or 'Unknown'}</li>
                        <li><strong>⏱️ Block Duration:</strong> {duration_minutes} minutes</li>
                        <li><strong>🕐 Time:</strong> {SecurityMonitor.get_current_time()}</li>
                        <li><strong>⚠️ Reason:</strong> Multiple failed login attempts (5+ attempts)</li>
                    </ul>
                </div>
                
                <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
                    <h3 style="margin-top: 0;">🔍 What Happened?</h3>
                    <p>Someone attempted to login with incorrect credentials 5 or more times from IP address <strong>{ip_address}</strong>. 
                    Our anti-brute force protection has automatically blocked this IP for {duration_minutes} minutes.</p>
                </div>
                
                <div style="background-color: #d1ecf1; padding: 15px; border-left: 4px solid #0c5460; margin: 20px 0;">
                    <h3 style="margin-top: 0;">✅ Actions Taken:</h3>
                    <ul>
                        <li>IP address has been temporarily blocked</li>
                        <li>Security event has been logged</li>
                        <li>Failed login attempts are being tracked</li>
                        <li>This notification has been sent to all admins</li>
                    </ul>
                </div>
                
                <div style="margin-top: 20px; padding: 15px; background-color: #e7f3ff; border-radius: 5px;">
                    <p><strong>💡 Recommended Actions:</strong></p>
                    <ol>
                        <li>Review the security dashboard for additional suspicious activity</li>
                        <li>If the employee ID is valid, contact the user to verify they weren't compromised</li>
                        <li>Monitor for additional attacks from different IPs</li>
                    </ol>
                </div>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                
                <p style="font-size: 12px; color: #666;">
                    This is an automated security alert from the University Document Management System (UDMS).<br>
                    To view detailed security logs, access the admin security dashboard.
                </p>
            </div>
        </body>
        </html>
        """
        
        # Send email to all admins
        msg = MailMessage(
            subject=subject,
            recipients=admin_emails,
            html=body
        )
        
        mail.send(msg)
        current_app.logger.info(f"Security alert email sent to {len(admin_emails)} admin(s)")
        
    except Exception as e:
        current_app.logger.error(f"Failed to send security alert email: {e}")
