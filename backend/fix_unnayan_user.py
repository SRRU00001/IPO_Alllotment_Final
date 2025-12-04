"""
Fix Unnayan User - Ensure Unnayan user exists with password 1234
Run this script to create or reset Unnayan's account
"""

from database import get_db
from models import User
from auth import get_password_hash

def fix_unnayan_user():
    """Create or reset Unnayan user with password 1234"""
    db = next(get_db())

    try:
        print("\n" + "="*70)
        print(" FIXING UNNAYAN USER")
        print("="*70)

        # Check if Unnayan user exists
        unnayan = db.query(User).filter(User.username == "Unnayan").first()

        if unnayan:
            print("\n[OK] Unnayan user found!")
            print(f"   - User ID: {unnayan.id}")
            print(f"   - Username: {unnayan.username}")
            print(f"   - Email: {unnayan.email if unnayan.email else 'N/A'}")
            print(f"   - Verified: {'Yes' if unnayan.is_verified else 'No'}")

            # Reset password to 1234
            print("\n[UPDATE] Resetting password to '1234'...")
            unnayan.hashed_password = get_password_hash("1234")
            unnayan.is_verified = True
            unnayan.token = None  # Clear any old tokens
            db.commit()
            print("[OK] Password reset successfully!")

        else:
            print("\n[WARNING] Unnayan user not found. Creating new user...")

            # Create new Unnayan user
            new_user = User(
                username="Unnayan",
                hashed_password=get_password_hash("1234"),
                is_verified=True
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)

            print("[OK] Unnayan user created successfully!")
            print(f"   - User ID: {new_user.id}")
            print(f"   - Username: {new_user.username}")

        # Verify the password works
        print("\n[CHECK] Verifying login credentials...")
        from auth import authenticate_user
        test_user = authenticate_user(db, "Unnayan", "1234")

        if test_user:
            print("[OK] Login verification successful!")
            print(f"   - Username: {test_user.username}")
            print(f"   - User can now log in with password: 1234")
        else:
            print("[ERROR] Login verification failed! Something went wrong.")
            return False

        print("\n" + "="*70)
        print(" UNNAYAN USER IS READY!")
        print("="*70)
        print("\nLogin credentials:")
        print("  Username: Unnayan")
        print("  Password: 1234")
        print("="*70 + "\n")

        return True

    except Exception as e:
        print(f"\n[ERROR] Error: {e}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    try:
        fix_unnayan_user()
    except Exception as e:
        print(f"\n[ERROR] Fatal error: {e}")
        print("\nMake sure the database exists and backend dependencies are installed.")
