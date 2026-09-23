/** Preserve nested paths so a failed line edit points to the actual input. */
export function validationDetails(error: { issues: Array<{ path: PropertyKey[]; message: string }> }) {
  const fieldErrors: Record<string, string[]> = {}, formErrors: string[] = [];
  for (const issue of error.issues) {
    const key = issue.path.map(String).join('.');
    if (key) (fieldErrors[key] ??= []).push(issue.message); else formErrors.push(issue.message);
  }
  return { fieldErrors, formErrors };
}
