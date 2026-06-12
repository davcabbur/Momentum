// Permite importar los .sql de las migraciones de Drizzle (transformados por babel-plugin-inline-import).
declare module '*.sql' {
  const value: string;
  export default value;
}
