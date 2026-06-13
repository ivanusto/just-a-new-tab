#!/usr/bin/env python3
"""Generate background images for theme packs using Gemini Imagen."""

import os
import time
import sys
from pathlib import Path
from google import genai
from google.genai import types

API_KEY = os.environ.get("GEMINI_API_KEY", "")
if not API_KEY:
    print("Error: GEMINI_API_KEY not set")
    sys.exit(1)

client = genai.Client(api_key=API_KEY)

# 5 prompts per theme, landscape wallpaper style
THEMES = {
    "anime_manga": [
        "Beautiful anime landscape with cherry blossom trees and Mount Fuji at golden hour, studio ghibli inspired art style, soft pastel colors, peaceful atmosphere, desktop wallpaper",
        "Futuristic anime cyberpunk city skyline at night with neon lights and rain reflections, manga illustration style, vibrant colors, desktop wallpaper",
        "Enchanted magical forest in anime style with glowing fireflies and ancient spirit trees, fantasy digital painting, ethereal light, desktop wallpaper",
        "Sweeping anime ocean sunset with dramatic orange and purple sky, sailboat silhouette, japanese animation style, cinematic, desktop wallpaper",
        "Anime-style mountain valley in autumn with red maple leaves and flowing river, watercolor illustration, serene and beautiful, desktop wallpaper",
    ],
    "couple_love": [
        "Romantic couple silhouette watching golden sunset over calm ocean, warm amber tones, love and togetherness, beautiful sky, desktop wallpaper",
        "Two people walking hand in hand through a blooming lavender field, soft purple hues, dreamy romantic atmosphere, golden light, desktop wallpaper",
        "Couple sharing a tender moment under falling cherry blossom petals, soft pink background, romantic and gentle, desktop wallpaper",
        "Romantic evening cityscape with glowing bokeh lights and two silhouettes on a rooftop, warm and intimate, desktop wallpaper",
        "Couple dancing barefoot on a beach at twilight, stars appearing in the sky, magical and romantic, desktop wallpaper",
    ],
    "elderly_nostalgia": [
        "Vintage 1950s small town main street with classic cars and warm summer afternoon light, sepia-tinted photography style, nostalgic, desktop wallpaper",
        "Old fashioned wooden farmhouse porch with rocking chairs and morning mist, countryside, warm sepia tones, peaceful nostalgia, desktop wallpaper",
        "Classic American diner at night with neon signs and rain puddle reflections, 1960s retro style, warm amber glow, desktop wallpaper",
        "Antique steam train passing through autumn countryside, vintage photography filter, golden light through trees, nostalgic journey, desktop wallpaper",
        "Old cobblestone European village square with flower boxes and vintage lamp posts, warm afternoon sun, timeless and charming, desktop wallpaper",
    ],
    "funny_humor": [
        "Playful cartoon animals having a chaotic office meeting with coffee spilling, colorful and humorous illustration style, fun desktop wallpaper",
        "Whimsical cartoon cats trying various silly activities like surfing and skateboarding, bright cheerful colors, funny desktop wallpaper",
        "Comic strip style illustration of dogs living their best life at a beach party, vibrant colors, joyful and funny, desktop wallpaper",
        "Quirky cartoon illustration of animals in a gym doing ridiculous workouts, bold colors and exaggerated poses, humorous desktop wallpaper",
        "Colorful cartoon illustration of a chaotic kitchen with animals as chefs, pots flying, ingredients everywhere, funny and energetic, desktop wallpaper",
    ],
    "gaming": [
        "Epic pixel art landscape of a fantasy video game world with castles and mountains, retro 16-bit style, vibrant colors, desktop wallpaper",
        "Futuristic gaming arena with neon lights and holographic displays, cyberpunk game aesthetic, blue and purple glow, desktop wallpaper",
        "Isometric low-poly game world with colorful biomes, fantasy adventure style, cute and detailed, desktop wallpaper",
        "Classic arcade game inspired background with geometric patterns and pixel art characters, retro neon colors, desktop wallpaper",
        "Fantasy RPG dungeon with glowing crystals and treasure chests, dramatic lighting, game concept art style, desktop wallpaper",
    ],
    "pets": [
        "Adorable golden retriever puppy playing in a field of sunflowers, warm golden light, joyful and cute, desktop wallpaper",
        "Fluffy cats of different colors lounging in a cozy sunny window, soft bokeh background, peaceful and cute, desktop wallpaper",
        "Playful kittens and puppies together in an autumn leaf pile, warm colors, heartwarming and adorable, desktop wallpaper",
        "Cute rabbit and hamster in a beautiful garden among flowers, pastel colors, soft focus background, adorable, desktop wallpaper",
        "Happy dogs of various breeds running on a beach at sunset, silhouettes in the golden light, joyful, desktop wallpaper",
    ],
    "politics": [
        "Majestic government capitol building with stone columns at sunrise, American flag, democratic symbols, patriotic desktop wallpaper",
        "Town hall meeting room with flags and podium, civic engagement and democracy, professional photography, desktop wallpaper",
        "Historic library interior with rows of law books and an American flag, justice and governance theme, desktop wallpaper",
        "Classical Greek temple columns with light rays symbolizing democracy and justice, architectural photography, desktop wallpaper",
        "Aerial view of Washington DC landmarks and the National Mall at golden hour, patriotic and inspiring, desktop wallpaper",
    ],
    "satire": [
        "Whimsical vintage newspaper collage with exaggerated cartoon headlines and illustrations, editorial cartoon style, black and white with pops of color, desktop wallpaper",
        "Surreal illustration of suited businessmen with giant megaphones making announcements, satirical art style, vintage editorial cartoon, desktop wallpaper",
        "Absurdist cartoon of tiny people climbing enormous graphs and pie charts, corporate satire illustration, bold colors, desktop wallpaper",
        "Vintage propaganda poster parody with ironic slogans and retro illustration style, tongue-in-cheek humor, bold graphics, desktop wallpaper",
        "Whimsical illustration of a chaotic news broadcast with cartoon anchors and absurd banners, satirical media commentary, colorful, desktop wallpaper",
    ],
}

