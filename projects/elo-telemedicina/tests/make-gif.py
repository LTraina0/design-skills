"""Exporta o GIF a partir dos frames da interação capturados por verify.cjs."""
from pathlib import Path
from PIL import Image

assets = Path(__file__).resolve().parent.parent / "assets"
frames = [Image.open(assets / f"gif-frame-{i}.png").convert("RGB") for i in range(6)]
frames[0].save(
    assets / "interacao.gif", save_all=True, append_images=frames[1:],
    duration=[1800, 400, 400, 800, 1000, 1600], loop=0, optimize=True,
)
for frame in assets.glob("gif-frame-*.png"):
    frame.unlink()
