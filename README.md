# LeafLogic

LeafLogic is a plant growth tracking and insight platform.

The app is not focused on image analysis. Users may upload plant images only as visual records. The main purpose of LeafLogic is to let users manually enter plant growth and care data over time, then connect that data to generate useful observations, trends, and recommendations.

---

## Core Idea

Users can:

- Create an account
- Add plants
- Log plant data regularly
- Store optional plant images
- Track plant growth over time
- View timelines and charts
- Receive rule-based insights based on their manual inputs

Example insight:

> Your tomato plant's growth slowed during the same week sunlight exposure dropped. Low sunlight may be affecting growth.

---

## Tech Stack

### Frontend
- React
- Vite
- JavaScript
- CSS

### Backend
- FastAPI
- SQLAlchemy
- Pydantic
- SQLite

---

## Main Features

### Current / Planned Features

- User signup and login
- JWT authentication
- User-specific plant data
- Add, view, edit, and delete plants
- Add plant logs
- Store optional plant images
- Plant growth timeline
- Charts for height, leaf count, watering, sunlight, etc.
- Rule-based insight generation
- Dashboard summaries

---

## What LeafLogic Does Not Do

LeafLogic does not analyze plant images using computer vision.

Images are only stored as visual records so users can compare plant appearance over time.

---

## Data Users Can Log

For each plant log, users may enter:

- Date
- Optional image
- Height in cm
- Leaf count
- Soil moisture level
- Watering amount in ml
- Sunlight exposure in hours
- Temperature in °C
- Humidity percentage
- Fertilizer used
- Pest signs
- Leaf color
- General health notes

---

## Suggested Database Structure

```txt
users
├── id
├── name
├── email
├── password_hash
└── created_at

plants
├── id
├── owner_id
├── name
├── species
├── location
├── planted_date
├── notes
└── created_at

plant_logs
├── id
├── plant_id
├── log_date
├── image_path
├── height_cm
├── leaf_count
├── soil_moisture
├── watering_amount_ml
├── sunlight_hours
├── temperature_c
├── humidity_percent
├── fertilizer_used
├── pest_signs
├── leaf_color
├── health_notes
└── created_at

insights
├── id
├── plant_id
├── insight_type
├── message
├── severity
└── created_at