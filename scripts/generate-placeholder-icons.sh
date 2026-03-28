#!/bin/bash

# Generate placeholder PWA icons for LEXORA
# This creates simple colored squares - replace with actual logo later

cd "$(dirname "$0")/.."

echo "🎨 Generating placeholder PWA icons..."

sizes=(72 96 128 144 152 192 384 512)

for size in "${sizes[@]}"; do
  filename="public/icon-${size}x${size}.png"
  
  # Check if ImageMagick is installed
  if command -v convert &> /dev/null; then
    convert -size "${size}x${size}" xc:"#1e40af" -pointsize $((size/4)) -fill white -gravity center -annotate +0+0 "L" "$filename"
    echo "  ✅ Generated $filename (with ImageMagick)"
  # Check if Python with PIL is available
  elif command -v python3 &> /dev/null && python3 -c "import PIL" &> /dev/null; then
    python3 -c "
from PIL import Image, ImageDraw, ImageFont
img = Image.new('RGB', ($size, $size), color='#1e40af')
d = ImageDraw.Draw(img)
try:
    font = ImageFont.truetype('Arial', $size // 4)
except:
    font = ImageFont.load_default()
text = 'L'
bbox = d.textbbox((0, 0), text, font=font)
text_width = bbox[2] - bbox[0]
text_height = bbox[3] - bbox[1]
x = ($size - text_width) // 2
y = ($size - text_height) // 2
d.text((x, y), text, fill='white', font=font)
img.save('$filename')
"
    echo "  ✅ Generated $filename (with Python PIL)"
  else
    # Fallback: Create a simple SVG and mention it needs conversion
    echo "  ⚠️  Can't generate $filename (missing ImageMagick or Python PIL)"
    echo "     Install ImageMagick: sudo apt-get install imagemagick"
    echo "     Or Python PIL: pip install Pillow"
  fi
done

echo ""
echo "✅ Placeholder icons generated!"
echo "⚠️  These are simple placeholders. Replace with actual logo:"
echo "   npx pwa-asset-generator public/logo.png public/ --background \"#ffffff\" --padding \"10%\""
