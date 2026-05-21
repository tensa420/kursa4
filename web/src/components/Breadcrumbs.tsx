import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

type Crumb = { label: string; to?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Хлебные крошки" className="mx-auto max-w-6xl px-4 py-3 text-sm text-soil/70">
      <ol className="flex flex-wrap items-center gap-1">
        <li>
          <Link to="/" className="inline-flex items-center gap-1 hover:text-moss">
            <Home className="h-4 w-4" aria-hidden />
            Главная
          </Link>
        </li>
        {items.map((c) => (
          <li key={c.label} className="flex items-center gap-1">
            <ChevronRight className="h-4 w-4 opacity-50" aria-hidden />
            {c.to ? (
              <Link to={c.to} className="hover:text-moss">
                {c.label}
              </Link>
            ) : (
              <span className="text-soil">{c.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
