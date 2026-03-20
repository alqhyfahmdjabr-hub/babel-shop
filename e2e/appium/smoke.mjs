import fs from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { remote } from "webdriverio";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");

function env(name, fallback) {
  const value = process.env[name];
  return value == null || value === "" ? fallback : value;
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function waitForPortOpen({ host, port, timeoutMs }) {
  const deadline = Date.now() + timeoutMs;

  // Poll port-connectability. Appium is ready once it accepts TCP connections.
  while (Date.now() < deadline) {
    // eslint-disable-next-line no-await-in-loop
    const isOpen = await new Promise((resolve) => {
      const socket = new net.Socket();

      const done = (result) => {
        socket.removeAllListeners();
        try {
          socket.destroy();
        } catch {
          // ignore
        }
        resolve(result);
      };

      socket.once("connect", () => done(true));
      socket.once("error", () => done(false));
      socket.setTimeout(750, () => done(false));
      socket.connect(port, host);
    });

    if (isOpen) return;

    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, 300));
  }

  throw new Error(
    `Appium server not reachable at ${host}:${port}. Start it, then re-run this command.`
  );
}

const host = env("APPIUM_HOST", "127.0.0.1");
const port = Number(env("APPIUM_PORT", "4723"));
const basePath = env("APPIUM_BASE_PATH", "/");

const apkPath = path.resolve(
  repoRoot,
  env("APK_PATH", "android/app/build/outputs/apk/debug/app-debug.apk")
);

if (!(await fileExists(apkPath))) {
  console.error(`APK not found at: ${apkPath}`);
  console.error(
    "Build it first (example): cd android; ./gradlew assembleDebug"
  );
  process.exit(1);
}

await waitForPortOpen({ host, port, timeoutMs: 30_000 });

const capabilities = {
  platformName: "Android",
  "appium:automationName": env("APPIUM_AUTOMATION_NAME", "UiAutomator2"),
  "appium:deviceName": env("DEVICE_NAME", "Android Emulator"),
  "appium:app": apkPath,
  "appium:autoGrantPermissions": true,
  "appium:newCommandTimeout": 120,
  "appium:appWaitActivity": env("APP_WAIT_ACTIVITY", "*"),
};

if (process.env.UDID) capabilities["appium:udid"] = process.env.UDID;

let driver;
try {
  driver = await remote({
    hostname: host,
    port,
    path: basePath,
    logLevel: env("WDIO_LOG_LEVEL", "info"),
    capabilities,
  });

  // Give the app a moment to render. We keep this simple for a smoke test.
  await driver.pause(4000);

  const outDir = path.resolve(repoRoot, "test-results", "appium");
  await fs.mkdir(outDir, { recursive: true });

  const screenshot = await driver.takeScreenshot();
  const outFile = path.join(outDir, `smoke-${Date.now()}.png`);
  await fs.writeFile(outFile, screenshot, "base64");

  console.log(`Smoke test OK. Screenshot: ${outFile}`);
} finally {
  if (driver) {
    try {
      await driver.deleteSession();
    } catch {
      // Best-effort cleanup. If the session is already gone, ignore.
    }
  }
}

