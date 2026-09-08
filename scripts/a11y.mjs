// Runs axe-core (WCAG 2.0/2.1 A + AA) over every page, logged in as the seed
// admin + a `student@example.com` account. Start the app first and seed the
// DB (`prisma db seed`, or point at the test branch). Reports serious/critical
// violations only.
//   node scripts/a11y.mjs [baseURL]
import { chromium } from "playwright";
import { AxeBuilder } from "@axe-core/playwright";

const BASE = process.argv[2] || "http://localhost:3000";
const browser = await chromium.launch();

async function audit(page, label) {
  const res = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const bad = res.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  if (bad.length === 0) {
    console.log(`  OK  ${label}`);
    return 0;
  }
  console.log(`  !!  ${label} — ${bad.length} serious/critical`);
  for (const v of bad) {
    console.log(`      [${v.impact}] ${v.id}: ${v.help}`);
    for (const n of v.nodes.slice(0, 3)) {
      console.log(`         ${n.target.join(" ")}  ::  ${n.html.slice(0, 110).replace(/\s+/g, " ")}`);
    }
  }
  return bad.length;
}

async function login(ctx, email, pw) {
  const p = await ctx.newPage();
  await p.goto(BASE + "/login", { waitUntil: "domcontentloaded" });
  await p.fill("input[type=email]", email);
  await p.fill("input[type=password]", pw);
  await Promise.all([p.waitForURL(/dashboard/, { timeout: 20000 }).catch(() => {}), p.click("button[type=submit]")]);
  await p.waitForTimeout(1500);
  await p.close();
}

let total = 0;
const pub = await browser.newContext();
console.log("public:");
for (const [path, name] of [
  ["/", "home"], ["/courses", "catalog"],
  ["/courses/grade-10-business-administration", "course-detail"],
  ["/pricing", "pricing"], ["/login", "login"], ["/register", "register"],
  ["/forgot-password", "forgot"], ["/privacy", "privacy"], ["/terms", "terms"],
]) {
  const p = await pub.newPage();
  await p.goto(BASE + path, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(600);
  total += await audit(p, name);
  await p.close();
}
await pub.close();

const stu = await browser.newContext();
await login(stu, "student@example.com", "password123");
console.log("student:");
for (const [path, name] of [["/dashboard/student", "home"], ["/dashboard/student/quizzes", "quizzes"], ["/dashboard/student/tools", "tools"]]) {
  const p = await stu.newPage();
  await p.goto(BASE + path, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(700);
  total += await audit(p, name);
  await p.close();
}
await stu.close();

const adm = await browser.newContext();
await login(adm, "instructor@example.com", "password123");
console.log("admin:");
for (const [path, name] of [
  ["/dashboard/admin", "home"], ["/dashboard/admin/courses", "courses"],
  ["/dashboard/admin/courses/new", "course-new"], ["/dashboard/admin/lessons", "lessons"],
  ["/dashboard/admin/users", "users"], ["/dashboard/admin/prepaid-codes", "codes"],
  ["/dashboard/admin/code-orders", "orders"], ["/dashboard/admin/settings", "settings"],
  ["/dashboard/admin/notifications", "notif"], ["/dashboard/admin/audit", "audit"],
]) {
  const p = await adm.newPage();
  await p.goto(BASE + path, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(700);
  total += await audit(p, name);
  await p.close();
}
await adm.close();

await browser.close();
console.log(`\nTOTAL serious/critical violations: ${total}`);
