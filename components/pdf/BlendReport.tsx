'use client'

import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from '@react-pdf/renderer'
import type { BlendDetail } from '@/types'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#292524',
    padding: 48,
    backgroundColor: '#fafaf9',
  },
  header: {
    marginBottom: 24,
    borderBottom: '1.5pt solid #d6d3d1',
    paddingBottom: 16,
  },
  brand: {
    fontSize: 9,
    color: '#78716c',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#1c1917',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 9,
    color: '#78716c',
  },
  authorLine: {
    fontSize: 9,
    color: '#78716c',
    marginTop: 2,
  },
  aboutText: {
    fontSize: 10,
    color: '#44403c',
    marginTop: 8,
    lineHeight: 1.5,
  },
  notesBox: {
    marginBottom: 16,
    padding: 10,
    backgroundColor: '#fef3c7',
    borderRadius: 4,
  },
  notesLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#92400e',
    marginBottom: 4,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  notesText: {
    fontSize: 9,
    color: '#78350f',
    lineHeight: 1.5,
  },
  gradeBadge: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  gradeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#d1fae5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeText: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#065f46',
  },
  gradeSummary: {
    fontSize: 9,
    color: '#44403c',
    flex: 1,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#44403c',
    marginBottom: 8,
    borderBottom: '0.5pt solid #e7e5e4',
    paddingBottom: 4,
  },
  table: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f4',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderBottom: '0.5pt solid #f5f5f4',
  },
  tableColOil: { flex: 3, fontSize: 9 },
  tableColNum: { flex: 1, textAlign: 'right', fontSize: 9 },
  tableHeaderText: { fontFamily: 'Helvetica-Bold', fontSize: 8, color: '#78716c' },
  oilCard: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#f5f5f4',
    borderRadius: 4,
  },
  oilCardName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: '#1c1917',
    marginBottom: 2,
  },
  bullet: {
    fontSize: 8,
    color: '#57534e',
    marginLeft: 8,
    marginTop: 1,
  },
  pairingRow: {
    flexDirection: 'row',
    marginBottom: 4,
    gap: 6,
  },
  pairingName: { flex: 2, fontSize: 8, color: '#44403c' },
  pairingRating: { flex: 1, fontSize: 8 },
  pairingReason: { flex: 3, fontSize: 8, color: '#57534e' },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 48,
    right: 48,
    borderTop: '0.5pt solid #e7e5e4',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: { fontSize: 7, color: '#a8a29e' },
  qrSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  qrUrl: {
    fontSize: 8,
    color: '#78716c',
    marginTop: 4,
  },
})

const GRADE_COLORS: Record<string, string> = {
  A: '#d1fae5',
  B: '#fef3c7',
  C: '#ffedd5',
  F: '#fee2e2',
}

const GRADE_TEXT_COLORS: Record<string, string> = {
  A: '#065f46',
  B: '#92400e',
  C: '#7c2d12',
  F: '#991b1b',
}

interface BlendReportProps {
  blend: BlendDetail
  baseUrl: string
  qrDataUrl?: string
}

export function BlendReport({ blend, baseUrl, qrDataUrl }: BlendReportProps) {
  const shareUrl = `${baseUrl}/blend/${blend.id}`
  const date = new Date(blend.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const essentials = blend.ingredients.filter((i) => i.oilType === 'ESSENTIAL')
  const carriers = blend.ingredients.filter((i) => i.oilType === 'CARRIER')
  const notablePairings = blend.pairings.filter((p) => p.rating !== 'GOOD')

  return (
    <Document title={`${blend.name} — Potions & Lotions`} author="Potions & Lotions">
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brand}>Potions &amp; Lotions</Text>
          <Text style={styles.title}>{blend.name}</Text>
          <Text style={styles.subtitle}>
            Created {date} · {blend.totalVolumeMl}ml · {(blend.dilutionRate * 100).toFixed(0)}% dilution
          </Text>
          {blend.authorName && (
            <Text style={styles.authorLine}>by {blend.authorName}</Text>
          )}
          {blend.about && (
            <Text style={styles.aboutText}>{blend.about}</Text>
          )}
          <View style={styles.gradeBadge}>
            <View
              style={[
                styles.gradeCircle,
                { backgroundColor: GRADE_COLORS[blend.grade] ?? '#f5f5f4' },
              ]}
            >
              <Text style={[styles.gradeText, { color: GRADE_TEXT_COLORS[blend.grade] ?? '#44403c' }]}>
                {blend.grade}
              </Text>
            </View>
            <Text style={styles.gradeSummary}>
              {blend.grade === 'A'
                ? 'Excellent blend — all pairings are compatible.'
                : blend.grade === 'B'
                ? 'Good blend — some pairings have notes worth reading.'
                : blend.grade === 'C'
                ? 'Fair blend — review the pairing warnings below.'
                : 'Review required.'}
            </Text>
          </View>
        </View>

        {/* Quantities table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ingredients &amp; Quantities</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableColOil, styles.tableHeaderText]}>Oil</Text>
              <Text style={[styles.tableColNum, styles.tableHeaderText]}>%</Text>
              <Text style={[styles.tableColNum, styles.tableHeaderText]}>ml</Text>
              <Text style={[styles.tableColNum, styles.tableHeaderText]}>drops</Text>
            </View>
            {[...carriers, ...essentials].map((i) => (
              <View key={i.oilId} style={styles.tableRow}>
                <Text style={styles.tableColOil}>
                  {i.oilName} ({i.oilType === 'CARRIER' ? 'carrier' : 'EO'})
                </Text>
                <Text style={styles.tableColNum}>
                  {((i.volumeMl / blend.totalVolumeMl) * 100).toFixed(1)}%
                </Text>
                <Text style={styles.tableColNum}>{i.volumeMl.toFixed(2)}</Text>
                <Text style={styles.tableColNum}>{i.oilType === 'ESSENTIAL' ? i.drops : '—'}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Oil benefits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Oil Profiles</Text>
          {blend.ingredients.map((i) => (
            <View key={i.oilId} style={styles.oilCard}>
              <Text style={styles.oilCardName}>
                {i.oilName}
                {i.oilType === 'CARRIER' ? ' (carrier)' : ''}
              </Text>
              {i.benefits.slice(0, 3).map((b, idx) => (
                <Text key={idx} style={styles.bullet}>• {b}</Text>
              ))}
              {i.contraindications.length > 0 && (
                <Text style={[styles.bullet, { color: '#b45309' }]}>
                  ⚠ {i.contraindications[0]}
                </Text>
              )}
            </View>
          ))}
        </View>

        {/* Pairing notes */}
        {notablePairings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pairing Notes</Text>
            {notablePairings.map((p) => (
              <View key={`${p.oilAId}-${p.oilBId}`} style={styles.pairingRow}>
                <Text style={styles.pairingName}>{p.oilAName} + {p.oilBName}</Text>
                <Text style={styles.pairingRating}>{p.rating}</Text>
                <Text style={styles.pairingReason}>{p.reason}</Text>
              </View>
            ))}
          </View>
        )}

        {/* User notes */}
        {blend.notes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{blend.notes}</Text>
          </View>
        )}

        {/* QR code + share URL */}
        <View style={styles.qrSection}>
          {qrDataUrl && (
            <Image src={qrDataUrl} style={{ width: 80, height: 80 }} />
          )}
          <Text style={styles.qrUrl}>Scan to open blend · {shareUrl}</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Always patch test. Not medical advice.</Text>
          <Text style={styles.footerText}>Potions &amp; Lotions · {shareUrl}</Text>
        </View>
      </Page>
    </Document>
  )
}
