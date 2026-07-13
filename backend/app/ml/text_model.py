"""
DOC AI - Free-Text Symptom Diagnosis Model
Uses TF-IDF on natural symptom descriptions + structured features.
Includes cross-validation, per-class metrics, model versioning, and explainability.
"""

import os
import hashlib
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_validate
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.metrics import accuracy_score, classification_report, precision_recall_fscore_support
import logging

logger = logging.getLogger(__name__)

MODEL_PATH = "app/ml/text_model.joblib"
DATASET_PATH = "datasets/symptom_dataset.csv"

# Confidence thresholds for clinical safety
CONFIDENCE_HIGH = 80.0    # High confidence — recommend doctor visit
CONFIDENCE_MEDIUM = 60.0  # Medium — suggest evaluation
CONFIDENCE_LOW = 40.0     # Low — abstain / flag uncertainty


def _compute_dataset_hash(df):
    """Compute a hash of the dataset for versioning."""
    return hashlib.md5(pd.util.hash_pandas_object(df).values.tobytes()).hexdigest()[:12]


def train_text_model(force_retrain=False):
    """Train hybrid free-text + structured model with cross-validation."""
    if os.path.exists(MODEL_PATH) and not force_retrain:
        try:
            model_data = joblib.load(MODEL_PATH)
            logger.info(f"Loaded existing model v{model_data.get('version', '?')}. "
                        f"CV Accuracy: {model_data.get('cv_accuracy_mean', 'N/A')}%")
            return {"status": "loaded", **_extract_metrics(model_data)}
        except Exception:
            pass

    logger.info("Training free-text symptom diagnosis model...")

    df = pd.read_csv(DATASET_PATH)
    dataset_hash = _compute_dataset_hash(df)

    X = df[['symptom_text', 'age', 'gender', 'duration_days', 'severity', 'temperature', 'pain_level']]
    y = df['disease']

    # Build pipeline
    text_transformer = TfidfVectorizer(
        max_features=800,
        stop_words='english',
        ngram_range=(1, 2),
        min_df=2
    )

    numeric_features = ['age', 'duration_days', 'temperature', 'pain_level']
    categorical_features = ['gender', 'severity']

    preprocessor = ColumnTransformer(
        transformers=[
            ('text', text_transformer, 'symptom_text'),
            ('num', StandardScaler(), numeric_features),
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features),
        ],
        remainder='drop'
    )

    model = Pipeline([
        ('preprocessor', preprocessor),
        ('classifier', RandomForestClassifier(
            n_estimators=500,
            max_depth=20,
            min_samples_split=3,
            min_samples_leaf=2,
            random_state=42,
            class_weight='balanced',
            n_jobs=-1
        ))
    ])

    # --- Stratified K-Fold Cross-Validation ---
    n_splits = min(5, min(y.value_counts()))  # Ensure enough samples per fold
    n_splits = max(2, n_splits)  # At least 2-fold
    skf = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)

    cv_results = cross_validate(
        model, X, y, cv=skf,
        scoring=['accuracy', 'f1_weighted', 'precision_weighted', 'recall_weighted'],
        return_train_score=True,
        n_jobs=-1
    )

    cv_accuracy_mean = float(np.mean(cv_results['test_accuracy'])) * 100
    cv_accuracy_std = float(np.std(cv_results['test_accuracy'])) * 100
    cv_f1_mean = float(np.mean(cv_results['test_f1_weighted'])) * 100

    logger.info(f"Cross-validation ({n_splits}-fold): "
                f"Accuracy={cv_accuracy_mean:.1f}% +/- {cv_accuracy_std:.1f}%, "
                f"F1={cv_f1_mean:.1f}%")

    # --- Final model training on full train split ---
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.15, random_state=42, stratify=y
    )

    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    test_accuracy = accuracy_score(y_test, y_pred) * 100

    # Per-class metrics
    class_names = sorted(y.unique().tolist())
    precision, recall, f1, support = precision_recall_fscore_support(
        y_test, y_pred, labels=class_names, zero_division=0
    )
    per_class_metrics = {
        name: {
            "precision": round(float(precision[i]) * 100, 1),
            "recall": round(float(recall[i]) * 100, 1),
            "f1": round(float(f1[i]) * 100, 1),
            "support": int(support[i])
        }
        for i, name in enumerate(class_names)
    }

    # Model versioning metadata
    model_data = {
        'model': model,
        'version': datetime.utcnow().strftime('%Y%m%d_%H%M%S'),
        'trained_at': datetime.utcnow().isoformat(),
        'dataset_hash': dataset_hash,
        'dataset_rows': len(df),
        'dataset_classes': len(class_names),
        'class_names': class_names,
        'test_accuracy': round(test_accuracy, 2),
        'cv_accuracy_mean': round(cv_accuracy_mean, 2),
        'cv_accuracy_std': round(cv_accuracy_std, 2),
        'cv_f1_mean': round(cv_f1_mean, 2),
        'cv_folds': n_splits,
        'per_class_metrics': per_class_metrics,
        'feature_names': numeric_features + categorical_features,
    }

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(model_data, MODEL_PATH)

    logger.info(f"Model trained. Test Accuracy: {test_accuracy:.1f}%, "
                f"CV Accuracy: {cv_accuracy_mean:.1f}% +/- {cv_accuracy_std:.1f}%")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))

    return {"status": "trained", **_extract_metrics(model_data)}


