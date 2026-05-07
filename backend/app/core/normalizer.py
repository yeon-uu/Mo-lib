from typing import Literal

from pydantic import BaseModel


class ContentItem(BaseModel):
    """세 도메인 공통 정규화 스키마. Node.metadata_ 에 저장될 구조와 대응."""

    domain: Literal["music", "movie", "book"]
    external_id: str
    title: str
    subtitle: str | None  # music: 아티스트 / movie: 감독 / book: 저자
    description: str | None
    image_url: str | None
    release_date: str | None
    external_url: str | None
    metadata: dict  # 도메인별 부가 정보 → Node.metadata_


# ── Spotify ──────────────────────────────────────────────────────────────────


def normalize_spotify_track(item: dict) -> ContentItem:
    """Spotify Search API track 객체 → ContentItem."""
    album = item.get("album", {})
    images = album.get("images", [])
    artists = [a["name"] for a in item.get("artists", [])]

    return ContentItem(
        domain="music",
        external_id=item["id"],
        title=item["name"],
        subtitle=", ".join(artists) if artists else None,
        description=None,  # Spotify는 트랙 설명을 제공하지 않음
        image_url=images[0]["url"] if images else None,
        release_date=album.get("release_date"),
        external_url=item.get("external_urls", {}).get("spotify"),
        metadata={
            "artists": artists,
            "album": album.get("name", ""),
            "duration_ms": item.get("duration_ms", 0),
            "preview_url": item.get("preview_url"),
            "popularity": item.get("popularity"),
            "explicit": item.get("explicit", False),
        },
    )


# ── TMDB ─────────────────────────────────────────────────────────────────────

_TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500"


def normalize_tmdb_movie(item: dict) -> ContentItem:
    """TMDB Search Movies API 객체 → ContentItem."""
    poster = item.get("poster_path")
    director = item.get("director")  # credits 포함 시 전처리 후 전달

    return ContentItem(
        domain="movie",
        external_id=str(item["id"]),
        title=item.get("title") or item.get("original_title", ""),
        subtitle=director,
        description=item.get("overview") or None,
        image_url=f"{_TMDB_IMAGE_BASE}{poster}" if poster else None,
        release_date=item.get("release_date") or None,
        external_url=f"https://www.themoviedb.org/movie/{item['id']}",
        metadata={
            "original_title": item.get("original_title"),
            "original_language": item.get("original_language"),
            "genre_ids": item.get("genre_ids", []),
            "vote_average": item.get("vote_average"),
            "vote_count": item.get("vote_count"),
            "popularity": item.get("popularity"),
            "adult": item.get("adult", False),
        },
    )


# ── 알라딘 ───────────────────────────────────────────────────────────────────


def normalize_aladin_book(item: dict) -> ContentItem:
    """알라딘 ItemSearch API 객체 → ContentItem."""
    return ContentItem(
        domain="book",
        external_id=item.get("isbn13")
        or item.get("isbn")
        or str(item.get("itemId", "")),
        title=item.get("title", ""),
        subtitle=item.get("author") or None,
        description=item.get("description") or None,
        image_url=item.get("cover") or None,
        release_date=item.get("pubDate") or None,
        external_url=item.get("link") or None,
        metadata={
            "publisher": item.get("publisher"),
            "category": item.get("categoryName"),
            "isbn": item.get("isbn"),
            "isbn13": item.get("isbn13"),
            "item_id": item.get("itemId"),
            "price_sales": item.get("priceSales"),
            "rating": item.get("customerReviewRank"),
        },
    )
