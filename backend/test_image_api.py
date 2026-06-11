import requests
BASE_URL = "http://127.0.0.1:5000/api"
# 1. Login
login_res = requests.post(f"{BASE_URL}/auth/login", json={"email": "jane@example.com", "password": "Password123"})
if login_res.status_code == 200:
    token = login_res.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    # 2. Upload the specific image
    image_path = r"E:\Ashish Choubey\DOC-AI-main\backend\datasets\images\test\NORMAL\IM-0001-0001.jpeg"
    print(f"Uploading image for diagnosis...")
    with open(image_path, "rb") as image_file:
        diag_res = requests.post(
            f"{BASE_URL}/diagnosis/image", 
            headers=headers, 
            files={"file": image_file},
            data={"image_type": "xray"}
        )
        print(f"Status: {diag_res.status_code}")
        print("Response:", diag_res.json())
else:
    print("Login failed! Did you register the test user?", login_res.json())