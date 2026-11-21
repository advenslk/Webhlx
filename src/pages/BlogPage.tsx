import { ArrowLeft, Calendar, Loader2, Search, User } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Surface3D } from '../components/Surface3D';
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
    <div className="bg-[#F4F4F5] text-[#0A0A0B]">
      <section className="relative overflow-hidden helzerx-studio-hero pt-16 pb-20 md:pt-24 md:pb-24 border-b border-black/[0.06]">
        <div className="relative z-10 max-w-[1040px] mx-auto px-6 text-center">
          <div className="text-xs font-medium text-neutral-600 mb-5">
            <span className="font-semibold text-[#0A0A0B]">HelzerX Editorial</span>
            <span aria-hidden="true" className="mx-2 text-neutral-400">·</span>
            <span>Engineering Blog &amp; Announcements</span>
          </div>
          <h1 className="text-[clamp(2.6rem,6vw,4.75rem)] font-extrabold tracking-[-0.04em] leading-[0.98] helzerx-dotted-text pb-2">
            engineering notes.
          </h1>
          <p className="mt-5 max-w-[56ch] mx-auto text-base md:text-lg text-neutral-600">
            Architecture deep-dives, Pterodactyl infrastructure releases, and official launch
            milestones ahead of January 1, 2027.
          </p>
        </div>
      </section>

      <section className="bg-[#F4F4F5] py-14 md:py-20">
        <div className="max-w-[1160px] mx-auto px-6">
          {activePost ? (
            <Surface3D intensity={5} className="max-w-[820px] mx-auto">
              <article className="p-7 md:p-10 space-y-6">
                <button
                  type="button"
                  onClick={() => setActivePost(null)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0A0A0B] hover:text-neutral-600 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to all articles</span>
                </button>

                <div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                    <span className="font-semibold text-[#0A0A0B]">{activePost.category}</span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1 text-[#0A0A0B]">
                      <User className="w-3.5 h-3.5" />
                      {activePost.author_name}
                    </span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(activePost.published_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h2 className="mt-4 text-2xl md:text-4xl font-extrabold text-[#0A0A0B] leading-tight tracking-tight">
                    {activePost.title}
                  </h2>
                  <p className="mt-4 text-base text-neutral-600 leading-relaxed">
                    {activePost.excerpt}
                  </p>
                </div>

                <div className="pt-6 border-t border-black/[0.08] space-y-4 text-sm md:text-base text-neutral-700 leading-[1.8] whitespace-pre-line">
                  {activePost.content}
                </div>
              </article>
            </Surface3D>
          ) : (
            <div className="space-y-12">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/[0.08]">
                <div className="inline-flex flex-wrap gap-1 p-1 rounded-xl bg-white border border-black/[0.08] shadow-sm">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        category === cat
                          ? 'bg-[#0A0A0B] text-white'
                          : 'text-neutral-600 hover:text-[#0A0A0B] hover:bg-neutral-100'
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
                    className="pl-9 pr-3 py-2 rounded-lg bg-white border border-black/[0.12] text-xs text-[#0A0A0B] focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              {loading ? (
                <div className="py-12 flex items-center justify-center gap-2 text-sm text-neutral-600">
                  <Loader2 className="w-4 h-4 animate-spin text-[#0A0A0B]" />
                  <span>Loading CMS articles...</span>
                </div>
              ) : visible.length === 0 ? (
                <p className="py-12 text-center text-sm text-neutral-600">
                  No matching articles found.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {visible.map((post, idx) => (
                    <Surface3D key={post.id} intensity={12} delay={idx * 0.05}>
                      <article className="h-full flex flex-col justify-between p-7">
                        <div>
                          <div className="flex items-center justify-between text-xs text-neutral-500">
                            <span className="font-semibold text-[#0A0A0B]">{post.category}</span>
                            <span className="tabular-nums">
                              {new Date(post.published_at).toLocaleDateString()}
                            </span>
                          </div>
                          <h2 className="mt-3 text-lg font-bold text-[#0A0A0B] leading-snug">
                            {post.title}
                          </h2>
                          <p className="mt-2.5 text-xs text-neutral-600 leading-relaxed">
                            {post.excerpt}
                          </p>
                        </div>

                        <div className="mt-6 pt-4 border-t border-black/[0.08] flex items-center justify-between text-xs">
                          <span className="text-neutral-600">{post.author_name}</span>
                          <button
                            type="button"
                            onClick={() => setActivePost(post)}
                            className="font-bold text-[#0A0A0B] hover:text-neutral-600 cursor-pointer"
                          >
                            Read Article →
                          </button>
                        </div>
                      </article>
                    </Surface3D>
                  ))}
                </div>
              )}

              {announcements.length > 0 && (
                <div className="pt-8 border-t border-black/[0.08]">
                  <h2 className="text-xl font-extrabold text-[#0A0A0B] mb-5">
                    Platform Announcements
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {announcements.map((ann, idx) => (
                      <Surface3D key={ann.id} intensity={11} delay={idx * 0.05}>
                        <div className="p-6 h-full">
                          <div className="flex items-center justify-between text-xs text-neutral-500">
                            <span className="font-semibold capitalize text-[#0A0A0B]">
                              {ann.type}
                            </span>
                            <span className="tabular-nums">
                              {new Date(ann.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <h3 className="mt-2 text-base font-bold text-[#0A0A0B]">{ann.title}</h3>
                          <p className="mt-2 text-xs text-neutral-600 leading-relaxed">
                            {ann.body}
                          </p>
                        </div>
                      </Surface3D>
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
