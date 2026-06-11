from marshmallow import Schema, fields, validate


class ChatStartSchema(Schema):
    pass


class ChatMessageSchema(Schema):
    message = fields.Str(required=True, validate=validate.Length(min=1, max=500))


class ChatHistorySchema(Schema):
    id = fields.Int()
    user_id = fields.Int()
    messages_json = fields.List(fields.Dict())
    summary = fields.Str()
    created_at = fields.DateTime()
