from pathlib import Path
from typing import List, Dict, Any, Optional
from pydub import AudioSegment
from ..config import PIPER_BIN, PIPER_VOICE_FEMALE, PIPER_VOICE_MALE, OUTPUT_DIR
import subprocess, shutil

def _voice_path_for_gender(gender: Optional[str]) -> str:
    if (gender or '').lower() == 'male':
        return PIPER_VOICE_MALE or PIPER_VOICE_FEMALE
    return PIPER_VOICE_FEMALE or PIPER_VOICE_MALE

def _piper_ok() -> tuple[bool, str]:
    p = shutil.which(PIPER_BIN)
    if not p: return (False, f"Piper not found: {PIPER_BIN}")
    if "ffmpeg" in p.lower(): return (False, f"PIPER_BIN points to ffmpeg: {p}")
    return (True, p)

def _log_tts(msg: str):
    log = OUTPUT_DIR / "audio" / "_tts.log"
    log.parent.mkdir(parents=True, exist_ok=True)
    with open(log, "a") as f:
        f.write(msg.rstrip() + "\n")

def synthesize_piper(text: str, voice_path: str, out_wav: Path):
    ok, why = _piper_ok()
    if not ok:
        _log_tts(f"[WARN] {why}; generating silent audio instead of Piper.")
        # 1 sn sessiz
        AudioSegment.silent(duration=1000).export(out_wav, format="wav")
        return
    out_wav.parent.mkdir(parents=True, exist_ok=True)
    cmd = [PIPER_BIN, "-m", voice_path, "-f", str(out_wav)]
    proc = subprocess.run(cmd, input=text.encode('utf-8'),
                          stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    if proc.returncode != 0:
        _log_tts("[PIPER ERR]\n" + proc.stdout.decode('utf-8', 'ignore'))
        # Piper hata verirse de sessize düş
        AudioSegment.silent(duration=1000).export(out_wav, format="wav")

def synthesize_dialogues(dialogues: List[Dict[str, Any]], out_wav: Path, gap_ms: int = 250):
    clips = []
    for i, d in enumerate(dialogues or []):
        txt = (d.get('text') or '').strip()
        if not txt:
            continue
        voice_path = _voice_path_for_gender(d.get('ttsGender'))
        if not voice_path:
            clips.append(AudioSegment.silent(duration=1000)); continue
        tmp = out_wav.parent / f"seg_{i:03d}.wav"
        synthesize_piper(txt, voice_path, tmp)
        try:
            clips.append(AudioSegment.from_wav(tmp))
        except Exception:
            clips.append(AudioSegment.silent(duration=800))
    final = (clips[0] if clips else AudioSegment.silent(duration=1000))
    for seg in clips[1:]:
        final += AudioSegment.silent(duration=gap_ms)
        final += seg
    out_wav.parent.mkdir(parents=True, exist_ok=True)
    final.export(out_wav, format="wav")
    return out_wav

