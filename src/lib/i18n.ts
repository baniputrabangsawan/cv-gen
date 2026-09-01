import type { Locale, SectionId } from "@/types/cv";

export const copy = {
  id: {
    editor: "Editor", preview: "Pratinjau", download: "Unduh PDF", saving: "Menyimpan…", saved: "Tersimpan", saveError: "Gagal menyimpan",
    content: "Konten", design: "Desain", documents: "Dokumen CV", newCv: "CV baru", duplicate: "Gandakan", rename: "Ganti nama", delete: "Hapus",
    backup: "Cadangkan data", restore: "Pulihkan data", template: "Template", accent: "Warna aksen", font: "Font", textSize: "Ukuran teks",
    margin: "Margin", density: "Kepadatan", photo: "Foto profil", uploadPhoto: "Unggah foto", removePhoto: "Hapus foto", sections: "Susunan bagian",
    personal: "Informasi pribadi", fullName: "Nama lengkap", role: "Posisi / profesi", email: "Email", phone: "Telepon", location: "Lokasi",
    website: "Website", linkedin: "LinkedIn", summary: "Ringkasan", experience: "Pengalaman", education: "Pendidikan", skills: "Keahlian",
    awards: "Penghargaan", languages: "Bahasa", projects: "Proyek", certifications: "Sertifikasi", volunteer: "Relawan & Komunitas", add: "Tambah", cancel: "Batal", save: "Simpan", close: "Tutup",
    position: "Posisi", company: "Perusahaan", school: "Institusi", degree: "Program / gelar", start: "Mulai", end: "Selesai", description: "Deskripsi",
    name: "Nama", level: "Tingkat", issuer: "Penerbit", year: "Tahun", link: "Tautan", current: "Masih bekerja di sini", empty: "Belum ada isi",
    confirmDelete: "Hapus CV ini? Tindakan ini tidak dapat dibatalkan.", invalidBackup: "File cadangan tidak valid.", restored: "Data berhasil dipulihkan.",
    zoom: "Zoom", fit: "Pas", compact: "Rapat", normal: "Normal", loose: "Longgar", show: "Tampilkan", hide: "Sembunyikan",
  },
  en: {
    editor: "Editor", preview: "Preview", download: "Download PDF", saving: "Saving…", saved: "Saved", saveError: "Save failed",
    content: "Content", design: "Design", documents: "CV documents", newCv: "New CV", duplicate: "Duplicate", rename: "Rename", delete: "Delete",
    backup: "Back up data", restore: "Restore data", template: "Template", accent: "Accent color", font: "Font", textSize: "Text size",
    margin: "Margin", density: "Density", photo: "Profile photo", uploadPhoto: "Upload photo", removePhoto: "Remove photo", sections: "Section order",
    personal: "Personal information", fullName: "Full name", role: "Role / profession", email: "Email", phone: "Phone", location: "Location",
    website: "Website", linkedin: "LinkedIn", summary: "Summary", experience: "Experience", education: "Education", skills: "Skills",
    awards: "Awards", languages: "Languages", projects: "Projects", certifications: "Certifications", volunteer: "Volunteer & Community", add: "Add", cancel: "Cancel", save: "Save", close: "Close",
    position: "Position", company: "Company", school: "Institution", degree: "Program / degree", start: "Start", end: "End", description: "Description",
    name: "Name", level: "Level", issuer: "Issuer", year: "Year", link: "Link", current: "I currently work here", empty: "Nothing here yet",
    confirmDelete: "Delete this CV? This action cannot be undone.", invalidBackup: "The backup file is invalid.", restored: "Data restored successfully.",
    zoom: "Zoom", fit: "Fit", compact: "Compact", normal: "Normal", loose: "Loose", show: "Show", hide: "Hide",
  },
} as const;

export type Copy = (typeof copy)[Locale];
export const sectionLabel = (id: SectionId, locale: Locale) => copy[locale][id];
