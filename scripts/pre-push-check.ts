import { execSync } from "child_process";

interface CheckStep {
  name: string;
  command: string;
}

const steps: CheckStep[] = [
  { name: "Lint", command: "npm run lint" },
  { name: "Tests", command: "npm run test:run" },
  { name: "Build", command: "npm run build" },
];

function runStep(step: CheckStep): boolean {
  console.log(`\n${"=".repeat(50)}`);
  console.log(`Running: ${step.name}`);
  console.log(`${"=".repeat(50)}\n`);

  try {
    execSync(step.command, { stdio: "inherit" });
    console.log(`\n✓ ${step.name} passed\n`);
    return true;
  } catch {
    console.error(`\n✗ ${step.name} failed\n`);
    return false;
  }
}

function main(): void {
  console.log("\n🚀 Running pre-push quality checks...\n");

  for (const step of steps) {
    if (!runStep(step)) {
      console.error("\n❌ Pre-push checks failed. Push aborted.\n");
      process.exit(1);
    }
  }

  console.log("\n✅ All pre-push checks passed!\n");
}

main();
