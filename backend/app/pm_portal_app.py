"""Loads Spec Builder's own FastAPI app (pm-portal/backend/main.py) so
app/main.py can mount it at /pm.

This deliberately doesn't touch any of pm-portal/backend's ~2661 lines of
route/agent/persistence code -- those files import each other with flat,
same-directory imports (`from persistence import ...`, `import jira_client`),
which only resolve if pm-portal/backend is on sys.path. Putting it there
first is lower-risk than rewriting every cross-file import to fit this
package's own layout.
"""

import sys
from pathlib import Path

_PM_PORTAL_BACKEND = Path(__file__).resolve().parent.parent.parent / "pm-portal" / "backend"

if str(_PM_PORTAL_BACKEND) not in sys.path:
    sys.path.insert(0, str(_PM_PORTAL_BACKEND))

import main as _pm_main  # noqa: E402 -- must follow the sys.path fixup above

pm_portal_app = _pm_main.app
