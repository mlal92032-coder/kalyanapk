"use client";

import { useEffect, useState } from "react";

const FIELDS = [
  { section: "Business", key: "business_name", label: "Business Name" },
  { section: "Homepage Hero", key: "hero_heading", label: "Hero Heading" },
  { section: "Homepage Hero", key: "hero_subheading", label: "Hero Subheading", textarea: true },
  { section: "Homepage Hero", key: "hero_button_label", label: "Hero Button Label" },
  { section: "Homepage Hero", key: "hero_button_link", label: "Hero Button Link" },
  { section: "Contact", key: "contact_email", label: "Contact Email" },
  { section: "Contact", key: "contact_phone", label: "Contact Phone" },
  { section: "Contact", key: "contact_whatsapp", label: "WhatsApp Number" },
  { section: "Contact", key: "contact_address", label: "Address" },
  { section: "Footer", key: "footer_text", label: "Footer About Text", textarea: true },
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        setSettings(d.settings || {});
        setLoading(false);
      });
  }, []);

  function update(key, value) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    setSettings(data.settings);
    setMessage("Saved. Changes are now live on the public website.");
    setSaving(false);
  }

  if (loading) return <div className="text-neutral-500">Loading…</div>;

  const sections = [...new Set(FIELDS.map((f) => f.section))];

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">Homepage & Settings</h1>
      <p className="text-sm text-neutral-500 mb-6">
        Everything here controls live content on the public website — nothing is hardcoded.
      </p>

      {sections.map((section) => (
        <div key={section} className="bg-white border border-neutral-200 rounded-lg p-6 mb-6 space-y-4">
          <h2 className="font-semibold">{section}</h2>
          {FIELDS.filter((f) => f.section === section).map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-medium mb-1">{f.label}</label>
              {f.textarea ? (
                <textarea
                  rows={3}
                  value={settings[f.key] || ""}
                  onChange={(e) => update(f.key, e.target.value)}
                  className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
                />
              ) : (
                <input
                  value={settings[f.key] || ""}
                  onChange={(e) => update(f.key, e.target.value)}
                  className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
                />
              )}
            </div>
          ))}
        </div>
      ))}

      {message && <div className="text-sm text-emerald-700 mb-4">{message}</div>}

      <button
        onClick={save}
        disabled={saving}
        className="bg-amber-800 text-white px-5 py-2.5 rounded-md text-sm font-medium hover:bg-amber-900 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save Changes"}
      </button>
    </div>
  );
}

