"""EPUB read/write API."""

from pathlib import Path

from fast_ebook._fast_ebook import (
    _read_epub,
    _read_epub_bytes,
    _read_epubs,
    _write_epub,
    _write_epub_bytes,
    EpubBook as _RustEpubBook,
    EpubItem,
    TocEntry,
)
from fast_ebook import (
    ITEM_COVER,
    ITEM_DOCUMENT,
    ITEM_IMAGE,
    ITEM_NAVIGATION,
    ITEM_STYLE,
    ITEM_SCRIPT,
)


XHTML_TEMPLATE = """\
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>{title}</title></head>
<body>
{content}
</body>
</html>"""


def _generate_id(file_name):
    """Generate a manifest ID from a file name."""
    return file_name.replace("/", "_").replace(".", "_").replace(" ", "_")


class EpubHtml:
    """An XHTML content document (chapter, section, etc.)."""

    def __init__(self, uid=None, title="", file_name="", lang=None,
                 content=b"", media_type="application/xhtml+xml"):
        self.id = uid or _generate_id(file_name)
        self.title = title
        self.file_name = file_name
        self.lang = lang
        self.media_type = media_type
        self._content = content if isinstance(content, bytes) else content.encode("utf-8")

    @property
    def content(self):
        return self._content

    @content.setter
    def content(self, value):
        if isinstance(value, str):
            value = value.encode("utf-8")
        self._content = value

    def get_content(self):
        """Return content, wrapping HTML fragments in a full XHTML document."""
        content_str = self._content.decode("utf-8", errors="replace")
        if content_str.lstrip().startswith("<?xml") or content_str.lstrip().lower().startswith("<html"):
            return self._content
        wrapped = XHTML_TEMPLATE.format(title=self.title, content=content_str)
        return wrapped.encode("utf-8")

    def get_type(self):
        return ITEM_DOCUMENT

    def get_name(self):
        return self.file_name

    def get_id(self):
        return self.id


class EpubImage:
    """A raster image item."""

    def __init__(self, uid=None, file_name="", media_type="", content=b""):
        self.id = uid or _generate_id(file_name)
        self.file_name = file_name
        self.media_type = media_type
        self.content = content

    def get_type(self):
        return ITEM_IMAGE

    def get_name(self):
        return self.file_name

    def get_id(self):
        return self.id

    def get_content(self):
        return self.content


class EpubCss:
    """A CSS stylesheet item."""

    def __init__(self, uid=None, file_name="", content=b""):
        self.id = uid or _generate_id(file_name)
        self.file_name = file_name
        self.media_type = "text/css"
        if isinstance(content, str):
            content = content.encode("utf-8")
        self.content = content

    def get_type(self):
        return ITEM_STYLE

    def get_name(self):
        return self.file_name

    def get_id(self):
        return self.id

    def get_content(self):
        return self.content


class EpubNcx:
    """Sentinel for auto-generated NCX (EPUB2 table of contents)."""

    def __init__(self):
        self.id = "ncx"
        self.file_name = "toc.ncx"
        self.media_type = "application/x-dtbncx+xml"
        self.content = b""

    def get_type(self):
        return ITEM_NAVIGATION


class EpubNav:
    """Sentinel for auto-generated Nav document (EPUB3 table of contents)."""

    def __init__(self):
        self.id = "nav"
        self.file_name = "nav.xhtml"
        self.media_type = "application/xhtml+xml"
        self.content = b""
        self._is_nav = True

    def get_type(self):
        return ITEM_NAVIGATION


class Link:
    """A table of contents entry linking to a document."""

    def __init__(self, href, title, uid=""):
        self.href = href
        self.title = title
        self.uid = uid


class Section:
    """A table of contents section heading (groups children)."""

    def __init__(self, title):
        self.title = title


