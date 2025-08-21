import requests
import os

NEXTCLOUD_URL = os.getenv('NEXTCLOUD_URL')
NEXTCLOUD_USER = os.getenv('NEXTCLOUD_USER')
NEXTCLOUD_PASSWORD = os.getenv('NEXTCLOUD_PASSWORD')


def upload_to_nextcloud(file):
    target_url = f"{NEXTCLOUD_URL}{file.filename}"

    print(f"Attempting to download from: {target_url}")
    print(f"Using auth: {NEXTCLOUD_USER}:{'*' * len(NEXTCLOUD_PASSWORD)}")

    response = requests.put(target_url, auth=(NEXTCLOUD_USER, NEXTCLOUD_PASSWORD), data=file.stream)
    return response


def download_from_nextcloud(filename):
    try:
        target_url = f"{NEXTCLOUD_URL}{filename}"
        response = requests.get(target_url, auth=(NEXTCLOUD_USER, NEXTCLOUD_PASSWORD), timeout = 30, stream = True)

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
