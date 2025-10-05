import os
import json
import shutil
import subprocess
import tempfile
import wave
from pathlib import Path
from typing import List, Dict, Any

PIPER_VOICES_DIR = Path(os.getenv("PIPER_VOICES_DIR", "/workspace/models/piper-voices"))
DEFAULT_TTS_FEMALE = os.getenv("DEFAULT_TTS_FEMALE", "")
DEFAULT_TTS_MALE = os.getenv("DEFAULT_TTS_MALE", "")

def _exists(p: str) -> bool:
    try:
        return Path(p).exists()
    except Exception:
        return False

def _resolve_voice_path(d: Dict[str, Any]) -> str:
    """
    Öncelik:
      1) dialogue.voicePath (tam onnx yolu)
      2) env DEFAULT_TTS_FEMALE / DEFAULT_TTS_MALE (gender'a göre)
      3) PIPER_VOICES_DIR içinden ilk uygun .onnx
    """
    vp = d.get("voicePath") or d.get("voice_path")
    if vp and _exists(vp):
        return vp

    gender = (d.get("gender") or d.get("voiceGender") or "").lower()
    if gender == "female" and DEFAULT_TTS_FEMALE:
        return DEFAULT_TTS_FEMALE
    if gender == "male" and DEFAULT_TTS_MALE:
        return DEFAULT_TTS_MALE

    # fallback: klasörden ilk .onnx
    for onnx in PIPER_VOICES_DIR.rglob("*.onnx"):
        return str(onnx)

    raise RuntimeError("No Piper voice model (.onnx) found")

def _guess_config_path(model_path: str) -> str | None:
    p = Path(model_path)
    c1 = p.with_suffix(p.suffix + ".json")       # foo.onnx.json
    if c1.exists():
        return str(c1)
    c2 = p.with_suffix(".json")                  # foo.json
    if c2.exists():
        return str(c2)
    # bazı repolarda adlandırma farklı olabilir → yoksa None
    return None

def _ensure_piper_cli():
    if shutil.which("piper") is None:
        raise RuntimeError("piper CLI not found. Please ensure 'piper-tts' is installed in the image.")

def _concat_wavs(parts: List[Path], out_path: Path):
    if not parts:
        return
    # Tüm parçalar aynı parametrelerde olsun varsayımı
    with wave.open(str(parts[0]), "rb") as w0:
        params = w0.getparams()
        frames = [w0.readframes(w0.getnframes())]
    for p in parts[1:]:
        with wave.open(str(p), "rb") as w:
            if w.getparams() != params:
                # farklı samplerate/channel varsa pydub ile decode/concat yapılabilir (basitlik adına zorlamıyoruz)
                raise RuntimeError("Voice fragments have different WAV params; use same Piper model family.")
            frames.append(w.readframes(w.getnframes()))
    with wave.open(str(out_path), "wb") as wout:
        wout.setparams(params)
        for fr in frames:
            wout.writeframes(fr)

def synthesize_dialogues(dialogues: List[Dict[str, Any]] | Any, out_wav_path: Path | str):
    """
    dialogues: [{ text, voicePath?, gender? }, ...]
    """
    _ensure_piper_cli()
    if not dialogues:
        # 1 sn sessizlik
        from pydub import AudioSegment
        AudioSegment.silent(duration=1000).export(str(out_wav_path), format="wav")
        return

    tmpdir = Path(tempfile.mkdtemp(prefix="piper_"))
    parts: List[Path] = []

    for i, d in enumerate(dialogues):
        if hasattr(d, "dict"):  # Pydantic objesi olabilir
            d = d.dict()
        text = (d.get("text") or "").strip()
        if not text:
            continue

        model = _resolve_voice_path(d)
        cfg = _guess_config_path(model)
        part = tmpdir / f"seg_{i:03}.wav"

        cmd = ["piper", "-m", model, "-f", str(part)]
        if cfg:
            cmd += ["-c", cfg]

        # text'i stdin'den gönderiyoruz
        proc = subprocess.run(cmd, input=text.encode("utf-8"), stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if proc.returncode != 0:
            raise RuntimeError(f"piper failed for segment {i}: {proc.stderr.decode('utf-8', 'ignore')}")
        parts.append(part)

    _concat_wavs(parts, Path(out_wav_path))
