import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "sindhu.live",
    pageTitleSuffix: " – sindhu.live",
    enableSPA: true,
    enablePopovers: true,
    analytics: {
  provider: "umami",
  websiteId: "cccbe2ef-f5d0-4351-ba87-bcadbe9b294b",
},
    locale: "en-US",
    baseUrl: "sindhu.live",
    ignorePatterns: ["private", "templates", ".obsidian"],
    defaultDateType: "modified",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
    typography: {
        header: "EB Garamond",
        body: "EB Garamond",
        code: "JetBrains Mono",
      },
      colors: {
        lightMode: {
          light: "#fdfdfc",
          lightgray: "#ececea",
          gray: "#b8b8b8",
          darkgray: "#4e4e4e",
          dark: "#1a1a1a",
          secondary: "#5c7a6b",
          tertiary: "#84a59d",
          highlight: "rgba(143, 159, 169, 0.15)",
          textHighlight: "#fff23688",
        },
        darkMode: {
          light: "#1c1917",
          lightgray: "#292524",
          gray: "#57534e",
          darkgray: "#d6d3d1",
          dark: "#f5f5f4",
          secondary: "#86a88a",
          tertiary: "#a8b89a",
          highlight: "rgba(134, 168, 138, 0.15)",
          textHighlight: "#b3aa0288",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: true }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
      // Comment out CustomOgImages to speed up build time
      Plugin.CustomOgImages(),
    ],
  },
}

export default config
