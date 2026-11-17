import codecs
import os
import tempfile
import uuid
import zipfile
from pathlib import Path

from fastapi import UploadFile


CHUNK_SIZE = 64 * 1024
ALLOWED_TYPES = {".pdf": "pdf", ".docx": "docx", ".pptx": "pptx", ".txt": "txt"}


class DocumentFileError(Exception):
    def __init__(self, detail: str, status_code: int = 400) -> None:
        super().__init__(detail)
        self.detail = detail
        self.status_code = status_code


def get_storage_root() -> Path:
    return Path(__file__).resolve().parents[2] / "storage"


def _resolve_path(relative_path: str) -> Path:
    root = get_storage_root().resolve()
    candidate = (root / relative_path).resolve()
    if not candidate.is_relative_to(root):
        raise ValueError("Invalid stored document path")
    return candidate


def _validate_structure(path: Path, file_type: str, prefix: bytes) -> None:
    if file_type == "pdf" and not prefix.startswith(b"%PDF-"):
        raise DocumentFileError("The file does not have a valid PDF signature.")
    if file_type in {"docx", "pptx"}:
        required_entries = {
            "docx": {"[Content_Types].xml", "word/document.xml"},
            "pptx": {"[Content_Types].xml", "ppt/presentation.xml"},
        }[file_type]
        try:
            with zipfile.ZipFile(path) as archive:
                if not required_entries.issubset(archive.namelist()):
                    raise DocumentFileError(f"The file is not a valid {file_type.upper()} document.")
        except (zipfile.BadZipFile, OSError, ValueError, EOFError, RuntimeError):
            raise DocumentFileError(f"The file is not a valid {file_type.upper()} document.") from None


async def save_upload(
    upload: UploadFile, user_id: uuid.UUID, project_id: uuid.UUID, max_size_bytes: int
) -> tuple[str, str, str, int]:
    original_filename = upload.filename or ""
    extension = Path(original_filename.replace("\\", "/")).suffix.lower()
    file_type = ALLOWED_TYPES.get(extension)
    if file_type is None:
        raise DocumentFileError("Unsupported file type. Upload a PDF, DOCX, PPTX, or TXT file.")
    if len(original_filename) > 255:
        raise DocumentFileError("The filename must be 255 characters or fewer.")

    relative_directory = Path("documents") / str(user_id) / str(project_id)
    target_directory = _resolve_path(relative_directory.as_posix())
    target_directory.mkdir(parents=True, exist_ok=True)
    stored_filename = f"{uuid.uuid4()}{extension}"
    relative_path = (relative_directory / stored_filename).as_posix()
    destination = _resolve_path(relative_path)
    file_descriptor, temporary_name = tempfile.mkstemp(prefix=".upload-", dir=target_directory)
    temporary_path = Path(temporary_name)
    total_size = 0
    prefix = bytearray()
    text_decoder = codecs.getincrementaldecoder("utf-8-sig")("strict") if file_type == "txt" else None

    try:
        with os.fdopen(file_descriptor, "wb") as output:
            while chunk := await upload.read(CHUNK_SIZE):
                total_size += len(chunk)
                if total_size > max_size_bytes:
                    raise DocumentFileError("The file exceeds the maximum upload size.", status_code=413)
                if len(prefix) < 8:
                    prefix.extend(chunk[: 8 - len(prefix)])
                if text_decoder is not None:
                    try:
                        text = text_decoder.decode(chunk)
                    except UnicodeDecodeError:
                        raise DocumentFileError("TXT files must contain valid UTF-8 text.") from None
                    if "\x00" in text:
                        raise DocumentFileError("TXT files must contain text, not binary data.")
                output.write(chunk)
            if total_size == 0:
                raise DocumentFileError("Empty files cannot be uploaded.")
            if text_decoder is not None:
                try:
                    final_text = text_decoder.decode(b"", final=True)
                except UnicodeDecodeError:
                    raise DocumentFileError("TXT files must contain valid UTF-8 text.") from None
                if "\x00" in final_text:
                    raise DocumentFileError("TXT files must contain text, not binary data.")
            output.flush()
            os.fsync(output.fileno())

        _validate_structure(temporary_path, file_type, bytes(prefix))
        os.replace(temporary_path, destination)
        return original_filename, stored_filename, relative_path, total_size
    except Exception:
        temporary_path.unlink(missing_ok=True)
        raise


def remove_file(relative_path: str) -> None:
    _resolve_path(relative_path).unlink(missing_ok=True)


def stage_file_removal(relative_path: str) -> str | None:
    path = _resolve_path(relative_path)
    if not path.exists():
        return None
    staged_path = path.with_name(f".delete-{uuid.uuid4()}-{path.name}")
    os.replace(path, staged_path)
    return staged_path.relative_to(get_storage_root().resolve()).as_posix()


def restore_staged_file(staged_relative_path: str, original_relative_path: str) -> None:
    staged = _resolve_path(staged_relative_path)
    original = _resolve_path(original_relative_path)
    if staged.exists():
        os.replace(staged, original)


def discard_staged_file(staged_relative_path: str | None) -> None:
    if staged_relative_path:
        remove_file(staged_relative_path)
