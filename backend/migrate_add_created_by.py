"""
Migration script to add created_by column to applicants and ipo_applications tables.
This script adds user isolation to the IPO Allotment system.

Run this script to update your existing database:
    python migrate_add_created_by.py
"""

import sys
from database import engine, get_db
from sqlalchemy import text

def run_migration():
    """Add created_by columns to existing tables"""
    print("🔧 Starting database migration...")
    print("=" * 60)
    
    db = next(get_db())
    
    try:
        # Check if columns already exist (SQLite compatible)
        print("\n1️⃣ Checking if migration is needed...")
        try:
            # Try to select the column - if it doesn't exist, we'll get an error
            db.execute(text("SELECT created_by FROM applicants LIMIT 1"))
            print("   ⚠️  Migration already applied. Columns already exist.")
            return
        except Exception:
            # Column doesn't exist, proceed with migration
            print("   ✅ Migration needed. Proceeding...")
        
        # Add created_by column to applicants table
        print("\n2️⃣ Adding 'created_by' column to 'applicants' table...")
        db.execute(text("""
            ALTER TABLE applicants 
            ADD COLUMN created_by INTEGER
        """))
        print("   ✅ Column added to 'applicants'")
        
        # Add created_by column to ipo_applications table
        print("\n3️⃣ Adding 'created_by' column to 'ipo_applications' table...")
        db.execute(text("""
            ALTER TABLE ipo_applications 
            ADD COLUMN created_by INTEGER
        """))
        print("   ✅ Column added to 'ipo_applications'")
        
        # Get the admin user ID (default user)
        print("\n4️⃣ Finding admin user...")
        admin_result = db.execute(text("""
            SELECT id FROM users WHERE username = 'admin' LIMIT 1
        """)).fetchone()
        
        if admin_result:
            admin_id = admin_result[0]
            print(f"   ✅ Admin user found (ID: {admin_id})")
            
            # Update existing records to belong to admin
            print("\n5️⃣ Assigning existing records to admin user...")
            
            applicants_result = db.execute(text(f"""
                UPDATE applicants 
                SET created_by = {admin_id} 
                WHERE created_by IS NULL
            """))
            print(f"   ✅ Updated {applicants_result.rowcount} applicant records")
            
            applications_result = db.execute(text(f"""
                UPDATE ipo_applications 
                SET created_by = {admin_id} 
                WHERE created_by IS NULL
            """))
            print(f"   ✅ Updated {applications_result.rowcount} application records")
        else:
            print("   ⚠️  No admin user found. Existing records will have NULL created_by.")
        
        # Commit the changes
        db.commit()
        
        print("\n" + "=" * 60)
        print("✅ Migration completed successfully!")
        print("\n📋 Summary:")
        print("   - Added 'created_by' column to 'applicants' table")
        print("   - Added 'created_by' column to 'ipo_applications' table")
        if admin_result:
            print(f"   - Assigned all existing records to admin (ID: {admin_id})")
        print("\n🔒 User isolation is now active!")
        print("   Each user will only see their own applicants and applications.")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Migration failed: {str(e)}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    print("""
    ╔════════════════════════════════════════════════════════════╗
    ║         IPO ALLOTMENT - DATABASE MIGRATION                 ║
    ║         Adding User Isolation Support                      ║
    ╚════════════════════════════════════════════════════════════╝
    """)
    
    response = input("⚠️  This will modify your database. Continue? (yes/no): ").strip().lower()
    
    if response in ['yes', 'y']:
        run_migration()
    else:
        print("❌ Migration cancelled.")
        sys.exit(0)

