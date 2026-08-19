import { useEffect } from "react";

export function SeoTags({
  title,
  description,
  keywords,
}: {
  title?: string;
  description?: string;
  keywords?: string;
}) {
  useEffect(() => {
    if (title) document.title = title;
    setMeta("description", description);
    setMeta("keywords", keywords);
    setMeta("og:title", title, "property");
    setMeta("og:description", description, "property");
  }, [title, description, keywords]);
  return null;
}

function setMeta(name: string, content?: string, attr: "name" | "property" = "name") {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}
