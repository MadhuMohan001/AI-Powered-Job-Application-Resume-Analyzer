from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import AuthError, ConflictError
from app.core.security import create_access_token, hash_password, verify_password
from app.models import User
from app.schemas.auth import UserCreate, UserUpdate


def register(db: Session, data: UserCreate) -> tuple[User, str]:
    email = data.email.lower()
    if db.scalar(select(User).where(User.email == email)):
        raise ConflictError("An account with this email already exists.")
    user = User(email=email, full_name=data.full_name, hashed_password=hash_password(data.password))
    db.add(user)
    db.commit()
    return user, create_access_token(user.id)


def login(db: Session, email: str, password: str) -> tuple[User, str]:
    user = db.scalar(select(User).where(User.email == email.lower()))
    # Same message for unknown email and wrong password: don't reveal which emails exist.
    if not user or not verify_password(password, user.hashed_password):
        raise AuthError("Incorrect email or password.")
    return user, create_access_token(user.id)


def update_profile(db: Session, user: User, data: UserUpdate) -> User:
    if data.full_name:
        user.full_name = data.full_name.strip()
    if data.password:
        user.hashed_password = hash_password(data.password)
    db.commit()
    return user