def _extract_metrics(model_data):
    """Extract summary metrics from model_data dict."""
    return {
        "version": model_data.get('version'),
        "test_accuracy": model_data.get('test_accuracy'),
        "cv_accuracy_mean": model_data.get('cv_accuracy_mean'),
        "cv_accuracy_std": model_data.get('cv_accuracy_std'),
        "cv_f1_mean": model_data.get('cv_f1_mean'),
        "cv_folds": model_data.get('cv_folds'),
        "dataset_rows": model_data.get('dataset_rows'),
        "per_class_metrics": model_data.get('per_class_metrics'),
    }


def predict_diagnosis(input_data: dict):
    """Predict with confidence thresholds, top-3 differential, and explainability."""
    if not os.path.exists(MODEL_PATH):
        logger.warning("Text model not found. Using fallback.")
        return {
            "predicted_disease": "Unknown",
            "confidence": 0.0,
            "model_accuracy": None,
            "confidence_level": "none",
            "recommendation": "Model not trained. Run train_text_model() first.",
            "error": "Model not trained."
        }

    try:
        model_data = joblib.load(MODEL_PATH)
        model = model_data['model']
        class_names = model_data.get('class_names', [])

        # Ensure symptom_text exists
        if 'symptom_text' not in input_data or not input_data['symptom_text']:
            input_data['symptom_text'] = " ".join([
                f"{k}: {v}" for k, v in input_data.items()
                if k not in ['symptom_text']
            ])

        input_df = pd.DataFrame([input_data])

        prediction = model.predict(input_df)[0]
        proba = model.predict_proba(input_df)[0]
        confidence = float(max(proba)) * 100

        # Confidence level classification
        if confidence >= CONFIDENCE_HIGH:
            confidence_level = "high"
        elif confidence >= CONFIDENCE_MEDIUM:
            confidence_level = "medium"
        elif confidence >= CONFIDENCE_LOW:
            confidence_level = "low"
        else:
            confidence_level = "very_low"

        # Top-3 differential diagnosis
        sorted_indices = np.argsort(proba)[::-1][:3]
        if class_names:
            all_classes = model.classes_
        else:
            all_classes = model.classes_

        differential = []
        for idx in sorted_indices:
            prob = float(proba[idx]) * 100
            if prob > 1.0:  # Only include if >1%
                differential.append({
                    "disease": str(all_classes[idx]),
                    "probability": round(prob, 2)
                })

        # Feature importance (top contributing features)
        feature_importance = _get_feature_importance(model, input_df)

        # Build recommendation based on confidence level
        if confidence_level == "very_low":
            recommendation = ("⚠️ Very low confidence. This prediction is unreliable. "
                              "Please consult a qualified doctor immediately.")
        elif confidence_level == "low":
            recommendation = ("Low confidence assessment. Multiple conditions are possible. "
                              "Professional medical evaluation is strongly recommended.")
        elif confidence_level == "medium":
            recommendation = ("Moderate confidence. This is a preliminary assessment. "
                              "Please consult a doctor for confirmation and treatment.")
        else:
            recommendation = ("This AI assessment has reasonable confidence, but is not a diagnosis. "
                              "Please consult a qualified doctor for proper evaluation.")

        result = {
            "predicted_disease": prediction,
            "confidence": round(confidence, 2),
            "confidence_level": confidence_level,
            "model_accuracy": model_data.get('cv_accuracy_mean'),
            "model_version": model_data.get('version'),
            "differential_diagnosis": differential,
            "recommendation": recommendation,
        }

        if feature_importance:
            result["contributing_factors"] = feature_importance

        return result

    except Exception as e:
        logger.error(f"Text prediction error: {e}")
        return {"error": f"Prediction error: {str(e)}"}


def _get_feature_importance(model, input_df):
    """Extract top contributing features for explainability."""
    try:
        classifier = model.named_steps['classifier']
        preprocessor = model.named_steps['preprocessor']

        # Get feature names from the preprocessor
        feature_names = []

        # TF-IDF feature names
        tfidf = preprocessor.named_transformers_['text']
        if hasattr(tfidf, 'get_feature_names_out'):
            feature_names.extend([f"text:{name}" for name in tfidf.get_feature_names_out()])

        # Numeric feature names
        feature_names.extend(['age', 'duration_days', 'temperature', 'pain_level'])

        # Categorical feature names
        cat_encoder = preprocessor.named_transformers_['cat']
        if hasattr(cat_encoder, 'get_feature_names_out'):
            feature_names.extend(cat_encoder.get_feature_names_out())

        importances = classifier.feature_importances_

        # Get top 5 most important features
        if len(importances) == len(feature_names):
            top_indices = np.argsort(importances)[::-1][:5]
            return [
                {"feature": feature_names[i], "importance": round(float(importances[i]) * 100, 2)}
                for i in top_indices
                if importances[i] > 0.01
            ]
    except Exception as e:
        logger.debug(f"Feature importance extraction failed: {e}")

    return None


# Backward compatibility
predict_text_symptoms = predict_diagnosis