from app.species_library import SPECIES_LIBRARY, get_species_profile


BAD_LEAF_COLORS = {"Yellowing", "Browning", "Black Spots", "White Patches", "Mixed Colors"}
BAD_LEAF_CONDITIONS = {"Drooping", "Curling", "Dry Edges", "Crispy", "Wilting", "Holes", "Spotted", "Torn"}
SEVERE_LEAF_CONDITIONS = {"Crispy", "Wilting", "Rotting"}
POOR_HEALTH = {"Poor", "Very Poor"}
DRY_WET_EXTREMES = {"Very Dry", "Waterlogged"}
MOISTURE_MISMATCH = {"Very Dry", "Dry", "Waterlogged"}


def clamp(value, minimum=0, maximum=100):
    return max(minimum, min(maximum, round(value)))


def label_for_score(score):
    if score >= 85:
        return "Excellent"
    if score >= 70:
        return "Good"
    if score >= 50:
        return "Needs Attention"
    if score >= 30:
        return "Poor"
    return "Critical"


def latest_seven(logs):
    return sorted(logs, key=lambda log: log.log_date)[-7:]


def count_matching(logs, predicate):
    return sum(1 for log in logs if predicate(log))


def current_health_score(latest_log, species_profile):
    score = 100
    reasons = []

    if latest_log.leaf_color in BAD_LEAF_COLORS:
        score -= 12
        reasons.append(f"Latest leaf color is {latest_log.leaf_color.lower()}, which reduces current health.")

    if latest_log.leaf_condition in BAD_LEAF_CONDITIONS:
        penalty = 18 if latest_log.leaf_condition in SEVERE_LEAF_CONDITIONS else 12
        score -= penalty
        reasons.append(f"Latest leaf condition is {latest_log.leaf_condition.lower()}.")

    if latest_log.pest_signs and latest_log.pest_signs != "None":
        score -= 18
        reasons.append("Pest signs are present in the latest log.")

    if latest_log.disease_signs and latest_log.disease_signs != "None":
        score -= 22
        reasons.append("Disease signs are present in the latest log.")

    if latest_log.overall_health in POOR_HEALTH:
        score -= 18 if latest_log.overall_health == "Poor" else 28
        reasons.append(f"Latest self-assessment is {latest_log.overall_health.lower()}.")
    elif latest_log.overall_health == "Average":
        score -= 8

    ideal_moisture = species_profile["ideal_soil_moisture"]
    if latest_log.soil_moisture and latest_log.soil_moisture not in ideal_moisture:
        score -= 12
        reasons.append(
            f"Soil moisture is {latest_log.soil_moisture.lower()}, outside the preferred range for this species."
        )

    if not reasons:
        reasons.append("Latest log shows no major leaf, pest, disease, or soil moisture problems.")

    return clamp(score), reasons


def growth_trend_score(logs):
    comparable = [log for log in logs if log.height_cm is not None or log.leaf_count is not None]

    if len(comparable) < 2:
        return 75, ["There is not enough growth history yet, so growth trend is treated cautiously."]

    first = comparable[0]
    latest = comparable[-1]
    height_change = None
    leaf_change = None

    if first.height_cm is not None and latest.height_cm is not None:
        height_change = latest.height_cm - first.height_cm

    if first.leaf_count is not None and latest.leaf_count is not None:
        leaf_change = latest.leaf_count - first.leaf_count

    recent_three = comparable[-3:] if len(comparable) >= 3 else comparable
    no_growth = False
    if len(recent_three) >= 3:
        heights = [log.height_cm for log in recent_three if log.height_cm is not None]
        leaves = [log.leaf_count for log in recent_three if log.leaf_count is not None]
        no_growth = (
            len(heights) >= 3 and max(heights) == min(heights)
        ) or (
            len(leaves) >= 3 and max(leaves) == min(leaves)
        )

    fruit_flower_progress = (
        (latest.flower_count or 0) - (first.flower_count or 0) +
        (latest.fruit_count or 0) - (first.fruit_count or 0)
    )

    if (height_change is not None and height_change < -2) or (leaf_change is not None and leaf_change < -4):
        return 25, ["Sudden major decline detected in height or leaf count."]

    if (height_change is not None and height_change < 0) or (leaf_change is not None and leaf_change < 0):
        return 42, ["Height or leaf count declined across recent logs."]

    if no_growth:
        return 58, ["No clear growth was detected across three or more recent logs."]

    growth_signal = (height_change or 0) + ((leaf_change or 0) * 0.35) + (fruit_flower_progress * 0.5)

    if growth_signal >= 3:
        return 94, ["Growth is steadily increasing across recent logs."]

    if growth_signal > 0:
        return 78, ["Growth is still positive but slower than strong growth patterns."]

    return 65, ["Growth is mostly flat, with no strong decline."]


