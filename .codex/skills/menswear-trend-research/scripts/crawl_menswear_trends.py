#!/usr/bin/env python3
"""Crawl recent high-end menswear trend references and render a report.

The script is intentionally dependency-light so it can be copied into a Codex
skill or small research toolkit. It uses only Python's standard library.
"""

from __future__ import annotations

import argparse
import dataclasses
import datetime as dt
import html
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Iterable


USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
)


KEYWORDS = {
    "menswear": 3,
    "men": 1,
    "男装": 3,
    "tailoring": 3,
    "suit": 2,
    "suiting": 2,
    "西装": 3,
    "blazer": 3,
    "jacket": 1,
    "夹克": 1,
    "old money": 4,
    "quiet luxury": 4,
    "轻奢": 4,
    "老钱": 4,
    "静奢": 4,
    "luxury": 2,
    "高端": 3,
    "runway": 2,
    "fashion week": 2,
    "时装周": 2,
    "spring 2027": 2,
    "2027 春夏": 2,
    "ss27": 2,
    "linen": 2,
    "silk": 2,
    "wool": 2,
    "cashmere": 2,
    "亚麻": 2,
    "真丝": 2,
    "羊毛": 2,
    "开领": 1,
    "商务": 2,
    "showroom": 1,
    "designer": 1,
    "设计师": 2,
}

NOISE_TITLE_PATTERNS = [
    re.compile(r"^\d+\s+comments?$", re.IGNORECASE),
    re.compile(r"^load more$", re.IGNORECASE),
    re.compile(r"^refresh page$", re.IGNORECASE),
    re.compile(r"^subscribe$", re.IGNORECASE),
    re.compile(r"^login$", re.IGNORECASE),
    re.compile(r"^中文首页$", re.IGNORECASE),
    re.compile(r"^english$", re.IGNORECASE),
]

NOISE_IMAGE_PARTS = (
    "logo",
    "icon",
    "avatar",
    "beian",
    "nav_bg",
    "content_right_li",
    "close_",
    ".gif",
    ".svg",
    "pixel",
    "beacon",
)


@dataclasses.dataclass(frozen=True)
class Source:
    name: str
    region: str
    base_url: str
    urls: list[str]


@dataclasses.dataclass(frozen=True)
class Item:
    source: str
    region: str
    title: str
    url: str
    date: str
    image_url: str
    summary: str
    score: int
    tags: list[str]


try:
    from html.parser import HTMLParser
except ImportError:  # pragma: no cover
    HTMLParser = object  # type: ignore[assignment]


