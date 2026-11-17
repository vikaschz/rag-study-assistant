from unittest.mock import MagicMock

import pytest

import app.database as database


def test_database_dependency_rolls_back_and_closes_after_error(monkeypatch):
    session = MagicMock()
    monkeypatch.setattr(database, "SessionLocal", lambda **kwargs: session)
    monkeypatch.setattr(database, "get_engine", lambda: object())

    dependency = database.get_db()
    assert next(dependency) is session

    with pytest.raises(RuntimeError, match="request failed"):
        dependency.throw(RuntimeError("request failed"))

    session.rollback.assert_called_once_with()
    session.close.assert_called_once_with()
