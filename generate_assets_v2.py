#!/usr/bin/env python3
"""
Cantu — Higgsfield Cloud API asset generator.

Uses Higgsfield Cloud API credentials (HF_API_KEY_ID / HF_API_KEY_SECRET),
therefore it spends the Cloud/API credit balance rather than the Higgsfield
web/MCP/ChatGPT-plugin plan-credit balance.

Designed for the current Next.js Cantu repository.

Typical usage (PowerShell):
  $env:HF_API_KEY_ID="..."
  $env:HF_API_KEY_SECRET="..."
  pip install requests
  python generate_assets_v2.py --coach

Generate only selected coach states:
  python generate_assets_v2.py --coach --only welcome,shortcut,listen,success

Preview planned jobs without spending credits:
  python generate_assets_v2.py --coach --dry-run

Output:
  public/robot/coach-*.mp4
  public/robot/coach-manifest.json

The generated names follow public/robot/README.md and are intended to replace
RobotCoach's /robot.png fallbacks without changing lesson components.
"""

from __future__ import annotations

import argparse
import json
import mimetypes
import os
import pathlib
import sys
import time
from typing import Dict, Iterable, Tuple

import requests

BASE = os.environ.get("HF_API_BASE", "https://platform.higgsfield.ai").rstrip("/")
KEY_ID = os.environ.get("HF_API_KEY_ID")
KEY_SECRET = os.environ.get("HF_API_KEY_SECRET")

# Keep model choice configurable: API model availability can differ from web/MCP.
VIDEO_MODEL = os.environ.get("HF_VIDEO_MODEL", "kling-video/v2.1/pro/image-to-video")
IMAGE_MODEL = os.environ.get("HF_IMAGE_MODEL", "higgsfield-ai/soul/standard")

COACH_DURATION = int(os.environ.get("HF_COACH_DURATION", "5"))
COACH_ASPECT_RATIO = os.environ.get("HF_COACH_ASPECT_RATIO", "1:1")
POLL_TIMEOUT = int(os.environ.get("HF_POLL_TIMEOUT", "900"))

HERE = pathlib.Path(__file__).resolve().parent


def first_existing(*paths: pathlib.Path) -> pathlib.Path:
    for path in paths:
        if path.exists():
            return path
    joined = "\n  - ".join(str(p) for p in paths)
    raise FileNotFoundError(f"Nem található a referencia asset. Próbált helyek:\n  - {joined}")


ROBOT = first_existing(
    HERE / "public" / "robot.png",
    HERE / "robot.png",
)
MEADOW = next(
    (
        p
        for p in (
            HERE / "public" / "robot_meadow.png",
            HERE / "robot_meadow.png",
        )
        if p.exists()
    ),
    None,
)

COACH_OUT = HERE / "public" / "robot"
LANDING_OUT = HERE / "public" / "assets"

# Motion should read as a calm coach, not a mascot constantly demanding attention.
COACH_STYLE = (
    "Preserve the robot character identity exactly: same face, proportions, materials, colors, "
    "headphones, wheels, microphone and overall 3D design. Preserve the existing clean background. "
    "Static locked camera, no zoom, no pan, no cuts, no text, no logos, no extra characters. "
    "Subtle premium 3D character animation suitable for a language-learning UI. Motion should be "
    "gentle, readable and loop cleanly. Keep the robot centered with comfortable empty space around it. "
    "Do not add musical notes, concert effects or childish props."
)

# These names intentionally match public/robot/README.md in the Cantu repo.
COACH_VIDEOS: Dict[str, str] = {
    "welcome": (
        "The robot gives one warm small wave, settles into a relaxed friendly pose and looks attentively "
        "toward the learner. Friendly first-meeting energy, restrained movement. " + COACH_STYLE
    ),
    "source": (
        "The robot glances toward an imaginary reading panel beside it and gently points toward the source "
        "text area with an open palm, then returns attention to the learner. Curious and attentive. " + COACH_STYLE
    ),
    "shortcut": (
        "The robot has a clear aha moment: eyes brighten, it raises one finger as if identifying the key idea, "
        "then gives a small confident nod. Smart shortcut / insight energy, not exaggerated. " + COACH_STYLE
    ),
    "explain": (
        "The robot calmly explains something with one or two small open-hand teaching gestures, briefly points "
        "to an imaginary phrase beside it, then returns to neutral. Patient and intelligent tutor behavior. " + COACH_STYLE
    ),
    "encourage": (
        "The robot gives a calm supportive nod and a small open-palm gesture that says 'you can use this', "
        "then settles into a confident friendly pose. Encouraging, not celebratory and not childish. " + COACH_STYLE
    ),
    "challenge": (
        "The robot leans forward slightly in an encouraging ready pose, makes a small 'your turn' gesture toward "
        "the learner, then gives a confident nod. Playful challenge without competitive or childish behavior. " + COACH_STYLE
    ),
    "listen": (
        "The robot becomes visibly attentive: tilts its head slightly, brings one hand near the headphones as if "
        "listening carefully, waits, then gives a tiny acknowledging nod. No sound waves or musical notes. " + COACH_STYLE
    ),
    "retry": (
        "The robot responds supportively after a mistake: small reassuring head shake followed by a gentle "
        "encouraging hand gesture meaning 'try once more', then returns to an attentive pose. Never sad or disappointed. " + COACH_STYLE
    ),
    "success": (
        "The robot gives a compact success reaction: bright happy eyes, one small celebratory fist/hand gesture and "
        "a pleased nod. Short micro-success moment, no confetti and no large dance. " + COACH_STYLE
    ),
    "completion": (
        "The robot gives a slightly bigger but still tasteful lesson-completion celebration: happy eyes, raises both "
        "hands briefly, makes one small joyful bounce, then settles into a proud friendly pose. No confetti. " + COACH_STYLE
    ),
}

