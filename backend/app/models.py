from datetime import datetime

from sqlalchemy import Column, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    plants = relationship("Plant", back_populates="owner", cascade="all, delete-orphan")


class Plant(Base):
    __tablename__ = "plants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    species = Column(String)
    pot_size_cm = Column(Float, nullable=True)
    plant_type = Column(String, nullable=True)
    location = Column(String, nullable=True)
    soil_type = Column(String, nullable=True)
    planted_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="plants")
    logs = relationship(
        "PlantLog",
        back_populates="plant",
        cascade="all, delete-orphan",
        order_by="PlantLog.log_date.desc()",
    )


class PlantLog(Base):
    __tablename__ = "plant_logs"

    id = Column(Integer, primary_key=True, index=True)
    plant_id = Column(Integer, ForeignKey("plants.id"), index=True)
    log_date = Column(Date, index=True)
    image_path = Column(String, nullable=True)
    height_cm = Column(Float, nullable=True)
    leaf_count = Column(Integer, nullable=True)
    flower_count = Column(Integer, nullable=True)
    fruit_count = Column(Integer, nullable=True)
    growth_stage = Column(String, nullable=True)
    watering_amount_ml = Column(Float, nullable=True)
    days_since_last_watering = Column(Float, nullable=True)
    soil_moisture = Column(String, nullable=True)
    sunlight_hours = Column(Float, nullable=True)
    temperature_c = Column(Float, nullable=True)
    humidity_percent = Column(Float, nullable=True)
    rain_exposure = Column(String, nullable=True)
    wind_exposure = Column(String, nullable=True)
    leaf_color = Column(String, nullable=True)
    leaf_condition = Column(String, nullable=True)
    stem_condition = Column(String, nullable=True)
    pest_signs = Column(String, nullable=True)
    disease_signs = Column(String, nullable=True)
    overall_health = Column(String, nullable=True)
    fertilizer_used = Column(String, nullable=True)
    pruning_status = Column(String, nullable=True)
    pesticide_used = Column(String, nullable=True)
    general_notes = Column(Text, nullable=True)
    health_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    plant = relationship("Plant", back_populates="logs")
