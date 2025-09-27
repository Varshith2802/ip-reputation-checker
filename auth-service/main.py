import os
import bcrypt
import requests
import ipaddress
import re
from datetime import datetime, timedelta
from typing import Optional
from fastapi import FastAPI, HTTPException, Body, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pymongo import MongoClient
from pydantic import BaseModel, Field, validator
from jose import JWTError, jwt

# ---- Config ----
# Support both MONGODB_URI and MONGO_URI (whichever you set in K8s)
MONGO_URI = os.getenv("MONGODB_URI", os.getenv("MONGO_URI", "mongodb://mongodb:27017"))
DB_NAME = os.getenv("MONGO_DB_NAME", "ip_reputation_db")

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Security Configuration
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:30080,http://127.0.0.1:30080").split(",")

# ---- DB ----
try:
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    users_collection = db["users"]
except Exception as e:
    # Raise at import-time so container fails fast if DB is unreachable
    raise RuntimeError(f"Database connection failed: {e}") from e

# ---- App ----
app = FastAPI(title="Auth Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# ---- Security ----
security = HTTPBearer()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

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

# ---- Models ----
class UserIn(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8, max_length=128)
    
    @validator('username')
    def validate_username(cls, v):
        if not re.match(r'^[a-zA-Z0-9_-]+$', v):
            raise ValueError('Username can only contain letters, numbers, underscores, and hyphens')
        return v
    
    @validator('password')
    def validate_password(cls, v):
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        return v

class UserOut(BaseModel):
    username: str

class Token(BaseModel):
    access_token: str
    token_type: str

# ---- Health ----
@app.get("/health")
def health():
    try:
        client.admin.command("ping")
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"db unreachable: {e}")

# ---- Auth ----
@app.post("/register", response_model=dict)
def register_user(user: UserIn):
    if users_collection.find_one({"username": user.username}):
        raise HTTPException(status_code=400, detail="Username already registered.")

    hashed = bcrypt.hashpw(user.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    users_collection.insert_one({
        "username": user.username, 
        "hashed_password": hashed,
        "created_at": datetime.utcnow(),
        "last_login": None
    })
    return {"message": "User registered successfully"}

@app.post("/login", response_model=Token)
def login_user(user: UserIn = Body(...)):
    doc = users_collection.find_one({"username": user.username})
    if not doc or not bcrypt.checkpw(user.password.encode("utf-8"), doc["hashed_password"].encode("utf-8")):
        raise HTTPException(status_code=401, detail="Invalid username or password.")
    
    # Update last login time
    users_collection.update_one(
        {"username": user.username},
        {"$set": {"last_login": datetime.utcnow()}}
    )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/verify-token")
def verify_user_token(current_user: str = Depends(verify_token)):
    return {"username": current_user, "message": "Token is valid"}

@app.get("/")
def read_root():
    return {"message": "Welcome to the Authentication Service"}

# ---- IP Reputation (simple demo) ----
KNOWN_CLEAN = {"1.1.1.1", "8.8.8.8"}
KNOWN_THREATS = {"185.220.101.5", "192.99.1.11"}

@app.get("/check-reputation/{ip_address}")
def check_ip_reputation(ip_address: str, current_user: str = Depends(verify_token)):
    """
    Demo: query ip-api.com and always return a 'reputation' string.
    Defaults to 'Clean' for any successful lookup not in the tiny blocklist.
    """
    # Validate IP address to prevent SSRF
    if not validate_ip_address(ip_address):
        raise HTTPException(status_code=400, detail="Invalid or private IP address")
    
    try:
        # Use HTTPS and add timeout
        r = requests.get(f"https://ip-api.com/json/{ip_address}", timeout=10)
        r.raise_for_status()
        data = r.json()
        ip = data.get("query", ip_address)

        if ip in KNOWN_THREATS:
            rep = "Known Threat"
        elif ip in KNOWN_CLEAN:
            rep = "Clean"
        elif data.get("status") == "success":
            rep = "Clean"   # default label for all other successful lookups
        else:
            rep = "Unknown"

        data["reputation"] = rep
        return data

    except requests.RequestException as e:
        # Generic error message to avoid information disclosure
        raise HTTPException(status_code=502, detail="IP lookup service temporarily unavailable")
