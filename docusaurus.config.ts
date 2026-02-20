import winterDark from "./src/prism-themes/winter-dark";
import winterLight from "./src/prism-themes/winter-light";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: "ElectronDoc",
  tagline: "Dinosaurs are cool",
  favicon: "img/favicon.ico",

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    // v4: true — disabled: restructures provider chain, breaking swizzled
    // theme components that rely on useColorMode / useScrollController context.
  },

  // Set the production url of your site here
  url: "https://luuman.github.io/",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/docusaurus-doc/",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "luuman", // Usually your GitHub org/user name.
  projectName: "docusaurus-doc", // Usually your repo name.

  trailingSlash: false,

  onBrokenLinks: "warn",
  onBrokenMarkdownLinks: "warn",

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "zh",
    locales: ["en", "zh"],
    localeConfigs: {
      en: {
        htmlLang: "en-US",
      },
      zh: {
        htmlLang: "zh-CN",
      },
    },
  },
  plugins: [
    [
      require.resolve("@easyops-cn/docusaurus-search-local"),
      {
        hashed: true,
        language: ["en", "zh"],
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
      },
    ],
  ],
  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          sidebarCollapsible: true,
          sidebarCollapsed: false,
          rehypePlugins: [require('./src/plugins/rehype-fix-style')],
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          // editUrl:
          //   "https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/",
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ["rss", "atom"],
            xslt: true,
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            "https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/",
          // Useful options to enforce blogging best practices
          onInlineTags: "warn",
          onInlineAuthors: "warn",
          onUntruncatedBlogPosts: "warn",
        },
        theme: {
          customCss: ['./src/css/custom.css', './src/css/brainboard-prose.css'],
        },
      } satisfies Preset.Options,
    ],
  ],
  markdown: {
    // .md files → CommonMark (not MDX), .mdx → MDX
    // Required for GitBook-sourced docs that use {% hint %}, <br>, <figure> etc.
    format: 'detect',
    mermaid: true,
  },
  themes: ["@docusaurus/theme-mermaid"],
  themeConfig: {
    mermaid: {
      theme: {
        dark: 'dark',
        light: 'default',
      },
      options: {
        look: 'handDrawn',
        maxWidth: '100%',
      },
    },
    // Set dark theme as default
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: false,
      respectPrefersColorScheme: false,
    },
    // Replace with your project's social card
    image: "img/docusaurus-social-card.jpg",
    navbar: {
      title: "ElectronDoc",
      // logo: {
      //   alt: "ElectronDoc Logo",
      //   src: "img/logo.svg",
      // },
      items: [
        { type: "doc", to: "/blog", position: "right", label: "Docs" },
        { to: "/blog", label: "Blog", position: "right" },
      ],
    },
    footer: {
      style: "dark",
      links: [
        // {
        //   title: "Docs",
        //   items: [
        //     {
        //       label: "Doc",
        //       to: "/docs/intro",
        //     },
        //   ],
        // },
        // {
        //   title: "Community",
        //   items: [
        //     {
        //       label: "Stack Overflow",
        //       href: "https://stackoverflow.com/questions/tagged/docusaurus",
        //     },
        //     {
        //       label: "Discord",
        //       href: "https://discordapp.com/invite/docusaurus",
        //     },
        //     {
        //       label: "X",
        //       href: "https://x.com/docusaurus",
        //     },
        //   ],
        // },
        // {
        //   title: "More",
        //   items: [
        //     {
        //       label: "Blog",
        //       to: "/blog",
        //     },
        //     {
        //       label: "GitHub",
        //       href: "https://github.com/facebook/docusaurus",
        //     },
        //   ],
        // },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} My Project, Inc. Built with Docusaurus.`,
    },
    prism: {
      theme: winterLight,
      darkTheme: winterDark,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
