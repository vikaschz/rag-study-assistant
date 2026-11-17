import uuid
import logging

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Project, User
from app.schemas.project import ProjectCreate, ProjectRead
from app.services import document_storage

router = APIRouter(prefix="/api/projects", tags=["projects"])
logger = logging.getLogger(__name__)


@router.post("/", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> Project:
    project = Project(**payload.model_dump(), user_id=current_user.id)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("/", response_model=list[ProjectRead])
def list_projects(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[Project]:
    return list(db.scalars(select(Project).where(Project.user_id == current_user.id).order_by(Project.created_at.desc())))


def get_owned_project(project_id: uuid.UUID, db: Session, user_id: uuid.UUID) -> Project:
    project = db.scalar(select(Project).where(Project.id == project_id, Project.user_id == user_id))
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.get("/{project_id}", response_model=ProjectRead)
def read_project(
    project_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> Project:
    return get_owned_project(project_id, db, current_user.id)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> Response:
    project = get_owned_project(project_id, db, current_user.id)
    staged_files: list[tuple[str, str]] = []
    try:
        for document in project.documents:
            staged = document_storage.stage_file_removal(document.file_path)
            if staged:
                staged_files.append((staged, document.file_path))
    except (OSError, ValueError):
        for staged, original in staged_files:
            try:
                document_storage.restore_staged_file(staged, original)
            except OSError:
                logger.exception("Failed to restore document after project deletion could not start")
        logger.exception("Failed to stage project documents for deletion")
        raise HTTPException(status_code=500, detail="Could not delete project documents") from None

    db.delete(project)
    try:
        db.commit()
    except Exception:
        db.rollback()
        for staged, original in staged_files:
            try:
                document_storage.restore_staged_file(staged, original)
            except OSError:
                logger.exception("Failed to restore project document after database deletion failure")
        raise HTTPException(status_code=500, detail="Could not delete project") from None

    for staged, _ in staged_files:
        try:
            document_storage.discard_staged_file(staged)
        except OSError:
            logger.exception("Failed to remove staged document after project deletion")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
