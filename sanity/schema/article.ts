// ============================================================
// AIBeat — Sanity Article Schema
// ============================================================

export const articleSchema = {
  name: 'article',
  title: 'Article',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Headline',
      type: 'string',
      validation: (Rule: any) => Rule.required().max(120),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'deck',
      title: 'Deck (sub-headline)',
      type: 'text',
      rows: 3,
      validation: (Rule: any) => Rule.required().max(300),
    },
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: '🔴 Breaking', value: 'breaking' },
          { title: '📰 News',     value: 'news'     },
          { title: '🛠 Tools',    value: 'tools'    },
          { title: '⚖️ Compare',  value: 'compare'  },
          { title: '🔬 Deep Dive',value: 'deep-dive'},
        ],
        layout: 'radio',
      },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: '📝 Draft',      value: 'draft'     },
          { title: '👀 In Review',  value: 'review'    },
          { title: '✅ Published',  value: 'published' },
        ],
        layout: 'radio',
      },
      initialValue: 'draft',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'author',
      title: 'Author',
      type: 'string',
      initialValue: 'AIBeat Staff',
    },
    {
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      options: {
        dateFormat: 'YYYY-MM-DD',
        timeFormat: 'HH:mm',
        calendarTodayLabel: 'Today',
      },
    },
    {
      name: 'readTime',
      title: 'Read Time (minutes)',
      type: 'number',
      validation: (Rule: any) => Rule.required().min(1).max(60),
    },
    {
      name: 'featured',
      title: 'Featured (show on homepage hero)',
      type: 'boolean',
      initialValue: false,
    },
    {
      name: 'content',
      title: 'Article Body (HTML)',
      type: 'text',
      rows: 20,
      description: 'Paste HTML content here. Supports <h2>, <p>, <table>, <ul>, <blockquote> tags.',
    },
    {
      name: 'relatedTools',
      title: 'Related Tool Slugs',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'e.g. cursor, github-copilot, jasper',
    },
    {
      name: 'seoTitle',
      title: 'SEO Title (optional override)',
      type: 'string',
    },
    {
      name: 'seoDescription',
      title: 'SEO Description (optional override)',
      type: 'text',
      rows: 2,
    },
  ],

  // How documents appear in the Sanity Studio list
  preview: {
    select: {
      title:    'title',
      category: 'category',
      status:   'status',
      date:     'publishedAt',
    },
    prepare({ title, category, status, date }: any) {
      const icons: Record<string, string> = {
        breaking: '🔴', news: '📰', tools: '🛠',
        compare: '⚖️', 'deep-dive': '🔬',
      }
      const statusIcons: Record<string, string> = {
        draft: '📝', review: '👀', published: '✅',
      }
      return {
        title,
        subtitle: `${statusIcons[status] ?? ''} ${status?.toUpperCase()} · ${icons[category] ?? ''} ${category} · ${date?.slice(0, 10) ?? ''}`,
      }
    },
  },

  // Sort newest first in the studio list
  orderings: [
    {
      title: 'Published Date, New → Old',
      name:  'publishedAtDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
    {
      title: 'Status',
      name:  'statusAsc',
      by: [{ field: 'status', direction: 'asc' }],
    },
  ],
}
