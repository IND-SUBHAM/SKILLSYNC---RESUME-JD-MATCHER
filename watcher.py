# watcher.py
import os
import sys
import time
import json
import subprocess
import threading
import logging
import flask.cli

# Suppress Flask development server startup messages and warnings
flask.cli.show_server_banner = lambda *args, **kwargs: None

# Suppress Flask request logs (e.g. 127.0.0.1 - - ...)
logging.getLogger('werkzeug').setLevel(logging.ERROR)

try:
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler
    HAS_WATCHDOG = True
except ImportError:
    HAS_WATCHDOG = False
    Observer = None
    FileSystemEventHandler = object

# Import Flask app from server
try:
    from server import app
except ImportError as ie:
    print(f"[Watcher] Error: Could not import Flask app from server.py: {ie}")
    sys.exit(1)

RESUMES_DIR = "resumes"
JD_DIR = "jd"
CONFIG_PATH = "latest_config.json"

class FileUploadedHandler(FileSystemEventHandler):
    def __init__(self):
        super().__init__()
        self.timer = None
        self.lock = threading.Lock()

    def on_created(self, event):
        self.process_event(event)

    def on_modified(self, event):
        self.process_event(event)

    def process_event(self, event):
        if event.is_directory:
            return

        filepath = event.src_path
        filename = os.path.basename(filepath)

        # Ignore temporary files, config file, and pycache
        if filename.startswith("upload_") or "pasted_job_description" in filename or not filename.lower().endswith(('.pdf', '.docx', '.txt')):
            return

        # Thread-safe timer restart
        with self.lock:
            if self.timer:
                self.timer.cancel()
            
            # Schedule execution after 1.2 seconds of inactivity (settling time)
            self.timer = threading.Timer(1.2, self.trigger_match)
            self.timer.start()

    def trigger_match(self):
        # Load latest uploaded configuration fallbacks
        latest_resume = "resumes/BISWAGAT_M_BAIRAGI_Resume.pdf"
        latest_jd = "jd/Software_Engineer_Trainee_JD.pdf"
        
        if os.path.exists(CONFIG_PATH):
            try:
                with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                    config = json.load(f)
                    cfg_resume = config.get("resume")
                    cfg_jd = config.get("jd")
                    if cfg_resume and os.path.exists(cfg_resume):
                        latest_resume = cfg_resume
                    if cfg_jd and os.path.exists(cfg_jd):
                        latest_jd = cfg_jd
            except Exception as e:
                print(f"[Watcher] Warning reading configuration: {e}")

        # Double check paths exist
        if not os.path.exists(latest_resume) or not os.path.exists(latest_jd):
            print("[Watcher] Error: One of the target files does not exist. Skipping CLI execution.")
            return

        # Execute app.py in terminal
        print(f"\n[Watcher] Executing: python app.py \"{latest_resume}\" \"{latest_jd}\"\n")
        sys.stdout.flush()

        try:
            # Running app.py in the terminal (outputs directly to the active stdout stream)
            subprocess.run([sys.executable, "app.py", latest_resume, latest_jd])
            print("\n" + "=" * 50 + "\n")
        except Exception as e:
            print(f"[Watcher] Error executing app.py: {e}")

def run_flask_server():
    """Runs the Flask web server. Debug and reloading are disabled to run safely inside a thread."""
    try:
        app.run(host='127.0.0.1', port=5000, debug=False, use_reloader=False)
    except Exception as e:
        print(f"[Watcher] Server error or port in use: {e}")

if __name__ == "__main__":
    os.makedirs(RESUMES_DIR, exist_ok=True)
    os.makedirs(JD_DIR, exist_ok=True)

    print("=" * 60)
    print("      SkillSync Terminal Activated")
    print("=" * 60)
    print("[*] Starting Flask web server on http://127.0.0.1:5000 ...")
    
    # Start the local server in a daemon thread
    server_thread = threading.Thread(target=run_flask_server, daemon=True)
    server_thread.start()
    
    # Wait briefly for server startup printout
    time.sleep(1)

    print(f"[*] Monitoring resumes in: {RESUMES_DIR}/")
    print(f"[*] Monitoring job details in: {JD_DIR}/")
    print("[*] Uploading files via browser will run 'app.py' here automatically.")
    print("[*] Press Ctrl+C to terminate BOTH the watcher and localhost.\n")

    event_handler = FileUploadedHandler()

    if HAS_WATCHDOG:
        observer = Observer()
        observer.schedule(event_handler, path=RESUMES_DIR, recursive=False)
        observer.schedule(event_handler, path=JD_DIR, recursive=False)
        observer.start()
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n[Watcher] Shutting down observer & localhost...")
            observer.stop()
        observer.join()
    else:
        # Fallback polling monitor when watchdog library is not installed
        known_files = {}
        for folder in [RESUMES_DIR, JD_DIR]:
            for root, _, files in os.walk(folder):
                for f in files:
                    p = os.path.join(root, f)
                    try:
                        known_files[p] = os.path.getmtime(p)
                    except OSError:
                        pass
        try:
            while True:
                time.sleep(1.5)
                for folder in [RESUMES_DIR, JD_DIR]:
                    for root, _, files in os.walk(folder):
                        for f in files:
                            p = os.path.join(root, f)
                            try:
                                mtime = os.path.getmtime(p)
                                if p not in known_files or mtime > known_files[p]:
                                    known_files[p] = mtime
                                    class DummyEvent:
                                        def __init__(self, path):
                                            self.src_path = path
                                            self.is_directory = False
                                    event_handler.process_event(DummyEvent(p))
                            except OSError:
                                pass
        except KeyboardInterrupt:
            print("\n[Watcher] Shutting down observer & localhost...")
    print("[Watcher] Offline.")
