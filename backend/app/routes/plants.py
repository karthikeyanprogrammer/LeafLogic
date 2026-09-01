from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app import models, schemas
from app.auth import get_current_user
from app.health_score import calculate_health_score
from app.species_library import SPECIES_LIBRARY, get_species_profile, list_species_options, normalize_species_key

router = APIRouter()
UPLOAD_DIR = Path("uploads")


# ---------- DATABASE ----------

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/species", response_model=list[schemas.SpeciesProfileResponse])
def get_species_options():
    return list_species_options()


# ---------- CREATE PLANT ----------

@router.post("/plants", response_model=schemas.PlantResponse)
def create_plant(
    plant: schemas.PlantCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    species_key = normalize_species_key(plant.species)
    species_profile = get_species_profile(plant.species)

    if not species_key or not species_profile:
        raise HTTPException(status_code=400, detail="Please select a supported species")

    new_plant = models.Plant(
        name=plant.name,
        species=species_key,
        pot_size_cm=plant.pot_size_cm,
        plant_type=plant.plant_type or species_profile["category"],
        location=plant.location,
        soil_type=plant.soil_type,
        planted_date=plant.planted_date,
        notes=plant.notes,
        user_id=current_user.id
    )

    db.add(new_plant)
    db.commit()
    db.refresh(new_plant)

    return new_plant


# ---------- GET USER PLANTS ----------

@router.get("/plants", response_model=list[schemas.PlantResponse])
def get_user_plants(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    plants = db.query(models.Plant).filter(
        models.Plant.user_id == current_user.id
    ).all()

    return plants


def get_owned_plant(plant_id: int, db: Session, current_user: models.User):
    plant = db.query(models.Plant).filter(
        models.Plant.id == plant_id,
        models.Plant.user_id == current_user.id
    ).first()

    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    return plant


@router.get("/plants/{plant_id}", response_model=schemas.PlantDetailResponse)
def get_plant_detail(
    plant_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return get_owned_plant(plant_id, db, current_user)


@router.delete("/plants/{plant_id}")
def delete_plant(
    plant_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    plant = get_owned_plant(plant_id, db, current_user)

    db.delete(plant)
    db.commit()

    return {"detail": "Plant deleted"}


@router.post("/plants/{plant_id}/logs", response_model=schemas.PlantLogResponse)
def create_plant_log(
    plant_id: int,
    log: schemas.PlantLogCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    get_owned_plant(plant_id, db, current_user)

    new_log = models.PlantLog(
        plant_id=plant_id,
        **log.model_dump()
    )

    db.add(new_log)
    db.commit()
    db.refresh(new_log)

    return new_log


@router.post("/plants/{plant_id}/images")
def upload_plant_image(
    plant_id: int,
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    get_owned_plant(plant_id, db, current_user)

    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload an image file")

    extension = Path(image.filename or "").suffix.lower()
    if extension not in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
        extension = ".jpg"

    UPLOAD_DIR.mkdir(exist_ok=True)
    filename = f"plant-{plant_id}-{uuid4().hex}{extension}"
    destination = UPLOAD_DIR / filename

    with destination.open("wb") as file_handle:
        file_handle.write(image.file.read())

    return {"image_path": f"/uploads/{filename}"}


@router.get("/plants/{plant_id}/logs", response_model=list[schemas.PlantLogResponse])
def get_plant_logs(
    plant_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    get_owned_plant(plant_id, db, current_user)

    return db.query(models.PlantLog).filter(
        models.PlantLog.plant_id == plant_id
    ).order_by(models.PlantLog.log_date.desc()).all()


@router.put("/plants/{plant_id}/logs/{log_id}", response_model=schemas.PlantLogResponse)
def update_plant_log(
    plant_id: int,
    log_id: int,
    log_update: schemas.PlantLogCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    get_owned_plant(plant_id, db, current_user)

    log = db.query(models.PlantLog).filter(
        models.PlantLog.id == log_id,
        models.PlantLog.plant_id == plant_id
    ).first()

    if not log:
        raise HTTPException(status_code=404, detail="Log not found")

    for field, value in log_update.model_dump().items():
        setattr(log, field, value)

    db.commit()
    db.refresh(log)

    return log


def recent_logs_for_analysis(logs):
    return sorted(logs, key=lambda item: item.log_date)[-7:]


def first_latest_delta(logs, field):
    values = [getattr(log, field) for log in logs if getattr(log, field) is not None]
    if len(values) < 2:
        return None

    return values[-1] - values[0]


def trend_phrase(delta, unit=""):
    if delta is None:
        return "not enough data"
    if delta > 0:
        return f"up {round(delta, 1)}{unit}"
    if delta < 0:
        return f"down {abs(round(delta, 1))}{unit}"
    return "unchanged"


def count_outside_range(logs, field, minimum, maximum):
    values = [getattr(log, field) for log in logs if getattr(log, field) is not None]
    outside = [value for value in values if value < minimum or value > maximum]
    return len(outside), len(values)


def build_health_score_analysis(plant, logs):
    health_score = calculate_health_score(logs, plant.species)
    alerts = []

    if health_score["score"] < 50:
        alerts.append("Health score is below the stable range.")
    if health_score["subscores"]["risk"] < 65:
        alerts.append("Recent risk signals need attention.")

    return {
        "module": "health_score",
        "title": "Health score",
        "summary": f"{plant.name} is currently rated {health_score['label']} at {health_score['score']}/100.",
        "severity": "high" if health_score["score"] < 50 else "medium" if health_score["score"] < 70 else "low",
        "metrics": {
            "Score": health_score["score"],
            "Current health": health_score["subscores"]["current_health"],
            "Growth trend": health_score["subscores"]["growth_trend"],
            "Care consistency": health_score["subscores"]["care_consistency"],
            "Environment fit": health_score["subscores"]["environment_fit"],
            "Risk": health_score["subscores"]["risk"],
        },
        "reasons": health_score["reasons"],
        "recommendations": [
            "Focus first on the lowest sub-score.",
            "Add another log in a few days to confirm whether the score is improving.",
        ],
        "alerts": alerts,
    }


def build_weekly_summary_analysis(plant, logs):
    if not logs:
        return {
            "module": "weekly_summary",
            "title": "Weekly summary",
            "summary": "No logs are available yet.",
            "severity": "low",
            "metrics": {},
            "reasons": ["Add a log to begin weekly comparison."],
            "recommendations": ["Record growth, watering, environment, and health data together."],
            "alerts": [],
        }

    latest = logs[-1]
    height_delta = first_latest_delta(logs, "height_cm")
    leaf_delta = first_latest_delta(logs, "leaf_count")
    sunlight_delta = first_latest_delta(logs, "sunlight_hours")
    watering_values = [log.watering_amount_ml for log in logs if log.watering_amount_ml is not None]
    average_watering = round(sum(watering_values) / len(watering_values), 1) if watering_values else None

    reasons = [
        f"Growth: height is {trend_phrase(height_delta, 'cm')} and leaves are {trend_phrase(leaf_delta)} across recent logs.",
        f"Environment: sunlight is {trend_phrase(sunlight_delta, 'h')} across recent logs.",
        f"Health: latest self-assessment is {latest.overall_health or 'not recorded'}.",
    ]

    if latest.soil_moisture:
        reasons.append(f"Care: latest soil moisture is {latest.soil_moisture.lower()}.")

    alerts = []
    if latest.pest_signs and latest.pest_signs != "None":
        alerts.append(f"Latest log includes pest signs: {latest.pest_signs}.")
    if latest.disease_signs and latest.disease_signs != "None":
        alerts.append(f"Latest log includes disease signs: {latest.disease_signs}.")

    return {
        "module": "weekly_summary",
        "title": "Weekly summary",
        "summary": f"Recent logs cover {logs[0].log_date} to {logs[-1].log_date}.",
        "severity": "high" if alerts else "low",
        "metrics": {
            "Logs reviewed": len(logs),
            "Height change": None if height_delta is None else round(height_delta, 1),
            "Leaf change": None if leaf_delta is None else round(leaf_delta, 1),
            "Average watering ml": average_watering,
        },
        "reasons": reasons,
        "recommendations": ["Use the next log to confirm whether growth and care are moving in the same direction."],
        "alerts": alerts,
    }


def build_growth_trends_analysis(plant, logs):
    height_delta = first_latest_delta(logs, "height_cm")
    leaf_delta = first_latest_delta(logs, "leaf_count")
    flower_delta = first_latest_delta(logs, "flower_count")
    fruit_delta = first_latest_delta(logs, "fruit_count")
    alerts = []

    if height_delta is not None and height_delta < 0:
        alerts.append("Height declined across recent logs.")
    if leaf_delta is not None and leaf_delta < 0:
        alerts.append("Leaf count declined across recent logs.")

    if height_delta is None and leaf_delta is None:
        summary = "There is not enough comparable growth data yet."
    elif (height_delta or 0) > 0 or (leaf_delta or 0) > 0:
        summary = "Growth is moving forward, based on recent height or leaf count changes."
    else:
        summary = "Growth is mostly flat in the recent history."

    return {
        "module": "growth_trends",
        "title": "Growth trends",
        "summary": summary,
        "severity": "high" if alerts else "low",
        "metrics": {
            "Height change cm": None if height_delta is None else round(height_delta, 1),
            "Leaf change": None if leaf_delta is None else round(leaf_delta, 1),
            "Flower change": None if flower_delta is None else round(flower_delta, 1),
            "Fruit change": None if fruit_delta is None else round(fruit_delta, 1),
        },
        "reasons": [
            f"Height is {trend_phrase(height_delta, 'cm')}.",
            f"Leaf count is {trend_phrase(leaf_delta)}.",
            f"Flower and fruit progress is {trend_phrase((flower_delta or 0) + (fruit_delta or 0))}.",
        ],
        "recommendations": ["Compare growth with sunlight and watering when adding the next log."],
        "alerts": alerts,
    }


def build_environment_analysis(plant, logs):
    species_profile = get_species_profile(plant.species) or SPECIES_LIBRARY["generic_indoor_plant"]
    sunlight_outside, sunlight_total = count_outside_range(
        logs,
        "sunlight_hours",
        species_profile["ideal_sunlight_min"],
        species_profile["ideal_sunlight_max"],
    )
    temperature_outside, temperature_total = count_outside_range(
        logs,
        "temperature_c",
        species_profile["ideal_temperature_min"],
        species_profile["ideal_temperature_max"],
    )
    humidity_outside, humidity_total = count_outside_range(logs, "humidity_percent", 35, 85)
    alerts = []

    if sunlight_total and sunlight_outside / sunlight_total >= 0.5:
        alerts.append("Sunlight was often outside the species range.")
    if temperature_total and temperature_outside / temperature_total >= 0.5:
        alerts.append("Temperature was often outside the species range.")
    if humidity_total and humidity_outside / humidity_total >= 0.5:
        alerts.append("Humidity was often outside the general comfort range.")

    return {
        "module": "environment_conditions",
        "title": "Environment conditions",
        "summary": f"Compared recent logs with the {species_profile['common_name']} profile.",
        "severity": "medium" if alerts else "low",
        "metrics": {
            "Sunlight outside range": f"{sunlight_outside}/{sunlight_total}" if sunlight_total else "not logged",
            "Temperature outside range": f"{temperature_outside}/{temperature_total}" if temperature_total else "not logged",
            "Humidity outside range": f"{humidity_outside}/{humidity_total}" if humidity_total else "not logged",
        },
        "reasons": [
            f"Ideal sunlight is {species_profile['ideal_sunlight_min']}-{species_profile['ideal_sunlight_max']} hours.",
            f"Ideal temperature is {species_profile['ideal_temperature_min']}-{species_profile['ideal_temperature_max']} C.",
            "Humidity is checked only when logged, and missing values are not punished.",
        ],
        "recommendations": [
            "Adjust location gradually if sunlight or temperature is repeatedly outside the target range.",
            *species_profile["care_tips"][:1],
        ],
        "alerts": alerts,
    }


def build_health_risks_analysis(plant, logs):
    total = len(logs) or 1
    pest_count = sum(1 for log in logs if log.pest_signs and log.pest_signs != "None")
    disease_count = sum(1 for log in logs if log.disease_signs and log.disease_signs != "None")
    poor_count = sum(1 for log in logs if log.overall_health in {"Poor", "Very Poor"})
    stressed_leaf_count = sum(1 for log in logs if log.leaf_condition in {"Drooping", "Crispy", "Wilting", "Holes", "Spotted"})
    alerts = []

    if pest_count:
        alerts.append(f"Pest signs appeared in {pest_count} of {total} recent log(s).")
    if disease_count:
        alerts.append(f"Disease signs appeared in {disease_count} of {total} recent log(s).")
    if poor_count:
        alerts.append(f"Poor self-assessment appeared in {poor_count} of {total} recent log(s).")

    return {
        "module": "health_risks",
        "title": "Health risks",
        "summary": "Recent logs were checked for repeated pest, disease, and leaf stress patterns.",
        "severity": "high" if disease_count or pest_count >= 2 else "medium" if alerts else "low",
        "metrics": {
            "Pest logs": pest_count,
            "Disease logs": disease_count,
            "Poor health logs": poor_count,
            "Stressed leaf logs": stressed_leaf_count,
        },
        "reasons": [
            f"Pest signs appeared in {pest_count} of {total} recent log(s).",
            f"Disease signs appeared in {disease_count} of {total} recent log(s).",
            f"Stressed leaf condition appeared in {stressed_leaf_count} of {total} recent log(s).",
        ],
        "recommendations": [
            "Inspect leaves and stems closely if any risk signal repeats.",
            "Keep notes after treatment so LeafLogic can compare whether the pattern improves.",
        ],
        "alerts": alerts,
    }


@router.get("/plants/{plant_id}/analysis/{module_key}", response_model=schemas.AnalysisModuleResponse)
def get_plant_analysis_module(
    plant_id: int,
    module_key: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    plant = get_owned_plant(plant_id, db, current_user)
    logs = recent_logs_for_analysis(plant.logs)

    builders = {
        "health_score": build_health_score_analysis,
        "weekly_summary": build_weekly_summary_analysis,
        "growth_trends": build_growth_trends_analysis,
        "environment_conditions": build_environment_analysis,
        "health_risks": build_health_risks_analysis,
    }

    if module_key not in builders:
        raise HTTPException(status_code=404, detail="Analysis module not found")

    return builders[module_key](plant, logs)


@router.get("/plants/{plant_id}/insights", response_model=list[schemas.InsightResponse])
def get_plant_insights(
    plant_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    plant = get_owned_plant(plant_id, db, current_user)
    logs = sorted(plant.logs, key=lambda item: item.log_date)

    insights = []

    if len(logs) >= 2:
        previous_log = logs[-2]
        latest_log = logs[-1]

        if (
            previous_log.height_cm is not None and
            latest_log.height_cm is not None and
            previous_log.sunlight_hours is not None and
            latest_log.sunlight_hours is not None
        ):
            height_growth = latest_log.height_cm - previous_log.height_cm
            sunlight_change = latest_log.sunlight_hours - previous_log.sunlight_hours

            if height_growth <= 0.5 and sunlight_change < 0:
                insights.append({
                    "insight_type": "growth",
                    "severity": "medium",
                    "message": (
                        "Growth has slowed while sunlight decreased. "
                        "Lower light may be affecting this plant's progress."
                    )
                })

        if (
            latest_log.soil_moisture in {"Very Dry", "Dry"} and
            latest_log.leaf_condition in {"Wilting", "Drooping"}
        ):
            insights.append({
                "insight_type": "watering",
                "severity": "high",
                "message": (
                    "Soil moisture is low and the leaf condition suggests stress. "
                    "Check whether this plant needs a more consistent watering routine."
                )
            })

        if previous_log.leaf_count is not None and latest_log.leaf_count is not None:
            if latest_log.leaf_count < previous_log.leaf_count:
                insights.append({
                    "insight_type": "foliage",
                    "severity": "medium",
                    "message": "Leaf count dropped since the previous log. Review pest signs, watering, and leaf color notes."
                })

    if logs:
        latest_log = logs[-1]
        species_profile = get_species_profile(plant.species)

        if latest_log.pest_signs and latest_log.pest_signs != "None":
            insights.append({
                "insight_type": "pests",
                "severity": "high",
                "message": "Pest signs were recorded in the latest log. Inspect the plant and isolate it if needed."
            })

        if latest_log.disease_signs and latest_log.disease_signs != "None":
            insights.append({
                "insight_type": "disease",
                "severity": "high",
                "message": "Disease signs were recorded in the latest log. Review affected leaves, stems, and watering conditions."
            })

        if latest_log.humidity_percent is not None and latest_log.humidity_percent < 35:
            insights.append({
                "insight_type": "environment",
                "severity": "low",
                "message": "Humidity is on the low side. Watch for crispy leaf edges or slowed growth."
            })

        if species_profile:
            common_name = species_profile["common_name"]

            if latest_log.sunlight_hours is not None:
                if latest_log.sunlight_hours < species_profile["ideal_sunlight_min"]:
                    insights.append({
                        "insight_type": "species_sunlight_low",
                        "severity": "medium",
                        "message": (
                            f"{common_name} usually prefers at least "
                            f"{species_profile['ideal_sunlight_min']} hours of sunlight. "
                            f"The latest log has {latest_log.sunlight_hours} hours."
                        )
                    })

                if latest_log.sunlight_hours > species_profile["ideal_sunlight_max"]:
                    insights.append({
                        "insight_type": "species_sunlight_high",
                        "severity": "medium",
                        "message": (
                            f"{common_name} is above its usual sunlight range of "
                            f"{species_profile['ideal_sunlight_min']}-{species_profile['ideal_sunlight_max']} hours."
                        )
                    })

            if latest_log.temperature_c is not None:
                if latest_log.temperature_c < species_profile["ideal_temperature_min"]:
                    insights.append({
                        "insight_type": "species_temperature_low",
                        "severity": "medium",
                        "message": (
                            f"{common_name} is below its usual temperature range. "
                            f"Latest temperature is {latest_log.temperature_c} C."
                        )
                    })

                if latest_log.temperature_c > species_profile["ideal_temperature_max"]:
                    insights.append({
                        "insight_type": "species_temperature_high",
                        "severity": "medium",
                        "message": (
                            f"{common_name} is above its usual temperature range. "
                            f"Latest temperature is {latest_log.temperature_c} C."
                        )
                    })

            if (
                latest_log.soil_moisture and
                latest_log.soil_moisture not in species_profile["ideal_soil_moisture"]
            ):
                insights.append({
                    "insight_type": "species_soil_moisture",
                    "severity": "medium",
                    "message": (
                        f"{common_name} usually prefers soil moisture values like "
                        f"{', '.join(species_profile['ideal_soil_moisture'])}. "
                        f"The latest log says {latest_log.soil_moisture}."
                    )
                })

            if latest_log.days_since_last_watering is not None:
                if latest_log.days_since_last_watering < species_profile["watering_frequency_days_min"]:
                    insights.append({
                        "insight_type": "species_watering_frequent",
                        "severity": "medium",
                        "message": (
                            f"{common_name} may be watered too frequently. "
                            f"Ideal watering gap is about "
                            f"{species_profile['watering_frequency_days_min']}-"
                            f"{species_profile['watering_frequency_days_max']} days."
                        )
                    })

                if latest_log.days_since_last_watering > species_profile["watering_frequency_days_max"]:
                    insights.append({
                        "insight_type": "species_watering_infrequent",
                        "severity": "medium",
                        "message": (
                            f"{common_name} may be going too long between waterings. "
                            f"Ideal watering gap is about "
                            f"{species_profile['watering_frequency_days_min']}-"
                            f"{species_profile['watering_frequency_days_max']} days."
                        )
                    })

    if not insights:
        insights.append({
            "insight_type": "baseline",
            "severity": "low",
            "message": "Add a few more logs to unlock stronger trend-based insights."
        })

    return insights


@router.get("/plants/{plant_id}/health-score", response_model=schemas.HealthScoreResponse)
def get_plant_health_score(
    plant_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    plant = get_owned_plant(plant_id, db, current_user)
    logs = sorted(plant.logs, key=lambda item: item.log_date)

    return calculate_health_score(logs, plant.species)
