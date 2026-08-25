#!/usr/bin/env python3
"""
LyricLingo – asset generation via the Higgsfield Cloud API (platform.higgsfield.ai).

Ez a script az API-kreditjeidből dolgozik, nem a webes/MCP fiók csomagjából.

Használat:
  export HF_API_KEY_ID=...        # https://cloud.higgsfield.ai -> API keys
  export HF_API_KEY_SECRET=...
  pip install requests
  python generate_assets.py

Kimenet:
  ./assets/*.mp4 és *.png  +  assets.json (URL-ek), amit az index.html LL_ASSETS
  objektumába kell bemásolni (vagy futtasd `python generate_assets.py --patch`
  és beírja helyetted).
"""
import json, os, re, sys, time, pathlib, mimetypes
import requests

BASE = "https://platform.higgsfield.ai"
KEY_ID = os.environ.get("HF_API_KEY_ID")
KEY_SECRET = os.environ.get("HF_API_KEY_SECRET")
if not (KEY_ID and KEY_SECRET):
    sys.exit("Állítsd be a HF_API_KEY_ID és HF_API_KEY_SECRET környezeti változókat.")
H = {"Authorization": f"Key {KEY_ID}:{KEY_SECRET}", "Content-Type": "application/json", "Accept": "application/json"}

# --- Modell-slugok: a cloud.higgsfield.ai modellkatalógusból másold ki a pontos elérési utat,
#     ha a fiókodban más a név. (A dokumentált példák: higgsfield-ai/dop/standard,
#     kling-video/v2.1/pro/image-to-video, higgsfield-ai/soul/standard.)
VIDEO_MODEL = os.environ.get("HF_VIDEO_MODEL", "kling-video/v2.1/pro/image-to-video")
IMAGE_MODEL = os.environ.get("HF_IMAGE_MODEL", "higgsfield-ai/soul/standard")

HERE = pathlib.Path(__file__).parent
OUT = HERE / "assets"; OUT.mkdir(exist_ok=True)

ROBOT = HERE / "robot.png"
MEADOW = HERE / "robot_meadow.png"

STYLE = ("Keep the character design, proportions and colors identical to the image. "
         "Static camera, no camera movement, background unchanged, stylized 3D character animation, seamless loop.")

VIDEOS = {
    "hero_idle":  (ROBOT,  "The cute white robot listens to music: gently bobs its head and sways side to side in rhythm, "
                           "headphones glow softly cyan and purple, chest waveform display pulses with the beat, antenna note bobs. " + STYLE),
    "hero_sing":  (ROBOT,  "The cute white robot raises the microphone to its face and sings joyfully, eyes squint into happy arcs, "
                           "small glowing musical notes float up from the microphone and fade. " + STYLE),
    "wave_upload":(ROBOT,  "The cute white robot waves its free hand toward the camera in a friendly, inviting way, then points upward "
                           "with one finger, smiling. " + STYLE),
    "dance_learn":(MEADOW, "The cute white robot does a small happy dance on its wheels in the flowery meadow, rocking left and right "
                           "and bouncing to the beat, headphones lighting up cyan and purple, flowers and grass sway gently in a breeze. " + STYLE),
}
IMAGES = {
    "bg_vinyl":    "Extreme close-up of a spinning vinyl record on a turntable, grooves catching soft purple and cyan neon reflections, shallow depth of field, deep dark navy background, moody cinematic lighting, photorealistic, no text, no logos.",
    "bg_waveform": "Abstract glowing audio waveform made of thousands of tiny light particles, purple and cyan gradient on a deep navy background, wide cinematic composition, waveform running low across the frame, lots of empty dark space above for text, soft bloom, no text.",
    "flags_soft":  "Four large soft blurred bokeh color fields side by side on a pale blue background, abstractly hinting at the flags of Italy, United Kingdom, Germany and France with no sharp shapes, no flags, no symbols, only defocused light, elegant, airy, minimal, no text.",
    "bg_italy":    "Golden-hour narrow cobblestone street in a small Italian hill town, laundry lines between ochre facades, warm low sunlight, soft focus, slight blue-purple cinematic color grade in the shadows, wide cinematic shot, no people, no text, photorealistic.",
}

def upload(path: pathlib.Path) -> str:
    ct = mimetypes.guess_type(path.name)[0] or "image/png"
    r = requests.post(f"{BASE}/files/generate-upload-url", headers=H, json={"content_type": ct}); r.raise_for_status()
    u = r.json()
    with open(path, "rb") as f:
        requests.put(u["upload_url"], headers=u["upload_headers"], data=f).raise_for_status()
    print(f"  feltöltve: {path.name}")
    return u["public_url"]

def submit(model: str, body: dict) -> str:
    r = requests.post(f"{BASE}/{model}", headers=H, json=body)
    if r.status_code >= 400:
        raise RuntimeError(f"{model}: {r.status_code} {r.text[:300]}")
    return r.json()["request_id"]

def wait(request_id: str, label: str, timeout=900) -> dict:
    t0 = time.time(); delay = 5
    while time.time() - t0 < timeout:
        s = requests.get(f"{BASE}/requests/{request_id}/status", headers=H).json()
        st = s.get("status")
        if st in ("completed", "failed", "nsfw", "canceled"):
            print(f"  {label}: {st}" + (f" – {s.get('error')}" if s.get("error") else ""))
            return s
        time.sleep(delay); delay = min(delay * 1.5, 20)
    raise TimeoutError(label)

def download(url: str, dest: pathlib.Path):
    with requests.get(url, stream=True) as r:
        r.raise_for_status()
        with open(dest, "wb") as f:
            for chunk in r.iter_content(1 << 16): f.write(chunk)

def main():
    print("1) Referenciaképek feltöltése")
    refs = {p: upload(p) for p in {ROBOT, MEADOW}}

    print("2) Kérések beküldése")
    jobs = {}
    for name, (ref, prompt) in VIDEOS.items():
        body = {"image_url": refs[ref], "prompt": prompt, "duration": 5, "aspect_ratio": "16:9"}
        jobs[name] = ("video", submit(VIDEO_MODEL, body)); print(f"  {name} -> {jobs[name][1]}")
    for name, prompt in IMAGES.items():
        body = {"prompt": prompt, "aspect_ratio": "16:9", "resolution": "1080p"}
        jobs[name] = ("image", submit(IMAGE_MODEL, body)); print(f"  {name} -> {jobs[name][1]}")

    print("3) Várakozás az eredményekre")
    result = {}
    for name, (kind, rid) in jobs.items():
        s = wait(rid, name)
        if s.get("status") != "completed": continue
        url = s["video"]["url"] if kind == "video" else s["images"][0]["url"]
        ext = ".mp4" if kind == "video" else ".png"
        download(url, OUT / f"{name}{ext}")
        result[name] = f"assets/{name}{ext}"          # relatív út az index.html mellé
        result[f"{name}__remote"] = url               # CDN URL (min. 7 napig él)

    (HERE / "assets.json").write_text(json.dumps(result, indent=2, ensure_ascii=False))
    print("\nKész. Fájlok: ./assets/, lista: assets.json")

    if "--patch" in sys.argv:
        html = (HERE / "index.html").read_text(encoding="utf8")
        for k, v in result.items():
            if "__remote" in k: continue
            html = re.sub(rf'({k}:\s*)""', rf'\1"{v}"', html, count=1)
        (HERE / "index.html").write_text(html, encoding="utf8")
        print("index.html LL_ASSETS frissítve.")

if __name__ == "__main__":
    main()