class SimpleHTMLExtractor(HTMLParser):
    """Small article/link extractor for magazine, runway, and brand-list pages."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.cards: list[dict[str, str]] = []
        self.current: dict[str, str] | None = None
        self.in_article_depth = 0
        self.capture_link_text = False
        self.link_href = ""
        self.link_text: list[str] = []
        self.last_image = ""
        self.last_time = ""
        self.meta: dict[str, str] = {}

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attrs_dict = {k.lower(): v or "" for k, v in attrs}
        tag = tag.lower()

        if tag == "meta":
            key = attrs_dict.get("property") or attrs_dict.get("name")
            value = attrs_dict.get("content", "")
            if key and value:
                self.meta[key.lower()] = value.strip()

        if tag == "article":
            self.in_article_depth += 1
            if self.current is None:
                self.current = {}

        if tag == "a":
            href = attrs_dict.get("href", "")
            if href:
                self.capture_link_text = True
                self.link_href = href
                self.link_text = []

        if tag == "img":
            src = (
                attrs_dict.get("src")
                or attrs_dict.get("data-src")
                or attrs_dict.get("data-original")
                or attrs_dict.get("data-lazy-src")
                or ""
            )
            alt = attrs_dict.get("alt", "")
            if src:
                self.last_image = src
                if self.current is not None and not self.current.get("image_url"):
                    self.current["image_url"] = src
                if alt and self.current is not None and not self.current.get("title"):
                    self.current["title"] = alt

        if tag == "time":
            value = attrs_dict.get("datetime", "")
            if value:
                self.last_time = value
                if self.current is not None:
                    self.current["date"] = value

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag == "a" and self.capture_link_text:
            text = normalize_text(" ".join(self.link_text))
            if text:
                card = self.current if self.current is not None else {}
                if not card.get("title"):
                    card["title"] = text
                if not card.get("url"):
                    card["url"] = self.link_href
                if not card.get("image_url") and self.last_image:
                    card["image_url"] = self.last_image
                if not card.get("date") and self.last_time:
                    card["date"] = self.last_time
                if self.current is None:
                    self.cards.append(dict(card))
            self.capture_link_text = False
            self.link_href = ""
            self.link_text = []

        if tag == "article" and self.in_article_depth:
            self.in_article_depth -= 1
            if self.in_article_depth == 0 and self.current:
                self.cards.append(dict(self.current))
                self.current = None

    def handle_data(self, data: str) -> None:
        if self.capture_link_text:
            self.link_text.append(data)


def default_sources() -> list[Source]:
    """Three foreign and two domestic sources for high-end menswear research."""

    return [
        Source(
            name="Vogue Runway",
            region="foreign",
            base_url="https://www.vogue.com",
            urls=[
                "https://www.vogue.com/fashion-shows/spring-2027-menswear",
                "https://www.vogue.com/fashion-shows/menswear",
            ],
        ),
        Source(
            name="GQ",
            region="foreign",
            base_url="https://www.gq.com",
            urls=[
                "https://www.gq.com/about/menswear",
                "https://www.gq.com/fashion",
            ],
        ),
        Source(
            name="Hypebeast",
            region="foreign",
            base_url="https://hypebeast.com",
            urls=[
                "https://hypebeast.com/fashion",
                "https://hypebeast.com/tags/menswear",
            ],
        ),
        Source(
            name="中国国际时装周",
            region="domestic",
            base_url="https://www.chinafashionweek.org.cn",
            urls=[
                "https://www.chinafashionweek.org.cn/",
                "https://www.chinafashionweek.org.cn/tpxz/2026cj/",
            ],
        ),
        Source(
            name="Ontimeshow",
            region="domestic",
            base_url="https://www.ontimeshow.com",
            urls=[
                "https://www.ontimeshow.com/",
                "https://www.ontimeshow.com/zh-hans/brands",
            ],
        ),
    ]


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(value)).strip()


def absolute_url(base_url: str, url: str) -> str:
    return urllib.parse.urljoin(base_url, html.unescape(url))


def fetch_url(url: str, timeout: int = 20) -> str:
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        },
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        return response.read().decode(charset, errors="replace")


def parse_date(value: str, today: dt.date) -> str:
    value = normalize_text(value)
    if not value:
        return ""

    iso_match = re.search(r"(20\d{2})[-/.年](\d{1,2})[-/.月](\d{1,2})", value)
    if iso_match:
        year, month, day = [int(part) for part in iso_match.groups()]
        try:
            return dt.date(year, month, day).isoformat()
        except ValueError:
            return ""

    month_match = re.search(
        r"(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),\s*(20\d{2})",
        value,
        re.IGNORECASE,
    )
    if month_match:
        month_name, day, year = month_match.groups()
        month = {
            "jan": 1,
            "feb": 2,
            "mar": 3,
            "apr": 4,
            "may": 5,
            "jun": 6,
            "jul": 7,
            "aug": 8,
            "sep": 9,
            "oct": 10,
            "nov": 11,
            "dec": 12,
        }[month_name[:3].lower()]
        return dt.date(int(year), month, int(day)).isoformat()

    if "today" in value.lower() or "今天" in value:
        return today.isoformat()
    if "yesterday" in value.lower() or "昨天" in value:
        return (today - dt.timedelta(days=1)).isoformat()
    return ""


def date_from_url(url: str) -> str:
    match = re.search(r"/(20\d{2})/(\d{1,2})(?:/|$)", url)
    if not match:
        return ""
    year, month = match.groups()
    try:
        return dt.date(int(year), int(month), 1).isoformat()
    except ValueError:
        return ""


def is_recent(date_text: str, today: dt.date, recent_days: int) -> bool:
    if not date_text:
        return True
    try:
        date_value = dt.date.fromisoformat(date_text[:10])
    except ValueError:
        return True
    return today - dt.timedelta(days=recent_days) <= date_value <= today


def keyword_score(text: str) -> int:
    lower = text.lower()
    score = 0
    for keyword, weight in KEYWORDS.items():
        if keyword.lower() in lower:
            score += weight
    return score


def is_noise_title(title: str) -> bool:
    normalized = normalize_text(title)
    if not normalized:
        return True
    return any(pattern.search(normalized) for pattern in NOISE_TITLE_PATTERNS)


def is_content_image(url: str) -> bool:
    if not url:
        return False
    lower = url.lower()
    return not any(part in lower for part in NOISE_IMAGE_PARTS)


def tags_for(text: str) -> list[str]:
    lower = text.lower()
    tags = []
    tag_map = {
        "tailoring": ["tailoring", "suit", "suiting", "西装", "blazer"],
        "old money": ["old money", "老钱", "quiet luxury", "静奢"],
        "light luxury": ["轻奢", "luxury", "高端"],
        "fabric": ["linen", "silk", "wool", "cashmere", "亚麻", "真丝", "羊毛"],
        "runway": ["runway", "fashion week", "时装周", "专场发布"],
        "designer brand": ["designer", "设计师", "showroom", "品牌"],
    }
    for tag, needles in tag_map.items():
        if any(needle.lower() in lower for needle in needles):
            tags.append(tag)
    return tags[:5]


def image_from_meta(parser: SimpleHTMLExtractor, source: Source) -> str:
    image_url = (
        parser.meta.get("og:image")
        or parser.meta.get("twitter:image")
        or parser.meta.get("image")
        or ""
    )
    return absolute_url(source.base_url, image_url) if image_url else ""


def extract_items(
    source: Source,
    url: str,
    html: str,
    today: dt.date,
    recent_days: int,
) -> list[Item]:
    parser = SimpleHTMLExtractor()
    parser.feed(html)

    meta_image = image_from_meta(parser, source)
    cards = parser.cards
    if parser.meta.get("og:title") or parser.meta.get("title"):
        cards.append(
            {
                "title": parser.meta.get("og:title") or parser.meta.get("title", ""),
                "url": parser.meta.get("og:url") or url,
                "date": parser.meta.get("article:published_time", ""),
                "image_url": meta_image,
            }
        )

    items: list[Item] = []
    seen: set[str] = set()
    for card in cards:
        title = normalize_text(card.get("title", ""))
        if not title or len(title) < 4:
            continue
        if is_noise_title(title):
            continue
        item_url = absolute_url(source.base_url, card.get("url", url))
        if "#" in item_url:
            item_url = item_url.split("#", 1)[0]
        if item_url in seen:
            continue
        seen.add(item_url)
        image_url = absolute_url(source.base_url, card.get("image_url", "") or meta_image)
        if not is_content_image(image_url):
            image_url = ""
        date_text = parse_date(card.get("date", ""), today) or date_from_url(item_url)
        combined = " ".join([title, item_url, source.name])
        score = keyword_score(combined)
        if score <= 0:
            continue
        if not is_recent(date_text, today, recent_days):
            continue
        items.append(
            Item(
                source=source.name,
                region=source.region,
                title=title,
                url=item_url,
                date=date_text,
                image_url=image_url,
                summary=summary_for(title, source.name),
                score=score,
                tags=tags_for(combined),
            )
        )
    return sorted(items, key=lambda item: (item.score, item.date), reverse=True)


def summary_for(title: str, source_name: str) -> str:
    text = title.lower()
    if "ralph" in text or "dunhill" in text or "blazer" in text:
        return "重点关注 old money、会所 blazer、轻量正装和社交场景。"
    if "prada" in text or "skinny" in text:
        return "重点关注精干轮廓、短夹克、五袋裤模板和更年轻的比例变化。"
    if "armani" in text or "auralee" in text:
        return "重点关注柔软剪裁、轻奢面料、度假商务混合和低饱和色彩。"
    if "时装周" in source_name or "中国国际" in source_name:
        return "重点关注国内发布场景、秀场图、设计师主题和本土化高级感表达。"
    if "ontimeshow" in source_name.lower():
        return "重点关注设计师品牌定位、showroom 语境、价格区间和商业化表达。"
    return "可作为高端男装趋势线索，建议结合图片、面料和场景进一步筛选。"


def crawl_sources(
    sources: Iterable[Source],
    today: dt.date,
    recent_days: int,
    delay_seconds: float,
    timeout: int,
) -> tuple[list[Item], list[dict[str, str]]]:
    all_items: list[Item] = []
    errors: list[dict[str, str]] = []
    for source in sources:
        for url in source.urls:
            try:
                page_html = fetch_url(url, timeout=timeout)
                all_items.extend(extract_items(source, url, page_html, today, recent_days))
            except (urllib.error.URLError, TimeoutError, OSError, UnicodeError) as exc:
                errors.append({"source": source.name, "url": url, "error": str(exc)})
            if delay_seconds:
                time.sleep(delay_seconds)
    return dedupe_items(all_items), errors


def dedupe_items(items: Iterable[Item]) -> list[Item]:
    seen = set()
    deduped = []
    for item in sorted(items, key=lambda value: (value.score, value.date), reverse=True):
        if item.url in seen:
            continue
        seen.add(item.url)
        deduped.append(item)
    return deduped


def render_markdown_report(
    items: list[Item],
    today: dt.date,
    recent_days: int,
    sources: list[Source],
    errors: list[dict[str, str]] | None = None,
) -> str:
    errors = errors or []
    lines = [
        "# 高端男装趋势爬取报告",
        "",
        f"生成日期：{today.isoformat()}",
        f"近期窗口：最近 {recent_days} 天",
        f"数据量：{len(items)} 条",
        "",
        "## 重点结论",
        "",
    ]
    top_tags = aggregate_tags(items)
    if top_tags:
        lines.append("本轮高频标签：" + "、".join(top_tags))
    else:
        lines.append("本轮未抓到足够高相关度条目，可放宽时间窗口或补充站点。")
    lines.extend(
        [
            "",
            "建议优先筛选：轻正装、会所 blazer、低饱和色、丝麻/羊毛/羊绒、国内设计师品牌的利落剪裁与商业价格带。",
            "",
            "## 高相关条目",
            "",
        ]
    )

    for index, item in enumerate(items[:30], start=1):
        date_text = item.date or "日期未识别"
        tags = "、".join(item.tags) if item.tags else "待人工标注"
        lines.extend(
            [
                f"### {index}. {item.title}",
                "",
                f"- 来源：{item.source}（{item.region}）",
                f"- 日期：{date_text}",
                f"- 相关度：{item.score}",
                f"- 标签：{tags}",
                f"- 链接：{item.url}",
                f"- 设计解读：{item.summary}",
            ]
        )
        if item.image_url:
            lines.extend(["", f"![{escape_markdown_alt(item.title)}]({item.image_url})"])
        lines.append("")

    lines.extend(["## 数据源", ""])
    for source in sources:
        lines.append(f"- {source.name}（{source.region}）：{', '.join(source.urls)}")

    if errors:
        lines.extend(["", "## 抓取异常", ""])
        for error in errors:
            lines.append(f"- {error['source']}：{error['url']} - {error['error']}")

    lines.extend(
        [
            "",
            "## 给 Skill 使用的建议",
            "",
            "- 将 JSON 结果作为结构化上下文，Markdown 报告作为人类可读版本。",
            "- 给大模型使用时优先传 `title/source/date/tags/summary/url/image_url` 字段。",
            "- 对国内源建议增加人工二次标注：男装、中性、女装、可转化男装元素。",
        ]
    )
    return "\n".join(lines).rstrip() + "\n"


def aggregate_tags(items: list[Item]) -> list[str]:
    counts: dict[str, int] = {}
    for item in items:
        for tag in item.tags:
            counts[tag] = counts.get(tag, 0) + 1
    return [tag for tag, _ in sorted(counts.items(), key=lambda pair: pair[1], reverse=True)[:8]]


def escape_markdown_alt(value: str) -> str:
    return value.replace("[", "(").replace("]", ")")


def save_outputs(
    items: list[Item],
    report: str,
    output_dir: Path,
    today: dt.date,
    sources: list[Source],
    errors: list[dict[str, str]],
) -> tuple[Path, Path]:
    output_dir.mkdir(parents=True, exist_ok=True)
    stem = f"{today.isoformat()}_menswear_trends"
    json_path = output_dir / f"{stem}.json"
    report_path = output_dir / f"{stem}.md"
    payload = {
        "generated_at": today.isoformat(),
        "sources": [dataclasses.asdict(source) for source in sources],
        "items": [dataclasses.asdict(item) for item in items],
        "errors": errors,
    }
    json_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    report_path.write_text(report, encoding="utf-8")
    return json_path, report_path


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Crawl recent high-end menswear references from 3 foreign and 2 domestic sites."
    )
    parser.add_argument("--days", type=int, default=14, help="Recent window in days. Default: 14.")
    parser.add_argument("--output-dir", default="outputs", help="Output directory. Default: outputs.")
    parser.add_argument("--limit", type=int, default=50, help="Maximum items in saved report. Default: 50.")
    parser.add_argument("--timeout", type=int, default=20, help="HTTP timeout seconds. Default: 20.")
    parser.add_argument("--delay", type=float, default=0.5, help="Delay between requests. Default: 0.5.")
    parser.add_argument(
        "--today",
        default="",
        help="Override today's date as YYYY-MM-DD. Useful for repeatable skill runs.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    today = dt.date.fromisoformat(args.today) if args.today else dt.date.today()
    sources = default_sources()
    items, errors = crawl_sources(
        sources=sources,
        today=today,
        recent_days=args.days,
        delay_seconds=args.delay,
        timeout=args.timeout,
    )
    items = items[: args.limit]
    report = render_markdown_report(items, today=today, recent_days=args.days, sources=sources, errors=errors)
    json_path, report_path = save_outputs(
        items=items,
        report=report,
        output_dir=Path(args.output_dir),
        today=today,
        sources=sources,
        errors=errors,
    )
    print(f"Saved JSON: {json_path}")
    print(f"Saved report: {report_path}")
    print(f"Items: {len(items)}")
    if errors:
        print(f"Errors: {len(errors)}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
