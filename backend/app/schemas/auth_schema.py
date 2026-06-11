from marshmallow import Schema, fields, validate, ValidationError


class RegisterSchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=2, max=128))
    email = fields.Email(required=True, validate=validate.Length(max=256))
    password = fields.Str(required=True, validate=validate.Length(min=8, max=128))
    age = fields.Int(required=False, allow_none=True, validate=lambda n: n is None or (0 <= n <= 120))
    gender = fields.Str(required=False, allow_none=True, validate=validate.OneOf(["male", "female", "other", "prefer_not_to_say"]))


class LoginSchema(Schema):
    email = fields.Email(required=True, validate=validate.Length(max=256))
    password = fields.Str(required=True, validate=validate.Length(min=8, max=128))
