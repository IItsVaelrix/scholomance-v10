import { spawn } from "node:child_process";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");

const BASE_URL = process.env.VISUAL_BASE_URL || "http://127.0.0.1:4173";
const START_SERVER = !process.env.VISUAL_BASE_URL;
const UPDATE_BASELINE = process.env.VISUAL_UPDATE === "1";

const SNAPSHOT_DIR = path.join(repoRoot, "tests", "visual");
const BASELINE_DIR = path.join(SNAPSHOT_DIR, "baseline");
const CURRENT_DIR = path.join(SNAPSHOT_DIR, "current");
const DIFF_DIR = path.join(SNAPSHOT_DIR, "diff");

const ensureDirs = async () => {
  await mkdir(BASELINE_DIR, { recursive: true });
  await mkdir(CURRENT_DIR, { recursive: true });
  await mkdir(DIFF_DIR, { recursive: true });
};

const waitForServer = async (url, timeoutMs = 30000) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { method: "GET" });
      if (res.ok) return;
    } catch {
      // ignore until timeout
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Timed out waiting for ${url}`);
};

const preparePage = async (page) => {
  await page.setViewport({ width: 1280, height: 720 });
  await page.emulateMediaType("screen");
  await page.emulateMediaFeatures([
    { name: "prefers-color-scheme", value: "dark" },
    { name: "prefers-reduced-motion", value: "reduce" },
  ]);
  await page.evaluateOnNewDocument(() => {
    document.documentElement.dataset.visualTest = "true";
  });
};

const waitForApp = async (page) => {
  await page.waitForSelector("#root", { state: "attached" });
  await page.waitForSelector(".app-shell");
  // Allow a tick for layout to settle after hydration.
  await new Promise((resolve) => setTimeout(resolve, 100));
};

const injectPaletteOverlay = async (page) => {
  await page.addStyleTag({
    content: `
      #visual-palette {
        position: fixed;
        inset: auto 16px 16px 16px;
        display: grid;
        gap: 8px;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        padding: 12px;
        border-radius: 12px;
        background: rgba(12, 12, 24, 0.9);
        box-shadow: 0 10px 30px rgba(0,0,0,0.35);
        z-index: 9999;
      }
      #visual-palette .swatch {
        display: grid;
        grid-template-columns: 64px 1fr;
        align-items: center;
        gap: 10px;
        padding: 8px 10px;
        border-radius: 10px;
        border: 1px solid rgba(255,255,255,0.08);
      }
      #visual-palette .chip {
        width: 64px;
        height: 40px;
        border-radius: 8px;
        box-shadow: inset 0 0 0 1px rgba(255,255,255,0.07);
      }
      #visual-palette .label {
        display: grid;
        gap: 4px;
        font-size: 12px;
        color: rgba(238, 240, 255, 0.9);
      }
      #visual-palette .meta {
        font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
        color: rgba(238,240,255,0.65);
        font-size: 11px;
        letter-spacing: 0.03em;
      }
    `,
  });

  await page.evaluate(() => {
    const existing = document.getElementById("visual-palette");
    if (existing) existing.remove();

    const palette = document.createElement("div");
    palette.id = "visual-palette";

    const schools = [
      { className: "school-void", label: "Void", varName: "--school-accent" },
      { className: "school-psychic", label: "Psychic", varName: "--school-accent" },
      { className: "school-alchemy", label: "Alchemy", varName: "--school-accent" },
      { className: "school-will", label: "Will", varName: "--school-accent" },
      { className: "school-sonic", label: "Sonic", varName: "--school-accent" },
    ];

    const feels = [
      { className: "feel-neutral", label: "Neutral", varName: "--feel-accent" },
      { className: "feel-joy", label: "Joy", varName: "--feel-accent" },
      { className: "feel-sorrow", label: "Sorrow", varName: "--feel-accent" },
      { className: "feel-rage", label: "Rage", varName: "--feel-accent" },
      { className: "feel-fear", label: "Fear", varName: "--feel-accent" },
      { className: "feel-awe", label: "Awe", varName: "--feel-accent" },
      { className: "feel-desire", label: "Desire", varName: "--feel-accent" },
    ];

    const renderGroup = (items, title) => {
      items.forEach(({ className, label, varName }) => {
        const swatch = document.createElement("div");
        swatch.className = `swatch ${className}`;
        const chip = document.createElement("div");
        chip.className = "chip";
        chip.style.background = `var(${varName})`;

        const text = document.createElement("div");
        text.className = "label";
        const heading = document.createElement("div");
        heading.textContent = `${title}: ${label}`;
        const meta = document.createElement("div");
        meta.className = "meta";
        meta.textContent = `${className} · ${varName}`;

        text.appendChild(heading);
        text.appendChild(meta);
        swatch.appendChild(chip);
        swatch.appendChild(text);
        palette.appendChild(swatch);
      });
    };

    renderGroup(schools, "School");
    renderGroup(feels, "Feel");
    document.body.appendChild(palette);
  });
};

const run = async () => {
  await ensureDirs();

  let serverProcess = null;
  if (START_SERVER) {
    serverProcess = spawn(
      "npm",
      ["run", "dev", "--", "--host", "127.0.0.1", "--port", "4173"],
      {
        cwd: repoRoot,
        stdio: "inherit",
        env: { ...process.env, BROWSER: "none" },
      }
    );
    await waitForServer(`${BASE_URL}/read`);
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await preparePage(page);

  const scenes = [
    {
      name: "color-palette",
      path: "/read",
      setup: async () => {
        await injectPaletteOverlay(page);
      },
    },
    {
      name: "read-idle",
      path: "/read",
      setup: async () => {},
    },
    {
      name: "read-highlight",
      path: "/read",
      setup: async () => {
        const scrolls = [
          {
            id: "scroll-visual",
            title: "Visual Scroll",
            content: "The oracle sings in violet ash",
            createdAt: Date.now(),
            updatedAt: Date.now(),
            _version: 1,
          },
        ];
        await page.evaluate((data) => {
          localStorage.setItem("scholomance-scrolls", JSON.stringify(data));
        }, scrolls);
        await page.reload({ waitUntil: "networkidle0" });
      },
    },
    {
      name: "read-annotation",
      path: "/read",
      setup: async () => {
        const scrolls = [
          {
            id: "scroll-annotate",
            title: "Annotation Scroll",
            content: "The cat sat on the mat",
            createdAt: Date.now(),
            updatedAt: Date.now(),
            _version: 1,
          },
        ];
        await page.evaluate((data) => {
          localStorage.setItem("scholomance-scrolls", JSON.stringify(data));
        }, scrolls);
        await page.reload({ waitUntil: "networkidle0" });
        await page.waitForSelector(".editor-word");
        await page.click(".editor-word");
        await page.waitForSelector(".annotation-panel");
      },
    },
  ];

  let failureCount = 0;

  for (const scene of scenes) {
    await page.goto(`${BASE_URL}${scene.path}`, { waitUntil: "networkidle0" });
    await waitForApp(page);
    await scene.setup();
    await waitForApp(page);

    const currentPath = path.join(CURRENT_DIR, `${scene.name}.png`);
    const baselinePath = path.join(BASELINE_DIR, `${scene.name}.png`);
    const diffPath = path.join(DIFF_DIR, `${scene.name}.png`);

    await page.screenshot({ path: currentPath, fullPage: true });

    try {
      await access(baselinePath);
    } catch {
      await writeFile(baselinePath, await readFile(currentPath));
      console.log(`Baseline created: ${scene.name}`);
      continue;
    }

    if (UPDATE_BASELINE) {
      await writeFile(baselinePath, await readFile(currentPath));
      console.log(`Baseline updated: ${scene.name}`);
      continue;
    }

    const baseline = PNG.sync.read(await readFile(baselinePath));
    const current = PNG.sync.read(await readFile(currentPath));
    const { width, height } = baseline;
    const diff = new PNG({ width, height });

    const mismatch = pixelmatch(
      baseline.data,
      current.data,
      diff.data,
      width,
      height,
      { threshold: 0.1 }
    );

    if (mismatch > 0) {
      failureCount += 1;
      await writeFile(diffPath, PNG.sync.write(diff));
      console.log(`Mismatch: ${scene.name} (${mismatch} pixels)`);
    } else {
      console.log(`Match: ${scene.name}`);
    }
  }

  await browser.close();

  if (serverProcess) {
    serverProcess.kill("SIGTERM");
  }

  if (failureCount > 0) {
    process.exitCode = 1;
  }
};

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
