import crypto from "crypto";
import fs from "fs";
import path from "path";

type Asset = {
  srcPath: string;
  platformTag: string;
  archiveName: string;
  archiveType: "tar.gz" | "zip";
};

function sha256File(filePath: string): string {
  const hash = crypto.createHash("sha256");
  const data = fs.readFileSync(filePath);
  hash.update(data);
  return hash.digest("hex");
}

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function rmrf(target: string) {
  fs.rmSync(target, { recursive: true, force: true });
}

function run(cmd: string, args: string[], cwd: string) {
  const child = Bun.spawnSync([cmd, ...args], {
    cwd,
    stdout: "inherit",
    stderr: "inherit",
  });
  if (child.exitCode !== 0) {
    throw new Error(
      `Command failed (${child.exitCode}): ${cmd} ${args.join(" ")}`,
    );
  }
}

function inferAssets(binDir: string): Asset[] {
  const entries = fs.readdirSync(binDir, { withFileTypes: true });
  const files = entries
    .filter((e) => e.isFile() && e.name.startsWith("synkrypt-"))
    .map((e) => e.name)
    .sort();

  return files.map((name) => {
    // Expected format: synkrypt-<os>-<arch>
    const platformTag = name.replace(/^synkrypt-/, "");
    const isWindows = name.endsWith(".exe") || platformTag.startsWith("windows-");
    return {
      srcPath: path.join(binDir, name),
      platformTag,
      archiveName: isWindows ? `synkrypt-${platformTag}.zip` : `synkrypt-${platformTag}.tar.gz`,
      archiveType: isWindows ? "zip" : "tar.gz",
    };
  });
}

function makeArchive(asset: Asset, outDir: string, tmpRoot: string) {
  const tmpDir = path.join(tmpRoot, asset.platformTag);
  rmrf(tmpDir);
  ensureDir(tmpDir);

  // Put the binary in the archive as `synkrypt` or `synkrypt.exe` so install instructions are consistent.
  const stagedName = asset.archiveType === "zip" ? "synkrypt.exe" : "synkrypt";
  const stagedBin = path.join(tmpDir, stagedName);
  fs.copyFileSync(asset.srcPath, stagedBin);
  fs.chmodSync(stagedBin, 0o755);

  const outPath = path.join(outDir, asset.archiveName);
  if (fs.existsSync(outPath)) fs.unlinkSync(outPath);

  if (asset.archiveType === "zip") {
    // zip -j <out> <file>
    run("zip", ["-j", outPath, stagedBin], process.cwd());
  } else {
    // tar -czf <out> -C <tmpDir> synkrypt
    run("tar", ["-czf", outPath, "-C", tmpDir, "synkrypt"], process.cwd());
  }

  return outPath;
}

function main() {
  const cliRoot = path.resolve(import.meta.dir, "..");
  const binDir = path.join(cliRoot, "bin");
  const outDir = path.join(cliRoot, "release");
  const tmpRoot = path.join(cliRoot, ".release-tmp");

  if (!fs.existsSync(binDir)) {
    console.error(`Missing bin directory: ${binDir}`);
    process.exit(1);
  }

  ensureDir(outDir);
  ensureDir(tmpRoot);

  const assets = inferAssets(binDir);
  if (assets.length === 0) {
    console.error(
      `No binaries found in ${binDir}. Expected files like synkrypt-linux-x64.`,
    );
    process.exit(1);
  }

  const sums: string[] = [];
  for (const asset of assets) {
    const archivePath = makeArchive(asset, outDir, tmpRoot);
    const sum = sha256File(archivePath);
    const filename = path.basename(archivePath);
    sums.push(`${sum}  ${filename}`);
  }

  fs.writeFileSync(path.join(outDir, "SHA256SUMS.txt"), sums.join("\n") + "\n");
  rmrf(tmpRoot);

  console.log(`Wrote ${assets.length} release archive(s) to ${outDir}`);
  console.log(`Wrote checksums to ${path.join(outDir, "SHA256SUMS.txt")}`);
}

main();
