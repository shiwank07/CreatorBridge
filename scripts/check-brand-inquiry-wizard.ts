import { readFileSync } from "node:fs";
import { join } from "node:path";

const sourcePath = join(process.cwd(), "components", "forms", "brand-inquiry-form.tsx");
const source = readFileSync(sourcePath, "utf8");
const failures: string[] = [];

function check(condition: boolean, message: string) {
  if (!condition) failures.push(message);
}

const submitStart = source.indexOf("async function onSubmit");
const fetchStart = source.indexOf('fetch("/api/brand-inquiries"');
const finalIntentGuard = source.indexOf("if (!finalSubmitRequestedRef.current || !isFinalStep || success)");
const inFlightGuard = source.indexOf("if (submitInFlightRef.current || isSaving) return;");
const continueButton = source.indexOf('<button type="button" onClick={goNext} disabled={isSaving}');
const finalSubmitIntent = source.indexOf("finalSubmitRequestedRef.current = true;");

check(submitStart >= 0, "Brand inquiry wizard must define an onSubmit handler.");
check(fetchStart > submitStart, "Brand inquiry API request must only live inside onSubmit.");
check(finalIntentGuard > submitStart && finalIntentGuard < fetchStart, "Submitting must require an explicit final submit intent before the API request.");
check(inFlightGuard > finalIntentGuard && inFlightGuard < fetchStart, "Submitting must be guarded against duplicate in-flight requests before the API request.");
check(finalSubmitIntent > fetchStart, "Only the final confirmation button should set the submit intent.");
check(continueButton >= 0, "The wizard Continue button must be type=\"button\" and call goNext.");
check(!/\buseEffect\b/.test(source), "Brand inquiry wizard must not use mount/state side effects that could auto-submit on review step entry.");

if (failures.length > 0) {
  console.error("Brand inquiry wizard regression check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Brand inquiry wizard regression check passed.");
