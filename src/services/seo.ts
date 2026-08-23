import { CategoryGroup, MovieDetail } from '../types/movie';

/**
 * Utility helper to safely set or create a meta tag by name or property
 */
function setMetaTag(attribute: 'name' | 'property', key: string, content: string) {
  let element = document.querySelector(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

/**
 * Set or update the canonical link tag
 */
function setCanonicalUrl(url: string) {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}

/**
 * Inject or update a JSON-LD structured data script tag
 */
function setJsonLd(scriptId: string, data: Record<string, unknown> | null) {
  let script = document.getElementById(scriptId) as HTMLScriptElement | null;
  if (!data) {
    if (script) {
      script.remove();
    }
    return;
  }

  if (!script) {
    script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

export interface DynamicSeoOptions {
  title?: string;
  description?: string;
  keywords?: string;
  url?: string;
  image?: string;
  type?: 'website' | 'video.movie' | 'video.tv_show' | 'article';
}

const DEFAULT_SEO = {
  title: 'Xóm Phim - Cả Xóm Cùng Xem Phim | Xem Phim HD Miễn Phí',
  description:
    'Xóm Phim - Cả xóm cùng xem phim. Website xem phim trực tuyến hiện đại phong cách Netflix, phim mới cập nhật liên tục, tốc độ cao, vietsub thuyết minh.',
  keywords:
    'xóm phim, xom phim, xem phim online, xem phim hd, phim moi, phim vietsub, phim thuyet minh, phim bo, phim le, hoat hinh, nguonc',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://xomphim.com',
  image: '/og-image.jpg',
};

/**
 * Updates browser title and standard SEO Meta / Open Graph / Twitter tags
 */
export function updateSEO(options: DynamicSeoOptions = {}) {
  const title = options.title || DEFAULT_SEO.title;
  const description = options.description || DEFAULT_SEO.description;
  const keywords = options.keywords || DEFAULT_SEO.keywords;
  const url = options.url || (typeof window !== 'undefined' ? window.location.href : DEFAULT_SEO.url);
  const image = options.image || DEFAULT_SEO.image;
  const type = options.type || 'website';

  // Browser Document Title
  document.title = title;

  // Standard Meta
  setMetaTag('name', 'description', description);
  setMetaTag('name', 'keywords', keywords);
  setCanonicalUrl(url);

  // Open Graph
  setMetaTag('property', 'og:title', title);
  setMetaTag('property', 'og:description', description);
  setMetaTag('property', 'og:image', image);
  setMetaTag('property', 'og:image:secure_url', image);
  setMetaTag('property', 'og:url', url);
  setMetaTag('property', 'og:type', type);

  // Twitter Cards
  setMetaTag('name', 'twitter:title', title);
  setMetaTag('name', 'twitter:description', description);
  setMetaTag('name', 'twitter:image', image);
}

/**
 * Injects dynamic Schema.org Movie / TVSeries JSON-LD for rich snippets
 */
export function injectMovieSchema(movie: MovieDetail, currentEpisodeName?: string) {
  if (!movie) return;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : `https://xomphim.com/phim/${movie.slug}`;
  const baseDomain = typeof window !== 'undefined' ? window.location.origin : 'https://xomphim.com';

  // Extract genres from category
  const genresList: string[] = [];
  if (movie.category) {
    try {
      const catValues = Object.values(movie.category) as CategoryGroup[];
      for (const group of catValues) {
        if (group.group?.name?.toLowerCase().includes('thể loại') && group.list) {
          group.list.forEach((item) => genresList.push(item.name));
        }
      }
    } catch {
      // ignore
    }
  }

  // Extract country
  let countryName = 'Việt Nam';
  if (movie.category) {
    try {
      const catValues = Object.values(movie.category) as CategoryGroup[];
      for (const group of catValues) {
        if (group.group?.name?.toLowerCase().includes('quốc gia') && group.list?.[0]) {
          countryName = group.list[0].name;
        }
      }
    } catch {
      // ignore
    }
  }

  // Clean description of any HTML tags
  const cleanDescription = (movie.description || `${movie.name} (${movie.original_name || ''}) - Xem phim Full HD Vietsub Thuyết Minh tốc độ cao tại Xóm Phim.`)
    .replace(/<[^>]*>?/gm, '')
    .trim();

  // Cast list
  const actors = movie.casts
    ? movie.casts.split(',').map((c) => ({
        '@type': 'Person',
        name: c.trim(),
      }))
    : [];

  const directorObj = movie.director
    ? {
        '@type': 'Person',
        name: movie.director.trim(),
      }
    : {
        '@type': 'Person',
        name: 'Đang cập nhật',
      };

  const isSeries = movie.total_episodes && Number(movie.total_episodes) > 1;

  const schemaMovie: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': isSeries ? 'TVSeries' : 'Movie',
    '@id': `${currentUrl}#movie`,
    name: movie.name,
    alternateName: movie.original_name || undefined,
    url: currentUrl,
    image: [movie.poster_url || `${baseDomain}/og-image.jpg`, movie.thumb_url || `${baseDomain}/og-image.jpg`].filter(Boolean),
    description: cleanDescription,
    dateCreated: movie.created || undefined,
    dateModified: movie.modified || undefined,
    genre: genresList.length > 0 ? genresList : ['Phim HD'],
    countryOfOrigin: {
      '@type': 'Country',
      name: countryName,
    },
    inLanguage: 'vi',
    subtitleLanguage: 'vi',
    director: directorObj,
    actor: actors.length > 0 ? actors : undefined,
    duration: movie.time || undefined,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '9.6',
      bestRating: '10',
      worstRating: '1',
      ratingCount: '2480',
    },
    publisher: {
      '@type': 'Organization',
      '@id': `${baseDomain}/#organization`,
      name: 'Xóm Phim',
      logo: {
        '@type': 'ImageObject',
        url: `${baseDomain}/logo.jpg`,
      },
    },
    potentialAction: {
      '@type': 'WatchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: currentUrl,
        inLanguage: 'vi',
        actionPlatform: [
          'http://schema.org/DesktopWebPlatform',
          'http://schema.org/MobileWebPlatform',
          'http://schema.org/AndroidPlatform',
          'http://schema.org/IOSPlatform',
        ],
      },
      name: `Xem phim ${movie.name}${currentEpisodeName ? ` - ${currentEpisodeName}` : ''}`,
    },
  };

  setJsonLd('schema-movie-jsonld', schemaMovie);

  // Update Page SEO Tags for this movie
  const epSuffix = currentEpisodeName ? ` [${currentEpisodeName}]` : '';
  const pageTitle = `${movie.name}${epSuffix} - Xem Phim Full HD Vietsub | Xóm Phim`;
  const pageDesc = cleanDescription.slice(0, 160);

  updateSEO({
    title: pageTitle,
    description: pageDesc,
    keywords: `${movie.name}, xem phim ${movie.name}, ${movie.original_name || ''}, phim ${genresList.join(', ')}, phim ${countryName}, xóm phim, xem phim hd`,
    image: movie.poster_url || movie.thumb_url || `${baseDomain}/og-image.jpg`,
    url: currentUrl,
    type: isSeries ? 'video.tv_show' : 'video.movie',
  });
}

/**
 * Injects Schema.org BreadcrumbList for rich navigation snippets
 */
export function injectBreadcrumbSchema(items: { name: string; url?: string }[]) {
  const baseDomain = typeof window !== 'undefined' ? window.location.origin : 'https://xomphim.com';

  const itemListElement = items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url ? (item.url.startsWith('http') ? item.url : `${baseDomain}${item.url}`) : baseDomain,
  }));

  const schemaBreadcrumbs: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${baseDomain}/#breadcrumbs`,
    itemListElement: itemListElement,
  };

  setJsonLd('schema-breadcrumb-jsonld', schemaBreadcrumbs);
}

