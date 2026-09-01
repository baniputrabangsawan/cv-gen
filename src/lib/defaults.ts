import type { CVDocument, SectionId } from "@/types/cv";

export const DEFAULT_SECTION_ORDER: SectionId[] = [
  "summary", "experience", "education", "skills", "awards", "certifications", "languages", "projects", "volunteer",
];

export const DEFAULT_SECTION_TITLES: Record<SectionId, string> = {
  summary: "Ringkasan Profesional", experience: "Pengalaman Kerja", education: "Pendidikan", skills: "Keahlian",
  awards: "Penghargaan", certifications: "Sertifikasi", languages: "Bahasa", projects: "Proyek", volunteer: "Relawan & Komunitas",
};

export const DEFAULT_DESIGN: CVDocument["design"] = {
  accentColor: "#0f766e", textColor: "#182321", borderColor: "#dfe5e2",
  fontFamily: "Helvetica", fontScale: 100, titleSize: 15, bodySize: 12, marginPreset: 16, density: "normal", showPhoto: true,
};

const uid = () => crypto.randomUUID();

export function createSampleDocument(title = "CV Product Designer"): CVDocument {
  const now = new Date().toISOString();
  return {
    id: uid(), title, createdAt: now, updatedAt: now, schemaVersion: 2, templateId: "modern",
    design: { ...DEFAULT_DESIGN },
    sectionOrder: [...DEFAULT_SECTION_ORDER], hiddenSections: [], sectionTitles: { ...DEFAULT_SECTION_TITLES },
    content: {
      personal: {
        fullName: "Nadia Pratama", role: "Product Designer", email: "nadia@email.com",
        phone: "+6281234567890", location: "Jakarta, Indonesia", website: "nadiapratama.com",
        linkedin: "linkedin.com/in/nadiapratama",
      },
      summary: "Product designer dengan pengalaman 5+ tahun merancang produk digital yang mudah digunakan. Terbiasa bekerja lintas fungsi, menerjemahkan kebutuhan pengguna, dan membawa ide dari riset hingga produk siap pakai.",
      experience: [
        { id: uid(), position: "Senior Product Designer", company: "Ruang Digital", location: "Jakarta", startDate: "2022", endDate: "Sekarang", current: true, description: "Memimpin desain ulang alur onboarding dan meningkatkan aktivasi pengguna sebesar 24%.\nMembangun design system yang digunakan oleh 4 tim produk." },
        { id: uid(), position: "UI/UX Designer", company: "Studio Utama", location: "Bandung", startDate: "2019", endDate: "2022", current: false, description: "Merancang pengalaman web dan mobile untuk produk fintech dan edukasi." },
      ],
      education: [{ id: uid(), degree: "S.Ds. Desain Komunikasi Visual", school: "Institut Teknologi Bandung", location: "Bandung", startDate: "2015", endDate: "2019", description: "Cum laude" }],
      skills: [{ id: uid(), name: "Product Design", items: ["Product Strategy", "User Research", "Figma", "Prototyping", "Design Systems"] }],
      awards: [{ id: uid(), title: "Best Product Experience", issuer: "Indonesia Design Awards", date: "2023", description: "Penghargaan untuk pengalaman produk digital inklusif.", url: "" }],
      languages: [{ id: uid(), name: "Bahasa Indonesia", level: "Native" }, { id: uid(), name: "English", level: "Professional" }],
      projects: [{ id: uid(), name: "Saku — Personal Finance", url: "saku.app", description: "Konsep aplikasi finansial dengan sistem budgeting yang sederhana dan aksesibel." }],
      certifications: [{ id: uid(), name: "Google UX Design", issuer: "Google", date: "2021", expiryDate: "", credentialId: "", url: "" }],
      volunteer: [],
    },
  };
}

export function createBlankDocument(title = "CV Baru"): CVDocument {
  const sample = createSampleDocument(title);
  return {
    ...sample,
    templateId: "ats",
    content: {
      personal: { fullName: "", role: "", email: "", phone: "", location: "", website: "", linkedin: "" },
      summary: "", experience: [], education: [], skills: [], awards: [], languages: [], projects: [], certifications: [], volunteer: [],
    },
  };
}
