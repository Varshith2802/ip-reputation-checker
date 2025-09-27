import os
import ipaddress
import re
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from jose import JWTError, jwt
import requests

# Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-this-in-production")
ALGORITHM = "HS256"
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:30080,http://127.0.0.1:30080").split(",")

# Rate limiting
limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="API Service")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return username
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def validate_ip_address(ip: str) -> bool:
    """Validate IP address and prevent SSRF attacks"""
    try:
        # Check if it's a valid IP address
        ipaddress.ip_address(ip)
        
        # Block private/internal IP ranges to prevent SSRF
        private_ranges = [
            ipaddress.ip_network('10.0.0.0/8'),
            ipaddress.ip_network('172.16.0.0/12'),
            ipaddress.ip_network('192.168.0.0/16'),
            ipaddress.ip_network('127.0.0.0/8'),
            ipaddress.ip_network('169.254.0.0/16'),
        ]
        
        ip_obj = ipaddress.ip_address(ip)
        for private_range in private_ranges:
            if ip_obj in private_range:
                return False
                
        return True
    except ValueError:
        return False

@app.get("/health")
@app.get("/api/health")
def health(): return {"status":"ok"}

def _fetch(ip: str):
    # Use HTTPS and add timeout
    r = requests.get(f"https://ip-api.com/json/{ip}", timeout=10)
    r.raise_for_status()
    data = r.json()
    data["reputation"] = "Clean" if data.get("query") in ["8.8.8.8","1.1.1.1"] else "Unknown"
    return data

@app.get("/check-ip/{ip}")
@limiter.limit("10/minute")
def check_ip(ip: str, current_user: str = Depends(verify_token)):
    # Validate IP address to prevent SSRF
    if not validate_ip_address(ip):
        raise HTTPException(status_code=400, detail="Invalid or private IP address")
    
    try: 
        return _fetch(ip)
    except Exception as e: 
        # Generic error message to avoid information disclosure
        raise HTTPException(status_code=502, detail="IP lookup service temporarily unavailable")

@app.get("/api/check-ip/{ip}")
@limiter.limit("10/minute")
def api_check_ip(ip: str, current_user: str = Depends(verify_token)): 
    return check_ip(ip)