// TEMPORARY — one-off check that Sentry is receiving events. Delete after
// confirming the error shows up in the Sentry Issues tab.
export async function GET() {
  throw new Error(`Sentry pipeline check ${new Date().toISOString()}`);
}
