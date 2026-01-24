const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Tree-shaking agressivo (equivalente ao Flutter)
config.transformer = {
  ...config.transformer,
  minifierPath: 'metro-minify-terser',
  minifierConfig: {
    compress: {
      // Remove código morto
      dead_code: true,
      drop_console: true,      // Remove console.log (equivalente a --obfuscate)
      drop_debugger: true,
      passes: 3,               // Múltiplas passagens de otimização
      pure_funcs: [            // Remove funções específicas
        'console.log',
        'console.info',
        'console.debug',
        'console.warn',
      ],
      // Otimizações agressivas
      collapse_vars: true,
      reduce_vars: true,
      toplevel: true,
      unused: true,
      // Remove imports não utilizados
      side_effects: true,
    },
    mangle: {
      // Ofusca nomes (equivalente a --obfuscate)
      toplevel: true,
      keep_classnames: false,
      keep_fnames: false,
    },
    output: {
      comments: false,         // Remove comentários
      ascii_only: true,
    },
  },
};

// Ignora fontes e assets grandes desnecessários
config.resolver = {
  ...config.resolver,
  blacklistRE: [
    // Ignora arquivos de teste
    /\/__tests__\//,
    /\/__mocks__\//,
    /\.test\.(js|jsx|ts|tsx)$/,
    /\.spec\.(js|jsx|ts|tsx)$/,
  ],
  assetExts: config.resolver.assetExts.filter(
    // Remove formatos de imagem pesados
    ext => !['gif', 'webp'].includes(ext)
  ),
};

module.exports = config;