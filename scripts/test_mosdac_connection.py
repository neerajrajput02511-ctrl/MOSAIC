import sys
import httpx
import re
from html import unescape

def verify_mosdac(username, password):
    print(f"[*] Connecting to ISRO MOSDAC (https://www.mosdac.gov.in)...")
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    }
    
    with httpx.Client(timeout=15.0, headers=headers, follow_redirects=True, verify=False) as client:
        # Step 1: Request login page
        resp = client.get("https://www.mosdac.gov.in/user/login")
        print(f"[*] Login Page HTTP Status: {resp.status_code}")
        print(f"[*] Landed URL: {resp.url}")
        
        # Step 2: Extract form action and inputs
        action_match = re.search(r'<form\s+[^>]*action=["\']([^"\']+)["\']', resp.text, re.IGNORECASE)
        if not action_match:
            print("[-] Could not find login form action URL.")
            return False, "Login form action missing"
            
        action_url = unescape(action_match.group(1))
        if not action_url.startswith("http"):
            action_url = str(resp.url.join(action_url))
            
        print(f"[*] Keycloak Form Action URL: {action_url}")
        
        # Extract all input fields
        inputs = re.findall(r'<input\s+[^>]*name=["\']([^"\']+)["\'][^>]*>', resp.text, re.IGNORECASE)
        print(f"[*] Detected Form Inputs: {inputs}")
        
        # Build POST data
        post_data = {}
        for inp_match in re.finditer(r'<input\s+[^>]*name=["\']([^"\']+)["\'](?:\s+[^>]*value=["\']([^"\']*)["\'])?', resp.text, re.IGNORECASE):
            name = inp_match.group(1)
            val = inp_match.group(2) or ""
            post_data[name] = val
            
        # Fill credentials
        post_data["username"] = username
        post_data["password"] = password
        
        print(f"[*] Submitting authentication request for {username}...")
        login_resp = client.post(action_url, data=post_data, headers={"Referer": str(resp.url)})
        
        print(f"[*] Response HTTP Status: {login_resp.status_code}")
        print(f"[*] Final URL after post: {login_resp.url}")
        
        # Check success indicators
        is_logged_in = False
        error_msg = None
        
        if "kc-feedback-text" in login_resp.text or "alert-error" in login_resp.text:
            err_match = re.search(r'<span class="kc-feedback-text">([^<]+)</span>', login_resp.text)
            if err_match:
                error_msg = err_match.group(1).strip()
            print(f"[-] Keycloak authentication message: {error_msg or 'Invalid credentials or login failure'}")
            return False, error_msg or "Authentication failed"
            
        if "logout" in login_resp.text.lower() or "user/logout" in login_resp.text or "profile" in login_resp.text.lower():
            is_logged_in = True
            print("[+] Successfully authenticated with MOSDAC ISRO portal!")
            
        cookies = list(client.cookies.keys())
        print(f"[*] Session Cookies Received: {cookies}")
        
        # Test protected user portal page
        user_resp = client.get("https://www.mosdac.gov.in/user")
        print(f"[*] User Portal Page HTTP Status: {user_resp.status_code}")
        if user_resp.status_code == 200:
            print("[+] Verified access to MOSDAC SAC-ISRO authenticated user portal!")
        
        return True, "Authenticated"

if __name__ == "__main__":
    u = "Neerajrajput02511@gmail.com"
    p = "Mosaic081#"
    success, msg = verify_mosdac(u, p)
    print(f"[*] Final Verification Result: success={success}, msg={msg}")

