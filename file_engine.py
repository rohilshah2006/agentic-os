import os
import time
import json
from pathlib import Path

# 1. Define Categories (The Logic)
CATEGORY_MAP = {
    "Code": ['.py', '.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.cpp', '.c', '.java', '.json', '.sql', '.sh', '.asm', '.lua', '.rbxs'], # <--- Added .asm, .lua
    "Documents": ['.pdf', '.docx', '.doc', '.txt', '.md', '.xlsx', '.xls', '.csv', '.pptx', '.ppt', '.epub'], # <--- Added .epub
    "Images": ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.heic', '.bmp', '.ico'],
    "Video": ['.mov', '.mp4', '.mkv', '.avi', '.webm'],
    "Audio": ['.mp3', '.wav', '.flac', '.m4a', '.aac'],
    "Archives": ['.zip', '.tar', '.gz', '.rar', '.7z', '.dmg', '.pkg', '.iso'],
    "3D Models": ['.fbx', '.obj', '.stl', '.blend', '.rbxl', '.rbxm'] # <--- NEW CATEGORY!
}

def get_category(extension):
    """Returns the broad category for a file extension."""
    ext = extension.lower()
    for category, extensions in CATEGORY_MAP.items():
        if ext in extensions:
            return category
    return "Others"

def scan_directory(root_path):
    """Scans a directory and returns a structured list of files."""
    print(f"🕵️‍♂️ Scanning: {root_path} ...")
    start_time = time.time()
    
    file_data = []
    
    # os.walk is the standard way to crawl folders
    for root, dirs, files in os.walk(root_path):
        for name in files:
            try:
                path = Path(os.path.join(root, name))
                stats = path.stat() # Get file details (size, time)
                
                ext = path.suffix
                category = get_category(ext)
                
                file_info = {
                    "name": name,
                    "path": str(path),
                    "extension": ext,
                    "category": category,
                    "size_bytes": stats.st_size,
                    "created_at": stats.st_ctime,
                    "modified_at": stats.st_mtime
                }
                file_data.append(file_info)
            except PermissionError:
                continue # Skip files we aren't allowed to touch
            except Exception as e:
                continue

    end_time = time.time()
    print(f"✅ Found {len(file_data)} files in {round(end_time - start_time, 2)} seconds.")
    return file_data

# --- TEST RUN ---
if __name__ == "__main__":
    # We scan the User's Download folder for safety first
    target_dir = os.path.expanduser("~/Downloads")
    
    data = scan_directory(target_dir)
    
    # Let's verify the "File Type" sorting logic
    # Filter just Code files and print top 5
    code_files = [f for f in data if f['category'] == 'Code']
    
    print("\n--- SAMPLE CODE FILES FOUND ---")
    for f in code_files[:5]:
        print(f"[{f['extension']}] {f['name']} ({round(f['size_bytes']/1024, 2)} KB)")

    # Save to a JSON file (This mimics sending data to React)
    with open("scan_results.json", "w") as f:
        json.dump(data, f, indent=4)
    print("\n💾 Database saved to 'scan_results.json'")