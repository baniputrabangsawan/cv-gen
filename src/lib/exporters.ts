import type { CVDocument, Locale, SectionId } from "@/types/cv";

const line = (value: string) => value.trim();

export function documentToMarkdown(cv: CVDocument, locale: Locale): string {
  const { personal } = cv.content;
  const output = [`# ${line(personal.fullName) || cv.title}`];
  if (personal.role) output.push(`**${line(personal.role)}**`);
  output.push("", [personal.email, personal.phone, personal.location, personal.website, personal.linkedin].filter(Boolean).join(" · "));
  const visible = cv.sectionOrder.filter((id) => !cv.hiddenSections.includes(id));
  const title = (id: SectionId) => cv.sectionTitles[id];
  for (const id of visible) {
    if (id === "summary" && cv.content.summary) output.push("", `## ${title(id)}`, "", cv.content.summary);
    if (id === "experience" && cv.content.experience.length) {
      output.push("", `## ${title(id)}`);
      cv.content.experience.forEach((item) => output.push("", `### ${item.position}${item.company ? ` — ${item.company}` : ""}`, `*${[item.startDate, item.current ? (locale === "id" ? "Sekarang" : "Present") : item.endDate, item.location].filter(Boolean).join(" · ")}*`, item.description));
    }
    if (id === "education" && cv.content.education.length) {
      output.push("", `## ${title(id)}`);
      cv.content.education.forEach((item) => output.push("", `### ${item.degree}${item.school ? ` — ${item.school}` : ""}`, `*${[item.startDate, item.endDate, item.location].filter(Boolean).join(" · ")}*`, item.description));
    }
    if (id === "skills" && cv.content.skills.length) output.push("", `## ${title(id)}`, ...cv.content.skills.map((item) => `- **${item.name}:** ${item.items.join(", ")}`));
    if (id === "awards" && cv.content.awards.length) output.push("", `## ${title(id)}`, ...cv.content.awards.flatMap((item) => ["", `### ${item.title}`, `*${[item.issuer, item.date].filter(Boolean).join(" · ")}*`, item.description]));
    if (id === "certifications" && cv.content.certifications.length) output.push("", `## ${title(id)}`, ...cv.content.certifications.map((item) => `- **${item.name}** — ${[item.issuer, item.date, item.expiryDate, item.credentialId].filter(Boolean).join(" · ")}`));
    if (id === "languages" && cv.content.languages.length) output.push("", `## ${title(id)}`, ...cv.content.languages.map((item) => `- ${item.name}${item.level ? ` — ${item.level}` : ""}`));
    if (id === "projects" && cv.content.projects.length) output.push("", `## ${title(id)}`, ...cv.content.projects.flatMap((item) => ["", `### ${item.name}${item.url ? ` — ${item.url}` : ""}`, item.description]));
    if (id === "volunteer" && cv.content.volunteer.length) output.push("", `## ${title(id)}`, ...cv.content.volunteer.flatMap((item) => ["", `### ${item.role}${item.organization ? ` — ${item.organization}` : ""}`, `*${[item.startDate, item.current ? (locale === "id" ? "Sekarang" : "Present") : item.endDate].filter(Boolean).join(" · ")}*`, item.description]));
  }
  return output.filter((value, index, all) => value !== "" || all[index - 1] !== "").join("\n").trim() + "\n";
}

export function downloadText(content: string, fileName: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
