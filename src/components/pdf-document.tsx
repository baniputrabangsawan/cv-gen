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
  const isGlints = templateId === "glints-english" || templateId === "glints-fresh" || templateId === "glints-ats";
  const isAtsLike = templateId === "ats" || templateId === "glints-ats";
  const density = densityMap[design.density];
  const base = design.bodySize * design.fontScale / 100;
  const titleSize = design.titleSize * design.fontScale / 100;
  const fontFamily = pdfFont(design.fontFamily);
  const isSerif = fontFamily === "Times-Roman";
  const ink = design.textColor;
  const muted = ink;
  const accent = isAtsLike || templateId === "minimal" || templateId === "academic" ? ink : design.accentColor;
  const border = design.borderColor;
  const headerDark = templateId === "professional" || templateId === "creative";
  const headerInk = headerDark ? "#ffffff" : ink;
  const showPhoto = Boolean(content.personal.photo && design.showPhoto && !isAtsLike && templateId !== "academic" && !isGlints);
  const showGlintsPhoto = Boolean(content.personal.photo && design.showPhoto && templateId !== "glints-ats");
  const showGlintsPhotoSlot = design.showPhoto && templateId !== "glints-ats";
  const initials = (content.personal.fullName || "CV").split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

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
      paddingBottom: headerDark ? design.marginPreset * 1.45 : isGlints ? 10 * density : 14 * density,
      marginBottom: isGlints ? 18 * density : 14 * density,
      backgroundColor: headerDark ? (templateId === "creative" ? accent : "#17323a") : "#ffffff",
      color: headerInk,
      borderBottomWidth: templateId === "modern" ? 3 : templateId === "minimal" || isGlints ? 0.5 : 0,
      borderBottomColor: templateId === "modern" ? accent : border,
      flexDirection: "row", alignItems: isGlints ? "flex-start" : "center", justifyContent: "space-between",
    },
    headerCopy: { flexGrow: 1, paddingRight: showPhoto ? 16 : 0 },
    name: {
      fontSize: titleSize, fontWeight: "bold", lineHeight: 1.05,
      letterSpacing: isAtsLike ? 0 : isGlints ? 0.7 : -0.3, marginBottom: isGlints ? 7 : 5,
    },
    role: { fontSize: base * (isGlints ? 1 : 1.18), color: headerDark ? headerInk : accent, marginBottom: 8, fontWeight: isGlints ? "normal" : "bold" },
    contact: { flexDirection: "row", flexWrap: "wrap", marginTop: 2 },
    contactItem: { fontSize: base * 0.86, marginRight: 10, marginBottom: 3, color: headerInk },
    photo: { width: 64, height: 64, objectFit: "cover", borderRadius: templateId === "creative" ? 32 : 4 },
    section: { marginBottom: 12 * density },
    sectionTitle: {
      fontSize: base * (isGlints ? 0.82 : 0.9), fontWeight: "bold", letterSpacing: isGlints ? 1.6 : 1.25, color: ink,
      marginBottom: 6 * density, paddingBottom: isGlints ? 4 : 3,
      borderBottomWidth: templateId === "minimal" ? 0 : isGlints ? 1 : 0.65,
      borderBottomColor: isAtsLike || templateId === "academic" || isGlints ? border : accent,
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
      backgroundColor: isAtsLike || templateId === "minimal" || templateId === "academic" || templateId === "glints-fresh" ? "#ffffff" : "#edf7f5",
      borderWidth: isAtsLike ? 0 : 0.5, borderColor: border, borderRadius: isGlints ? 0 : 2,
    },
    chipSep: { marginRight: 5, color: muted },
    link: { color: ink, textDecoration: "none" },
    headerLink: { color: headerInk, textDecoration: "none" },
    footer: { position: "absolute", bottom: 10, left: 0, right: 0, textAlign: "center", fontSize: 7, color: "#9aa5a2" },
    glintsPage: { backgroundColor: "#ffffff", color: ink, fontFamily: isSerif ? "Times-Roman" : fontFamily, fontSize: base, lineHeight: 1.38, padding: 0 },
    glintsFramedPage: { backgroundColor: accent, color: ink, fontFamily: isSerif ? "Times-Roman" : fontFamily, fontSize: base, lineHeight: 1.38, padding: 18 },
    glintsCard: { flexGrow: 1, backgroundColor: "#ffffff" },
    glintsHeader: { padding: 24, borderBottomWidth: 1.2, borderBottomColor: ink },
    glintsEnglishHeader: { padding: 20, backgroundColor: accent, color: "#ffffff" },
    glintsFreshHeader: { padding: 26, backgroundColor: ink, color: "#ffffff" },
    glintsHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    glintsHeaderCopy: { flexGrow: 1, paddingRight: showGlintsPhoto ? 18 : 0 },
    glintsName: { fontSize: titleSize + 5, fontWeight: "bold", letterSpacing: 1.4, textTransform: "uppercase" },
    glintsEnglishName: { fontSize: titleSize + 7, fontWeight: "bold", letterSpacing: 1.5, textTransform: "uppercase", color: "#ffffff" },
    glintsFreshName: { fontSize: titleSize + 5, fontWeight: "bold", letterSpacing: 1.2, textTransform: "uppercase", color: "#ffffff" },
    glintsPhoto: { width: 76, height: 76, objectFit: "cover", borderRadius: 38, borderWidth: 2, borderColor: "#ffffff" },
    glintsFreshPhoto: { width: 80, height: 80, objectFit: "cover", borderRadius: 40, marginBottom: 10, borderWidth: 2, borderColor: "#ffffff" },
    glintsFreshPhotoPlaceholder: { width: 80, height: 80, marginBottom: 10, borderRadius: 40, borderWidth: 2, borderColor: "#ffffff", backgroundColor: "#e9f7f6", alignItems: "center", justifyContent: "center" },
    glintsFreshPhotoInitials: { color: ink, fontSize: 20, fontWeight: "bold" },
    glintsRole: { marginTop: 5, fontSize: base, letterSpacing: 0.8, textTransform: "uppercase" },
    glintsBody: { flexDirection: "row", minHeight: preview ? previewPageHeight(cv) - 94 : A4_HEIGHT - 94 },
    glintsEnglishBody: { flexDirection: "row", minHeight: preview ? previewPageHeight(cv) - 130 : A4_HEIGHT - 130 },
    glintsEnglishSidebar: { width: "34%", padding: 18, backgroundColor: "#f3f4f0", borderRightWidth: 1, borderRightColor: border },
    glintsFreshSidebar: { width: "30%", padding: 18, backgroundColor: "#ffffff", borderRightWidth: 1, borderRightColor: ink },
    glintsMain: { width: "66%", padding: 18 },
    glintsFreshMain: { width: "70%", padding: 18 },
    glintsContact: { marginBottom: 13 },
    glintsContactItem: { marginBottom: 4, fontSize: base * 0.86 },
    glintsSection: { marginBottom: 13 * density },
    glintsSectionTitle: { marginBottom: 6, paddingBottom: 3, borderBottomWidth: 1, borderBottomColor: ink, fontSize: base * 0.84, fontWeight: "bold", letterSpacing: 1.7, textTransform: "uppercase" },
    glintsAtsHeader: { paddingBottom: 7, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: ink, textAlign: "center" },
    glintsAtsName: { fontSize: titleSize + 1, fontWeight: "bold", textTransform: "uppercase" },
    glintsAtsContact: { marginTop: 4, fontSize: base * 0.82 },
    glintsAtsSection: { marginBottom: 8 * density },
    glintsAtsSectionTitle: { marginBottom: 4, paddingBottom: 2, borderBottomWidth: 0.7, borderBottomColor: ink, fontSize: base * 0.82, fontWeight: "bold", letterSpacing: 1, textTransform: "uppercase" },
    glintsEnglishPlainHeader: { paddingBottom: 10, marginBottom: 14, borderBottomWidth: 1, borderBottomColor: ink, alignItems: "center", textAlign: "center" },
    glintsEnglishPlainName: { fontSize: titleSize + 3, fontWeight: "bold", letterSpacing: 1.2, textTransform: "uppercase" },
    glintsEnglishPlainContact: { marginTop: 5, fontSize: base * 0.86 },
  });

  const contact = [
    content.personal.email, content.personal.phone, content.personal.location,
    content.personal.website, content.personal.linkedin,
  ].filter(Boolean);
  const renderOrder = templateId === "glints-fresh"
    ? ["summary", "education", "skills", "projects", "experience", "certifications", "awards", "languages", "volunteer"].filter((id) => cv.sectionOrder.includes(id as SectionId)) as SectionId[]
    : cv.sectionOrder;

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
    if (id === "skills") body = content.skills.map((item) => <View key={item.id} style={styles.item} wrap={false}><Text style={styles.itemTitle}>{item.name}</Text><View style={styles.chips}>{item.items.map((skill, index) => isAtsLike || isGlints ? <Text key={skill} style={styles.chipSep}>{skill}{index < item.items.length - 1 ? "  •" : ""}</Text> : <Text key={skill} style={styles.chip}>{skill}</Text>)}</View></View>);
    if (id === "awards") body = content.awards.map((item) => <View key={item.id} style={styles.item} wrap={false}><View style={styles.itemTop}><View style={styles.itemMain}><Text style={styles.itemTitle}>{item.title}</Text><Text style={styles.itemSubtitle}>{item.issuer}</Text></View><Text style={styles.meta}>{item.date}</Text></View>{item.description ? <Text style={styles.description}>{item.description}</Text> : null}{item.url ? <Link src={normalizeUrl(item.url)} style={styles.link}>{item.url}</Link> : null}</View>);
    if (id === "languages") body = <View style={styles.chips}>{content.languages.map((item) => <Text key={item.id} style={styles.chip}>{item.name}{item.level ? ` · ${item.level}` : ""}</Text>)}</View>;
    if (id === "projects") body = content.projects.map((item) => <View key={item.id} style={styles.item} wrap={false}><Text style={styles.itemTitle}>{item.name}</Text>{item.url ? <Link src={normalizeUrl(item.url)} style={styles.itemSubtitle}>{item.url}</Link> : null}{item.description ? <Text style={styles.description}>{item.description}</Text> : null}</View>);
    if (id === "certifications") body = content.certifications.map((item) => <View key={item.id} style={styles.item} wrap={false}><View style={styles.itemTop}><View style={styles.itemMain}><Text style={styles.itemTitle}>{item.name}</Text><Text style={styles.itemSubtitle}>{item.issuer}</Text></View><Text style={styles.meta}>{[item.date, item.expiryDate].filter(Boolean).join(" — ")}</Text></View>{item.credentialId ? <Text style={styles.description}>Credential ID: {item.credentialId}</Text> : null}{item.url ? <Link src={normalizeUrl(item.url)} style={styles.link}>{item.url}</Link> : null}</View>);
    if (id === "volunteer") body = content.volunteer.map((item) => <View key={item.id} style={styles.item} wrap={false}><View style={styles.itemTop}><View style={styles.itemMain}><Text style={styles.itemTitle}>{item.role}</Text><Text style={styles.itemSubtitle}>{item.organization}</Text></View><Text style={styles.meta}>{item.startDate}{item.startDate || item.endDate ? " — " : ""}{item.current ? (locale === "id" ? "Sekarang" : "Present") : item.endDate}</Text></View>{item.description ? <Text style={styles.description}>{item.description}</Text> : null}</View>);
    if (!body || (Array.isArray(body) && body.length === 0)) return null;
    return <View key={id} style={styles.section}><Text style={styles.sectionTitle} minPresenceAhead={24}>{(cv.sectionTitles[id] || labels[locale][id]).toUpperCase()}</Text>{body}</View>;
  };

  const renderGlintsSection = (id: SectionId, compact = false) => {
    const node = renderSection(id);
    if (!node) return null;
    return <View key={id} style={compact ? styles.glintsSection : styles.section}><Text style={compact ? styles.glintsSectionTitle : styles.sectionTitle}>{(cv.sectionTitles[id] || labels[locale][id]).toUpperCase()}</Text>{node.props.children[1]}</View>;
  };

  if (templateId === "glints-english") {
    const englishOrder: SectionId[] = ["summary", "education", "skills", "experience", "projects", "certifications", "awards", "languages", "volunteer"];
    return <Document title={`${content.personal.fullName || cv.title} — CV`} author={content.personal.fullName || "CVKita"} creator="CVKita" language={locale}>
      <Page size={preview ? [A4_WIDTH, previewPageHeight(cv)] : "A4"} style={[styles.page, { paddingTop: 34, paddingBottom: 34 }]} wrap={!preview}>
        <View style={styles.glintsEnglishPlainHeader}><Text style={styles.glintsEnglishPlainName}>{content.personal.fullName || "Nama Lengkap"}</Text><Text style={styles.glintsRole}>{content.personal.role || "Position / Profession"}</Text><Text style={styles.glintsEnglishPlainContact}>{contact.join("  |  ")}</Text></View>
        {englishOrder.map((id) => renderGlintsSection(id))}
        {preview ? null : <Text style={styles.footer} fixed render={({ pageNumber, totalPages }) => totalPages > 1 ? `${pageNumber} / ${totalPages}` : ""} />}
      </Page>
    </Document>;
  }

  if (templateId === "glints-fresh") {
    const sidebarOrder: SectionId[] = ["skills", "languages", "certifications", "awards"];
    const mainOrder: SectionId[] = ["summary", "education", "projects", "experience", "volunteer"];
    return <Document title={`${content.personal.fullName || cv.title} — CV`} author={content.personal.fullName || "CVKita"} creator="CVKita" language={locale}>
      <Page size={preview ? [A4_WIDTH, previewPageHeight(cv)] : "A4"} style={styles.glintsPage} wrap={!preview}>
        <View style={styles.glintsFreshHeader}>{showGlintsPhoto ? (
          // React-pdf Image is not an HTML image; it does not expose an alt prop.
          // eslint-disable-next-line jsx-a11y/alt-text
          <Image src={content.personal.photo!} style={styles.glintsFreshPhoto} />
        ) : showGlintsPhotoSlot ? <View style={styles.glintsFreshPhotoPlaceholder}><Text style={styles.glintsFreshPhotoInitials}>{initials}</Text></View> : null}<Text style={styles.glintsFreshName}>{content.personal.fullName || "Nama Lengkap"}</Text><Text style={[styles.glintsRole, { color: "#ffffff" }]}>{content.personal.role || "Fresh Graduate"}</Text><Text style={[styles.glintsAtsContact, { marginTop: 8, color: "#ffffff" }]}>{contact.join("  •  ")}</Text></View>
        <View style={styles.glintsBody}>
          <View style={styles.glintsFreshSidebar}>{sidebarOrder.map((id) => renderGlintsSection(id, true))}</View>
          <View style={styles.glintsFreshMain}>{mainOrder.map((id) => renderGlintsSection(id))}</View>
        </View>
      </Page>
    </Document>;
  }

  if (templateId === "glints-ats") {
    return <Document title={`${content.personal.fullName || cv.title} — CV`} author={content.personal.fullName || "CVKita"} creator="CVKita" language={locale}>
      <Page size={preview ? [A4_WIDTH, previewPageHeight(cv)] : "A4"} style={[styles.page, { paddingTop: 28, paddingBottom: 28 }]} wrap={!preview}>
        <View style={styles.glintsAtsHeader}><Text style={styles.glintsAtsName}>{content.personal.fullName || "Nama Lengkap"}</Text><Text style={styles.glintsAtsContact}>{contact.join(" | ")}</Text></View>
        {renderOrder.map((id) => {
          const node = renderSection(id);
          if (!node) return null;
          return <View key={id} style={styles.glintsAtsSection}><Text style={styles.glintsAtsSectionTitle}>{(cv.sectionTitles[id] || labels[locale][id]).toUpperCase()}</Text>{node.props.children[1]}</View>;
        })}
        {preview ? null : <Text style={styles.footer} fixed render={({ pageNumber, totalPages }) => totalPages > 1 ? `${pageNumber} / ${totalPages}` : ""} />}
      </Page>
    </Document>;
  }

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
        {renderOrder.map(renderSection)}
        {preview ? null : <Text style={styles.footer} fixed render={({ pageNumber, totalPages }) => totalPages > 1 ? `${pageNumber} / ${totalPages}` : ""} />}
      </Page>
    </Document>
  );
}