# Kept only for optional regeneration of historical landing visuals.
LANDING_STYLE = (
    "Keep the character design, proportions and colors identical to the reference image. "
    "Static camera, no camera movement, background unchanged, stylized 3D character animation, seamless loop."
)

LANDING_VIDEOS: Dict[str, Tuple[pathlib.Path, str]] = {
    "hero_idle": (
        ROBOT,
        "The white Cantu robot gently bobs its head and sways subtly, looking curious and welcoming; "
        "headphones glow softly cyan and purple, chest display pulses very subtly. " + LANDING_STYLE,
    ),
    "wave_upload": (
        ROBOT,
        "The white Cantu robot gives a friendly wave, then makes a small inviting gesture toward the interface. "
        + LANDING_STYLE,
    ),
}
if MEADOW:
    LANDING_VIDEOS["dance_learn"] = (
        MEADOW,
        "The Cantu robot does a small joyful completion dance in the meadow, rocking gently and making one small bounce. "
        + LANDING_STYLE,
    )

LANDING_IMAGES: Dict[str, str] = {
    "bg_waveform": (
        "Abstract elegant audio waveform made of tiny soft cyan and purple particles on deep navy, wide composition, "
        "generous empty space, premium modern language-learning product, no text, no logos."
    ),
}


def headers() -> dict:
    if not (KEY_ID and KEY_SECRET):
        raise RuntimeError(
            "Állítsd be a HF_API_KEY_ID és HF_API_KEY_SECRET környezeti változókat "
            "(Higgsfield Cloud API keys)."
        )
    return {
        "Authorization": f"Key {KEY_ID}:{KEY_SECRET}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }


def upload(path: pathlib.Path) -> str:
    ct = mimetypes.guess_type(path.name)[0] or "image/png"
    r = requests.post(
        f"{BASE}/files/generate-upload-url",
        headers=headers(),
        json={"content_type": ct},
        timeout=60,
    )
    r.raise_for_status()
    info = r.json()
    with path.open("rb") as handle:
        requests.put(
            info["upload_url"],
            headers=info.get("upload_headers", {}),
            data=handle,
            timeout=180,
        ).raise_for_status()
    print(f"  feltöltve: {path.name}")
    return info["public_url"]


def submit(model: str, body: dict) -> str:
    r = requests.post(f"{BASE}/{model}", headers=headers(), json=body, timeout=60)
    if r.status_code >= 400:
        raise RuntimeError(f"{model}: {r.status_code} {r.text[:500]}")
    payload = r.json()
    request_id = payload.get("request_id")
    if not request_id:
        raise RuntimeError(f"A Higgsfield válaszban nincs request_id: {payload}")
    return request_id


def wait(request_id: str, label: str, timeout: int = POLL_TIMEOUT) -> dict:
    t0 = time.time()
    delay = 5.0
    while time.time() - t0 < timeout:
        r = requests.get(
            f"{BASE}/requests/{request_id}/status",
            headers=headers(),
            timeout=60,
        )
        r.raise_for_status()
        status = r.json()
        state = status.get("status")
        if state in {"completed", "failed", "nsfw", "canceled"}:
            suffix = f" – {status.get('error')}" if status.get("error") else ""
            print(f"  {label}: {state}{suffix}")
            return status
        time.sleep(delay)
        delay = min(delay * 1.5, 20.0)
    raise TimeoutError(label)


def download(url: str, destination: pathlib.Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    with requests.get(url, stream=True, timeout=180) as r:
        r.raise_for_status()
        with destination.open("wb") as f:
            for chunk in r.iter_content(1 << 16):
                if chunk:
                    f.write(chunk)


def parse_only(value: str | None, available: Iterable[str]) -> set[str]:
    available_set = set(available)
    if not value:
        return available_set
    requested = {part.strip() for part in value.split(",") if part.strip()}
    unknown = requested - available_set
    if unknown:
        raise ValueError(f"Ismeretlen asset név: {', '.join(sorted(unknown))}")
    return requested


def run_coach(args: argparse.Namespace) -> None:
    selected = parse_only(args.only, COACH_VIDEOS)

    # Current Kling v2.1 Pro image-to-video accepts only 5s or 10s clips.
    # Validate before uploading the reference image so an invalid duration cannot
    # create unnecessary API traffic or confuse credit usage.
    if VIDEO_MODEL == "kling-video/v2.1/pro/image-to-video" and COACH_DURATION not in {5, 10}:
        raise ValueError(
            f"A {VIDEO_MODEL} modell csak 5 vagy 10 másodperces videót fogad el; "
            f"HF_COACH_DURATION={COACH_DURATION}. Állítsd 5-re vagy 10-re."
        )

    print(f"Coach assetek: {', '.join(sorted(selected))}")
    print(f"Model: {VIDEO_MODEL}; duration={COACH_DURATION}s; aspect={COACH_ASPECT_RATIO}")

    if args.dry_run:
        for state in COACH_VIDEOS:
            if state in selected:
                print(f"  DRY RUN -> public/robot/coach-{state}.mp4")
        return

    COACH_OUT.mkdir(parents=True, exist_ok=True)
    ref_url = upload(ROBOT)
    jobs: Dict[str, str] = {}

    for state, prompt in COACH_VIDEOS.items():
        if state not in selected:
            continue
        destination = COACH_OUT / f"coach-{state}.mp4"
        if destination.exists() and not args.overwrite:
            print(f"  skip (létezik): {destination.name}")
            continue
        body = {
            "image_url": ref_url,
            "prompt": prompt,
            "duration": COACH_DURATION,
            "aspect_ratio": COACH_ASPECT_RATIO,
        }
        request_id = submit(VIDEO_MODEL, body)
        jobs[state] = request_id
        print(f"  coach-{state} -> {request_id}")

    manifest: Dict[str, dict] = {}
    manifest_path = COACH_OUT / "coach-manifest.json"
    if manifest_path.exists():
        try:
            manifest.update(json.loads(manifest_path.read_text(encoding="utf-8")))
        except Exception:
            pass

    for state, request_id in jobs.items():
        status = wait(request_id, f"coach-{state}")
        if status.get("status") != "completed":
            continue
        video = status.get("video") or {}
        url = video.get("url")
        if not url:
            print(f"  nincs video URL: coach-{state}")
            continue
        filename = f"coach-{state}.mp4"
        download(url, COACH_OUT / filename)
        manifest[state] = {
            "src": f"/robot/{filename}",
            "remote": url,
            "request_id": request_id,
            "model": VIDEO_MODEL,
            "duration_seconds": COACH_DURATION,
            "aspect_ratio": COACH_ASPECT_RATIO,
        }

    manifest_path.write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"\nKész: {COACH_OUT}")
    print(f"Manifest: {manifest_path}")


def run_landing(args: argparse.Namespace) -> None:
    names = list(LANDING_VIDEOS) + list(LANDING_IMAGES)
    selected = parse_only(args.only, names)
    if args.dry_run:
        for name in names:
            if name in selected:
                print(f"  DRY RUN -> public/assets/{name}")
        return

    LANDING_OUT.mkdir(parents=True, exist_ok=True)
    refs: Dict[pathlib.Path, str] = {}
    for ref, _ in LANDING_VIDEOS.values():
        if ref not in refs:
            refs[ref] = upload(ref)

    jobs: Dict[str, Tuple[str, str]] = {}
    for name, (ref, prompt) in LANDING_VIDEOS.items():
        if name not in selected:
            continue
        jobs[name] = (
            "video",
            submit(
                VIDEO_MODEL,
                {
                    "image_url": refs[ref],
                    "prompt": prompt,
                    "duration": 5,
                    "aspect_ratio": "16:9",
                },
            ),
        )
    for name, prompt in LANDING_IMAGES.items():
        if name not in selected:
            continue
        jobs[name] = (
            "image",
            submit(
                IMAGE_MODEL,
                {"prompt": prompt, "aspect_ratio": "16:9", "resolution": "1080p"},
            ),
        )

    result = {}
    for name, (kind, request_id) in jobs.items():
        status = wait(request_id, name)
        if status.get("status") != "completed":
            continue
        if kind == "video":
            url = status["video"]["url"]
            ext = ".mp4"
        else:
            url = status["images"][0]["url"]
            ext = ".png"
        download(url, LANDING_OUT / f"{name}{ext}")
        result[name] = f"/assets/{name}{ext}"

    (LANDING_OUT / "generated-manifest.json").write_text(
        json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8"
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Cantu Higgsfield Cloud API asset generator")
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--coach", action="store_true", help="Robot Coach state animations (default)")
    mode.add_argument("--landing", action="store_true", help="Optional landing asset regeneration")
    mode.add_argument("--all", action="store_true", help="Coach + landing")
    parser.add_argument("--only", help="Comma-separated asset/state names")
    parser.add_argument("--dry-run", action="store_true", help="Do not call Higgsfield / spend credits")
    parser.add_argument("--overwrite", action="store_true", help="Regenerate existing coach files")
    args = parser.parse_args()

    try:
        if args.all:
            run_coach(args)
            run_landing(args)
        elif args.landing:
            run_landing(args)
        else:
            run_coach(args)
    except (RuntimeError, ValueError, FileNotFoundError, TimeoutError) as exc:
        sys.exit(str(exc))


if __name__ == "__main__":
    main()
