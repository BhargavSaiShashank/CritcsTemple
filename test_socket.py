import socket

hosts = [
    "ac-mjttkat-shard-00-00.jrtglai.mongodb.net",
    "ac-mjttkat-shard-00-01.jrtglai.mongodb.net",
    "ac-mjttkat-shard-00-02.jrtglai.mongodb.net"
]
port = 27017

for host in hosts:
    print(f"Testing {host}:{port}...")
    try:
        # Set a short timeout
        s = socket.create_connection((host, port), timeout=5)
        print(f"✅ SUCCESS: Connected to {host}")
        s.close()
    except Exception as e:
        print(f"❌ FAILED: Could not connect to {host}. Error: {e}")

print("\nSuggestions:")
print("1. If FAILED, your ISP or local firewall is likely blocking port 27017.")
print("2. If SUCCESS, the issue is strictly with the TLS/SSL handshake configuration in Python.")
