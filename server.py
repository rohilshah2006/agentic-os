import os
import shutil
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from send2trash import send2trash
from fastapi.responses import FileResponse

app = FastAPI()

# 🛑 SECURITY: Allow the React app to talk to this Python script
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONFIGURATION ---

# 1. Define the Folders we can navigate to
FOLDERS = {
    "Downloads": os.path.expanduser("~/Downloads"),
    "Documents": os.path.expanduser("~/Documents"),
    "Desktop": os.path.expanduser("~/Desktop")
}

# 2. Define the Categories (So we can sort files in ANY folder)
CATEGORY_MAP = {
    "Code": ['.py', '.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.cpp', '.c', '.java', '.json', '.sql', '.sh', '.asm', '.lua', '.rbxs'],
    "Documents": ['.pdf', '.docx', '.doc', '.txt', '.md', '.xlsx', '.xls', '.csv', '.pptx', '.ppt', '.epub'],
    "Images": ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.heic', '.bmp', '.ico'],
    "Video": ['.mov', '.mp4', '.mkv', '.avi', '.webm'],
    "Audio": ['.mp3', '.wav', '.flac', '.m4a', '.aac'],
    "Archives": ['.zip', '.tar', '.gz', '.rar', '.7z', '.dmg', '.pkg', '.iso'],
    "3D Models": ['.fbx', '.obj', '.stl', '.blend', '.rbxl', '.rbxm']
}

# --- API ENDPOINTS ---

@app.get("/")
def home():
    return {"status": "Agentic File System Online 🟢"}

@app.get("/scan")
def get_files(folder: str = "Downloads", sort_by: str = "date", category: str = "All", limit: int = 50, offset: int = 0): # <--- ADDED category
    """Scans, Filters by Category, Sorts, and then Paginates."""
    target_path = FOLDERS.get(folder, FOLDERS["Downloads"])
    
    if not os.path.exists(target_path):
        return []

    files_data = []
    
    # 1. Scan EVERYTHING
    for root, _, files in os.walk(target_path):
        for file in files:
            # UNCOMMENT to hide hidden files
            # if file.startswith('.'): continue
            
            file_path = os.path.join(root, file)
            try:
                stats = os.stat(file_path)
                ext = os.path.splitext(file)[1].lower()
                
                # Determine Category
                file_cat = "Others"
                for cat, extensions in CATEGORY_MAP.items():
                    if ext in extensions:
                        file_cat = cat
                        break
                
                # --- FILTERING HAPPENS HERE NOW ---
                # If the user asked for "Code", skip anything that isn't "Code"
                if category != "All" and file_cat != category:
                    continue
                
                files_data.append({
                    "name": file,
                    "path": file_path,
                    "extension": ext,
                    "category": file_cat,
                    "size_bytes": stats.st_size,
                    "created_at": stats.st_ctime
                })
            except Exception:
                continue

    # 2. SORT
    if sort_by == "size":
        files_data.sort(key=lambda x: x['size_bytes'], reverse=True)
    elif sort_by == "name":
        files_data.sort(key=lambda x: x['name'].lower())
    else:
        files_data.sort(key=lambda x: x['created_at'], reverse=True)
    
    # 3. PAGINATE
    return files_data[offset : offset + limit]

class FileAction(BaseModel):
    path: str

@app.post("/open")
def open_file(action: FileAction):
    """Opens a file using the native Mac finder."""
    if not os.path.exists(action.path):
        raise HTTPException(status_code=404, detail="File not found")
    
    os.system(f'open "{action.path}"')
    return {"status": "opened", "path": action.path}

@app.post("/delete")
def delete_file(action: FileAction):
    """Moves a file to the Trash (Safe Delete)."""
    if not os.path.exists(action.path):
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        send2trash(action.path)
        return {"status": "trashed", "path": action.path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/read")
def read_file(path: str):
    """Streams the file content to the frontend."""
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path)    

# --- RUNNER ---
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)