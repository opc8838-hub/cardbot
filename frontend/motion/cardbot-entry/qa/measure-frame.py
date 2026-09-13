"""Print the strongest central contours for a continuity screenshot."""

from pathlib import Path
import sys

import cv2


image_path = Path(sys.argv[1])
image = cv2.imread(str(image_path))
if image is None:
    raise SystemExit(f"Unable to read {image_path}")

height, width = image.shape[:2]
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
crop = gray[int(height * 0.2) : int(height * 0.8), int(width * 0.3) : int(width * 0.7)]
crop = cv2.GaussianBlur(crop, (5, 5), 0)
edges = cv2.Canny(crop, 1, 8)
edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_RECT, (7, 7)))
contours, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)

found = []
for contour in contours:
    x, y, w, h = cv2.boundingRect(contour)
    area = cv2.contourArea(contour)
    if 20 <= w <= width * 0.3 and 20 <= h <= height * 0.5 and area >= 80:
        found.append(
            {
                "x": x + int(width * 0.3),
                "y": y + int(height * 0.2),
                "width": w,
                "height": h,
                "area": round(area, 1),
            }
        )

for item in sorted(found, key=lambda value: value["area"], reverse=True)[:20]:
    print(item)