def generate_images_for_theme(theme_name: str, prompts: list[str]) -> int:
    theme_dir = Path(theme_name)
    theme_dir.mkdir(exist_ok=True)

    generated = 0
    for i, prompt in enumerate(prompts, 1):
        out_path = theme_dir / f"bg{i}.jpg"
        if out_path.exists():
            print(f"  ✓ {out_path} already exists, skipping")
            generated += 1
            continue

        print(f"  Generating {out_path}...", end=" ", flush=True)
        try:
            response = client.models.generate_images(
                model="imagen-4.0-generate-001",
                prompt=prompt,
                config=types.GenerateImagesConfig(
                    number_of_images=1,
                    aspect_ratio="16:9",
                    output_mime_type="image/jpeg",
                    output_compression_quality=90,
                    safety_filter_level="BLOCK_LOW_AND_ABOVE",
                ),
            )
            if response.generated_images:
                img_bytes = response.generated_images[0].image.image_bytes
                out_path.write_bytes(img_bytes)
                print(f"done ({len(img_bytes)//1024}KB)")
                generated += 1
            else:
                print("no image returned (prompt may have been filtered)")
        except Exception as e:
            print(f"error: {e}")

        time.sleep(1)  # avoid rate limiting

    return generated

def main():
    # Allow targeting specific themes via CLI args
    targets = sys.argv[1:] if len(sys.argv) > 1 else list(THEMES.keys())
    total = 0

    for theme in targets:
        if theme not in THEMES:
            print(f"Unknown theme: {theme}")
            continue
        print(f"\n[{theme}]")
        count = generate_images_for_theme(theme, THEMES[theme])
        total += count
        print(f"  → {count}/{len(THEMES[theme])} images ready")

    print(f"\nDone. Total images generated/found: {total}")

if __name__ == "__main__":
    main()
