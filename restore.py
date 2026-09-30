import os
import subprocess

try:
    subprocess.run([r"C:\Program Files\Git\cmd\git.exe", "checkout", "naksha_frontend/src/components/views/ExploreMap.jsx"])
    print("Restored from git")
except Exception as e:
    print(e)
