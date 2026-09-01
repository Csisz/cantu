import process from "node:process";
import { evaluateReadiness } from "./readiness-core.mjs";

const production = process.argv.includes("production") || process.argv.includes("--production") || process.env.CANTU_READINESS_PRODUCTION === "1";
const results = evaluateReadiness({ root: process.cwd(), env: process.env, production });
for (const result of results) process.stdout.write(`${result.level}  ${result.message}\n`);
const counts = Object.fromEntries(["PASS", "WARN", "BLOCK"].map((level) => [level, results.filter((item) => item.level === level).length]));
process.stdout.write(`\nPASS ${counts.PASS} · WARN ${counts.WARN} · BLOCK ${counts.BLOCK}\n`);
if (counts.BLOCK) process.exitCode = 1;
