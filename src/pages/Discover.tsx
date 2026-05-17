import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { MarkdownRenderer } from "@/utils/markdownRenderer";
import TagIcon from "@/assets/icons/tag.svg";
import "katex/dist/katex.min.css";

interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  html_url: string;
}

export const Discover: React.FC = () => {
  const { t } = useTranslation();
  const [releases, setReleases] = useState<GitHubRelease[]>([]);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReleases = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          "https://api.github.com/repos/LYOfficial/OneDocs/releases"
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: GitHubRelease[] = await res.json();
        setReleases(data);
        if (data.length > 0) setActiveTag(data[0].tag_name);
      } catch (err: any) {
        setError(err.message || t("discover.fetchError"));
      } finally {
        setLoading(false);
      }
    };
    fetchReleases();
  }, [t]);

  const activeRelease = releases.find((r) => r.tag_name === activeTag);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const renderReleaseBody = (body: string): string => {
    if (!body) return "";
    try {
      return MarkdownRenderer.render(body);
    } catch {
      // Fallback to basic rendering if MarkdownRenderer fails
      return body
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br/>");
    }
  };

  return (
    <div className="tools-container">
      <aside className="tools-sidebar">
        <div className="tools-sidebar-header">
          <h2>{t("discover.title")}</h2>
          <p>{t("discover.subtitle")}</p>
        </div>

        {loading ? (
          <div className="discover-loading">
            <span>{t("discover.loading")}</span>
          </div>
        ) : error ? (
          <div className="discover-error">
            <p>{t("discover.fetchError")}</p>
            <small>{error}</small>
          </div>
        ) : releases.length === 0 ? (
          <div className="archive-empty">
            <p>{t("discover.noReleases")}</p>
          </div>
        ) : (
          <nav className="tools-nav">
            {releases.map((release) => (
              <button
                key={release.id}
                className={`tools-nav-item ${release.tag_name === activeTag ? "active" : ""}`}
                onClick={() => setActiveTag(release.tag_name)}
              >
                <div className="tools-nav-icon">
                  <img src={TagIcon} alt="" />
                </div>
                <div className="tools-nav-meta">
                  <span>{release.tag_name}</span>
                  <small>{formatDate(release.published_at)}</small>
                </div>
              </button>
            ))}
          </nav>
        )}
      </aside>

      <section className="tools-content">
        {activeRelease ? (
          <div className="discover-release">
            <div className="discover-release-header">
              <h2>{activeRelease.name || activeRelease.tag_name}</h2>
              <div className="discover-release-meta">
                <span className="discover-tag-badge">{activeRelease.tag_name}</span>
                <span>{formatDate(activeRelease.published_at)}</span>
              </div>
            </div>
            <div
              className="discover-release-body markdown-body"
              dangerouslySetInnerHTML={{ __html: renderReleaseBody(activeRelease.body) }}
            />
          </div>
        ) : (
          <div className="result-empty-card">
            <h3>{t("discover.emptyTitle")}</h3>
            <p>{t("discover.emptyBody")}</p>
          </div>
        )}
      </section>
    </div>
  );
};
