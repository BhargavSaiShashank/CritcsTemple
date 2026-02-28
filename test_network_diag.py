import socket
import os
import requests

def diagnostic():
    host = "api.themoviedb.org"
    print(f"--- Python Environment Diagnostics for {host} ---")
    
    # 1. DNS Resolution
    try:
        ip = socket.gethostbyname(host)
        print(f"DNS Resolution: {host} -> {ip}")
    except Exception as e:
        print(f"DNS Resolution FAILED: {e}")

    # 2. Proxy Settings
    print(f"\nProxy Environment Variables:")
    for var in ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy', 'NO_PROXY', 'no_proxy']:
        print(f"{var}: {os.environ.get(var, 'Not Set')}")
    
    # 3. Requests Session Proxy Check
    session = requests.Session()
    print(f"\nRequests Session Proxies: {session.proxies}")

    # 4. Resolve full host list
    try:
        info = socket.getaddrinfo(host, 443)
        print(f"\nAddr Info (Port 443): {info}")
    except Exception as e:
        print(f"Addr Info FAILED: {e}")

if __name__ == "__main__":
    diagnostic()
