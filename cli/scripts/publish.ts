import fs from "fs";
import path from "path";

function run(cmd: string, args: string[], cwd: string) {
  console.log(`\nRunning: ${cmd} ${args.join(" ")}`);
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

async function main() {
  const cliRoot = path.resolve(import.meta.dir, "..");
  const pkgPath = path.join(cliRoot, "package.json");

  // 1. Read and increment version
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const versionParts = pkg.version.split(".").map(Number);

  if (versionParts.length !== 3 || versionParts.some(isNaN)) {
    throw new Error(`Invalid version format in package.json: ${pkg.version}`);
  }

  const oldVersion = pkg.version;
  versionParts[2]++; // Increment patch
  const newVersion = versionParts.join(".");
  pkg.version = newVersion;

  console.log(`Bumping version: ${oldVersion} -> ${newVersion}`);
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

  const tag = `v${newVersion}`;

  try {
    // 2. Compile binaries
    console.log(`\nCompiling binaries...`);
    run("bun", ["run", "compile:all"], cliRoot);

    // 3. Package assets
    console.log(`\nPackaging assets...`);
    run("bun", ["run", "release:assets"], cliRoot);

    // 4. Create GitHub Release
    console.log(`\nCreating GitHub Release ${tag}...`);
    run(
      "gh",
      [
        "release",
        "create",
        tag,
        "--title",
        tag,
        "--notes",
        `Synkrypt CLI binaries for ${tag}`,
      ],
      cliRoot,
    );

    // 5. Upload Assets
    console.log(`\nUploading assets...`);
    const releaseDir = path.join(cliRoot, "release");
    const assets = fs
      .readdirSync(releaseDir)
      .map((file) => path.join(releaseDir, file));
    run("gh", ["release", "upload", tag, ...assets, "--clobber"], cliRoot);

    // // 6. Publish to npm
    // console.log(`\nPublishing to npm...`);
    // // Attempt to find npm/node in common paths if not in PATH
    // const npmPath = fs.existsSync("/opt/homebrew/bin/npm")
    //   ? "/opt/homebrew/bin/npm"
    //   : "npm";

    // try {
    //   // Check if logged in first
    //   run(npmPath, ["whoami"], cliRoot);
    //   run(npmPath, ["publish", "--access", "public"], cliRoot);
    //   console.log(`\nSuccessfully published ${tag} to npm!`);
    // } catch (npmErr: any) {
    //   console.error(`\nnpm publication failed: ${npmErr.message}`);
    //   console.log(`Please ensure you are logged in via 'npm login' before running this script.`);
    // }

    console.log(`\nSuccessfully published ${tag} to GitHub!`);
  } catch (err: any) {
    console.error(`\nPublish failed: ${err.message}`);
    // Optional: Revert package.json on failure?
    // fs.writeFileSync(pkgPath, JSON.stringify({...pkg, version: oldVersion}, null, 2) + "\n");
    process.exit(1);
  }
}

main();
