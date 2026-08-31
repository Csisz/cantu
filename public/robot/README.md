# Robot Coach asset contract

The learning UI resolves robot visuals through `lib/learning/robot-coach.ts`; lesson cards never hardcode state-specific paths.

Future production motion assets may use these slots:

- `coach-welcome.*`
- `coach-source.*`
- `coach-shortcut.*`
- `coach-explain.*`
- `coach-challenge.*`
- `coach-listen.*`
- `coach-retry.*`
- `coach-success.*`
- `coach-completion.*`

Until an approved asset exists, every state deliberately falls back to the existing `/robot.png`. Animated assets must respect reduced motion and must not loop distractingly while the learner reads.
