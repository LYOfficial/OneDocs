import os
import pytest
from dotenv import load_dotenv
from firecrawl import Firecrawl
from firecrawl.v2.types import Document, ScrapeOptions

load_dotenv()
API_KEY = (os.getenv("API_KEY") or "").strip()
API_URL = (os.getenv("API_URL") or "").strip()


@pytest.mark.skipif(
    not API_KEY or not API_URL,
    reason="API_KEY and API_URL are required for parse e2e tests",
)
class TestParseE2E:
    def setup_method(self):
        self.client = Firecrawl(api_key=API_KEY, api_url=API_URL)

    def test_parse_uploaded_html(self):
        doc = self.client.parse(
            b"<!DOCTYPE html><html><body><h1>Python Parse E2E</h1></body></html>",
            filename="python-parse-e2e.html",
            content_type="text/html",
            options=ScrapeOptions(formats=["markdown"]),
        )
        assert isinstance(doc, Document)
        assert doc.markdown is not None
        assert "Python Parse E2E" in doc.markdown
