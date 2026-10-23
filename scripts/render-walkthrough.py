"""Render a labelled narrated walkthrough from actual CUA-captured product states.

Not a continuous screen recording. No simulated tool output is added to captures.
Requires ffmpeg/ffprobe and Windows speech WAVs produced by the companion script.
"""
import json
import argparse
import subprocess
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--media',default='docs/evidence/walkthrough')
parser.add_argument('--output-name',default='readyby-local-walkthrough')
args = parser.parse_args()
if not args.output_name.replace('-','').replace('_','').isalnum():
    raise SystemExit('Output name must be a simple artifact name.')
media = Path(args.media)
manifest = json.loads((media / 'manifest.json').read_text(encoding='utf-8'))
clips = []
durations = []
subtitle_lines = []
elapsed = 0.0

def timestamp(seconds):
    ms = round(seconds * 1000)
    return f'{ms // 3600000:02}:{ms // 60000 % 60:02}:{ms // 1000 % 60:02},{ms % 1000:03}'

for i, scene in enumerate(manifest):
    image = media / scene['image']
    audio = media / f'voice-{i:02}.wav'
    if not image.exists() or not audio.exists():
        raise SystemExit(f'Missing actual capture or narration: {image}, {audio}')
    audio_duration = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', str(audio)], text=True))
    duration = max(8.0, audio_duration + 1.0)
    caption = media / f'caption-{i:02}.txt'
    caption.write_text(scene['caption'], encoding='utf-8')
    target = media / f'clip-{i:02}.mp4'
    # The subtitle band is separate from the unaltered captured product area.
    filters = (
        'scale=1920:1000:force_original_aspect_ratio=decrease,'
        'pad=1920:1080:(ow-iw)/2:0:color=white,'
        'drawbox=x=0:y=1000:w=1920:h=80:color=0x132842:t=fill,'
        "drawtext=fontfile='C\\:/Windows/Fonts/segoeui.ttf':"
        f"textfile='{caption.as_posix()}':fontcolor=white:fontsize=24:x=30:y=1027"
    )
    subprocess.run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-loop', '1', '-framerate', '15', '-i', str(image), '-i', str(audio), '-vf', filters, '-af', 'apad', '-t', str(duration), '-c:v', 'libx264', '-preset', 'fast', '-crf', '19', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', str(target)], check=True)
    clips.append(target)
    durations.append(duration)
    subtitle_lines.append(f'{i + 1}\n{timestamp(elapsed)} --> {timestamp(elapsed + duration)}\n{scene["caption"]}\n')
    elapsed += duration

if elapsed >= 180:
    raise SystemExit(f'Walkthrough is too long: {elapsed:.1f}s. Trim narration before publishing.')
concat = media / 'concat.txt'
concat.write_text(''.join(f"file '{p.name}'\n" for p in clips), encoding='utf-8')
output = Path('docs/evidence') / (args.output_name + '.mp4')
subprocess.run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', str(concat), '-c', 'copy', '-movflags', '+faststart', str(output)], check=True)
(Path('docs/evidence') / (args.output_name + '.srt')).write_text('\n'.join(subtitle_lines), encoding='utf-8')
(Path('docs/evidence') / (args.output_name + '-render.json')).write_text(json.dumps({'durationSeconds': elapsed, 'sceneDurations': durations, 'format': 'Narrated captured product states; not a continuous screen recording', 'output': str(output)}, indent=2), encoding='utf-8')
print(f'Created {output}: {elapsed:.1f} seconds, {len(clips)} actual captured states.')
