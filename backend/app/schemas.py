from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


# ---------- USER SCHEMAS ----------

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr

    class Config:
        from_attributes = True


# ---------- LOGIN ----------

class Token(BaseModel):
    access_token: str
    token_type: str


# ---------- PLANT SCHEMAS ----------

class PlantCreate(BaseModel):
    name: str
    species: str
    pot_size_cm: Optional[float] = None
    plant_type: Optional[str] = None
    location: Optional[str] = None
    soil_type: Optional[str] = None
    planted_date: Optional[date] = None
    notes: Optional[str] = None


class PlantResponse(BaseModel):
    id: int
    name: str
    species: str
    pot_size_cm: Optional[float] = None
    plant_type: Optional[str] = None
    location: Optional[str] = None
    soil_type: Optional[str] = None
    planted_date: Optional[date] = None
    notes: Optional[str] = None
    user_id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PlantLogCreate(BaseModel):
    log_date: date
    image_path: Optional[str] = None
    height_cm: Optional[float] = None
    leaf_count: Optional[int] = None
    flower_count: Optional[int] = None
    fruit_count: Optional[int] = None
    growth_stage: Optional[str] = None
    watering_amount_ml: Optional[float] = None
    days_since_last_watering: Optional[float] = None
    soil_moisture: Optional[str] = None
    sunlight_hours: Optional[float] = None
    temperature_c: Optional[float] = None
    humidity_percent: Optional[float] = None
    rain_exposure: Optional[str] = None
    wind_exposure: Optional[str] = None
    leaf_color: Optional[str] = None
    leaf_condition: Optional[str] = None
    stem_condition: Optional[str] = None
    pest_signs: Optional[str] = None
    disease_signs: Optional[str] = None
    overall_health: Optional[str] = None
    fertilizer_used: Optional[str] = None
    pruning_status: Optional[str] = None
    pesticide_used: Optional[str] = None
    general_notes: Optional[str] = None
    health_notes: Optional[str] = None


class PlantLogResponse(PlantLogCreate):
    id: int
    plant_id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PlantDetailResponse(PlantResponse):
    logs: list[PlantLogResponse] = []


class InsightResponse(BaseModel):
    insight_type: str
    severity: str
    message: str


class HealthSubscores(BaseModel):
    current_health: int
    growth_trend: int
    care_consistency: int
    environment_fit: int
    risk: int


class HealthScoreResponse(BaseModel):
    score: int
    label: str
    subscores: HealthSubscores
    reasons: list[str]


class AnalysisModuleResponse(BaseModel):
    module: str
    title: str
    summary: str
    severity: Optional[str] = None
    metrics: dict[str, str | int | float | None] = {}
    reasons: list[str] = []
    recommendations: list[str] = []
    alerts: list[str] = []


class SpeciesProfileResponse(BaseModel):
    key: str
    common_name: str
    category: str
    ideal_sunlight_min: float
    ideal_sunlight_max: float
    ideal_temperature_min: float
    ideal_temperature_max: float
    ideal_soil_moisture: list[str]
    watering_frequency_days_min: float
    watering_frequency_days_max: float
    care_tips: list[str]
    common_warnings: list[str]
