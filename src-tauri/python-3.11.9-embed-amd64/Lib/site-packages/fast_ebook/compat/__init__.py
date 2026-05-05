"""
Drop-in compatibility layer for ebooklib.

Usage:
    import fast_ebook.compat as ebooklib
    from fast_ebook.compat import epub
"""

from fast_ebook import *  # noqa: F401,F403 — ITEM_* constants
from fast_ebook import epub  # noqa: F401
