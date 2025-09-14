import requests
import os
from urllib.parse import quote
from requests.auth import HTTPBasicAuth
from io import BytesIO
from flask import Response, stream_with_context, send_file, jsonify

NEXTCLOUD_URL = os.getenv('NEXTCLOUD_URL')
NEXTCLOUD_USER = os.getenv('NEXTCLOUD_USER')
NEXTCLOUD_PASSWORD = os.getenv('NEXTCLOUD_PASSWORD')

def safe_path(path :str):
    # Encode each segment separately to keep `/` intact
    return "/".join(quote(p.strip()) for p in path.split('/'))

# Create folder if it doesn't exists
def check_directory(path):
    url = f"{NEXTCLOUD_URL}/{path.strip('/')}"
    # returns 405 if already exists and 201 if the folder is created
    response = requests.request("MKCOL", url, auth=(NEXTCLOUD_USER, NEXTCLOUD_PASSWORD))
    if response.status_code in [201, 405]:
        return True
    else:
        print("Error in making directory:", response.text)
        return False

def upload_to_nextcloud(file, path):
    target_url = f"{NEXTCLOUD_URL}{path.strip('/')}/{file.filename}"

    response = requests.put(target_url, auth=HTTPBasicAuth(NEXTCLOUD_USER, NEXTCLOUD_PASSWORD), data=file.stream)
    return response


def preview_from_nextcloud(doc_path):
    try:
        target_url = f"{NEXTCLOUD_URL.rstrip('/')}/{doc_path.strip('/')}"

        response = requests.get(
                target_url, 
                auth=HTTPBasicAuth(NEXTCLOUD_USER, NEXTCLOUD_PASSWORD), 
                timeout = 30, 
                stream = True
            )

        print(f"Response status: {response.status_code}")
        print(f"Content-Type: {response.headers.get('Content-Type')}")
        print(f"Content-Length: {response.headers.get('Content-Length')}")

        return response
    
    except requests.exceptions.RequestException as e:
        print(f"Nextcloud request failed: {e}")

        class MockResponse:
            status_code = 500,
            text = str(e)
            headers = {}
        return MockResponse()
    

def rename_file_nextcloud(old_path, new_path):
    UDMS_URL = f"{NEXTCLOUD_URL.rstrip('/')}/UDMS_Repository/"
   
    old_url = UDMS_URL + quote(old_path)
    new_url = UDMS_URL + quote(new_path)
    print(f"Renaming in Nextcloud: {old_url} -> {new_url}")

    try:
        response = requests.request(
            "MOVE",
            old_url,
            auth=HTTPBasicAuth(NEXTCLOUD_USER, NEXTCLOUD_PASSWORD),
            headers = {"Destination": new_url},
        )
        return response  
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def delete_from_nextcloud(doc_path):
    try:
        safe_path = doc_path.strip("/")
        encoded_path = quote(safe_path)
        
        target_url = f"{NEXTCLOUD_URL.rstrip('/')}/UDMS_Repository/{encoded_path}"

        print(f"Deleting at Nextcloud: {target_url}")

        response = requests.delete(
                target_url, 
                auth=HTTPBasicAuth(NEXTCLOUD_USER, NEXTCLOUD_PASSWORD), 
                timeout = 30
            )

        print(f"Response status: {response.status_code}")
        print(f"Response text: {response.text}")

        return response
    except requests.exceptions.RequestException as e:
        print(f"Nextcloud request failed: {e}")

        class MockResponse:
            status_code = 500,
            text = str(e)
            headers = {}
        return MockResponse()


    # Fetch all files & folders from Nextcloud and return as a nested dict (tree).