def care_consistency_score(logs, species_profile):
    score = 92
    reasons = []

    watering_amounts = [log.watering_amount_ml for log in logs if log.watering_amount_ml is not None]
    watering_gaps = [log.days_since_last_watering for log in logs if log.days_since_last_watering is not None]
    moisture_values = [log.soil_moisture for log in logs if log.soil_moisture]

    if len(watering_amounts) >= 3:
        spread = max(watering_amounts) - min(watering_amounts)
        average = sum(watering_amounts) / len(watering_amounts)
        if average and spread / average > 0.75:
            score -= 18
            reasons.append("Watering amounts vary a lot across recent logs.")
        elif average and spread / average > 0.35:
            score -= 8
            reasons.append("Watering amounts show minor inconsistency.")

    min_gap = species_profile["watering_frequency_days_min"]
    max_gap = species_profile["watering_frequency_days_max"]
    outside_gaps = sum(1 for gap in watering_gaps if gap < min_gap or gap > max_gap)
    if watering_gaps and outside_gaps:
        ratio = outside_gaps / len(watering_gaps)
        score -= 25 if ratio >= 0.5 else 10
        reasons.append(f"Watering interval was outside the species range in {outside_gaps} recent log(s).")

    extreme_moisture = sum(1 for value in moisture_values if value in DRY_WET_EXTREMES)
    dry_wet_swings = "Very Dry" in moisture_values and "Waterlogged" in moisture_values
    if extreme_moisture >= 3:
        score -= 35
        reasons.append("Repeated very dry or waterlogged soil was logged.")
    elif dry_wet_swings:
        score -= 22
        reasons.append("Soil moisture swung between very dry and waterlogged.")
    elif extreme_moisture:
        score -= 10
        reasons.append("One or more soil moisture extremes were logged.")

    fertilizer_values = [log.fertilizer_used for log in logs if log.fertilizer_used]
    fertilizer_uses = [value for value in fertilizer_values if value != "None"]
    if len(fertilizer_uses) >= 4:
        score -= 10
        reasons.append("Fertilizer appears frequently in recent logs; avoid overfeeding.")
    elif len(logs) >= 7 and not fertilizer_uses:
        score -= 5
        reasons.append("No fertilizer use appears in the recent history.")

    if not reasons:
        reasons.append("Watering and soil moisture have stayed mostly stable.")

    return clamp(score), reasons


def environment_fit_score(logs, species_profile):
    score = 95
    reasons = []
    measured = 0
    outside = 0
    severe = 0

    for log in logs:
        if log.sunlight_hours is not None:
            measured += 1
            if log.sunlight_hours < species_profile["ideal_sunlight_min"] or log.sunlight_hours > species_profile["ideal_sunlight_max"]:
                outside += 1
            if log.sunlight_hours < species_profile["ideal_sunlight_min"] - 2 or log.sunlight_hours > species_profile["ideal_sunlight_max"] + 3:
                severe += 1

        if log.temperature_c is not None:
            measured += 1
            if log.temperature_c < species_profile["ideal_temperature_min"] or log.temperature_c > species_profile["ideal_temperature_max"]:
                outside += 1
            if log.temperature_c < species_profile["ideal_temperature_min"] - 5 or log.temperature_c > species_profile["ideal_temperature_max"] + 5:
                severe += 1

        if log.humidity_percent is not None:
            measured += 1
            if log.humidity_percent < 35 or log.humidity_percent > 85:
                outside += 1
            if log.humidity_percent < 25 or log.humidity_percent > 90:
                severe += 1

        if log.wind_exposure == "Strong":
            measured += 1
            outside += 1

        if log.rain_exposure == "Heavy Rain":
            measured += 1
            outside += 1

    if not measured:
        return 75, ["Environment fit has limited data, so it is scored cautiously."]

    outside_ratio = outside / measured
    severe_ratio = severe / measured

    if severe_ratio >= 0.35:
        score = 30
        reasons.append("Environment values were severely outside the preferred range repeatedly.")
    elif outside_ratio >= 0.55:
        score = 52
        reasons.append("Environment values were frequently outside the preferred range.")
    elif outside_ratio >= 0.2:
        score = 74
        reasons.append("Environment was occasionally outside the preferred range.")
    else:
        score = 92
        reasons.append("Environment values were mostly within the preferred range.")

    return clamp(score), reasons


