import sys
import threading
import time


class Spinner:
    def __init__(self, message="Loading...", delay=0.1):
        self.spinner_cycle = ['|', '/', '-', '\\']
        self.stop_running = False
        self.delay = delay
        self.message = message
        self.spinner_thread = threading.Thread(target=self._spinner_task)

    def _spinner_task(self):
        sys.stdout.write(self.message + " ")
        sys.stdout.flush()
        while not self.stop_running:
            for symbol in self.spinner_cycle:
                sys.stdout.write(symbol)
                sys.stdout.flush()
                time.sleep(self.delay)
                sys.stdout.write('\b')

    def __enter__(self):
        self.stop_running = False
        self.spinner_thread.start()

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.stop_running = True
        self.spinner_thread.join()
        sys.stdout.write('\bDone!\n')
        sys.stdout.flush()