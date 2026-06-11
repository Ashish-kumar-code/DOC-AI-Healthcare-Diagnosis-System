from marshmallow import Schema, fields, validate, pre_load


class TextDiagnosisSchema(Schema):
    age = fields.Int(required=True, validate=lambda n: 0 <= n <= 120)
    gender = fields.Str(required=True, validate=validate.OneOf(["male", "female", "other", "prefer_not_to_say"]))
    
    # Make symptom_text optional for structured input
    symptom_text = fields.Str(required=False, allow_none=True, validate=validate.Length(max=1000))
    
    duration_days = fields.Int(required=True, validate=lambda n: n > 0)
    
    # Allow both lowercase and title case for severity
    severity = fields.Str(required=True)
    
    temperature = fields.Float(required=False, allow_none=True)
    pain_level = fields.Int(required=False, allow_none=True, validate=lambda n: n is None or (0 <= n <= 10))

    @pre_load
    def normalize_input(self, data, **kwargs):
        """Normalize gender and severity to lowercase"""
        if isinstance(data, dict):
            if 'gender' in data and data['gender']:
                data['gender'] = data['gender'].lower().strip()
            if 'severity' in data and data['severity']:
                data['severity'] = data['severity'].lower().strip()
        return data


class MultimodalDiagnosisSchema(Schema):
    age = fields.Int(required=True, validate=lambda n: 0 <= n <= 120)
    gender = fields.Str(required=True, validate=validate.OneOf(["male", "female", "other", "prefer_not_to_say"]))
    symptom_text = fields.Str(required=False, allow_none=True, validate=validate.Length(max=1000))
    duration_days = fields.Int(required=True, validate=lambda n: n > 0)
    severity = fields.Str(required=True)
    temperature = fields.Float(required=False, allow_none=True)
    pain_level = fields.Int(required=False, allow_none=True, validate=lambda n: n is None or (0 <= n <= 10))
    image_type = fields.Str(required=False, allow_none=True)

    @pre_load
    def normalize_input(self, data, **kwargs):
        if isinstance(data, dict):
            if 'gender' in data and data['gender']:
                data['gender'] = data['gender'].lower().strip()
            if 'severity' in data and data['severity']:
                data['severity'] = data['severity'].lower().strip()
        return data


# Keep the rest unchanged
class ImageDiagnosisSchema(Schema):
    image_type = fields.Str(required=False, allow_none=True, validate=validate.OneOf(["xray", "skin_lesion", "general"]))


class DiagnosisHistorySchema(Schema):
    id = fields.Int()
    user_id = fields.Int()
    symptom_text = fields.Str()
    structured_symptoms_json = fields.Dict()
    text_prediction = fields.Dict()
    image_prediction = fields.Dict()
    final_prediction = fields.Str()
    confidence_score = fields.Float()
    advice = fields.Str()
    created_at = fields.DateTime()