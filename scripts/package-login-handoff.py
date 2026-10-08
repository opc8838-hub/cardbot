"""Build the distributable ZIP from the versioned standalone motion kit."""
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

root = Path(__file__).resolve().parents[1]
source = root / "motion-kits" / "login-handoff"
output = root / "motion-kits" / "cardbot-login-handoff.zip"

with ZipFile(output, "w", compression=ZIP_DEFLATED) as archive:
    for path in sorted(source.rglob("*")):
        if path.is_file():
            archive.write(path, Path("cardbot-login-handoff") / path.relative_to(source))

with ZipFile(output) as archive:
    assert archive.testzip() is None
    assert "cardbot-login-handoff/index.html" in archive.namelist()
print(f"Built {output.name}: {output.stat().st_size} bytes")