class EpubBook(_RustEpubBook):
    """Extended EpubBook with Python-level convenience for building EPUBs."""

    def __init__(self):
        super().__init__()
        self._toc_raw = []
        self._spine_raw = []

    def __enter__(self):
        return self

    def __exit__(self, *args):
        pass

    @property
    def toc(self):
        if self._toc_raw:
            return self._toc_raw
        return super().toc

    @toc.setter
    def toc(self, value):
        self._toc_raw = value
        entries = _normalize_toc(value)
        self._set_toc_from_entries(entries)

    @property
    def spine(self):
        if self._spine_raw:
            return self._spine_raw
        return super().get_spine()

    @spine.setter
    def spine(self, value):
        self._spine_raw = value
        entries = _normalize_spine(value)
        self._set_spine_from_entries(entries)

    def add_item(self, item):
        """Add a Python item (EpubHtml, EpubImage, etc.) to the book."""
        properties = None
        if isinstance(item, EpubNav) or getattr(item, "_is_nav", False):
            properties = "nav"

        if hasattr(item, "get_content"):
            content = item.get_content()
        else:
            content = getattr(item, "content", b"")

        if isinstance(content, str):
            content = content.encode("utf-8")

        self.add_item_raw(
            item.id,
            item.file_name,
            item.media_type,
            content,
            item.get_type(),
            properties,
        )


def _normalize_toc(toc_list):
    """Convert Link/Section/tuple toc to TocEntry list for Rust."""
    result = []
    for entry in toc_list:
        if isinstance(entry, Link):
            result.append(TocEntry(entry.title, entry.href, []))
        elif isinstance(entry, TocEntry):
            result.append(entry)
        elif isinstance(entry, tuple) and len(entry) == 2:
            section, children = entry
            title = section.title if isinstance(section, Section) else str(section)
            child_entries = _normalize_toc(children)
            result.append(TocEntry(title, "", child_entries))
    return result


def _normalize_spine(spine_list):
    """Convert mixed spine list to [(idref, linear)] for Rust."""
    result = []
    for entry in spine_list:
        if isinstance(entry, str):
            result.append((entry, True))
        elif isinstance(entry, tuple):
            result.append(entry)
        elif hasattr(entry, "id"):
            result.append((entry.id, True))
    return result


def read_epub(source, options=None):
    """Read an EPUB file and return an EpubBook.

    Args:
        source: File path (str or Path), bytes, or file-like object (BytesIO).
        options: Optional dict with keys:
            ignore_ncx (bool): Skip NCX parsing.
            ignore_nav (bool): Skip Nav document parsing.
            lazy (bool): Defer item content loading until first access.

    Returns:
        EpubBook instance.
    """
    opts = options or {}
    kwargs = {
        "ignore_ncx": opts.get("ignore_ncx", False),
        "ignore_nav": opts.get("ignore_nav", False),
        "lazy": opts.get("lazy", False),
    }

    if isinstance(source, (bytes, bytearray)):
        return _read_epub_bytes(bytes(source), **kwargs)
    if hasattr(source, "read"):
        data = source.read()
        return _read_epub_bytes(data, **kwargs)
    return _read_epub(str(Path(source).resolve()), **kwargs)


def write_epub(target, book):
    """Write an EpubBook to an EPUB file, BytesIO, or file-like object.

    Args:
        target: Output file path (str or Path) or writable file-like object.
        book: EpubBook instance to write.
    """
    if hasattr(target, "write"):
        data = _write_epub_bytes(book)
        target.write(data)
        return
    _write_epub(str(Path(target).resolve()), book)


def read_epubs(paths, workers=None, options=None):
    """Read multiple EPUB files in parallel using Rayon.

    Args:
        paths: List of file paths (str or Path).
        workers: Number of worker threads (None = auto).
        options: Optional dict with keys: ignore_ncx (bool), ignore_nav (bool).

    Returns:
        List of EpubBook instances.
    """
    opts = options or {}
    resolved = [str(Path(p).resolve()) for p in paths]
    return _read_epubs(
        resolved,
        workers=workers,
        ignore_ncx=opts.get("ignore_ncx", False),
        ignore_nav=opts.get("ignore_nav", False),
    )


def open(source, options=None):
    """Open an EPUB for reading, returns an EpubBook usable as context manager.

    Usage:
        with epub.open('test.epub') as book:
            print(book.get_metadata('DC', 'title'))
    """
    return read_epub(source, options)
