"use client";

import { type FormEvent, useState } from "react";
import { Mail, Send } from "lucide-react";

import { CONTACT_EMAILS } from "@/lib/constants";

type ContactTopic = "support" | "partnerships" | "legal";

type ContactFormState = {
  name: string;
  email: string;
  topic: ContactTopic;
  subject: string;
  message: string;
};

const topicLabels: Record<ContactTopic, string> = {
  support: "Support",
  partnerships: "Business partnerships",
  legal: "Legal",
};

export function ContactUsForm() {
  const [form, setForm] = useState<ContactFormState>({
    name: "",
    email: "",
    topic: "support",
    subject: "",
    message: "",
  });
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function setField<K extends keyof ContactFormState>(key: K, value: ContactFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitted(false);

    if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || form.message.trim().length < 20) {
      setError("Add your name, email, subject, and a message with at least 20 characters.");
      return;
    }

    const to = CONTACT_EMAILS[form.topic];
    const subject = `[${topicLabels[form.topic]}] ${form.subject.trim()}`;
    const body = [
      `Name: ${form.name.trim()}`,
      `Email: ${form.email.trim()}`,
      `Topic: ${topicLabels[form.topic]}`,
      "",
      form.message.trim(),
    ].join("\n");

    window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSubmitted(true);
  }

  return (
    <form onSubmit={onSubmit} className="bridge-panel p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] border border-cyan-300/25 bg-cyan-300/10 text-cyan-100">
          <Mail size={18} />
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold">Contact form</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            Send the team a structured note. Your email app will open with the message prefilled.
          </p>
        </div>
      </div>

      {error ? (
        <div role="alert" className="mt-5 rounded-[8px] border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {submitted ? (
        <div role="status" className="mt-5 rounded-[8px] border border-emerald-800 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-100">
          Your email draft is ready. Send it from your email app so the CreatorBridge team receives it.
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label>
          <span className="bridge-label">Name</span>
          <input
            value={form.name}
            onChange={(event) => setField("name", event.target.value)}
            className="bridge-input mt-2"
            autoComplete="name"
            required
          />
        </label>
        <label>
          <span className="bridge-label">Email</span>
          <input
            type="email"
            value={form.email}
            onChange={(event) => setField("email", event.target.value)}
            className="bridge-input mt-2"
            autoComplete="email"
            required
          />
        </label>
        <label>
          <span className="bridge-label">Topic</span>
          <select
            value={form.topic}
            onChange={(event) => setField("topic", event.target.value as ContactTopic)}
            className="bridge-input mt-2"
          >
            <option value="support">Support</option>
            <option value="partnerships">Business partnerships</option>
            <option value="legal">Legal</option>
          </select>
        </label>
        <label>
          <span className="bridge-label">Subject</span>
          <input
            value={form.subject}
            onChange={(event) => setField("subject", event.target.value)}
            className="bridge-input mt-2"
            required
          />
        </label>
        <label className="sm:col-span-2">
          <span className="bridge-label">Message</span>
          <textarea
            value={form.message}
            onChange={(event) => setField("message", event.target.value)}
            className="bridge-input mt-2 min-h-40"
            placeholder="Tell us what happened, which account or collaboration it relates to, and what outcome would help."
            required
          />
        </label>
      </div>

      <button type="submit" className="bridge-button-primary mt-5 w-full sm:w-auto">
        <Send size={17} />
        Prepare Email
      </button>
    </form>
  );
}
