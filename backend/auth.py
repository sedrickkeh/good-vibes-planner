import os
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from config import settings
from database import SessionLocal
from models import User as UserModel

# Configuration
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Token model
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class User(BaseModel):
    username: str

class UserCreate(BaseModel):
    username: str
    password: str

class UserInDB(User):
    hashed_password: str

# Security
security = HTTPBearer()

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def get_user(username: str):
    db = SessionLocal()
    try:
        user = db.query(UserModel).filter(UserModel.username == username).first()
        if user:
            return UserInDB(username=user.username, hashed_password=user.hashed_password)
        return None
    finally:
        db.close()

def create_user(user_create: UserCreate):
    db = SessionLocal()
    try:
        # Check if user already exists
        existing_user = db.query(UserModel).filter(UserModel.username == user_create.username).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already exists"
            )
        
        # Create new user
        hashed_password = get_password_hash(user_create.password)
        db_user = UserModel(
            username=user_create.username,
            hashed_password=hashed_password
        )
        db.add(db_user)
        db.commit()
        
        # Initialize default data for the new user
        from database import init_user_data
        init_user_data(user_create.username)
        
        return User(username=user_create.username)
    finally:
        db.close()

def authenticate_user(username: str, password: str):
    user = get_user(username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = get_user(username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

# Create default admin user if it doesn't exist
def ensure_admin_user():
    db = SessionLocal()
    try:
        admin_user = db.query(UserModel).filter(UserModel.username == settings.DEFAULT_USERNAME).first()
        if not admin_user:
            print(f"Creating default admin user: {settings.DEFAULT_USERNAME}")
            db_user = UserModel(
                username=settings.DEFAULT_USERNAME,
                hashed_password=get_password_hash(settings.DEFAULT_PASSWORD)
            )
            db.add(db_user)
            db.commit()
            
            # Initialize default data for admin
            from database import init_user_data
            init_user_data(settings.DEFAULT_USERNAME)
            print("Default admin user created with default calendars!")
    finally:
        db.close() 