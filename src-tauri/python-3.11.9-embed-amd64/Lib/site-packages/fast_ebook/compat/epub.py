"""Compatibility re-export of fast_ebook.epub for ebooklib drop-in replacement."""

from fast_ebook.epub import *  # noqa: F401,F403
from fast_ebook.epub import (  # noqa: F401 — explicit re-exports
    EpubBook,
    EpubHtml,
    EpubImage,
    EpubCss,
    EpubNcx,
    EpubNav,
    Link,
    Section,
    read_epub,
    write_epub,
    open,
)
