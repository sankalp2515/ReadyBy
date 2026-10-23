"""Install optional offline speech dependencies and verify the downloaded model archive."""
from pathlib import Path
import hashlib
import os
import subprocess
import sys
import urllib.request
import venv
import zipfile

root = Path(__file__).resolve().parent.parent
environment = root / '.venv-speech'
python = environment / ('Scripts/python.exe' if os.name == 'nt' else 'bin/python')
if not python.exists():
    venv.create(environment, with_pip=True)
subprocess.run([str(python), '-m', 'pip', 'install', '-r', str(root/'scripts/speech-requirements.txt')], check=True)
destination = root / 'data/speech'
destination.mkdir(parents=True, exist_ok=True)
archive = destination / 'vosk-model-small-en-us-0.15.zip'
if not archive.exists():
    print('Downloading the 40MB Apache-2.0 English model from its publisher.', flush=True)
    urllib.request.urlretrieve('https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip', archive)
expected = '30f26242c4eb449f948e42cb302dd7a686cb29a3423a8367f99ff41780942498'
if hashlib.sha256(archive.read_bytes()).hexdigest() != expected:
    raise SystemExit('Speech model checksum mismatch. Remove the archive and retry; no extraction performed.')
with zipfile.ZipFile(archive) as bundle:
    for entry in bundle.infolist():
        target = (destination / entry.filename).resolve()
        if not target.is_relative_to(destination.resolve()):
            raise SystemExit('Unsafe archive path; no extraction performed.')
    bundle.extractall(destination)
print('Offline speech is installed. Restart ReadyBy and open the household display.')
