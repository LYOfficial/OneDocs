"""fast-ebook: Rust-powered EPUB2/EPUB3 library."""

from fast_ebook._fast_ebook import EpubItem, TocEntry

# Item type constants
ITEM_UNKNOWN = 0
ITEM_IMAGE = 1
ITEM_STYLE = 2
ITEM_SCRIPT = 3
ITEM_NAVIGATION = 4
ITEM_VECTOR = 5
ITEM_FONT = 6
ITEM_VIDEO = 7
ITEM_AUDIO = 8
ITEM_DOCUMENT = 9
ITEM_COVER = 10
ITEM_SMIL = 11

__version__ = "0.1.0"
__all__ = [
    "EpubItem",
    "TocEntry",
    "ITEM_UNKNOWN",
    "ITEM_IMAGE",
    "ITEM_STYLE",
    "ITEM_SCRIPT",
    "ITEM_NAVIGATION",
    "ITEM_VECTOR",
    "ITEM_FONT",
    "ITEM_VIDEO",
    "ITEM_AUDIO",
    "ITEM_DOCUMENT",
    "ITEM_COVER",
    "ITEM_SMIL",
]
