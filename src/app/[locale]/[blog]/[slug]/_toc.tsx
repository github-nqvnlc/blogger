export interface HeadingItem {
  id: string;
  text: string;
  level: number;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function injectHeadingIds(html: string): string {
  if (typeof window === "undefined") return html;
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const headings = Array.from(doc.querySelectorAll("h2, h3"));
  headings.forEach((el, i) => {
    if (!el.id) {
      const text = el.textContent?.trim() ?? "";
      el.id = text ? `${slugify(text)}-${i}` : `heading-${i}`;
    }
  });
  return doc.body.innerHTML;
}

export function extractHeadingMenu(html: string): HeadingItem[] {
  if (typeof window === "undefined") return [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const headings = Array.from(doc.querySelectorAll("h2, h3"));
  return headings.map((el, i) => {
    const text = el.textContent?.trim() ?? "";
    const id = el.id || `heading-${i}`;
    const level = parseInt(el.tagName[1]);
    return { id, text, level };
  });
}

export function TableOfContents({ html }: { html: string }) {
  const items = extractHeadingMenu(html);
  if (items.length === 0) return null;

  return (
    <nav className="space-y-4 text-sm">
      {items.map(item => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className={`block text-sm md:text-base font-semibold text-foreground-variant hover:text-foreground transition-colors leading-snug
                        ${item.level === 3 ? "pl-4" : "font-medium"}`}
        >
          {item.text}
        </a>
      ))}
    </nav>
  );
}
