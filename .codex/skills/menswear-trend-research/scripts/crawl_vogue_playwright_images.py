#!/usr/bin/env python3
"""Render Vogue Runway pages with Playwright and extract look images.

Install dependencies once before running:
    python3 -m pip install playwright

Browser options:
    - Prefer --use-system-chrome when Google Chrome is already installed.
    - Otherwise run once: python3 -m playwright install chromium
"""

from __future__ import annotations

import argparse
import asyncio
import datetime as dt
import json
import re
from pathlib import Path


DEFAULT_SLUGS = [
    "ralph-lauren",
    "dunhill",
    "giorgio-armani",
    "prada",
    "auralee",
    "paul-smith",
    "thom-browne",
    "saint-laurent",
    "louis-vuitton",
]


def canonical_image_url(url: str) -> str:
    return url.replace("%2C", ",")


def is_vogue_look_image(url: str, slug: str) -> bool:
    lower = url.lower()
    return (
        "assets.vogue.com/photos/" in lower
        and f"{slug}-spring-2027-menswear" in lower
        and "credit" in lower
        and "details" not in lower
        and lower.endswith((".jpg", ".jpeg", ".png", ".webp"))
    )


async def extract_images_from_page(page, slug: str, max_images: int) -> dict:
    url = f"https://www.vogue.com/fashion-shows/spring-2027-menswear/{slug}"
    await page.goto(url, wait_until="domcontentloaded", timeout=30_000)
    await page.wait_for_timeout(1500)
    urls = await page.evaluate(
        """
        () => {
          const urls = new Set();
          const add = (value) => {
            if (!value) return;
            String(value).split(',').forEach(part => {
              const url = part.trim().split(/\\s+/)[0];
              if (url && /^https?:/.test(url)) urls.add(url);
            });
          };
          document.querySelectorAll('img').forEach(img => {
            add(img.currentSrc);
            add(img.src);
            add(img.getAttribute('data-src'));
            add(img.getAttribute('srcset'));
          });
          document.querySelectorAll('source').forEach(source => {
            add(source.srcset);
            add(source.getAttribute('srcset'));
          });
          return Array.from(urls);
        }
        """
    )
    images = []
    seen = set()
    for image_url in urls:
        normalized = canonical_image_url(image_url)
        if normalized in seen:
            continue
        if is_vogue_look_image(normalized, slug):
            seen.add(normalized)
            images.append(normalized)
    return {
        "slug": slug,
        "title": await page.title(),
        "url": url,
        "image_count": len(images),
        "images": images[:max_images],
    }


async def launch_browser(playwright, use_system_chrome: bool):
    if use_system_chrome:
        return await playwright.chromium.launch(channel="chrome", headless=True)
    try:
        return await playwright.chromium.launch(headless=True)
    except Exception as exc:
        message = str(exc)
        if "Executable doesn't exist" in message or "playwright install" in message:
            raise SystemExit(
                "Playwright Chromium is not installed. Either run with --use-system-chrome "
                "if Google Chrome is installed, or run once: python3 -m playwright install chromium"
            ) from exc
        raise


async def crawl(slugs: list[str], max_images: int, use_system_chrome: bool) -> list[dict]:
    try:
        from playwright.async_api import async_playwright
    except ImportError as exc:
        raise SystemExit(
            "Playwright is not installed. Run: python3 -m pip install playwright && "
            "python3 -m playwright install chromium"
        ) from exc

    async with async_playwright() as playwright:
        browser = await launch_browser(playwright, use_system_chrome)
        page = await browser.new_page(viewport={"width": 1440, "height": 1600})
        results = []
        for slug in slugs:
            try:
                results.append(await extract_images_from_page(page, slug, max_images))
            except Exception as exc:  # noqa: BLE001 - keep crawler resilient.
                results.append(
                    {
                        "slug": slug,
                        "title": "",
                        "url": f"https://www.vogue.com/fashion-shows/spring-2027-menswear/{slug}",
                        "image_count": 0,
                        "images": [],
                        "error": str(exc),
                    }
                )
        await browser.close()
        return results


def render_markdown(results: list[dict], today: dt.date) -> str:
    lines = [
        "# Vogue Runway Playwright 图片抓取报告",
        "",
        f"生成日期：{today.isoformat()}",
        f"品牌页数量：{len(results)}",
        f"图片总数：{sum(result.get('image_count', 0) for result in results)}",
        "",
        "## 品牌图片",
        "",
    ]
    for result in results:
        lines.extend(
            [
                f"### {result['slug']}",
                "",
                f"- 页面：{result['url']}",
                f"- 标题：{result.get('title') or '未识别'}",
                f"- 抓到图片：{result.get('image_count', 0)} 张",
            ]
        )
        if result.get("error"):
            lines.append(f"- 错误：{result['error']}")
        lines.append("")
        for image_url in result.get("images", []):
            lines.append(f"![{result['slug']}]({image_url})")
            lines.append("")
    return "\n".join(lines).rstrip() + "\n"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Use Playwright to extract Vogue Runway look images.")
    parser.add_argument("--slugs", nargs="*", default=DEFAULT_SLUGS, help="Vogue brand slugs.")
    parser.add_argument("--max-images", type=int, default=8, help="Max images per brand.")
    parser.add_argument("--output-dir", default="outputs", help="Output directory.")
    parser.add_argument("--today", default="", help="Override report date as YYYY-MM-DD.")
    parser.add_argument(
        "--use-system-chrome",
        action="store_true",
        help="Use installed Google Chrome instead of Playwright-managed Chromium.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    today = dt.date.fromisoformat(args.today) if args.today else dt.date.today()
    results = asyncio.run(crawl(args.slugs, args.max_images, args.use_system_chrome))
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    json_path = output_dir / f"{today.isoformat()}_vogue_playwright_images.json"
    md_path = output_dir / f"{today.isoformat()}_vogue_playwright_images.md"
    json_path.write_text(json.dumps({"generated_at": today.isoformat(), "results": results}, ensure_ascii=False, indent=2), encoding="utf-8")
    md_path.write_text(render_markdown(results, today), encoding="utf-8")
    print(f"Saved JSON: {json_path}")
    print(f"Saved report: {md_path}")
    print(f"Images: {sum(result.get('image_count', 0) for result in results)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
