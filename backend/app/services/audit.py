import json
from datetime import datetime
from typing import Any, Dict, Optional

from sqlalchemy.exc import SQLAlchemyError

def audit_event(action: str, user_id: Optional[int], payload: Dict[str, Any]) -> None:
    """
    Persist audit event to database; if DB write fails, fallback to stdout.
    """
    event = {
        "action": action,
        "user_id": user_id,
        "payload": payload,
        "timestamp": datetime.utcnow().isoformat(),
    }
    try:
        from app.database import SessionLocal
        from app import models

        db = SessionLocal()
        audit_model = getattr(models, "AuditLog", None)
        if audit_model:
            log = audit_model(
                action=action,
                user_id=user_id,
                payload_json=json.dumps(payload or {}),
            )
            db.add(log)
            db.commit()
        else:
            print(f"[AUDIT] {event}")
    except SQLAlchemyError:
        print(f"[AUDIT-FAIL-DB] {event}")
    finally:
        try:
            db.close()
        except Exception:
            pass
