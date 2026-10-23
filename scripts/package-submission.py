"""Create an explicit local source export; never include live data or installed runtimes."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import shutil
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parent.parent
FILES = [
    'README.md', 'LICENSE', 'CHANGELOG.md', 'CONTRIBUTING.md', 'SECURITY.md',
    'CODE_OF_CONDUCT.md', 'THIRD_PARTY_NOTICES.md', '.gitattributes', '.gitignore', '.env.example', 'package.json',
    'pnpm-lock.yaml', 'pnpm-workspace.yaml', 'tsconfig.json', 'vite.config.ts',
    'app-server.mjs', 'readyby-server.mjs', 'server.mjs',
]
TREES = [
    'src', 'tests', 'scripts', 'public', 'readyby/public',
    'frontend/src', 'frontend/public', 'frontend/dist', 'docs/architecture',
    '.github', 'docs/brand', 'docs/releases', 'docs/evidence/live-voice',
]
EVIDENCE = [
    'actual-browser-receipts.json', 'speech-service.json', 'tests.tap',
    'integrated-household-desktop.png', 'integrated-conversation.png',
    'saved-default.png', 'essential-mobile.png', 'essential-mobile-360.png',
    'essential-schedule.png', 'synthetic-fifteen.wav', 'synthetic-fifteen.pcm',
]


def selected_files():
    selected = {ROOT / name for name in FILES}
    selected.add(ROOT / 'frontend/index.html')
    for name in TREES:
        selected.update(p for p in (ROOT/name).rglob('*') if p.is_file())
    selected.update((ROOT/'docs').glob('*.md'))
    for name in ('readyby-mcp-evidence-walkthrough.mp4','readyby-mcp-evidence-walkthrough.srt','readyby-mcp-evidence-walkthrough-render.json'):
        selected.add(ROOT/'docs/evidence'/name)
    selected.update(p for p in (ROOT/'docs/evidence/mcp-integration').glob('*') if p.suffix in {'.json','.tap','.png'})
    trace = ROOT/'docs/evidence/ai-trace/live-model-request.json'
    if trace.exists():
        selected.add(trace)
    selected.update(ROOT/'docs/evidence/film-integration'/name for name in EVIDENCE)
    for path in sorted(selected):
        if not path.exists():
            raise SystemExit(f'Missing export input: {path.relative_to(ROOT)}')
        if not path.resolve().is_relative_to(ROOT):
            raise SystemExit('Export inputs must resolve inside the project.')
        relative = path.relative_to(ROOT)
        if any(part in {'node_modules', '__pycache__', '.git', 'data', 'backups', '.venv-speech'} for part in relative.parts):
            continue
        if path.suffix in {'.pyc', '.log'}:
            continue
        yield path, relative


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--check-dir', action='store_true', help='Copy to a fresh temp directory for independent installation/testing.')
    args = parser.parse_args()
    inputs = list(selected_files())
    manifest = {
        'createdAt': datetime.now(timezone.utc).isoformat(),
        'scope': 'ReadyBy 0.4.0 Alexa+ simulator source and selected evidence; public repository: https://github.com/sankalp2515/ReadyBy',
        'excludes': ['live household data and account/session records', 'backups', 'environment secrets', 'installed dependencies', 'model weights', 'historical videos'],
        'files': [{
            'path': relative.as_posix(), 'bytes': path.stat().st_size,
            'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
        } for path, relative in inputs],
    }
    if args.check_dir:
        destination = Path(tempfile.mkdtemp(prefix='readyby-final-check-'))
        for path, relative in inputs:
            target = destination/relative
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(path, target)
        (destination/'EXPORT_MANIFEST.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
        print(json.dumps({'checkDirectory':str(destination), 'files':len(inputs)}))
        return
    destination = ROOT/'artifacts'
    destination.mkdir(exist_ok=True)
    archive = destination/'ReadyBy-Local-Submission.zip'
    temporary = destination/'ReadyBy-Local-Submission.zip.tmp'
    with zipfile.ZipFile(temporary, 'w', compression=zipfile.ZIP_DEFLATED) as bundle:
        for path, relative in inputs:
            bundle.write(path, relative.as_posix())
        bundle.writestr('EXPORT_MANIFEST.json', json.dumps(manifest, indent=2))
    temporary.replace(archive)
    digest = hashlib.sha256(archive.read_bytes()).hexdigest()
    archive.with_suffix('.zip.sha256').write_text(digest+'  '+archive.name+'\n',encoding='utf-8')
    print(json.dumps({'archive':str(archive),'files':len(inputs),'bytes':archive.stat().st_size,'sha256':digest}))


if __name__ == '__main__':
    main()
