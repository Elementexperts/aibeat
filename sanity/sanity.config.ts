// ============================================================
// AIBeat — Sanity Studio Configuration
// Project ID: uk52fboh
// ============================================================
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool }    from '@sanity/vision'
import { articleSchema } from './schema/article'

export default defineConfig({
  name:    'aibeat',
  title:   'AIBeat CMS',
  projectId: 'uk52fboh',
  dataset:   'production',

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('AIBeat Content')
          .items([
            S.listItem()
              .title('✅ Published')
              .child(
                S.documentList()
                  .title('Published Articles')
                  .filter('_type == "article" && status == "published"')
                  .defaultOrdering([{ field: 'publishedAt', direction: 'desc' }])
              ),
            S.listItem()
              .title('👀 In Review')
              .child(
                S.documentList()
                  .title('Articles Awaiting Review')
                  .filter('_type == "article" && status == "review"')
              ),
            S.listItem()
              .title('📝 Drafts')
              .child(
                S.documentList()
                  .title('Draft Articles')
                  .filter('_type == "article" && status == "draft"')
              ),
            S.divider(),
            S.listItem()
              .title('📚 All Articles')
              .child(
                S.documentList()
                  .title('All Articles')
                  .filter('_type == "article"')
                  .defaultOrdering([{ field: 'publishedAt', direction: 'desc' }])
              ),
          ]),
    }),
    visionTool(), // lets you run GROQ queries directly in the studio
  ],

  schema: {
    types: [articleSchema],
  },
})
