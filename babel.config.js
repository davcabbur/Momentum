module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // inline-import permite importar los .sql de las migraciones de Drizzle.
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
