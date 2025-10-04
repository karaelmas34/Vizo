import subprocess, os
from pathlib import Path
from ..config import FFMPEG_BIN

def _run(cmd, cwd=None, env=None, log: Path | None = None):
    if log:
        with open(log, "a", buffering=1) as lf:
            lf.write("[CMD] " + " ".join(cmd) + "\n\n")
            p = subprocess.Popen(cmd, cwd=cwd, env=env,
                                 stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                                 text=True, bufsize=1)
            try:
                for line in p.stdout:
                    lf.write(line)
                    print(line, end="", flush=True)
            finally:
                p.wait()
            return p.returncode
    else:
        return subprocess.call(cmd, cwd=cwd, env=env)

def mux_audio_to_video(video_path: Path, audio_path: Path, out_path: Path) -> Path:
    """
    1) Video copy + AAC audio (en hızlı, kalite kaybı yok)
    2) Olmazsa video'yu libx264 ile re-encode et (uyumluluk)
    """
    video_path = Path(video_path)
    audio_path = Path(audio_path)
    out_path   = Path(out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    log = out_path.with_suffix(".ffmpeg.log")

    # 1) copy
    cmd1 = [
        FFMPEG_BIN, "-y",
        "-i", str(video_path),
        "-i", str(audio_path),
        "-map", "0:v:0", "-map", "1:a:0",
        "-c:v", "copy",
        "-c:a", "aac", "-b:a", "192k",
        "-shortest",
        str(out_path),
    ]
    rc = _run(cmd1, log=log)
    if rc == 0 and out_path.exists():
        return out_path

    # 2) re-encode
    tmp = out_path.with_suffix(".enc.mp4")
    cmd2 = [
        FFMPEG_BIN, "-y",
        "-i", str(video_path),
        "-i", str(audio_path),
        "-map", "0:v:0", "-map", "1:a:0",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k",
        "-shortest",
        str(tmp),
    ]
    rc2 = _run(cmd2, log=log)
    if rc2 != 0 or not tmp.exists():
        raise RuntimeError("FFmpeg mux failed; log: " + str(log))

    tmp.replace(out_path)
    return out_path

