from pydantic import BaseModel
from typing import List, Literal, Optional, Dict, Any

class Box(BaseModel):
    x: int; y: int; width: int; height: int

class FaceOut(BaseModel):
    id: str
    name: str
    boundingBox: Box

class UploadResponse(BaseModel):
    path: str
    faces: List[FaceOut]

class Dialogue(BaseModel):
    characterId: str
    text: str
    audioSource: Literal['text', 'tts'] = 'text'
    ttsGender: Optional[Literal['female', 'male']] = 'female'

class VideoSettings(BaseModel):
    scenePrompt: str
    duration: int
    resolution: Literal['480p', '720p', '1080p']
    aspectRatio: Literal['16:9', '9:16']

class GeneratePayload(BaseModel):
    imagePath: str
    prompt: str
    aspect: Literal['16:9', '9:16']
    resolution: Literal['480p', '720p', '1080p']
    dialogues: List[Dialogue]
    voice: Dict[str, Any] = {}
    settings: VideoSettings
