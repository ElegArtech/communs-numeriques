import puppeteer from 'puppeteer';

// Même navigateur pour les vérifications et les figures. Puppeteer installe
// sa version compatible via browser:install ; un navigateur local reste utilisable.
export async function browserOptions() {
  return {
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || await puppeteer.executablePath(),
    args: [
      '--disable-dev-shm-usage',
      ...(process.env.PUPPETEER_NO_SANDBOX === '1'
        ? ['--no-sandbox', '--disable-setuid-sandbox'] : []),
    ],
  };
}
