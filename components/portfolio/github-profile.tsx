import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { FiExternalLink, FiGithub } from "react-icons/fi";
import { getGithubProfile } from "@/lib/github-profile";
import type { SiteContent } from "@/types/site";
import type { SiteLanguage } from "@/lib/i18n";

export async function GithubProfile({
  config,
  language,
}: {
  config: SiteContent["github"];
  language: SiteLanguage;
}) {
  if (!config.enabled) return null;
  let profile;
  try {
    profile = await getGithubProfile(config.username, config.repository);
  } catch {
    /* Keep the portfolio available if GitHub is down. */
  }
  const url = `https://github.com/${encodeURIComponent(config.username)}/${encodeURIComponent(config.repository)}`;
  return (
    <section className="section-shell py-8 lg:py-16" id="github">
      <div className="glass-panel min-w-0 overflow-hidden p-5 sm:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-3 font-display text-2xl font-semibold">
            <FiGithub />
            GitHub
          </h2>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm text-[var(--color-accent-soft)]"
          >
            {config.username}/{config.repository}
            <FiExternalLink />
          </a>
        </div>
        {profile ? (
          <div className="github-readme">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, rehypeSanitize]}
              components={{
                a: ({ node, href, children, ...props }) => (
                  <a
                    {...props}
                    href={
                      href && !/^[a-z][a-z\d+.-]*:|^#|^\/\//i.test(href)
                        ? new URL(href, profile.linkBase).href
                        : href
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    {children}
                  </a>
                ),
                img: ({ node, src, alt, ...props }) => (
                  <img
                    {...props}
                    src={
                      src && !/^https?:\/\/|^\/\//i.test(src)
                        ? new URL(src, profile.rawBase).href
                        : src
                    }
                    alt={alt || "GitHub"}
                    loading="lazy"
                  />
                ),
              }}
            >
              {profile.markdown}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm text-[var(--color-muted)]">
            {language === "es"
              ? "No se pudo cargar el panel. Puedes verlo directamente en GitHub."
              : "The dashboard could not be loaded. You can view it directly on GitHub."}
          </p>
        )}
      </div>
    </section>
  );
}
