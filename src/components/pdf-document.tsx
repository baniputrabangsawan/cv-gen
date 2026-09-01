"use client";

import {
  Document, Page, View, Text, Image, Link, StyleSheet,
} from "@react-pdf/renderer";
import type { CVDocument, Locale, SectionId } from "@/types/cv";

const labels: Record<Locale, Record<SectionId, string>> = {
  id: { summary: "PROFIL", experience: "PENGALAMAN", education: "PENDIDIKAN", skills: "KEAHLIAN", awards: "PENGHARGAAN", certifications: "SERTIFIKASI", languages: "BAHASA", projects: "PROYEK", volunteer: "RELAWAN & KOMUNITAS" },
  en: { summary: "PROFILE", experience: "EXPERIENCE", education: "EDUCATION", skills: "SKILLS", awards: "AWARDS", certifications: "CERTIFICATIONS", languages: "LANGUAGES", projects: "PROJECTS", volunteer: "VOLUNTEER & COMMUNITY" },
};

const densityMap = { compact: 0.82, normal: 1, loose: 1.18 } as const;
const normalizeUrl = (url: string) => !url ? "" : /^https?:\/\//i.test(url) ? url : `https://${url}`;
const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const pdfFont = (font: CVDocument["design"]["fontFamily"]) => font === "Times New Roman" ? "Times-Roman" : font === "Arial" ? "Helvetica" : font;

function textUnits(value: string) {
  return Math.max(1, Math.ceil(value.length / 85) + value.split("\n").length - 1);
}

function previewPageHeight(cv: CVDocument) {
  const { content, design } = cv;
  const density = densityMap[design.density];
  let height = design.marginPreset * 5.67 + 92;
  const visible = cv.sectionOrder.filter((id) => !cv.hiddenSections.includes(id));

  for (const id of visible) {
    if (id === "summary" && content.summary) height += 34 + textUnits(content.summary) * 14 * density;
    if (id === "experience") height += content.experience.reduce((total, item) => total + 30 + textUnits(item.description) * 13 * density, 0);
    if (id === "education") height += content.education.reduce((total, item) => total + 30 + textUnits(item.description) * 13 * density, 0);
    if (id === "skills") height += content.skills.reduce((total, item) => total + 25 + Math.ceil(item.items.join(", ").length / 70) * 15 * density, 0);
    if (id === "awards") height += content.awards.reduce((total, item) => total + 30 + textUnits(item.description) * 13 * density, 0);
    if (id === "certifications") height += content.certifications.length * 34 * density;
    if (id === "languages") height += Math.ceil(content.languages.length / 4) * 24 * density;
    if (id === "projects") height += content.projects.reduce((total, item) => total + 28 + textUnits(item.description) * 13 * density, 0);
    if (id === "volunteer") height += content.volunteer.reduce((total, item) => total + 30 + textUnits(item.description) * 13 * density, 0);
  }

  return Math.max(A4_HEIGHT, Math.ceil(height + visible.length * 18));
}

