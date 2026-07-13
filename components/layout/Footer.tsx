import Link from "next/link";
import Image from "next/image";

const categories = [
  { title: "Text Tools", slug: "text-tools" },
  { title: "PDF Tools", slug: "pdf-tools" },
  { title: "Image Tools", slug: "image-tools" },
  { title: "Calculators", slug: "calculators" },
  { title: "AI Tools", slug: "ai-tools" },
  { title: "SEO Tools", slug: "seo-tools" },
];

export function Footer() {
  return (
    <footer className="mt-20 border-t border-line bg-white">
      <div className="container-shell grid gap-10 py-12 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 text-sm font-bold text-white">
              T
            </span>
            <span className="text-xl font-bold text-ink">Toolvio</span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-6 text-muted">
            Fast online tools for documents, text, images, and daily tasks.
          </p>
          <p className="mt-3 text-sm text-muted">
            Contact:{" "}
            <a href="mailto:info@toolsvio.online" className="font-medium text-blue-700 hover:text-blue-800">
              info@toolsvio.online
            </a>
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <a href="https://launchstag.com" target="_blank" rel="noopener">
              <Image
                src="https://launchstag.com/badge-light.svg"
                alt="Featured on Launchstag"
                width={198}
                height={62}
              />
            </a>
            <a href="https://tools.cafe" target="_blank" rel="noopener">
              <Image
                src="https://tools.cafe/b/light.svg"
                alt="Featured on tools.cafe"
                width={256}
                height={80}
              />
            </a>
          </div>
          <div className="ad-slot mt-4 rounded-lg border border-dashed border-slate-300 px-4 py-5 text-center text-xs font-medium uppercase tracking-wide text-slate-500">
            Ad space
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-ink">Categories</h2>
          <div className="mt-4 grid gap-3 text-sm text-muted">
            {categories.map((category) => (
              <Link key={category.title} href={`/tools/categories/${category.slug}`} className="hover:text-blue-700">
                {category.title}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-ink">Company</h2>
          <div className="mt-4 grid gap-3 text-sm text-muted">
            <Link href="/about" className="hover:text-blue-700">About</Link>
            <Link href="/blog" className="hover:text-blue-700">Blog</Link>
            <Link href="/privacy-policy" className="hover:text-blue-700">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-blue-700">Terms</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-line py-5 text-center text-sm text-muted">
        &copy; {new Date().getFullYear()} Toolvio. All rights reserved.
      </div>
    </footer>
  );
}
