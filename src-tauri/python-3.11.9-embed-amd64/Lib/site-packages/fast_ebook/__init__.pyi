from typing import Any

ITEM_UNKNOWN: int
ITEM_IMAGE: int
ITEM_STYLE: int
ITEM_SCRIPT: int
ITEM_NAVIGATION: int
ITEM_VECTOR: int
ITEM_FONT: int
ITEM_VIDEO: int
ITEM_AUDIO: int
ITEM_DOCUMENT: int
ITEM_COVER: int
ITEM_SMIL: int

__version__: str

class EpubItem:
    def get_content(self) -> bytes: ...
    def get_type(self) -> int: ...
    def get_name(self) -> str: ...
    def get_id(self) -> str: ...
    def get_media_type(self) -> str: ...
    def get_text(self) -> str | None: ...
    def __repr__(self) -> str: ...

class TocEntry:
    title: str
    href: str
    children: list[TocEntry]
    def __init__(
        self, title: str, href: str, children: list[TocEntry] | None = ...
    ) -> None: ...
    def __repr__(self) -> str: ...
