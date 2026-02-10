# 📂 Agentic OS

A high-performance, local-first file explorer built to outsmart Finder.

**Agentic OS** transforms your chaotic file system into a streamlined, dark-mode dashboard. It moves beyond standard file browsing, using a **Python brain** to index thousands of files instantly and a **React face** to render them with infinite-scroll precision.

### ✨ Key Features

**1. The "X-Ray" Vision 👁️**
See what your OS is hiding from you. Agentic OS detects and exposes hidden system junk (like `.Opera` cache files or `.DS_Store` clutter) that standard file managers suppress, giving you total control over your storage.

**2. Infinite Scroll Engine ♾️**
* **Zero Lag:** Capable of handling **35,000+ files** without freezing the UI.
* **Server-Side Sorting:** Instead of burdening the browser, the Python backend sorts your entire hard drive by Size, Date, or Name in milliseconds before sending data to the frontend.
* **Seamless Pagination:** No "Load More" buttons. The UI automatically fetches the next batch of files as you scroll using an Intersection Observer.

**3. "Quick Look" Modal ⚡**
Instant, in-app previews for every file type:
* **Code:** Syntax highlighting for `.py`, `.tsx`, `.json`, and `.asm`.
* **Media:** Native playback for 4K video and high-res images.
* **Docs:** Embedded PDF viewing without leaving the dashboard.

**4. Developer-First Categorization 🗂️**
Pre-configured to understand the files that actually matter to developers.
* **3D Models:** `.fbx`, `.stl`, `.rbxl` (Roblox)
* **Code:** `.asm` (Assembly), `.lua`, `.tsx`
* **Archives:** `.dmg`, `.iso`, `.zip`

---

### 🛠️ Under the Hood

This project bridges the gap between a desktop script and a modern web app using a custom local server architecture.

* **Frontend:** React 18 + Tailwind CSS (Dark Mode Native)
* **Backend:** Python (FastAPI + Uvicorn)
* **System Integration:** `os` module for scanning, `send2trash` for safe deletion.
* **State Management:** React Hooks (`useState`, `useEffect`, `useInView`)

#### The "Architecture" Bit 🧠

To prevent memory leaks when loading 35,000 files, Agentic OS uses a **cursor-based pagination system**. The frontend never loads the whole directory. It requests slices of data:

```python
# The Python Brain slicing the data dynamically
@app.get("/scan")
def get_files(limit: int = 50, offset: int = 0):
    # ... sorts 35k files in memory ...
    return files_data[offset : offset + limit]
```

### 🚀 Getting Started

**Prerequisites**
* Node.js & npm
* Python 3.9+

**Installation**

1.  Clone the repo:
    ```bash
    git clone https://github.com/rohilshah2006/Agentic-OS.git
    ```

2.  **The "One-Click" Launch:**
    I've included a custom shell script that boots the Backend, Frontend, and Browser simultaneously.

    ```bash
    chmod +x run.sh
    ./run.sh
    ```

*(Note: The script automatically manages the Python Virtual Environment and kills any rogue processes on ports 8000/5173).*

---

### 🎨 Customization

You can add new file categories (e.g., for specialized game engines or software) by editing the `CATEGORY_MAP` dictionary in `server.py`:

```python
"3D Models": ['.fbx', '.obj', '.blend', '.rbxl'],
"Assembly": ['.asm', '.s'],
```

### 👤 Author

**Rohil Shah** 
Full-Stack Architecture & System Logic. Built to clean up 35,000+ files without crashing.