# DubMate AI

A full-stack automated video dubbing and lip-syncing pipeline engineered for resource-constrained hardware. 

DubMate AI takes a talking-head video, isolates the audio, transcribes and translates it, generates new TTS audio, and synchronizes the speaker's lip movements to the new audio—all optimized to run locally on an NVIDIA GTX 1650 (4GB VRAM).

## Architecture & Tech Stack
* **Frontend:** Next.js
* **Backend:** FastAPI, SQLModel
* **AI Models:** Whisper (Transcription), Pyannote (Speaker Diarization), YuNet (Facial Tracking), Wav2Lip & GFPGAN (Lip-sync & Face Restoration)
* **Media Processing:** FFmpeg (Python Subprocesses), yt-dlp

## Core Engineering Features
* **Hardware Optimization:** Engineered memory management protocols and asynchronous routing to prevent VRAM overflow during simultaneous face-tracking and audio generation.
* **Multi-Face Tracking:** Utilizes robust bounding-box logic to maintain consistent face tracking across dynamic video cuts.
* **Automated Media Routing:** Seamlessly hands off data between CPU-bound tasks (FFmpeg extraction) and GPU-bound tasks (Wav2Lip inference).

## Getting Started
*(Add your installation steps here later: e.g., `pip install -r requirements.txt`, `uvicorn main:app --reload`)*
