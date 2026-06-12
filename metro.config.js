const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Permite que Metro resuelva los .sql de las migraciones de Drizzle.
config.resolver.sourceExts.push('sql');

module.exports = config;
