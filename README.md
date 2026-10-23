# Echo Loop+ Touch

Echo Loop+ Desktop 2, rebuilt for iPhone: the same exact sound engine and editing tools, with a waveform you select, zoom and trim with your fingers.

## Upright or on its side

- **Upright — listen and drill.** The waveform sits in the middle, with everything you use while practising within thumb reach: Play, ±5 s, previous and next, Mark and End, Repeat, speed, the sleep timer, your flags, and the section controls (A and B, the length lock, repeats, the section's own speed, Save).
- **On its side — edit.** The waveform fills the width of the screen. The tools run along the top, Play sits under your left thumb, the trim controls in the middle and the section's repeats, speed, Save, ⋯ and ✕ under your right thumb.

Turn the phone at any moment: the same part of the recording stays in view.

## Your fingers on the waveform

| Gesture | What it does |
|---|---|
| Tap | Moves the playhead there. With the magic wand: selects that word. |
| Drag | Selects a stretch to loop. With the magic wand: whole words. |
| Drag A or B | Trims the section. A magnifier, placed clear of your finger, shows the edge up close to the millisecond. A's handle is on top and B's at the bottom, so you can grab either one even on a tiny section. |
| Slide off while dragging an edge | Move your finger above or below the waveform and the edge follows at ½, ¼ or ⅛ speed, for exact placement. Edges snap to the quiet point between sounds at normal speed and land exactly where you leave them at the slower speeds. |
| Double-tap | Loops the whole phrase around that point. |
| Touch and hold | Options: play from here, select the word, add the word to the section, loop the phrase, zoom in. On a section: save, split, crop, cut, save as WAV, lock, exact length. |
| Pinch | Zooms in and out, from the whole recording down to single sound waves. |
| Two fingers | Slide to scroll; flick and the view glides on. A quick two-finger tap zooms out. |
| Ruler and flag strip | Drag to scroll. Tap the ruler to jump there, tap a flag to loop it, hold a flag for its options. |
| Overview strip | Drag the box to move around; double-tap it to see the whole recording. |

The ‹ › buttons beside A and B move an edge 10 ms at a time when you're zoomed in closely and 0.1 s otherwise; hold one to keep it moving. Tap the A or B badge to hear that edge.

## Everything from Echo Loop+ Desktop 2

- **The exact sound engine.** Seamless loops exactly as long as you set them, a tiny fade at every seam so nothing clicks, slow-down and speed-up that keep the speaker's natural pitch, and a playhead timed to what you hear.
- **Magic wand** (Syllables / Words / Phrases), **Split** into one flag per sound, **double-tap** for a phrase, **Mark and End** while listening.
- **Length lock**: move a fixed-length section along the recording, or jump by one whole length with the double arrows.
- **Flags** with their own speed and repeats, **Undo and Redo**.
- **Shuffle sets** of up to 100 flags from any recordings, with pauses, rounds and even loudness; **Reshuffle**.
- **Crop** and **Cut out** into new recordings (the original is never changed), **Join** a list into one track.
- **Save as a WAV file**, then **Save or share…** opens the iPhone share sheet: Save to Files, AirDrop or any app.
- Folders, play counts, Repeat One / All / Off, the sleep timer, Even out volume, Clarity, Playhead timing, offline use.

## Put it online (GitHub Pages)

1. On GitHub, create a new public repository, for example `echo-loop-touch`. Upload every file in this folder and keep the file names as they are. **`worklet.js` must sit next to `index.html`**: it is the sound engine, and iPhone won't load the engine any other way.
2. In the repository, open **Settings → Pages** and choose **Deploy from a branch → main → / (root)**. Save.
3. After a minute, open `https://<your-username>.github.io/echo-loop-touch/` in **Safari** on the iPhone.
4. Tap **Share → Add to Home Screen**, keep **Open as Web App** switched on, then tap **Add**. It appears as **Echo Touch**.
5. Open it from the Home Screen **once while online**. When the dot at the top turns green (**Offline ready**), it works in airplane mode.
6. Import your recordings with **+**. Each Home Screen app keeps its own recordings, so the ones in Echo Loop+ don't carry over. All the apps can stay installed side by side.

## Good to know

- **Turning the phone.** If the screen doesn't turn, switch off the rotation lock (the padlock with a circular arrow) in Control Center.
- **The first Play** switches the sound engine on. iPhone lets a web app make sound only after a tap, so the first tap on Play (or on a recording or a flag) starts it.
- **Screen off.** Start playing, then press the side button. The engine loops on the iPhone's audio thread, so sections stay exact with the screen off, and a silent companion sound keeps iOS from putting the app to sleep. Pause, skip and scrub from the Lock Screen. If a folder ever stalls between recordings with the screen off, open ⋯ above the library list → **Join into one track** and play that instead.
- **Silent mode.** It keeps playing with the iPhone set to Silent, like a music app.
- **Long recordings.** MP3 and WAV recordings of any length play at full quality and start at once: only the part around the playhead (about 20 seconds at a time) is decoded, so a 3-hour lecture takes a few MB. The first time a long recording opens, its waveform is drawn in the background (the percentage shows) and kept for next time. Other formats (m4a and the rest) are still decoded whole, so long ones are kept at a lower quality: full quality up to about 11 minutes, 16 kHz (clear speech) up to about half an hour, 12 kHz up to about 45 minutes, phone-call quality beyond that.
- **Bluetooth headphones** add their own delay. The playhead allows for it; if it still looks early or late, adjust **Sound → Playhead timing**.
- **Earphones that stop or go out of range.** Playback pauses where you were, in the app and on the Lock Screen, like a music app. Press Play on the phone, the Lock Screen or the earphones once they're back and it carries on from the same place.
- **Pause and Play with the screen locked.** About 10 seconds after a pause iOS puts a web app to sleep, and Safari's sound engine can't be woken again until the app is opened. So a Play from the Lock Screen or the earphones after that plays the recording through an ordinary audio player instead: same place, same speed, with Pause, Play, scrubbing, next and previous, the sleep timer and section loops (looped to about a quarter of a second, and without Clarity and Even out volume). The first touch in the app after unlocking hands back to the exact sound engine at the same place.
- **Playing means heard.** A moment after every start the app checks the sound is really coming out. If iOS has silenced it (after the app was put to sleep or the earphones changed), it brings the sound back by itself, from the same place: a fresh sound engine on screen, the ordinary audio player with the screen locked. You never need to close and reopen the app; each rescue is in the Sound log.
- **Sound log.** If Play ever gives no sound, open **Sound → Sound log…** right after and tap **Share or copy**: it lists what iOS and the app did with the sound, step by step.
- **Shuffle sets, crops and cuts are WAV files**, so they take more space than MP3s: about 5 MB per minute (10 MB in stereo). Very long ones are written at a lower rate to fit the iPhone's memory (a cut of a 2-hour lecture comes out at 8 kHz).
- **If Play makes no sound**, check the volume first. Some iOS 26 versions lose sound in Home Screen web apps because of an Apple bug; restarting the iPhone clears it.
- **Opened in Safari instead of from the Home Screen**, it shares one library with any other Echo Loop app opened in Safari from the same GitHub account. Keep only one of them open at a time: a tab left open in the background holds an old copy of the library and can save it over newer changes.
- **Updating later.** If you change any file, also change `elt-v10` to `elt-v11` (and so on) at the top of `sw.js`. The app picks up the new version the next time it's opened online.

## Files

| File | Purpose |
|---|---|
| `index.html` | The whole app |
| `worklet.js` | The sound engine (runs on the iPhone's audio thread) |
| `sw.js` | Saves the app for offline use |
| `manifest.webmanifest` | Home Screen name, icon and colours |
| `icon-180.png`, `icon-192.png`, `icon-512.png` | App icons |
| `make_icons.py` | Script that draws the icons (only needed if you want to change them) |

Recordings, play counts and flags are stored on the iPhone, inside the app. They are never uploaded anywhere.
