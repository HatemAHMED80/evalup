import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navbar />
      <main className="pt-[var(--nav-height)]">
        <article className="max-w-3xl mx-auto px-6 md:px-8 py-12 md:py-16">
          <div className="prose prose-lg max-w-none
            [&_h1]:text-[32px] [&_h1]:md:text-[40px] [&_h1]:font-bold [&_h1]:text-[var(--text-primary)] [&_h1]:leading-tight [&_h1]:mb-6
            [&_h2]:text-[24px] [&_h2]:font-bold [&_h2]:text-[var(--text-primary)] [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:border-b [&_h2]:border-[var(--border)] [&_h2]:pb-3
            [&_h3]:text-[18px] [&_h3]:font-semibold [&_h3]:text-[var(--text-primary)] [&_h3]:mt-8 [&_h3]:mb-3
            [&_p]:text-[16px] [&_p]:text-[var(--text-secondary)] [&_p]:leading-relaxed [&_p]:mb-4
            [&_ul]:text-[var(--text-secondary)] [&_ul]:space-y-2 [&_ul]:mb-6 [&_ul]:list-disc [&_ul]:pl-6
            [&_ol]:text-[var(--text-secondary)] [&_ol]:space-y-2 [&_ol]:mb-6 [&_ol]:list-decimal [&_ol]:pl-6
            [&_li]:text-[15px] [&_li]:leading-relaxed
            [&_strong]:text-[var(--text-primary)] [&_strong]:font-semibold
            [&_a]:text-[var(--accent)] [&_a]:underline [&_a]:hover:no-underline
            [&_blockquote]:border-l-4 [&_blockquote]:border-[var(--accent)] [&_blockquote]:bg-[var(--bg-secondary)] [&_blockquote]:px-6 [&_blockquote]:py-4 [&_blockquote]:my-6 [&_blockquote]:rounded-r-[var(--radius-md)]
            [&_table]:w-full [&_table]:border-collapse [&_table]:my-6
            [&_th]:text-left [&_th]:text-[13px] [&_th]:font-semibold [&_th]:text-[var(--text-primary)] [&_th]:bg-[var(--bg-secondary)] [&_th]:px-4 [&_th]:py-3 [&_th]:border [&_th]:border-[var(--border)]
            [&_td]:text-[14px] [&_td]:text-[var(--text-secondary)] [&_td]:px-4 [&_td]:py-3 [&_td]:border [&_td]:border-[var(--border)]
          ">
            {children}
          </div>
        </article>
      </main>
      <Footer />
    </div>
  )
}
