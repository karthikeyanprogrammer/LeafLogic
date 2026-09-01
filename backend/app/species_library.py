SPECIES_LIBRARY = {
    "tomato": {
        "common_name": "Tomato",
        "category": "Vegetable",
        "ideal_sunlight_min": 6,
        "ideal_sunlight_max": 8,
        "ideal_temperature_min": 18,
        "ideal_temperature_max": 30,
        "ideal_soil_moisture": ["Moist"],
        "watering_frequency_days_min": 1,
        "watering_frequency_days_max": 3,
        "care_tips": ["Keep sunlight high and water consistently.", "Support stems as fruit develops."],
        "common_warnings": ["Watch for wilting, leaf spots, and pests under leaves."],
    },
    "basil": {
        "common_name": "Basil",
        "category": "Herb",
        "ideal_sunlight_min": 5,
        "ideal_sunlight_max": 7,
        "ideal_temperature_min": 18,
        "ideal_temperature_max": 32,
        "ideal_soil_moisture": ["Slightly Dry", "Moist"],
        "watering_frequency_days_min": 1,
        "watering_frequency_days_max": 3,
        "care_tips": ["Pinch flowers to encourage leaf growth.", "Keep soil lightly moist, not soggy."],
        "common_warnings": ["Low light can slow leaf growth.", "Dry soil can cause drooping quickly."],
    },
    "rose": {
        "common_name": "Rose",
        "category": "Flower",
        "ideal_sunlight_min": 6,
        "ideal_sunlight_max": 8,
        "ideal_temperature_min": 15,
        "ideal_temperature_max": 29,
        "ideal_soil_moisture": ["Moist"],
        "watering_frequency_days_min": 2,
        "watering_frequency_days_max": 4,
        "care_tips": ["Provide strong light and prune spent blooms.", "Water at soil level when possible."],
        "common_warnings": ["Watch for black spots, white powder, and pests."],
    },
    "mint": {
        "common_name": "Mint",
        "category": "Herb",
        "ideal_sunlight_min": 3,
        "ideal_sunlight_max": 6,
        "ideal_temperature_min": 15,
        "ideal_temperature_max": 30,
        "ideal_soil_moisture": ["Moist", "Wet"],
        "watering_frequency_days_min": 1,
        "watering_frequency_days_max": 3,
        "care_tips": ["Keep soil consistently moist.", "Trim regularly to encourage bushy growth."],
        "common_warnings": ["Dry soil can quickly stress mint."],
    },
    "chilli": {
        "common_name": "Chilli",
        "category": "Vegetable",
        "ideal_sunlight_min": 6,
        "ideal_sunlight_max": 8,
        "ideal_temperature_min": 20,
        "ideal_temperature_max": 32,
        "ideal_soil_moisture": ["Slightly Dry", "Moist"],
        "watering_frequency_days_min": 2,
        "watering_frequency_days_max": 4,
        "care_tips": ["Give strong sunlight for flowering and fruiting.", "Avoid waterlogging."],
        "common_warnings": ["Low sunlight may reduce flowering and fruiting."],
    },
    "coriander": {
        "common_name": "Coriander",
        "category": "Herb",
        "ideal_sunlight_min": 4,
        "ideal_sunlight_max": 6,
        "ideal_temperature_min": 15,
        "ideal_temperature_max": 27,
        "ideal_soil_moisture": ["Moist"],
        "watering_frequency_days_min": 1,
        "watering_frequency_days_max": 3,
        "care_tips": ["Keep soil moist and avoid harsh afternoon heat.", "Harvest outer leaves gently."],
        "common_warnings": ["High heat can make coriander bolt early."],
    },
    "aloe_vera": {
        "common_name": "Aloe Vera",
        "category": "Succulent",
        "ideal_sunlight_min": 4,
        "ideal_sunlight_max": 6,
        "ideal_temperature_min": 18,
        "ideal_temperature_max": 35,
        "ideal_soil_moisture": ["Very Dry", "Dry", "Slightly Dry"],
        "watering_frequency_days_min": 10,
        "watering_frequency_days_max": 21,
        "care_tips": ["Let soil dry well between watering.", "Use bright light and fast-draining soil."],
        "common_warnings": ["Wet soil can lead to root rot."],
    },
    "money_plant": {
        "common_name": "Money Plant",
        "category": "Indoor Plant",
        "ideal_sunlight_min": 2,
        "ideal_sunlight_max": 5,
        "ideal_temperature_min": 18,
        "ideal_temperature_max": 32,
        "ideal_soil_moisture": ["Slightly Dry", "Moist"],
        "watering_frequency_days_min": 4,
        "watering_frequency_days_max": 7,
        "care_tips": ["Use bright indirect light.", "Let the top soil dry slightly before watering."],
        "common_warnings": ["Too much direct sun can scorch leaves."],
    },
    "cactus": {
        "common_name": "Cactus",
        "category": "Succulent",
        "ideal_sunlight_min": 5,
        "ideal_sunlight_max": 8,
        "ideal_temperature_min": 18,
        "ideal_temperature_max": 38,
        "ideal_soil_moisture": ["Very Dry", "Dry"],
        "watering_frequency_days_min": 14,
        "watering_frequency_days_max": 30,
        "care_tips": ["Use strong light and very well-draining soil.", "Water rarely and deeply."],
        "common_warnings": ["Frequent watering can rot roots."],
    },
    "generic_indoor_plant": {
        "common_name": "Generic Indoor Plant",
        "category": "Indoor Plant",
        "ideal_sunlight_min": 2,
        "ideal_sunlight_max": 5,
        "ideal_temperature_min": 18,
        "ideal_temperature_max": 30,
        "ideal_soil_moisture": ["Slightly Dry", "Moist"],
        "watering_frequency_days_min": 4,
        "watering_frequency_days_max": 8,
        "care_tips": ["Use bright indirect light.", "Adjust watering based on soil feel and leaf condition."],
        "common_warnings": ["Overwatering and low light are common indoor plant issues."],
    },
}


SPECIES_ALIASES = {
    "ocimum basilicum": "basil",
    "aloe vera": "aloe_vera",
    "money plant": "money_plant",
    "generic indoor plant": "generic_indoor_plant",
}


def normalize_species_key(species: str | None):
    if not species:
        return None

    normalized = species.strip().lower().replace("-", " ").replace("_", " ")
    normalized_key = normalized.replace(" ", "_")

    if normalized_key in SPECIES_LIBRARY:
        return normalized_key

    return SPECIES_ALIASES.get(normalized)


def get_species_profile(species: str | None):
    species_key = normalize_species_key(species)
    if not species_key:
        return None

    return SPECIES_LIBRARY.get(species_key)


def list_species_options():
    return [
        {"key": key, **profile}
        for key, profile in SPECIES_LIBRARY.items()
    ]
