"""
DOC AI - Multimodal Fusion (Text + Image)
Weighted fusion with confidence-based abstention and safety warnings.
"""

import logging

logger = logging.getLogger(__name__)

# Confidence thresholds
CONFIDENCE_THRESHOLD_ABSTAIN = 40.0  # Below this, flag as unreliable
CONFIDENCE_THRESHOLD_LOW = 60.0      # Below this, recommend further evaluation


def fuse_results(text_result=None, image_result=None, text_weight=0.6, image_weight=0.4):
    """
    Fuse text and image predictions with weighted logic and confidence-based safety.

    Returns a result dict with:
    - final_prediction: the predicted disease
    - final_confidence: weighted confidence score
    - confidence_level: 'high', 'medium', 'low', or 'abstain'
    - method: fusion method used
    - safety_warning: optional warning for low confidence
    """
    result = {
        "text_result": text_result,
        "image_result": image_result,
        "final_prediction": None,
        "final_confidence": 0.0,
        "confidence_level": "none",
        "method": "unknown",
        "text_confidence": 0.0,
        "image_confidence": 0.0,
        "safety_warning": None,
    }

    if not text_result and not image_result:
        raise ValueError("At least one result (text or image) must be provided")

    # Only Text
    if not image_result:
        conf = text_result.get("confidence", 0.0)
        result.update({
            "final_prediction": text_result.get("predicted_disease"),
            "final_confidence": conf,
            "confidence_level": _classify_confidence(conf),
            "method": "text_only",
            "safety_warning": _get_safety_warning(conf),
        })
        # Pass through differential diagnosis if available
        if "differential_diagnosis" in text_result:
            result["differential_diagnosis"] = text_result["differential_diagnosis"]
        return result

    # Only Image
    if not text_result:
        conf = image_result.get("confidence", 0.0)
        result.update({
            "final_prediction": image_result.get("predicted_class") or image_result.get("predicted_disease"),
            "final_confidence": conf,
            "confidence_level": _classify_confidence(conf),
            "method": "image_only",
            "safety_warning": _get_safety_warning(conf),
        })
        return result

    # Both available — Fusion
    text_conf = float(text_result.get("confidence", 0.0))
    image_conf = float(image_result.get("confidence", 0.0))

    result["text_confidence"] = text_conf
    result["image_confidence"] = image_conf

    # Weighted fusion using real confidence scores
    if text_conf > image_conf + 15:
        final_pred = text_result.get("predicted_disease")
        final_conf = text_conf * text_weight + image_conf * image_weight
        method = "text_dominant"
    elif image_conf > text_conf + 15:
        final_pred = image_result.get("predicted_class") or image_result.get("predicted_disease")
        final_conf = text_conf * text_weight + image_conf * image_weight
        method = "image_dominant"
    else:
        # Close confidence — use weighted average, prefer text
        final_pred = text_result.get("predicted_disease")
        final_conf = text_conf * text_weight + image_conf * image_weight
        method = "balanced_fusion"

    # Check for disagreement between modalities
    text_disease = text_result.get("predicted_disease", "")
    image_disease = image_result.get("predicted_class") or image_result.get("predicted_disease", "")

    if text_disease and image_disease and text_disease != image_disease:
        # Disagreement — reduce confidence and note it
        final_conf = final_conf * 0.85  # Penalize disagreement
        method += "_disagreement"
        logger.info(f"Modality disagreement: text={text_disease}, image={image_disease}")

    confidence_level = _classify_confidence(final_conf)
    safety_warning = _get_safety_warning(final_conf)

    result.update({
        "final_prediction": final_pred,
        "final_confidence": round(min(100.0, final_conf), 2),
        "confidence_level": confidence_level,
        "method": method,
        "safety_warning": safety_warning,
    })

    # Pass through differential diagnosis from text if available
    if "differential_diagnosis" in text_result:
        result["differential_diagnosis"] = text_result["differential_diagnosis"]

    return result


def _classify_confidence(confidence):
    """Classify confidence into levels for frontend display."""
    if confidence >= 80.0:
        return "high"
    elif confidence >= 60.0:
        return "medium"
    elif confidence >= CONFIDENCE_THRESHOLD_ABSTAIN:
        return "low"
    else:
        return "abstain"


def _get_safety_warning(confidence):
    """Generate safety warning for low-confidence predictions."""
    if confidence < CONFIDENCE_THRESHOLD_ABSTAIN:
        return ("⚠️ VERY LOW CONFIDENCE: This prediction is unreliable and should not be used "
                "for any medical decision. Please consult a qualified healthcare professional.")
    elif confidence < CONFIDENCE_THRESHOLD_LOW:
        return ("This prediction has limited confidence. Multiple conditions may be possible. "
                "Professional medical evaluation is strongly recommended.")
    return None