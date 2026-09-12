import getDb from "./db";

export function getAllSettings() {
  const db = getDb();
  const rows = db.prepare("SELECT key, value FROM settings").all();
  const map = {};
  for (const row of rows) map[row.key] = row.value;
  return map;
}

export function setSettings(updates) {
  const db = getDb();
  const upsert = db.prepare(
    `INSERT INTO settings (key, value) VALUES (@key, @value)
     ON CONFLICT(key) DO UPDATE SET value = @value`
  );
  const tx = db.transaction((entries) => {
    for (const [key, value] of entries) upsert.run({ key, value: value ?? "" });
  });
  tx(Object.entries(updates));
  return getAllSettings();
}
