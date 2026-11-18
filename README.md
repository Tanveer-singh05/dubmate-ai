# DubMate AI

**Live Demo:** [dubmate-ai.vercel.app](https://dubmate-ai.vercel.app)

A full-stack automated video dubbing and lip-syncing pipeline engineered for scalable cloud execution and resource-constrained local hardware. 

DubMate AI takes a talking-head video, isolates the audio, transcribes and translates it, generates new TTS audio, and synchronizes the speaker's lip movements to the new audio.

## Architecture & Tech Stack
* **Frontend:** Next.js (Live on Vercel)
* **Backend:** FastAPI, SQLModel (Serverless Deployment via Modal)
* **AI Models:** Whisper (Transcription), Pyannote (Speaker Diarization), YuNet (Facial Tracking), Wav2Lip & GFPGAN (Lip-sync & Face Restoration), Demucs, Chatterbox TTS
* **Media Processing:** FFmpeg (Python Subprocesses), yt-dlp

## Core Engineering Features
* **Serverless Cloud Deployment:** Architected the backend to run on **Modal**, provisioning serverless cloud containers for the FastAPI app to execute heavy AI inferences dynamically.
* **Hardware Optimization:** Engineered memory management protocols and asynchronous routing to prevent VRAM overflow during simultaneous face-tracking and audio generation.
* **Multi-Face Tracking:** Utilizes robust bounding-box logic to maintain consistent face tracking across dynamic video cuts.
* **Automated Media Routing:** Seamlessly hands off data between CPU-bound tasks (FFmpeg extraction) and GPU-bound tasks (Wav2Lip inference).

## Getting Started
Follow these steps to get a local development environment running.

### Prerequisites
Before you begin, ensure you have the following installed on your system:
* **Git**
* **Python 3.10+** (Ensure "Add Python to PATH" is checked during installation)
* **Node.js 18+** (Includes npm)
* **FFmpeg:** This project relies heavily on media processing. You must install FFmpeg and add it to your system's PATH.
  * *Windows Users:* Download a build from [gyan.dev](https://www.gyan.dev/ffmpeg/builds/), extract it, and add the `bin` folder to your System Environment Variables. Verify the installation by running `ffmpeg -version` in a new terminal.

### 1. Clone the Repository
Open your terminal and clone the project:
```bash
git clone [https://github.com/Tanveer-singh05/dubmate-ai.git](https://github.com/Tanveer-singh05/dubmate-ai.git)
cd dubmate-ai
```

### 2. Backend Setup (FastAPI)
We recommend using a Python virtual environment to isolate your dependencies.

Create and activate the virtual environment (Windows):
```powershell
# Create the environment
python -m venv venv

# Activate the environment (Command Prompt)
venv\Scripts\activate.bat

# OR Activate the environment (PowerShell)
.\venv\Scripts\Activate.ps1
```

Install the backend dependencies:
*(Note: Some AI dependencies like Pyannote and Wav2Lip require specific versions of PyTorch. Ensure your pip is up to date before installing).*
```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Start the FastAPI server (Local Test):
```bash
uvicorn main:app --reload
```
The local backend should now be running at `http://127.0.0.1:8000`. 
*(Note for Cloud Deployment: To deploy the FastAPI backend to your cloud containers, use the `modal deploy` command).*

### 3. Frontend Setup (Next.js)
Open a new, separate terminal window (keep the backend running in the first one). Navigate to the frontend directory:
```bash
cd frontend
npm install
npm run dev
```
The frontend should now be running at `http://localhost:3000`.

> **💡 Pro-Tip for Local Development**
> Because this is a full-stack application, you will need two terminal windows open simultaneously (one for FastAPI, one for Next.js). Ensure your frontend `.env.local` is configured to point to your local backend URL (`http://127.0.0.1:8000`) rather than your Modal production URL.
