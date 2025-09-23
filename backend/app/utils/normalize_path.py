import os
from urllib.parse import unquote

def normalize_path(path: str) -> str:
    # Decode %20, etc.
    path = unquote(path)

    # Normalize slashes, remove redundant parts
    path = os.path.normpath(path)

    # Remove leading "./" or "/" for consistency
    if path.startswith("./"):
        path = path[2:]
    if path.startswith("/"):
        path = path[1:]

    return path