export function CVPdfDocument({ document: cv, locale = "id", preview = false }: { document: CVDocument; locale?: Locale; preview?: boolean }) {
  const { content, design, templateId } = cv;
  const density = densityMap[design.density];
  const base = design.bodySize * design.fontScale / 100;
  const titleSize = design.titleSize * design.fontScale / 100;
  const fontFamily = pdfFont(design.fontFamily);
  const isSerif = fontFamily === "Times-Roman";
  const ink = design.textColor;
  const muted = ink;
  const accent = templateId === "ats" || templateId === "minimal" || templateId === "academic" ? ink : design.accentColor;
  const border = design.borderColor;
  const headerDark = templateId === "professional" || templateId === "creative";
  const headerInk = headerDark ? "#ffffff" : ink;
  const showPhoto = Boolean(content.personal.photo && design.showPhoto && templateId !== "ats" && templateId !== "academic");

  const styles = StyleSheet.create({
    page: {
      backgroundColor: "#ffffff", color: ink, fontFamily: isSerif ? "Times-Roman" : fontFamily,
      fontSize: base, lineHeight: 1.42, paddingTop: design.marginPreset * 2.835,
      paddingBottom: design.marginPreset * 2.835, paddingHorizontal: design.marginPreset * 2.835,
    },
    header: {
      marginHorizontal: headerDark ? -design.marginPreset * 2.835 : 0,
      marginTop: headerDark ? -design.marginPreset * 2.835 : 0,
      paddingHorizontal: headerDark ? design.marginPreset * 2.835 : 0,
      paddingTop: headerDark ? design.marginPreset * 2.2 : 0,
      paddingBottom: headerDark ? design.marginPreset * 1.45 : 14 * density,
      marginBottom: 14 * density,
      backgroundColor: headerDark ? (templateId === "creative" ? accent : "#17323a") : "#ffffff",
      color: headerInk,
      borderBottomWidth: templateId === "modern" ? 3 : templateId === "minimal" ? 0.5 : 0,
      borderBottomColor: templateId === "modern" ? accent : border,
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    },
    headerCopy: { flexGrow: 1, paddingRight: showPhoto ? 16 : 0 },
    name: {
      fontSize: titleSize, fontWeight: "bold", lineHeight: 1.05,
      letterSpacing: templateId === "ats" ? 0 : -0.3, marginBottom: 5,
    },
    role: { fontSize: base * 1.18, color: headerDark ? headerInk : accent, marginBottom: 8, fontWeight: "bold" },
    contact: { flexDirection: "row", flexWrap: "wrap", marginTop: 2 },
    contactItem: { fontSize: base * 0.86, marginRight: 10, marginBottom: 3, color: headerInk },
    photo: { width: 64, height: 64, objectFit: "cover", borderRadius: templateId === "creative" ? 32 : 4 },
    section: { marginBottom: 12 * density },
    sectionTitle: {
      fontSize: base * 0.9, fontWeight: "bold", letterSpacing: 1.25, color: ink,
      marginBottom: 6 * density, paddingBottom: 3,
      borderBottomWidth: templateId === "minimal" ? 0 : 0.65,
      borderBottomColor: templateId === "ats" || templateId === "academic" ? border : accent,
    },
    paragraph: { color: ink, lineHeight: 1.5 },
    item: { marginBottom: 8 * density },
    itemTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    itemMain: { flexGrow: 1, paddingRight: 12 },
    itemTitle: { fontWeight: "bold", fontSize: base * 1.06 },
    itemSubtitle: { color: ink, marginTop: 1 },
    meta: { color: muted, fontSize: base * 0.84, textAlign: "right" },
    description: { marginTop: 3, color: ink, whiteSpace: "pre-wrap" },
    chips: { flexDirection: "row", flexWrap: "wrap" },
    chip: {
      marginRight: 5, marginBottom: 5, paddingVertical: templateId === "ats" ? 0 : 3,
      paddingHorizontal: templateId === "ats" ? 0 : 6,
      backgroundColor: templateId === "ats" || templateId === "minimal" || templateId === "academic" ? "#ffffff" : "#edf7f5",
      borderWidth: templateId === "ats" ? 0 : 0.5, borderColor: border, borderRadius: 2,
    },
    chipSep: { marginRight: 5, color: muted },
    link: { color: ink, textDecoration: "none" },
    headerLink: { color: headerInk, textDecoration: "none" },
    footer: { position: "absolute", bottom: 10, left: 0, right: 0, textAlign: "center", fontSize: 7, color: "#9aa5a2" },
  });

  const contact = [
    content.personal.email, content.personal.phone, content.personal.location,
    content.personal.website, content.personal.linkedin,
  ].filter(Boolean);

  const renderSection = (id: SectionId) => {
    if (cv.hiddenSections.includes(id)) return null;
    let body: React.ReactNode = null;
    if (id === "summary") body = content.summary ? <Text style={styles.paragraph}>{content.summary}</Text> : null;
    if (id === "experience") body = content.experience.map((item) => (
      <View key={item.id} style={styles.item} wrap={false}>
        <View style={styles.itemTop}>
          <View style={styles.itemMain}><Text style={styles.itemTitle}>{item.position}</Text><Text style={styles.itemSubtitle}>{item.company}{item.location ? ` · ${item.location}` : ""}</Text></View>
          <Text style={styles.meta}>{item.startDate}{item.startDate || item.endDate ? " — " : ""}{item.current ? "Sekarang" : item.endDate}</Text>
        </View>
        {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
      </View>
    ));
    if (id === "education") body = content.education.map((item) => (
      <View key={item.id} style={styles.item} wrap={false}>
        <View style={styles.itemTop}><View style={styles.itemMain}><Text style={styles.itemTitle}>{item.degree}</Text><Text style={styles.itemSubtitle}>{item.school}{item.location ? ` · ${item.location}` : ""}</Text></View><Text style={styles.meta}>{item.startDate}{item.startDate || item.endDate ? " — " : ""}{item.endDate}</Text></View>
        {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
      </View>
    ));
    if (id === "skills") body = content.skills.map((item) => <View key={item.id} style={styles.item} wrap={false}><Text style={styles.itemTitle}>{item.name}</Text><View style={styles.chips}>{item.items.map((skill, index) => templateId === "ats" ? <Text key={skill} style={styles.chipSep}>{skill}{index < item.items.length - 1 ? "  •" : ""}</Text> : <Text key={skill} style={styles.chip}>{skill}</Text>)}</View></View>);
    if (id === "awards") body = content.awards.map((item) => <View key={item.id} style={styles.item} wrap={false}><View style={styles.itemTop}><View style={styles.itemMain}><Text style={styles.itemTitle}>{item.title}</Text><Text style={styles.itemSubtitle}>{item.issuer}</Text></View><Text style={styles.meta}>{item.date}</Text></View>{item.description ? <Text style={styles.description}>{item.description}</Text> : null}{item.url ? <Link src={normalizeUrl(item.url)} style={styles.link}>{item.url}</Link> : null}</View>);
    if (id === "languages") body = <View style={styles.chips}>{content.languages.map((item) => <Text key={item.id} style={styles.chip}>{item.name}{item.level ? ` · ${item.level}` : ""}</Text>)}</View>;
    if (id === "projects") body = content.projects.map((item) => <View key={item.id} style={styles.item} wrap={false}><Text style={styles.itemTitle}>{item.name}</Text>{item.url ? <Link src={normalizeUrl(item.url)} style={styles.itemSubtitle}>{item.url}</Link> : null}{item.description ? <Text style={styles.description}>{item.description}</Text> : null}</View>);
    if (id === "certifications") body = content.certifications.map((item) => <View key={item.id} style={styles.item} wrap={false}><View style={styles.itemTop}><View style={styles.itemMain}><Text style={styles.itemTitle}>{item.name}</Text><Text style={styles.itemSubtitle}>{item.issuer}</Text></View><Text style={styles.meta}>{[item.date, item.expiryDate].filter(Boolean).join(" — ")}</Text></View>{item.credentialId ? <Text style={styles.description}>Credential ID: {item.credentialId}</Text> : null}{item.url ? <Link src={normalizeUrl(item.url)} style={styles.link}>{item.url}</Link> : null}</View>);
    if (id === "volunteer") body = content.volunteer.map((item) => <View key={item.id} style={styles.item} wrap={false}><View style={styles.itemTop}><View style={styles.itemMain}><Text style={styles.itemTitle}>{item.role}</Text><Text style={styles.itemSubtitle}>{item.organization}</Text></View><Text style={styles.meta}>{item.startDate}{item.startDate || item.endDate ? " — " : ""}{item.current ? (locale === "id" ? "Sekarang" : "Present") : item.endDate}</Text></View>{item.description ? <Text style={styles.description}>{item.description}</Text> : null}</View>);
    if (!body || (Array.isArray(body) && body.length === 0)) return null;
    return <View key={id} style={styles.section}><Text style={styles.sectionTitle} minPresenceAhead={24}>{(cv.sectionTitles[id] || labels[locale][id]).toUpperCase()}</Text>{body}</View>;
  };

  return (
    <Document title={`${content.personal.fullName || cv.title} — CV`} author={content.personal.fullName || "CVKita"} creator="CVKita" language={locale}>
      <Page size={preview ? [A4_WIDTH, previewPageHeight(cv)] : "A4"} style={styles.page} wrap={!preview}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.name}>{content.personal.fullName || "Nama Lengkap"}</Text>
            <Text style={styles.role}>{content.personal.role || "Posisi / Profesi"}</Text>
            <View style={styles.contact}>
              {contact.map((value) => {
                const href = value.includes("@") ? `mailto:${value}` : value.includes(".") && !value.includes(" ") ? normalizeUrl(value) : "";
                return href ? <Link key={value} src={href} style={[styles.contactItem, styles.headerLink]}>{value}</Link> : <Text key={value} style={styles.contactItem}>{value}</Text>;
              })}
            </View>
          </View>
          {/* React-pdf Image is not an HTML image; it does not expose an alt prop. */}
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          {showPhoto ? <Image src={content.personal.photo!} style={styles.photo} /> : null}
        </View>
        {cv.sectionOrder.map(renderSection)}
        {preview ? null : <Text style={styles.footer} fixed render={({ pageNumber, totalPages }) => totalPages > 1 ? `${pageNumber} / ${totalPages}` : ""} />}
      </Page>
    </Document>
  );
}