def risk_score(logs):
    score = 100
    reasons = []
    total = len(logs) or 1

    pest_count = count_matching(logs, lambda log: log.pest_signs and log.pest_signs != "None")
    disease_count = count_matching(logs, lambda log: log.disease_signs and log.disease_signs != "None")
    poor_count = count_matching(logs, lambda log: log.overall_health in POOR_HEALTH)

    score -= (pest_count / total) * 30
    score -= (disease_count / total) * 35
    score -= (poor_count / total) * 25

    leaf_color_order = ["Dark Green", "Healthy Green", "Pale Green", "Yellowing", "Browning", "Black Spots", "White Patches", "Mixed Colors"]
    leaf_condition_order = ["Healthy", "Drooping", "Curling", "Dry Edges", "Crispy", "Wilting", "Holes", "Spotted", "Torn"]

    if len(logs) >= 2:
        first = logs[0]
        latest = logs[-1]
        if first.leaf_color in leaf_color_order and latest.leaf_color in leaf_color_order:
            if leaf_color_order.index(latest.leaf_color) > leaf_color_order.index(first.leaf_color):
                score -= 12
                reasons.append("Leaf color appears to be worsening across recent logs.")

        if first.leaf_condition in leaf_condition_order and latest.leaf_condition in leaf_condition_order:
            if leaf_condition_order.index(latest.leaf_condition) > leaf_condition_order.index(first.leaf_condition):
                score -= 12
                reasons.append("Leaf condition appears to be worsening across recent logs.")

    if pest_count:
        reasons.append(f"Recent history: pest signs appeared in {pest_count} of the recent log(s).")
    else:
        reasons.append("No repeated pest signs were detected.")

    if disease_count:
        reasons.append(f"Recent history: disease signs appeared in {disease_count} of the recent log(s).")
    else:
        reasons.append("No repeated disease signs were detected.")

    return clamp(score), reasons


def calculate_health_score(logs, species):
    recent_logs = latest_seven(logs)
    species_profile = get_species_profile(species) or SPECIES_LIBRARY["generic_indoor_plant"]

    if not recent_logs:
        return {
            "score": 0,
            "label": "Needs Attention",
            "subscores": {
                "current_health": 0,
                "growth_trend": 0,
                "care_consistency": 0,
                "environment_fit": 0,
                "risk": 0,
            },
            "reasons": ["No logs are available yet, so a health score cannot be calculated."],
        }

    latest_log = recent_logs[-1]
    current_score, current_reasons = current_health_score(latest_log, species_profile)
    growth_score, growth_reasons = growth_trend_score(recent_logs)
    care_score, care_reasons = care_consistency_score(recent_logs, species_profile)
    environment_score, environment_reasons = environment_fit_score(recent_logs, species_profile)
    risk_subscore, risk_reasons = risk_score(recent_logs)

    if len(recent_logs) < 3:
        weights = {
            "current_health": 0.45,
            "growth_trend": 0.10,
            "care_consistency": 0.15,
            "environment_fit": 0.20,
            "risk": 0.10,
        }
        history_reason = "Fewer than 3 logs exist, so the score relies more on current health and environment fit."
    else:
        weights = {
            "current_health": 0.30,
            "growth_trend": 0.25,
            "care_consistency": 0.20,
            "environment_fit": 0.15,
            "risk": 0.10,
        }
        history_reason = "Score uses the latest log plus recent history from up to 7 logs."

    final_score = clamp(
        weights["current_health"] * current_score +
        weights["growth_trend"] * growth_score +
        weights["care_consistency"] * care_score +
        weights["environment_fit"] * environment_score +
        weights["risk"] * risk_subscore
    )

    reasons = [
        history_reason,
        current_reasons[0],
        growth_reasons[0],
        care_reasons[0],
        environment_reasons[0],
        risk_reasons[0],
    ]

    return {
        "score": final_score,
        "label": label_for_score(final_score),
        "subscores": {
            "current_health": current_score,
            "growth_trend": growth_score,
            "care_consistency": care_score,
            "environment_fit": environment_score,
            "risk": risk_subscore,
        },
        "reasons": reasons,
    }
