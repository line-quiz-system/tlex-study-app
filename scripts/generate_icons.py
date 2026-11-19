import math
import os
from PIL import Image, ImageDraw, ImageFont

def create_tlex_icon(size, filename):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 角丸の背景（薄い黄色・やわらかなクリームゴールド）
    radius = int(size * 0.22)
    bg_color = (255, 251, 235, 255) # #FFFBEB warm cream yellow
    border_color = (253, 230, 138, 255) # #FDE68A soft yellow border
    
    # 外枠描画
    draw.rounded_rectangle([(0, 0), (size - 1, size - 1)], radius=radius, fill=bg_color, outline=border_color, width=max(2, int(size * 0.03)))

    # 内部のやわらかなイエローグラデーション円
    inner_pad = int(size * 0.08)
    draw.ellipse([(inner_pad, inner_pad), (size - inner_pad, size - inner_pad)], fill=(254, 240, 138, 90), outline=None)

    # 心電図 & カテーテル/リードモチーフ
    # やわらかな温かみのあるアンバー色
    accent_color = (180, 83, 9, 255) # #B45309 warm amber brown
    gold_color = (217, 119, 6, 255)   # #D97706 honey gold

    # 心電図ラインの描画
    cy = size * 0.52
    line_w = max(3, int(size * 0.038))
    
    points = [
        (size * 0.14, cy),
        (size * 0.28, cy),
        (size * 0.35, cy - size * 0.06),
        (size * 0.40, cy + size * 0.04),
        (size * 0.45, cy - size * 0.24),
        (size * 0.52, cy + size * 0.16),
        (size * 0.58, cy - size * 0.04),
        (size * 0.64, cy + size * 0.06),
        (size * 0.72, cy),
        (size * 0.86, cy)
    ]
    draw.line(points, fill=gold_color, width=line_w, joint="round")

    # カテーテル/シースのリングモチーフ（上部）
    sheath_x = size * 0.5
    sheath_y = size * 0.28
    sheath_r = int(size * 0.09)
    draw.ellipse([(sheath_x - sheath_r, sheath_y - sheath_r), (sheath_x + sheath_r, sheath_y + sheath_r)], outline=accent_color, width=max(2, int(size * 0.035)))
    draw.ellipse([(sheath_x - sheath_r * 0.4, sheath_y - sheath_r * 0.4), (sheath_x + sheath_r * 0.4, sheath_y + sheath_r * 0.4)], fill=accent_color)

    # 「TLE」文字を配置
    font_size = int(size * 0.16)
    try:
        # WindowsのArialまたはSegoe UI
        font = ImageFont.truetype("arialbd.ttf", font_size)
    except:
        font = ImageFont.load_default()
    
    text = "TLE"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    text_x = (size - text_w) / 2
    text_y = size * 0.68
    draw.text((text_x, text_y), text, font=font, fill=accent_color)

    img.save(filename, "PNG")
    print(f"Generated {filename} ({size}x{size})")

os.makedirs("icons", exist_ok=True)
create_tlex_icon(192, "icons/icon-192.png")
create_tlex_icon(512, "icons/icon-512.png")
create_tlex_icon(180, "icons/apple-touch-icon.png")

# favicon.ico 生成 (32x32, 48x48)
img_fav = Image.open("icons/icon-192.png")
img_fav.save("icons/favicon.ico", format="ICO", sizes=[(32, 32), (48, 48)])
print("Generated icons/favicon.ico")
