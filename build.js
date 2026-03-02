/**
 * Production build: obfuscates client-side JS and copies static assets to dist/.
 * Run: npm run build
 * Then run the server with NODE_ENV=production to serve from dist/.
 *
 * Note: Browser code cannot be fully hidden—the browser must execute it.
 * Obfuscation makes it much harder to read and copy, but determined users can still inspect it.
 */

const fs = require("fs");
const path = require("path");

const SRC = __dirname;
const DIST = path.join(__dirname, "dist");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

async function main() {
  let obfuscate;
  try {
    obfuscate = require("javascript-obfuscator").obfuscate;
  } catch (e) {
    console.error("Run: npm install --save-dev javascript-obfuscator");
    process.exit(1);
  }

  if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true });
  ensureDir(DIST);

  const jsDir = path.join(SRC, "js");
  const distJs = path.join(DIST, "js");
  ensureDir(distJs);

  const obfuscatorOptions = {
    compact: true,
    controlFlowFlattening: false,
    deadCodeInjection: false,
    debugProtection: false,
    disableConsoleOutput: false,
    identifierNamesGenerator: "hexadecimal",
    log: false,
    numbersToExpressions: false,
    renameGlobals: false,
    selfDefending: false,
    simplify: true,
    splitStrings: false,
    stringArray: true,
    stringArrayCallsTransform: false,
    stringArrayEncoding: [],
    stringArrayIndexShift: true,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayWrappersCount: 0,
    stringArrayWrappersChainedCalls: false,
    stringArrayWrappersParametersMaxCount: 2,
    stringArrayWrappersType: "variable",
    stringArrayThreshold: 0.75,
    target: "browser",
    transformObjectKeys: false,
    unicodeEscapeSequence: false,
  };

  const jsFiles = fs.readdirSync(jsDir).filter((f) => f.endsWith(".js"));
  for (const file of jsFiles) {
    const srcPath = path.join(jsDir, file);
    const code = fs.readFileSync(srcPath, "utf8");
    try {
      const result = obfuscate(code, obfuscatorOptions);
      fs.writeFileSync(path.join(distJs, file), result.getObfuscatedCode(), "utf8");
      console.log("  obfuscated js/" + file);
    } catch (err) {
      console.warn("  skip js/" + file + " (obfuscation failed):", err.message);
      fs.writeFileSync(path.join(distJs, file), code, "utf8");
    }
  }

  const htmlFiles = ["index.html", "restaurant-pos.html", "admin.html", "admin-orders.html", "order-history.html"];
  for (const file of htmlFiles) {
    const srcPath = path.join(SRC, file);
    if (fs.existsSync(srcPath)) {
      copyFile(srcPath, path.join(DIST, file));
      console.log("  copied " + file);
    }
  }

  const assets = ["waketech-logo.png"];
  for (const name of assets) {
    const srcPath = path.join(SRC, name);
    if (fs.existsSync(srcPath)) {
      copyFile(srcPath, path.join(DIST, name));
      console.log("  copied " + name);
    }
  }

  console.log("\nBuild complete. Output in dist/");
  console.log("Run with NODE_ENV=production to serve from dist/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
