"""Local PCM16 recognition. Audio is processed in memory and never written to disk."""
import base64
import json
import sys

from vosk import Model, KaldiRecognizer, SetLogLevel

SetLogLevel(-1)
model = Model(sys.argv[1])
print(json.dumps({"ready": True}), flush=True)
for line in sys.stdin:
    request = {}
    try:
        request = json.loads(line)
        audio = base64.b64decode(request["pcm"], validate=True)
        recognizer = KaldiRecognizer(model, 16000)
        parts = []
        for offset in range(0, len(audio), 8000):
            if recognizer.AcceptWaveform(audio[offset:offset + 8000]):
                parts.append(json.loads(recognizer.Result()).get("text", ""))
        parts.append(json.loads(recognizer.FinalResult()).get("text", ""))
        print(json.dumps({"id": request["id"], "text": " ".join(p for p in parts if p)}), flush=True)
    except Exception:
        print(json.dumps({"id": request.get("id"), "error": "Local recognition failed."}), flush=True)
