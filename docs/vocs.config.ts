import { defineConfig } from 'vocs'

export default defineConfig({
  title: 'Guillotine',
  description: 'High-performance Zig EVM Implementation',
  rootDir: '.',
  logoUrl: '/logo.svg',
  iconUrl: '/favicon.ico',
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
      link: 'https://github.com/williamcory/Guillotine',
    },
  ],
  theme: {
    accentColor: '#f97316',
  },
})