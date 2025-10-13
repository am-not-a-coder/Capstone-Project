import requests
import os
from urllib.parse import quote
from requests.auth import HTTPBasicAuth
from io import BytesIO
from werkzeug.utils import secure_filename
from flask import Response, stream_with_context, send_file, jsonify
from app.models import Document


NEXTCLOUD_URL = os.getenv('NEXTCLOUD_URL')
NEXTCLOUD_USER = os.getenv('NEXTCLOUD_USER')
NEXTCLOUD_PASSWORD = os.getenv('NEXTCLOUD_PASSWORD')

def safe_path(path :str):
    # Encode each segment separately to keep `/` intact
    return "/".join(quote(p.strip()) for p in path.split('/'))


def build_nextcloud_url(doc_path: str):
    # Ensure consistent encoding for directories & filename
    encoded_path = "/".join(quote(p) for p in doc_path.strip("/").split("/"))
    return f"{NEXTCLOUD_URL.rstrip('/')}/{encoded_path}"


# Create folder if it doesn't exists
created_dirs = set()
def ensure_directories(path: str):   
    # Remove leading/trailing slashes and split into segments
    path = path.strip("/")
    if not path:
        return True
    
    segments = path.split("/")
    current_path = ""
    
    for segment in segments:
        if not segment.strip():  # Skip empty segments
            continue
            
        current_path += "/" + segment.strip()
        
        # Skip if we've already created this directory
        if current_path in created_dirs:
            continue
            
        # Construct the full URL for this directory
        url = f"{NEXTCLOUD_URL.rstrip('/')}{current_path}"
        
        print(f"Creating directory: {url}")
        
        try:
            resp = requests.request(
                "MKCOL", 
                url, 
                auth=(NEXTCLOUD_USER, NEXTCLOUD_PASSWORD),
                timeout=30
            )
            
            if resp.status_code == 201:
                # Directory created successfully
                created_dirs.add(current_path)
                print(f"Directory created: {current_path}")
            elif resp.status_code == 405:
                # Directory already exists
                created_dirs.add(current_path)
                print(f"Directory already exists: {current_path}")
            else:
                print(f"Error creating directory {current_path}: {resp.status_code} - {resp.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"Network error creating directory {current_path}: {e}")
            return False
            
    return True



def upload_to_nextcloud(file, path):    
    filename = secure_filename(file.filename)  # normalized filename
    target_url = build_nextcloud_url(f"{path}/{filename}")


    file_bytes = file.read()
    file.seek(0)
    response = requests.put(
        target_url,
        auth=HTTPBasicAuth(NEXTCLOUD_USER, NEXTCLOUD_PASSWORD),
        data=file_bytes
    )
    return response



def preview_from_nextcloud(doc_path):
    try:
        target_url = build_nextcloud_url(doc_path)

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
            status_code = 500
            text = str(e)
            headers = {}
        return MockResponse()
    

def rename_file_nextcloud(old_path, new_path):
    UDMS_URL = f"{NEXTCLOUD_URL}/UDMS_Repository/"
   
    old_url = UDMS_URL + '/'.join(quote(part) for part in old_path.split('/'))
    new_url = UDMS_URL + '/'.join(quote(part) for part in new_path.split('/'))

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



# Upload or overwrite (edit) a file in Nextcloud
def edit_file_nextcloud(file_path, file_content):
   
    UDMS_URL = f"{NEXTCLOUD_URL.rstrip('/')}/UDMS_Repository/"
    file_url = UDMS_URL + '/'.join(quote(part) for part in file_path.split('/'))

    try:
        # If file_content is string, encode to bytes
        if isinstance(file_content, str):
            file_content = file_content.encode("utf-8")

        response = requests.put(
            file_url,
            data=file_content,
            auth=HTTPBasicAuth(NEXTCLOUD_USER, NEXTCLOUD_PASSWORD)
        )

        if response.status_code in [200, 201, 204]:
            return jsonify({
                "success": True,
                "message": "File updated successfully",
                "path": file_path
            }), response.status_code
        else:
            return jsonify({
                "error": f"Failed to update file. Status {response.status_code}",
                "details": response.text
            }), response.status_code

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
            status_code = 500
            text = str(e)
            headers = {}
        return MockResponse()


    # Fetch all files & folders from Nextcloud and return as a nested dict (tree).
def list_files_from_nextcloud():
    UDMS_URL = f"{NEXTCLOUD_URL.rstrip('/')}/UDMS_Repository/"

    response = requests.request(
        "PROPFIND",
        UDMS_URL,
        auth=HTTPBasicAuth(NEXTCLOUD_USER, NEXTCLOUD_PASSWORD),
        headers={"Depth": "infinity"}
    )

    if response.status_code != 207:
        raise Exception(f"NextCloud Error: {response.status_code} - {response.text}")

    from xml.etree import ElementTree as ET
    from urllib.parse import unquote, urlparse
    import os

    tree = ET.fromstring(response.content)
    ns = {"d": "DAV:"}

    paths = []
    responses = [] 

    parsed = urlparse(UDMS_URL)
    base_path = parsed.path if parsed.path else "/"
    if not base_path.endswith('/'):
        base_path += '/'

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
    file_ext = {"pdf", "docx", "xlsx", "txt", "pptx", "jpg", "png", "jpeg", "xls", "ppt", "csv", "webp"}

    # Preload all docs from DB into a dict {path: Document}
    db_docs = {doc.docPath: doc for doc in Document.query.all()}

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
                    # Add UDMS_Repository to match DB docPath
                    db_doc = db_docs.get(f"UDMS_Repository/{path}")

                    file_obj = {
                        "name": unquote(part),
                        "type": "file",
                        "size": int(size.text) if size is not None and size.text else None,
                        "mime": mime.text if mime is not None else None,
                        "modified": modified.text if modified is not None else None,
                        "docID": db_doc.docID if db_doc else None,
                        "docName": db_doc.docName if db_doc else None,
                        "docTag": db_doc.tags if db_doc else None,
                    }
                    current["files"].append(file_obj)
                else:
                    if part not in current["folders"]:
                        current["folders"][unquote(part)] = {
                            "files": [],
                            "folders": {},
                            "type": "folder",
                            "meta": {
                                "name": unquote(part),
                                "modified": modified.text if modified is not None else None
                            }
                        }
            else:                
                decoded_part = unquote(part)
                if decoded_part not in current["folders"]:
                    current["folders"][decoded_part] = {"files": [], "folders": {}, "meta": {"name": decoded_part}}
                current = current["folders"][decoded_part]

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