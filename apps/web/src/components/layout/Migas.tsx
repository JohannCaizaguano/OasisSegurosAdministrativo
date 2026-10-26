import { Link } from 'react-router-dom';

/** Migas de pan de una subpágina (DESIGN.md §Navigation): el tramo anterior es un enlace. */
export function Migas({
  anterior,
  actual,
}: {
  anterior: { a: string; texto: string };
  actual: string;
}) {
  return (
    <nav aria-label="Migas de pan" className="text-label text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link to={anterior.a} className="font-semibold text-link underline underline-offset-3">
            {anterior.texto}
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li aria-current="page" className="cifra">
          {actual}
        </li>
      </ol>
    </nav>
  );
}
