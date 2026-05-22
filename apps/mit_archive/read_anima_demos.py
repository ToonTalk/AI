import re

path = r"C:\Users\toont\Documents\MIT-AI-Lab\7005044\ken\anima.demos"
try:
    with open(path, 'r', errors='ignore') as f:
        content = f.read()
    
    cleaned = "".join([c if (32 <= ord(c) <= 126 or c in "\n\r\t") else " " for c in content])
    cleaned = re.sub(r' +', ' ', cleaned)
    
    # Search for (DEFPROP DRAW/.FLOWER ... EXPR)
    start_idx = cleaned.find("UNITE 'DRAW/.FLOWER")
    if start_idx != -1:
        print("=== DRAW/.FLOWER ===")
        # Print a wider window
        print(cleaned[start_idx:start_idx+1500])
        
    start_rocket = cleaned.find("UNITE 'DRAW/.ROCKET")
    if start_rocket != -1:
        print("=== DRAW/.ROCKET ===")
        print(cleaned[start_rocket:start_rocket+1500])
except Exception as e:
    print(f"Error: {e}")
