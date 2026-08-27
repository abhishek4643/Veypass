import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("No DATABASE_URL")
    exit(1)

engine = create_engine(DATABASE_URL)
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE tickets ADD COLUMN IF NOT EXISTS passenger_name VARCHAR;"))
        conn.execute(text("ALTER TABLE tickets ADD COLUMN IF NOT EXISTS passenger_age INTEGER;"))
        conn.execute(text("ALTER TABLE tickets ADD COLUMN IF NOT EXISTS passenger_gender VARCHAR;"))
        conn.execute(text("ALTER TABLE tickets ADD COLUMN IF NOT EXISTS boarding_point_name VARCHAR;"))
        conn.execute(text("ALTER TABLE tickets ADD COLUMN IF NOT EXISTS boarding_point_time VARCHAR;"))
        conn.execute(text("ALTER TABLE tickets ADD COLUMN IF NOT EXISTS dropping_point_name VARCHAR;"))
        conn.execute(text("ALTER TABLE tickets ADD COLUMN IF NOT EXISTS dropping_point_time VARCHAR;"))
        conn.commit()
        print("Successfully added columns to Postgres!")
    except Exception as e:
        print("Migration failed:", e)