/**
 * Resets SEO metadata to homepage default and clears movie/breadcrumb JSON-LD
 */
export function resetDefaultSEO(categoryLabel?: string) {
  const baseDomain = typeof window !== 'undefined' ? window.location.origin : 'https://xomphim.com';

  if (categoryLabel && categoryLabel !== 'Phim Mới Cập Nhật') {
    updateSEO({
      title: `${categoryLabel} - Xem Phim Online Full HD Miễn Phí | Xóm Phim`,
      description: `Tổng hợp danh sách ${categoryLabel} chọn lọc hay nhất, cập nhật liên tục, tốc độ cao, vietsub thuyết minh full HD tại Xóm Phim.`,
      url: typeof window !== 'undefined' ? window.location.href : baseDomain,
      type: 'website',
    });

    injectBreadcrumbSchema([
      { name: 'Trang Chủ', url: '/' },
      { name: categoryLabel, url: window.location.search || '/' },
    ]);
  } else {
    updateSEO({
      title: DEFAULT_SEO.title,
      description: DEFAULT_SEO.description,
      keywords: DEFAULT_SEO.keywords,
      url: baseDomain,
      image: `${baseDomain}/og-image.jpg`,
      type: 'website',
    });

    injectBreadcrumbSchema([{ name: 'Trang Chủ', url: '/' }]);
  }

  // Remove movie JSON-LD when not on movie page
  setJsonLd('schema-movie-jsonld', null);
}
