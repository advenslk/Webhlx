import { ArrowLeft, Calendar, Loader2, Search, User } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { apiRequest } from '../lib/api';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  category: string;
  tags_json: string;
  excerpt: string;
  content: string;
  author_name: string;
  published_at: string;
}

export function BlogPage() {
  const { siteData } = useAppContext();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [activePost, setActivePost] = useState<BlogPost | null>(null);

  useEffect(() => {
    let active = true;
    apiRequest<{ posts: BlogPost[] }>('/api/blog/posts')
      .then((res) => {
        if (active) setPosts(res.posts || []);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(posts.map((p) => p.category)))],
    [posts],
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts.filter((p) => {
      const catMatch = category === 'All' || p.category === category;
      const qMatch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return catMatch && qMatch;
    });
  }, [posts, category, search]);

  const announcements = siteData?.announcements ?? [];

  return (
    <div className="bg-black text-white">
      <section className="relative overflow-hidden helzerx-hero-aura pt-20 pb-20 md:pt-28 md:pb-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-[440px] left-1/2 -translate-x-1/2 w-[165%] h-[540px] rounded-[100%] bg-black border-t border-violet-300/40 shadow-[0_-20px_80px_rgba(167,139,250,0.35)]"
        />

        <div className="relative z-10 max-w-[1040px] mx-auto px-6 text-center">
          <div className="text-xs md:text-sm font-medium text-violet-200/85 mb-5">
            <span>HelzerX Editorial</span>
            <span aria-hidden="true" className="mx-2 text-cyan-400/70">·</span>
            <span>Engineering Blog &amp; Announcements</span>
          </div>
          <h1 className="text-[clamp(2.5rem,5.5vw,4.25rem)] font-extrabold tracking-[-0.03em] leading-[1.04] text-white">
            Dispatch &amp; Engineering Notes
          </h1>
          <p className="mt-5 max-w-[56ch] mx-auto text-base md:text-lg text-neutral-300">
            Architecture deep-dives, Pterodactyl infrastructure releases, and official launch
            milestones ahead of January 1, 2027.
          </p>
        </div>
      </section>

      <section className="bg-black py-14 md:py-20">
        <div className="max-w-[1160px] mx-auto px-6">
          {activePost ? (
            <article className="max-w-[820px] mx-auto rounded-2xl bg-[#08080F] border border-white/[0.12] p-7 md:p-10 space-y-6">
              <button
                type="button"
                onClick={() => setActivePost(null)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-300 hover:text-white cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to all articles</span>
              </button>

              <div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400">
                  <span className="font-mono text-violet-300">{activePost.category}</span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    {activePost.author_name}
                  </span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(activePost.published_at).toLocaleDateString()}
                  </span>
                </div>
                <h2 className="mt-4 text-2xl md:text-4xl font-bold text-white leading-tight">
                  {activePost.title}
                </h2>
                <p className="mt-4 text-base text-neutral-300 leading-relaxed">
                  {activePost.excerpt}
                </p>
              </div>

              <div className="pt-6 border-t border-white/[0.08] space-y-4 text-sm md:text-base text-neutral-200 leading-[1.8] whitespace-pre-line">
                {activePost.content}
              </div>
            </article>
          ) : (
            <div className="space-y-12">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
                <div className="inline-flex flex-wrap gap-1 p-1 rounded-xl bg-white/[0.05] border border-white/[0.1]">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        category === cat
                          ? 'bg-white text-black'
                          : 'text-neutral-300 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Filter articles..."
                    className="pl-9 pr-3 py-2 rounded-lg bg-[#08080F] border border-white/[0.12] text-xs text-white focus:outline-none focus:border-violet-400"
                  />
                </div>
              </div>

              {loading ? (
                <div className="py-12 flex items-center justify-center gap-2 text-sm text-neutral-400">
                  <Loader2 className="w-4 h-4 animate-spin text-violet-300" />
                  <span>Loading CMS articles...</span>
                </div>
              ) : visible.length === 0 ? (
                <p className="py-12 text-center text-sm text-neutral-400">
                  No matching articles found.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {visible.map((post) => (
                    <article
                      key={post.id}
                      className="flex flex-col justify-between rounded-2xl bg-[#08080C] border border-white/[0.1] p-7 hover:border-violet-400/40 transition-colors"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs text-neutral-400">
                          <span className="font-mono text-cyan-300">{post.category}</span>
                          <span className="font-mono tabular-nums">
                            {new Date(post.published_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h2 className="mt-3 text-lg font-bold text-white leading-snug">
                          {post.title}
                        </h2>
                        <p className="mt-2.5 text-xs text-neutral-400 leading-relaxed">
                          {post.excerpt}
                        </p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs">
                        <span className="text-neutral-400">{post.author_name}</span>
                        <button
                          type="button"
                          onClick={() => setActivePost(post)}
                          className="font-semibold text-violet-300 hover:text-white cursor-pointer"
                        >
                          Read Article →
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {announcements.length > 0 && (
                <div className="pt-8 border-t border-white/[0.08]">
                  <h2 className="text-xl font-bold text-white mb-5">Platform Announcements</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {announcements.map((ann) => (
                      <div
                        key={ann.id}
                        className="rounded-2xl bg-[#08080F] border border-white/[0.1] p-6"
                      >
                        <div className="flex items-center justify-between text-xs text-neutral-400">
                          <span className="font-mono text-cyan-300 uppercase">{ann.type}</span>
                          <span className="font-mono tabular-nums">
                            {new Date(ann.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="mt-2 text-base font-bold text-white">{ann.title}</h3>
                        <p className="mt-2 text-xs text-neutral-400 leading-relaxed">{ann.body}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
