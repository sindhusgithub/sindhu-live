import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"
import { SimpleSlug } from "./quartz/util/path"

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [Component.PageTitle(),
  Component.Search(),
  Component.Darkmode()],
  afterBody: [Component.ClickSound()],
  footer: Component.Footer({
  links: {
    home: "https://sindhu.live",
    garden: "https://sindhu.live/garden",
    guestbook: "https://www.yourworldoftext.com/~sindhulive",
    rss: "https://sindhu.live/index.xml",
    webring: "https://webring.xxiivv.com/",
  },
}),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ArticleTitle(),
    Component.ConditionalRender({
  component: Component.ContentMeta(),
  condition: (page) => {
    const slug = page.fileData.slug ?? ""
    return !["index", "lore", "now", "career-manifesto", "garden/index"].includes(slug)
  },
}),
    Component.TagList(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
        { Component: Component.ReaderMode() },
      ],
    }),
Component.Explorer({
  title: "",
  folderClickBehavior: "link",
  folderDefaultState: "open",
  useSavedState: false,
  filterFn: (node) => {
    const allowed = new Set(["Garden", "Lore", "Now", "Career Manifesto"])
    return allowed.has(node.displayName)
  },
}),
Component.RecentNotes({
  title: "Recent writing",
  limit: 4,
  showTags: false,
  filter: (f) => (f.slug?.startsWith("garden/") && f.slug !== "garden/index") ?? false,
  linkToMore: "garden/" as SimpleSlug,
}),
  ],
  right: [
    Component.DesktopOnly(Component.TableOfContents()),
  ],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.ArticleTitle(), Component.ContentMeta()],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
      ],
    }),
  Component.Explorer({
  title: "",
  folderClickBehavior: "link",
  folderDefaultState: "open",
  useSavedState: false,
  filterFn: (node) => {
    const allowed = new Set(["Garden", "Lore", "Now", "Career Manifesto"])
    return allowed.has(node.displayName)
  },
}),
  ],
  right: [],
}


