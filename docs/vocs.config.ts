import { defineConfig } from 'vocs'

export default defineConfig({
  title: 'Guillotine',
  titleTemplate: '%s - Guillotine Docs',
  description: 'The ultrafast EVM for every language and platform. High-performance Ethereum Virtual Machine implementation in Zig with extreme speed, minimal bundle size, and universal language support.',
  rootDir: '.',
  baseUrl: 'https://guillotine.dev',
  logoUrl: {
    light: '/logo-light.svg',
    dark: '/logo-dark.svg'
  },
  iconUrl: {
    light: '/favicon-light.ico',
    dark: '/favicon-dark.ico'
  },
  ogImageUrl: 'https://guillotine.dev/api/og?logo=%logo&title=%title&description=%description',
  
  // Enhanced font configuration for better readability
  font: {
    default: {
      google: 'Inter'
    },
    mono: {
      google: 'JetBrains Mono'
    }
  },
  
  // Top navigation for better organization
  topNav: [
    { 
      text: 'Guide', 
      link: '/getting-started/installation',
      match: '/getting-started'
    },
    { 
      text: 'API', 
      link: '/api/evm',
      match: '/api'
    },
    { 
      text: 'Architecture', 
      link: '/advanced/architecture/overview',
      match: '/advanced/architecture'
    },
    { 
      text: 'Examples', 
      link: '/examples',
      match: '/examples'
    },
    {
      text: 'v0.1.0-alpha',
      items: [
        {
          text: '🎯 Roadmap',
          link: '/roadmap'
        },
        {
          text: '📝 Changelog',
          link: 'https://github.com/evmts/Guillotine/blob/main/CHANGELOG.md'
        },
        {
          text: '🚀 Releases',
          link: 'https://github.com/evmts/Guillotine/releases'
        }
      ]
    }
  ],
  
  // Edit link for contributions
  editLink: {
    pattern: 'https://github.com/evmts/Guillotine/edit/main/docs/pages/:path',
    text: 'Edit this page on GitHub'
  },
  sidebar: [
    {
      text: '🚀 Getting Started',
      items: [
        {
          text: 'Installation',
          link: '/getting-started/installation',
        },
        {
          text: 'Quick Start',
          link: '/getting-started/quick-start',
        },
        {
          text: 'Basic Example',
          link: '/getting-started/basic-example',
        },
      ],
    },
    {
      text: '📖 Usage',
      items: [
        {
          text: 'Basic Execution',
          link: '/usage/basic-execution',
        },
        {
          text: 'Configuration',
          link: '/usage/configuration',
        },
        {
          text: 'Error Handling',
          link: '/usage/error-handling',
        },
      ],
    },
    {
      text: '📝 API Reference',
      items: [
        {
          text: 'EVM',
          link: '/api/evm',
        },
        {
          text: 'State',
          link: '/api/state',
        },
        {
          text: 'Types',
          link: '/api/types',
        },
      ],
    },
    {
      text: '🔧 Advanced',
      collapsed: true,
      items: [
        {
          text: 'Language Bindings',
          items: [
            {
              text: 'C API',
              link: '/advanced/bindings/c-api',
            },
            {
              text: 'Go (Coming Soon)',
              link: '/advanced/bindings/go',
            },
            {
              text: 'TypeScript (Coming Soon)',
              link: '/advanced/bindings/typescript',
            },
          ],
        },
        {
          text: 'Performance',
          items: [
            {
              text: 'Benchmarks',
              link: '/advanced/performance/benchmarks',
            },
            {
              text: 'Optimization Guide',
              link: '/advanced/performance/optimization',
            },
            {
              text: 'Memory Management',
              link: '/advanced/performance/memory',
            },
          ],
        },
        {
          text: 'Customization',
          items: [
            {
              text: 'Compile-time Config',
              link: '/advanced/customization/comptime-config',
            },
            {
              text: 'Custom Hardforks',
              link: '/advanced/customization/hardforks',
            },
            {
              text: 'Custom Opcodes',
              link: '/advanced/customization/opcodes',
            },
            {
              text: 'Custom Precompiles',
              link: '/advanced/customization/precompiles',
            },
          ],
        },
        {
          text: 'Architecture',
          items: [
            {
              text: 'Design Principles',
              link: '/advanced/architecture/design',
            },
            {
              text: 'EVM Core',
              link: '/advanced/architecture/evm-core',
            },
            {
              text: 'Bytecode Analysis',
              link: '/advanced/architecture/bytecode',
            },
            {
              text: 'State Management',
              link: '/advanced/architecture/state',
            },
          ],
        },
        {
          text: 'Testing',
          items: [
            {
              text: 'Unit Tests',
              link: '/advanced/testing/unit',
            },
            {
              text: 'Differential Testing',
              link: '/advanced/testing/differential',
            },
            {
              text: 'Fuzzing',
              link: '/advanced/testing/fuzzing',
            },
          ],
        },
      ],
    },
    {
      text: '🤝 Contributing',
      items: [
        {
          text: 'Development Setup',
          link: '/contributing/setup',
        },
        {
          text: 'Code Guidelines',
          link: '/contributing/guidelines',
        },
        {
          text: 'Testing Requirements',
          link: '/contributing/testing',
        },
      ],
    },
  ],
  socials: [
    {
      icon: 'github',
      link: 'https://github.com/evmts/Guillotine',
    },
    {
      icon: 'telegram',
      link: 'https://t.me/+ANThR9bHDLAwMjUx',
    },
    {
      icon: 'discord',
      link: 'https://discord.gg/guillotine',
    },
    {
      icon: 'x',
      link: 'https://x.com/guillotinevm',
    },
  ],
  
  // Professional theme configuration inspired by Stripe & Vercel
  theme: {
    accentColor: {
      light: '#EA580C',  // Orange-600
      dark: '#FB923C'    // Orange-400
    },
    colorScheme: 'system',
    variables: {
      color: {
        background: {
          light: '#FFFFFF',
          dark: '#0A0A0A'
        },
        background2: {
          light: '#FAFAFA',
          dark: '#141414'
        },
        background3: {
          light: '#F5F5F5',
          dark: '#1F1F1F'
        },
        backgroundAccent: {
          light: '#EA580C',
          dark: '#FB923C'
        },
        backgroundAccentHover: {
          light: '#DC2626',
          dark: '#FED7AA'
        },
        heading: {
          light: '#111111',
          dark: '#FAFAFA'
        },
        text: {
          light: '#404040',
          dark: '#A3A3A3'
        },
        text2: {
          light: '#666666',
          dark: '#888888'
        },
        border: {
          light: '#E5E5E5',
          dark: '#262626'
        },
        codeBlockBackground: {
          light: '#FAFAFA',
          dark: '#0A0A0A'
        },
        codeInlineBackground: {
          light: '#F3F4F6',
          dark: '#1F2937'
        },
        link: {
          light: '#EA580C',
          dark: '#FB923C'
        },
        linkHover: {
          light: '#DC2626',
          dark: '#FED7AA'
        }
      },
      fontFamily: {
        default: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
        mono: '"JetBrains Mono", "SF Mono", Monaco, "Inconsolata", "Fira Code", monospace'
      },
      fontSize: {
        root: '16px',
        h1: '2.5rem',
        h2: '2rem',
        h3: '1.5rem',
        h4: '1.25rem',
        h5: '1.125rem',
        h6: '1rem',
        code: '0.875rem',
        codeBlock: '0.875rem'
      },
      lineHeight: {
        heading: '1.2',
        paragraph: '1.75',
        code: '1.5'
      },
      content: {
        width: '1280px',
        horizontalPadding: '2rem',
        verticalPadding: '3rem'
      },
      borderRadius: {
        '0': '0',
        '2': '0.125rem',
        '4': '0.25rem',
        '8': '0.5rem'
      }
    }
  },
  
  // Search configuration for better discoverability
  search: {
    boostDocument(documentId) {
      // Prioritize important pages in search results
      if (documentId.includes('getting-started')) return 2
      if (documentId.includes('api')) return 1.5
      if (documentId.includes('examples')) return 1.5
      return 1
    }
  },
  
  // Markdown enhancements
  markdown: {
    code: {
      themes: {
        light: 'github-light',
        dark: 'github-dark'
      }
    }
  },
  
  // Banner for alpha warning
  banner: {
    dismissable: true,
    backgroundColor: '#FEF3C7',
    textColor: '#92400E',
    content: '⚠️ **Alpha Release**: Guillotine is in early development and NOT suitable for production use. [Learn more →](/status)'
  }
})