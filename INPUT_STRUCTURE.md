# LeafLogic Input Structure

This document defines the exact input structure for the LeafLogic application.

The app is designed around structured plant tracking data. Most inputs should use selectable predefined options instead of free text so the backend can generate meaningful insights and correlations.

---

# Design Philosophy

LeafLogic is not a scientific laboratory system.

The app should:
- feel easy and fast to use
- encourage consistent logging
- use structured inputs for analysis
- minimize typing

Only one free-text field should exist:
- General Notes

Everything else should use:
- dropdowns
- radio buttons
- sliders
- chips
- selectable options

---

# Plant Creation Inputs

These inputs are entered once when creating a plant.

---

## Text Inputs

### Plant Name
```txt
Type: Text
Required: Yes
```

### Species
```txt
Type: Text
Required: Yes
```

---

## Numeric Inputs

### Pot Size
```txt
Type: Number
Unit: cm
Required: No
```

---

## Selectable Inputs

### Plant Type

```txt
- Vegetable
- Fruit
- Flower
- Herb
- Succulent
- Indoor Plant
- Tree
- Shrub
- Other
```

### Location

```txt
- Indoor
- Balcony
- Outdoor
- Greenhouse
- Terrace
```

### Soil Type

```txt
- Garden Soil
- Potting Mix
- Sandy Soil
- Clay Soil
- Coco Peat
- Compost Rich
- Mixed Soil
```

---

## Date Inputs

### Planting Date
```txt
Type: Date
Required: No
```

---

## Free Text

### General Plant Notes
```txt
Type: Multiline Text
Required: No
```

---

# Plant Log Inputs

Plant logs are recurring entries added over time.

The log page should be divided into sections:

```txt
1. Growth
2. Watering
3. Environment
4. Health
5. Care Actions
6. Media
7. Notes
```

---

# 1. Growth Inputs

## Numeric Inputs

### Height
```txt
Type: Number
Unit: cm
```

### Leaf Count
```txt
Type: Number
```

### Flower Count
```txt
Type: Number
```

### Fruit Count
```txt
Type: Number
```

---

## Selectable Inputs

### Growth Stage

```txt
- Seedling
- Young Plant
- Vegetative
- Flowering
- Fruiting
- Mature
- Drying
```

---

# 2. Watering Inputs

## Numeric Inputs

### Watering Amount
```txt
Type: Number
Unit: ml
```

### Days Since Last Watering
```txt
Type: Number
Unit: days
```

---

## Selectable Inputs

### Soil Moisture

```txt
- Very Dry
- Dry
- Slightly Dry
- Moist
- Wet
- Waterlogged
```

---

# 3. Environment Inputs

## Numeric Inputs

### Sunlight Exposure
```txt
Type: Number
Unit: hours per day
```

### Temperature
```txt
Type: Number
Unit: °C
```

### Humidity
```txt
Type: Number
Unit: %
```

---

## Selectable Inputs

### Rain Exposure

```txt
- No Rain
- Light Rain
- Moderate Rain
- Heavy Rain
```

### Wind Exposure

```txt
- None
- Low
- Moderate
- Strong
```

---

# 4. Health Inputs

## Selectable Inputs

### Leaf Color

```txt
- Dark Green
- Healthy Green
- Pale Green
- Yellowing
- Browning
- Black Spots
- White Patches
- Mixed Colors
```

### Leaf Condition

```txt
- Healthy
- Drooping
- Curling
- Dry Edges
- Crispy
- Wilting
- Holes
- Spotted
- Torn
```

### Stem Condition

```txt
- Strong
- Weak
- Bending
- Soft
- Cracked
- Rotting
```

### Pest Signs

```txt
- None
- Small Insects
- Holes in Leaves
- White Powder
- Sticky Residue
- Webbing
- Chewed Leaves
- Unknown Pest Signs
```

### Disease Signs

```txt
- None
- Yellow Spots
- Brown Spots
- White Mold
- Black Mold
- Root Rot Signs
- Leaf Rot
- Stem Rot
- Unknown Disease Signs
```

### Overall Health Self Assessment

```txt
- Excellent
- Good
- Average
- Poor
- Very Poor
```

---

# 5. Care Action Inputs

## Selectable Inputs

### Fertilizer Used

```txt
- None
- Compost
- Organic Fertilizer
- Liquid Fertilizer
- Nitrogen Rich
- Phosphorus Rich
- Potassium Rich
- Balanced Fertilizer
```

### Pruning Status

```txt
- No Pruning
- Light Pruning
- Heavy Pruning
```

### Pesticide Used

```txt
- None
- Neem Oil
- Organic Pesticide
- Chemical Pesticide
- Fungicide
```

---

# 6. Media Inputs

## Optional Image Upload

```txt
Purpose:
Visual history only

IMPORTANT:
Images are NOT analyzed by AI.
Images are stored only as visual references for the user.
```

---

# 7. Notes

## General Notes

```txt
Type: Multiline Text
Purpose:
User observations that do not fit predefined categories.
```

---

# Backend Recommendations

- Store selectable inputs as enums/constants
- Keep numeric values nullable
- Logs should belong to plants
- Plants should belong to users

Recommended structure:

```txt
User
└── Plants
    └── Plant Logs
```

---

# Future Insight System

The app should later generate:

- growth trends
- watering consistency analysis
- sunlight correlation insights
- health score calculations
- anomaly detection
- recommendation messages
- weekly summaries

The system should analyze relationships between metrics over time instead of simply displaying individual graphs.