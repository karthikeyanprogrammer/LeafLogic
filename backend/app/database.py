import os

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./plants.db")

# SQLAlchemy needs an explicit driver for psycopg 3. Some providers also still
# expose the legacy postgres:// URL scheme.
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def init_db():
    Base.metadata.create_all(bind=engine)

    with engine.begin() as connection:
        inspector = inspect(connection)

        if "users" in inspector.get_table_names():
            user_columns = {column["name"] for column in inspector.get_columns("users")}
            if "created_at" not in user_columns:
                connection.execute(
                    text("ALTER TABLE users ADD COLUMN created_at DATETIME")
                )

        if "plants" in inspector.get_table_names():
            plant_columns = {column["name"] for column in inspector.get_columns("plants")}
            plant_migrations = {
                "pot_size_cm": "ALTER TABLE plants ADD COLUMN pot_size_cm FLOAT",
                "plant_type": "ALTER TABLE plants ADD COLUMN plant_type VARCHAR",
                "location": "ALTER TABLE plants ADD COLUMN location VARCHAR",
                "soil_type": "ALTER TABLE plants ADD COLUMN soil_type VARCHAR",
                "planted_date": "ALTER TABLE plants ADD COLUMN planted_date DATE",
                "notes": "ALTER TABLE plants ADD COLUMN notes TEXT",
                "created_at": "ALTER TABLE plants ADD COLUMN created_at DATETIME",
            }

            for column_name, statement in plant_migrations.items():
                if column_name not in plant_columns:
                    connection.execute(text(statement))

        if "plant_logs" in inspector.get_table_names():
            log_columns = {column["name"] for column in inspector.get_columns("plant_logs")}
            log_migrations = {
                "flower_count": "ALTER TABLE plant_logs ADD COLUMN flower_count INTEGER",
                "fruit_count": "ALTER TABLE plant_logs ADD COLUMN fruit_count INTEGER",
                "growth_stage": "ALTER TABLE plant_logs ADD COLUMN growth_stage VARCHAR",
                "days_since_last_watering": "ALTER TABLE plant_logs ADD COLUMN days_since_last_watering FLOAT",
                "rain_exposure": "ALTER TABLE plant_logs ADD COLUMN rain_exposure VARCHAR",
                "wind_exposure": "ALTER TABLE plant_logs ADD COLUMN wind_exposure VARCHAR",
                "leaf_condition": "ALTER TABLE plant_logs ADD COLUMN leaf_condition VARCHAR",
                "stem_condition": "ALTER TABLE plant_logs ADD COLUMN stem_condition VARCHAR",
                "disease_signs": "ALTER TABLE plant_logs ADD COLUMN disease_signs VARCHAR",
                "overall_health": "ALTER TABLE plant_logs ADD COLUMN overall_health VARCHAR",
                "pruning_status": "ALTER TABLE plant_logs ADD COLUMN pruning_status VARCHAR",
                "pesticide_used": "ALTER TABLE plant_logs ADD COLUMN pesticide_used VARCHAR",
                "general_notes": "ALTER TABLE plant_logs ADD COLUMN general_notes TEXT",
            }

            for column_name, statement in log_migrations.items():
                if column_name not in log_columns:
                    connection.execute(text(statement))
