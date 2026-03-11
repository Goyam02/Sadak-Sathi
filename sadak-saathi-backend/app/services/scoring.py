SOURCE_WEIGHTS = {
    "camera": 0.5,
    "accelerometer": 0.3,
    "human": 0.8
}

def calculate_confidence(old_conf, report_conf, source):
    weight = SOURCE_WEIGHTS.get(source, 0.3)
    return old_conf + (report_conf * weight)


def calculate_severity(confidence):
    if confidence < 2:
        return 1, "candidate"
    elif confidence < 5:
        return 2, "candidate"
    elif confidence < 10:
        return 3, "confirmed"
    elif confidence < 20:
        return 4, "confirmed"
    else:
        return 5, "critical"
