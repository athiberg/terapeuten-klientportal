// Minimal stub som gør build grønt.
// Udvidelse til Google/Outlook kan komme senere.
export async function createEventForTherapist(
  _userId: string,
  _startISO: string,
  _endISO: string,
  _title: string,
  _description?: string
) {
  // Her kunne vi kalde Google/Microsoft API baseret på gemte tokens.
  // For nu: no-op.
  return { ok: true }
}
