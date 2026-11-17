import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DocumentRead(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    user_id: uuid.UUID
    original_filename: str
    stored_filename: str
    file_type: str
    file_size: int
    processing_status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
