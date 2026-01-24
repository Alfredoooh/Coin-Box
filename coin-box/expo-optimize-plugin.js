const { withAppBuildGradle } = require('@expo/config-plugins');

const withOptimizedBuild = (config) => {
  return withAppBuildGradle(config, (config) => {
    let contents = config.modResults.contents;
    
    // Adiciona minify e shrink
    contents = contents.replace(
      /minifyEnabled\s*=?\s*false/g,
      'minifyEnabled true'
    );
    contents = contents.replace(
      /shrinkResources\s*=?\s*false/g,
      'shrinkResources true'
    );
    
    // Adiciona outras otimizações no buildTypes release
    if (!contents.includes('crunchPngs')) {
      contents = contents.replace(
        /(buildTypes\s*{[\s\S]*?release\s*{[\s\S]*?)(signingConfig)/,
        '$1crunchPngs true\n            zipAlignEnabled true\n            $2'
      );
    }
    
    // Adiciona ndk filter para arm64 apenas
    if (!contents.includes('abiFilters')) {
      contents = contents.replace(
        /(defaultConfig\s*{)/,
        `$1
        ndk {
            abiFilters "arm64-v8a"
        }
        resConfigs "xxhdpi", "xxxhdpi"`
      );
    }
    
    // Adiciona packagingOptions
    if (!contents.includes('packagingOptions')) {
      contents = contents.replace(
        /(android\s*{)/,
        `$1
    packagingOptions {
        jniLibs {
            useLegacyPackaging false
        }
        exclude 'META-INF/**'
        exclude '**/*.kotlin_module'
        exclude 'kotlin/**'
        pickFirst 'lib/*/libc++_shared.so'
        pickFirst 'lib/*/libfbjni.so'
    }
    `
      );
    }
    
    // Adiciona debugSymbolLevel NONE
    if (!contents.includes('debugSymbolLevel')) {
      contents = contents.replace(
        /(buildTypes\s*{[\s\S]*?release\s*{[\s\S]*?minifyEnabled)/,
        `$1 true
            ndk {
                debugSymbolLevel 'NONE'
            }
            minifyEnabled`
      );
    }
    
    config.modResults.contents = contents;
    return config;
  });
};

module.exports = withOptimizedBuild;