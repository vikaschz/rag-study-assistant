import logging
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.deps import get_current_user
from app.models import Document, User
from app.routers.projects import get_owned_project
from app.schemas.document import DocumentRead
from app.services import document_storage
from app.services.document_storage import DocumentFileError

router = APIRouter(tags=["documents"])
logger = logging.getLogger(__name__)


@router.post(
    "/api/projects/{project_id}/documents/", response_model=DocumentRead, status_code=status.HTTP_201_CREATED
)
async def upload_document(
    project_id: uuid.UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Document:
    project = get_owned_project(project_id, db, current_user.id)
    max_size_bytes = get_settings().max_upload_size_mb * 1024 * 1024
    try:
        original, stored, relative_path, file_size = await document_storage.save_upload(
            file, current_user.id, project.id, max_size_bytes
        )
    except DocumentFileError as error:
        raise HTTPException(status_code=error.status_code, detail=error.detail) from None
    except OSError:
        logger.exception("Failed to store uploaded document")
        raise HTTPException(status_code=500, detail="Could not store the uploaded document") from None
    finally:
        await file.close()

    document = Document(
        project_id=project.id,
        user_id=current_user.id,
        original_filename=original,
        stored_filename=stored,
        file_path=relative_path,
        file_type=stored.rsplit(".", 1)[-1],
        file_size=file_size,
        processing_status="uploaded",
    )
    db.add(document)
    try:
        db.commit()
    except Exception:
        db.rollback()
        try:
            document_storage.remove_file(relative_path)
        except OSError:
            logger.exception("Failed to clean up document after database insertion failure")
        raise HTTPException(status_code=500, detail="Could not save document metadata") from None
    db.refresh(document)
    return document


@router.get("/api/projects/{project_id}/documents/", response_model=list[DocumentRead])
def list_documents(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Document]:
    project = get_owned_project(project_id, db, current_user.id)
    return list(
        db.scalars(
            select(Document)
            .where(Document.project_id == project.id, Document.user_id == current_user.id)
            .order_by(Document.created_at.desc())
        )
    )


@router.get("/api/documents/{document_id}", response_model=DocumentRead)
def read_document(
    document_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Document:
    document = db.scalar(select(Document).where(Document.id == document_id, Document.user_id == current_user.id))
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")
    return document


@router.delete("/api/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    document = db.scalar(select(Document).where(Document.id == document_id, Document.user_id == current_user.id))
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")

    relative_path = document.file_path
    try:
        staged_path = document_storage.stage_file_removal(relative_path)
    except (OSError, ValueError):
        logger.exception("Failed to stage document file for deletion")
        raise HTTPException(status_code=500, detail="Could not delete document file") from None

    db.delete(document)
    try:
        db.commit()
    except Exception:
        db.rollback()
        if staged_path:
            try:
                document_storage.restore_staged_file(staged_path, relative_path)
            except OSError:
                logger.exception("Failed to restore document file after database deletion failure")
        raise HTTPException(status_code=500, detail="Could not delete document") from None

    try:
        document_storage.discard_staged_file(staged_path)
    except OSError:
        logger.exception("Failed to remove staged document file after database deletion")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
