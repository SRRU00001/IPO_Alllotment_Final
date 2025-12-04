"""
Migrate Unnayan's Data - Link all old applicants and applications to Unnayan user
Run this script to ensure all Unnayan's data is visible to him
"""

from database import get_db
from models import User, Applicant, IpoApplication

def migrate_unnayan_data():
    """Migrate all applicants and applications to Unnayan user"""
    db = next(get_db())

    try:
        print("\n" + "="*70)
        print(" MIGRATING UNNAYAN'S DATA")
        print("="*70)

        # Find Unnayan user
        unnayan = db.query(User).filter(User.username == "Unnayan").first()

        if not unnayan:
            print("\n[ERROR] Unnayan user not found!")
            print("Run fix_unnayan_user.py first to create the user.")
            return False

        print(f"\n[OK] Unnayan user found (ID: {unnayan.id})")

        # Count existing data
        total_applicants = db.query(Applicant).count()
        total_applications = db.query(IpoApplication).count()
        unnayan_applicants = db.query(Applicant).filter(Applicant.created_by == unnayan.id).count()
        unnayan_applications = db.query(IpoApplication).filter(IpoApplication.created_by == unnayan.id).count()

        print(f"\n[INFO] Current database status:")
        print(f"   - Total applicants: {total_applicants}")
        print(f"   - Unnayan's applicants: {unnayan_applicants}")
        print(f"   - Total applications: {total_applications}")
        print(f"   - Unnayan's applications: {unnayan_applications}")

        # Find orphaned data (NULL created_by)
        orphaned_applicants = db.query(Applicant).filter(Applicant.created_by == None).count()
        orphaned_applications = db.query(IpoApplication).filter(IpoApplication.created_by == None).count()

        print(f"\n[INFO] Orphaned data (not linked to any user):")
        print(f"   - Orphaned applicants: {orphaned_applicants}")
        print(f"   - Orphaned applications: {orphaned_applications}")

        if orphaned_applicants == 0 and orphaned_applications == 0:
            print("\n[OK] No orphaned data found. All data is already linked!")
            print("="*70 + "\n")
            return True

        print(f"\n[UPDATE] Migrating orphaned data to Unnayan (ID: {unnayan.id})...")

        # Update applicants with NULL created_by
        applicants_updated = db.query(Applicant).filter(
            Applicant.created_by == None
        ).update({"created_by": unnayan.id}, synchronize_session=False)

        # Update applications with NULL created_by
        applications_updated = db.query(IpoApplication).filter(
            IpoApplication.created_by == None
        ).update({"created_by": unnayan.id}, synchronize_session=False)

        db.commit()

        print(f"\n[OK] Migration completed!")
        print(f"   - Migrated {applicants_updated} applicants")
        print(f"   - Migrated {applications_updated} applications")

        # Verify final counts
        final_unnayan_applicants = db.query(Applicant).filter(Applicant.created_by == unnayan.id).count()
        final_unnayan_applications = db.query(IpoApplication).filter(IpoApplication.created_by == unnayan.id).count()

        print(f"\n[INFO] Final status:")
        print(f"   - Unnayan's applicants: {final_unnayan_applicants}")
        print(f"   - Unnayan's applications: {final_unnayan_applications}")

        print("\n" + "="*70)
        print(" MIGRATION SUCCESSFUL!")
        print("="*70)
        print("\nUnnayan can now see all his applicants and applications.")
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
        migrate_unnayan_data()
    except Exception as e:
        print(f"\n[ERROR] Fatal error: {e}")
        print("\nMake sure the database exists and backend dependencies are installed.")
