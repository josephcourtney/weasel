import logging
import os
import subprocess
import time

from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(message)s")

class RestartOnChangeHandler(FileSystemEventHandler):
    def __init__(self, command):
        self.command = command
        self.process = None
        self.restart_process()

    def restart_process(self):
        if self.process:
            logging.info("Terminating the existing process...")
            self.process.terminate()
            self.process.wait()
        logging.info("Starting the process...")
        self.process = subprocess.Popen(self.command, shell=True)

    def on_modified(self, event):
        if self._is_valid_file(event.src_path):
            logging.info(f"{event.src_path} changed, restarting server...")
            self.restart_process()

    def _is_valid_file(self, path):
        if any(part.startswith(".") for part in path.split(os.sep)):
            return False
        return path.endswith(".py")

if __name__ == "__main__":
    command = "python weasel.py"
    event_handler = RestartOnChangeHandler(command)
    observer = Observer()
    observer.schedule(event_handler, path=".", recursive=True)
    observer.start()
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    finally:
        observer.join()

