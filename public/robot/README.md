# Robot Coach asset contract

The learning UI resolves robot visuals through `lib/learning/robot-coach.ts`; lesson cards never hardcode state-specific paths.

Production motion assets use these slots:

- `coach-welcome.*`
- `coach-source.*`
- `coach-shortcut.*`
- `coach-explain.*`
- `coach-challenge.*`
- `coach-listen.*`
- `coach-retry.*`
- `coach-success.*`
- `coach-completion.*`

`RobotCoach` loads these files lazily through the centralized mapping. A missing/broken video and `prefers-reduced-motion` both fall back to `/robot.png`; success and completion clips do not loop.

## Build-time Higgsfield workflow

Higgsfield Cloud is an optional development-time asset generator, not a Cantu runtime dependency. Keys stay in local environment variables and are never shipped to learners.

Preview all coach jobs without API traffic or credit use:

```powershell
python generate_assets_v2.py --coach --dry-run
```

Preview or generate selected states:

```powershell
python generate_assets_v2.py --coach --only welcome,challenge,success --dry-run
python generate_assets_v2.py --coach --only welcome,challenge,success
```

Real generation requires local `HF_API_KEY_ID` and `HF_API_KEY_SECRET`. Never commit their values. Generated MP4 files are static web assets; the application never calls Higgsfield when a learner opens Cantu.
