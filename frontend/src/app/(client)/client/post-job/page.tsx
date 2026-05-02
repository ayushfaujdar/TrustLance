"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import api from "@/lib/api";
import toast from "react-hot-toast";

type Milestone = { title: string; amount: string; description: string };

const CATEGORIES = [
  "Web Development", "Mobile App", "UI/UX Design", "Graphic Design",
  "Content Writing", "Video Editing", "Data Entry", "SEO",
  "Digital Marketing", "Other",
];

const SKILLS = [
  "React", "Next.js", "Node.js", "Python", "TypeScript", "Figma",
  "MongoDB", "PostgreSQL", "AWS", "Docker", "Flutter", "Swift",
  "WordPress", "Shopify", "After Effects", "Photoshop",
];

export default function PostJobPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([
    { title: "", amount: "", description: "" },
  ]);

  const toggleSkill = (skill: string) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const addMilestone = () => {
    setMilestones((prev) => [...prev, { title: "", amount: "", description: "" }]);
  };

  const removeMilestone = (index: number) => {
    if (milestones.length > 1) {
      setMilestones((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const updateMilestone = (index: number, field: keyof Milestone, value: string) => {
    setMilestones((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  };

  const totalMilestoneAmount = milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);

  const handleSubmit = async () => {
    if (!title.trim()) return toast.error("Add a project title");
    if (!description.trim()) return toast.error("Add a description");
    if (!category) return toast.error("Select a category");
    if (!budget || parseFloat(budget) < 10) return toast.error("Minimum budget is ₹10");

    const validMilestones = milestones.filter((m) => m.title.trim() && m.amount);
    if (validMilestones.length === 0) return toast.error("Add at least one milestone");

    setIsLoading(true);
    try {
      await api.post("/jobs", {
        title: title.trim(),
        description: description.trim(),
        category,
        budget: parseFloat(budget),
        deadline: deadline || undefined,
        skills,
        milestones: validMilestones.map((m) => ({
          title: m.title.trim(),
          amount: parseFloat(m.amount),
          description: m.description.trim(),
        })),
      });
      toast.success("Job posted successfully!");
      router.push("/client/dashboard");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || "Failed to post job");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardShell role="client">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-display">Post a New Job</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-ink-3)" }}>
            Describe your project and set milestones for secure escrow payments
          </p>
        </div>

        <div className="space-y-6">
          {/* Title */}
          <div className="card">
            <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--color-ink-3)" }}>
              Project Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Build a React dashboard for my SaaS"
              className="input-field"
              maxLength={120}
            />
            <p className="text-xs mt-1.5" style={{ color: "var(--color-ink-3)" }}>{title.length}/120</p>
          </div>

          {/* Description */}
          <div className="card">
            <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--color-ink-3)" }}>
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the project scope, requirements, and expected deliverables..."
              className="input-field !min-h-[160px] resize-y"
              maxLength={5000}
            />
            <p className="text-xs mt-1.5" style={{ color: "var(--color-ink-3)" }}>{description.length}/5000</p>
          </div>

          {/* Category & Budget */}
          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--color-ink-3)" }}>
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input-field"
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--color-ink-3)" }}>
                  Budget (₹) *
                </label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="10"
                  min={10}
                  className="input-field"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--color-ink-3)" }}>
                Deadline (optional)
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="input-field max-w-xs"
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>

          {/* Skills */}
          <div className="card">
            <label className="text-xs font-semibold uppercase tracking-wider mb-3 block" style={{ color: "var(--color-ink-3)" }}>
              Required Skills
            </label>
            <div className="flex flex-wrap gap-2">
              {SKILLS.map((skill) => (
                <button
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150"
                  style={{
                    borderColor: skills.includes(skill) ? "var(--color-primary)" : "var(--color-border)",
                    backgroundColor: skills.includes(skill) ? "var(--color-primary-lt)" : "white",
                    color: skills.includes(skill) ? "var(--color-primary)" : "var(--color-ink-3)",
                  }}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          {/* Milestones */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider block" style={{ color: "var(--color-ink-3)" }}>
                  Milestones *
                </label>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-ink-3)" }}>
                  Break your project into funded milestones
                </p>
              </div>
              {budget && totalMilestoneAmount > 0 && (
                <span
                  className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg"
                  style={{
                    backgroundColor: totalMilestoneAmount === parseFloat(budget) ? "var(--color-primary-lt)" : "var(--color-danger-lt)",
                    color: totalMilestoneAmount === parseFloat(budget) ? "var(--color-primary)" : "var(--color-danger)",
                  }}
                >
                  ₹{totalMilestoneAmount.toLocaleString("en-IN")} / ₹{parseFloat(budget).toLocaleString("en-IN")}
                </span>
              )}
            </div>

            <div className="space-y-4">
              {milestones.map((m, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl border"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold" style={{ color: "var(--color-ink-3)" }}>
                      Milestone {index + 1}
                    </span>
                    {milestones.length > 1 && (
                      <button
                        onClick={() => removeMilestone(index)}
                        className="text-xs font-medium"
                        style={{ color: "var(--color-danger)" }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <input
                        type="text"
                        value={m.title}
                        onChange={(e) => updateMilestone(index, "title", e.target.value)}
                        placeholder="Milestone title"
                        className="input-field !text-sm"
                      />
                    </div>
                    <input
                      type="number"
                      value={m.amount}
                      onChange={(e) => updateMilestone(index, "amount", e.target.value)}
                      placeholder="₹ Amount"
                      className="input-field !text-sm"
                      min={10}
                    />
                  </div>
                  <textarea
                    value={m.description}
                    onChange={(e) => updateMilestone(index, "description", e.target.value)}
                    placeholder="What will be delivered in this milestone?"
                    className="input-field !text-sm !min-h-[60px] mt-3 resize-y"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={addMilestone}
              className="mt-4 flex items-center gap-2 text-sm font-semibold"
              style={{ color: "var(--color-primary)" }}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Milestone
            </button>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => router.back()}
              className="btn-outline !py-3 !px-6"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="btn-primary !py-3 !px-8 disabled:opacity-50"
            >
              {isLoading ? "Posting..." : "Post Job →"}
            </button>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