def list_files_from_nextcloud():
    UDMS_URL = f"{NEXTCLOUD_URL}UDMS_Repository/"

    response = requests.request(
        "PROPFIND",
        UDMS_URL,
        auth=HTTPBasicAuth(NEXTCLOUD_USER, NEXTCLOUD_PASSWORD),
        headers={"Depth": "infinity"}
    )

    if response.status_code != 207:
        raise Exception(f"NextCloud Error: {response.status_code} - {response.text}")

    from xml.etree import ElementTree as ET
    from urllib.parse import unquote
    import os

    tree = ET.fromstring(response.content)
    ns = {"d": "DAV:"}

    paths = []
    responses = []  # keep full <response> nodes for metadata lookup
    base_path = f"/remote.php/dav/files/{NEXTCLOUD_USER}/UDMS_Repository/"

    for resp in tree.findall("d:response", ns):
        href = resp.find("d:href", ns).text.rstrip("/")
        if href.rstrip("/") == base_path.rstrip("/"):
            continue

        relative_path = unquote(href)
        if relative_path.startswith(base_path):
            relative_path = relative_path[len(base_path):]
        relative_path = relative_path.lstrip("/")

        paths.append(relative_path)
        responses.append((relative_path, resp))  # map path → XML node

    root = {"files": [], "folders": {}}
    file_ext = {"pdf", "docx", "xlsx", "txt", "pptx", "jpg", "png", "jpeg", "xls", "ppt", "csv"}

    # Convert flat paths into directory tree
    for path, resp in responses:
        parts = path.split("/")
        current = root
        for i, part in enumerate(parts):
            is_last = i == len(parts) - 1
            props = resp.find("d:propstat/d:prop", ns)

            size = props.find("d:getcontentlength", ns)
            mime = props.find("d:getcontenttype", ns)
            modified = props.find("d:getlastmodified", ns)

            if is_last:
                ext = os.path.splitext(part)[1].lower().lstrip(".")
                if ext in file_ext:
                    # File metadata
                    file_obj = {
                        "name": part,
                        "type": "file",
                        "size": int(size.text) if size is not None and size.text else None,
                        "mime": mime.text if mime is not None else None,
                        "modified": modified.text if modified is not None else None
                    }
                    current["files"].append(file_obj)
                else:
                    # Folder metadata
                    if part not in current["folders"]:
                        current["folders"][part] = {
                            "files": [],
                            "folders": {},
                            "type": "folder",
                            "meta": {
                                "name": part,                            
                                "modified": modified.text if modified is not None else None
                            }
                        }
            else:
                if part not in current["folders"]:
                    current["folders"][part] = {"files": [], "folders": {}, "meta": {"name": part}}
                current = current["folders"][part]

    return root



    # Preview file from Nextcloud
def preview_file_nextcloud(file_path):
    url = f"{NEXTCLOUD_URL.rstrip('/')}/UDMS_Repository/{safe_path(file_path)}"

    response = requests.get(
        url,
        auth=HTTPBasicAuth(NEXTCLOUD_USER, NEXTCLOUD_PASSWORD),
        stream=True
    )

    if response.status_code == 200:
        return Response(
            stream_with_context(response.iter_content(chunk_size=8192)),
            content_type=response.headers.get("Content-Type")

        )
    else:
        return Response(f"Error fetching file: {response.status_code} - {response.text}", status=response.status_code)
 
def download_file_nextcloud(file_path):
    url = f"{NEXTCLOUD_URL.rstrip('/')}/UDMS_Repository/{safe_path(file_path)}"

    response = requests.get(
        url,
        auth=HTTPBasicAuth(NEXTCLOUD_USER, NEXTCLOUD_PASSWORD),
        stream=True
    )
    print(f"Downloading: {file_path} -> Status {response.status_code}")

    if response.status_code == 200:
        # Wrap response content in a BytesIO for Flask
        return send_file(
            BytesIO(response.content),
            as_attachment=True,
            download_name=os.path.basename(file_path),
            mimetype=response.headers.get("Content-Type", "application/octet-stream")
        )
    else:
        return jsonify({"error": f"Failed to download file: {response.status_code}"}), response.status_code