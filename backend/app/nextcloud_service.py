import requests
import os
from urllib.parse import quote
from requests.auth import HTTPBasicAuth

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


def download_from_nextcloud(doc_path):
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

def delete_from_nextcloud(doc_path):
    try:
        target_url = f"{NEXTCLOUD_URL.rstrip('/')}/{doc_path.strip('/')}"

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
