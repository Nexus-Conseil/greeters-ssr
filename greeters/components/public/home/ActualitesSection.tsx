import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";

import type { HomeArticle } from "@/lib/public-site-data";

type ActualitesSectionProps = {
  title: string;
  items: HomeArticle[];
};

export const ActualitesSection = ({ title, items }: ActualitesSectionProps) => {
  return (
    <section className="site-section" data-testid="public-home-actualites-section">
      <div className="site-container">
        <h2 className="site-section-title" data-testid="public-home-actualites-title">
          {title}
        </h2>
        <div className="site-news-grid" data-testid="public-home-actualites-grid">
          {items.map((article) => (
            <Link href={article.link as Route} key={article.id} className="site-news-card" data-testid={`public-home-actualite-card-${article.id}`}>
              <div className="site-news-date" data-testid={`public-home-actualite-date-${article.id}`}>
                <span>{article.day}</span>
                <strong>{article.month}</strong>
              </div>
              <div className="site-news-content">
                <div className="site-news-thumb">
                  <Image src={article.image} alt={article.title} width={96} height={96} className="site-news-thumb-image" data-testid={`public-home-actualite-image-${article.id}`} />
                </div>
                <div className="site-news-copy">
                  <h3 className="site-news-title" data-testid={`public-home-actualite-title-${article.id}`}>
                    {article.title}
                  </h3>
                  <p className="site-news-excerpt" data-testid={`public-home-actualite-excerpt-${article.id}`}>
                    {article.excerpt}
                  </p>
                  <span className="site-news-link">Lire la suite →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};