import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import type { SpecialistDiagnosticReport } from '@/lib/diagnostics/types';
import { healthLabelEs } from '@/lib/design/tokens';
import { APP_NAME, APP_TAGLINE } from '@/lib/constants/app-brand';
import { auraPdfStyles as s, AURA_PDF } from '@/lib/reports/aura-pdf-theme';

function BulletList({ items }: { items: string[] }) {
  if (!items.length) {
    return <Text style={s.paragraph}>—</Text>;
  }
  return (
    <View>
      {items.map((item, idx) => (
        <View key={`${idx}-${item.slice(0, 24)}`} style={s.bullet}>
          <Text style={s.bulletDot}>•</Text>
          <Text style={s.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function ReportFooter({ report }: { report: SpecialistDiagnosticReport }) {
  const date = new Date(report.generatedAt).toLocaleString('es-AR');
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>
        {APP_NAME} · {APP_TAGLINE}
      </Text>
      <Text style={s.footerText}>
        {report.reportId} · {date}
      </Text>
    </View>
  );
}

function FindingBadge({ text }: { text: string }) {
  return (
    <View style={s.badgeWrap}>
      <Text style={s.badgeText}>{text}</Text>
    </View>
  );
}

export function DiagnosticPdfDocument({ report }: { report: SpecialistDiagnosticReport }) {
  const generated = new Date(report.generatedAt).toLocaleString('es-AR');
  const healthLabel = healthLabelEs[report.overallHealth];

  return (
    <Document
      title={`Informe fitosanitario — ${report.fieldName}`}
      author={APP_NAME}
      subject="Diagnóstico especialista Aura Agro"
    >
      <Page size="A4" style={s.page}>
        <View style={s.headerBar}>
          <View style={s.brandRow}>
            <View>
              <Text style={s.brandTitle}>AURA AGRO</Text>
              <Text style={s.brandTagline}>{APP_TAGLINE}</Text>
            </View>
            <View>
              <Text style={s.reportType}>INFORME FITOSANITARIO</Text>
              <Text style={s.reportId}>{report.reportId}</Text>
            </View>
          </View>
        </View>

        <Text style={s.sectionTitle}>1. Resumen ejecutivo</Text>
        <Text style={s.paragraph}>{report.executiveSummary}</Text>

        <View style={s.kpiRow}>
          <View style={s.kpiBox}>
            <Text style={s.kpiLabel}>Salud integral</Text>
            <Text style={s.kpiValue}>{healthLabel}</Text>
          </View>
          <View style={s.kpiBoxSpaced}>
            <Text style={s.kpiLabel}>Índice / Riesgo</Text>
            <Text style={s.kpiValue}>
              {report.healthScore} · R{report.riskScore}
            </Text>
          </View>
          <View style={s.kpiBoxSpaced}>
            <Text style={s.kpiLabel}>Confianza IA</Text>
            <Text style={s.kpiValue}>{Math.round(report.confidence)}%</Text>
          </View>
        </View>

        <Text style={s.sectionTitle}>2. Datos del muestreo</Text>
        <View style={s.metaGrid}>
          <View style={s.metaCell}>
            <Text style={s.metaLabel}>Organización</Text>
            <Text style={s.metaValue}>{report.orgName}</Text>
          </View>
          <View style={s.metaCell}>
            <Text style={s.metaLabel}>Fecha de emisión</Text>
            <Text style={s.metaValue}>{generated}</Text>
          </View>
          <View style={s.metaCell}>
            <Text style={s.metaLabel}>Lote / Parcela</Text>
            <Text style={s.metaValue}>{report.fieldName}</Text>
          </View>
          <View style={s.metaCell}>
            <Text style={s.metaLabel}>Zona de manejo</Text>
            <Text style={s.metaValue}>{report.zoneName}</Text>
          </View>
          <View style={s.metaCell}>
            <Text style={s.metaLabel}>Cultivo</Text>
            <Text style={s.metaValue}>{report.cropLabel}</Text>
          </View>
          {report.coordinates ? (
            <View style={s.metaCell}>
              <Text style={s.metaLabel}>Coordenadas GPS</Text>
              <Text style={s.metaValue}>
                {report.coordinates.lat.toFixed(5)}, {report.coordinates.lng.toFixed(5)}
              </Text>
            </View>
          ) : null}
        </View>

        <Text style={s.sectionTitle}>3. Metodología</Text>
        <BulletList items={report.methodology} />

        <Text style={s.sectionTitle}>4. Evaluación visual (IA)</Text>
        <Text style={s.paragraph}>
          Color foliar: {report.visualAssessment.leafColor} · Manchas:{' '}
          {report.visualAssessment.spotting ? 'Sí' : 'No'} · Marchitez:{' '}
          {report.visualAssessment.wilt ? 'Sí' : 'No'} · Necrosis:{' '}
          {report.visualAssessment.necrosis ? 'Sí' : 'No'}
        </Text>
        <Text style={s.paragraph}>
          Humedad foliar: {report.visualAssessment.moistureStatus} · Nutrición:{' '}
          {report.visualAssessment.nutritionStatus}
        </Text>

        <ReportFooter report={report} />
      </Page>

      <Page size="A4" style={s.page}>
        <View style={s.headerBarCompact}>
          <Text style={s.headerCompactTitle}>AURA AGRO — Correlación satelital</Text>
        </View>

        <Text style={s.sectionTitle}>5. Índices Copernicus</Text>
        <View style={s.metaGrid}>
          {report.satellite.ndvi != null ? (
            <View style={s.metaCell}>
              <Text style={s.metaLabel}>NDVI</Text>
              <Text style={s.metaValue}>{report.satellite.ndvi.toFixed(3)}</Text>
            </View>
          ) : null}
          {report.satellite.ndmi != null ? (
            <View style={s.metaCell}>
              <Text style={s.metaLabel}>NDMI</Text>
              <Text style={s.metaValue}>{report.satellite.ndmi.toFixed(3)}</Text>
            </View>
          ) : null}
          {report.satellite.ndre != null ? (
            <View style={s.metaCell}>
              <Text style={s.metaLabel}>NDRE</Text>
              <Text style={s.metaValue}>{report.satellite.ndre.toFixed(3)}</Text>
            </View>
          ) : null}
          {report.satellite.lst != null ? (
            <View style={s.metaCell}>
              <Text style={s.metaLabel}>LST (Sentinel-3)</Text>
              <Text style={s.metaValue}>{report.satellite.lst.toFixed(1)} °C</Text>
            </View>
          ) : null}
          {report.satellite.s1Moisture != null ? (
            <View style={s.metaCell}>
              <Text style={s.metaLabel}>Humedad S1</Text>
              <Text style={s.metaValue}>
                {(report.satellite.s1Moisture * 100).toFixed(0)}%
              </Text>
            </View>
          ) : null}
          <View style={s.metaCell}>
            <Text style={s.metaLabel}>Fuente</Text>
            <Text style={s.metaValue}>{report.satellite.source ?? 'Copernicus'}</Text>
          </View>
        </View>
        <Text style={s.paragraph}>{report.satellite.interpretation}</Text>
        {report.satellite.insights.length > 0 ? (
          <View>
            <Text style={s.subsection}>Insights de correlación</Text>
            <BulletList items={report.satellite.insights} />
          </View>
        ) : null}

        <Text style={s.sectionTitle}>6. Diagnóstico por hallazgo</Text>
        {report.findings.map((f) => (
          <View key={f.detectionName} style={s.findingBox}>
            <Text style={s.findingTitle}>{f.nameEs}</Text>
            <FindingBadge
              text={`Confianza ${f.confidencePct}% · Severidad ${f.severityLabel}${
                f.affectedAreaPct > 0 ? ` · ${f.affectedAreaPct}% área` : ''
              }`}
            />
            {f.knowledge ? (
              <Text style={s.paragraphSmall}>
                Agente: {f.knowledge.causalAgent} · Umbral económico:{' '}
                {f.knowledge.economicThreshold}
              </Text>
            ) : null}
            <Text style={s.paragraph}>{f.specialistNarrative}</Text>
            {f.knowledge ? (
              <View>
                <Text style={s.subsection}>Síntomas clave</Text>
                <BulletList items={f.knowledge.symptoms.slice(0, 4)} />
              </View>
            ) : null}
          </View>
        ))}

        <ReportFooter report={report} />
      </Page>

      <Page size="A4" style={s.page}>
        <View style={s.headerBarPlan}>
          <Text style={s.headerCompactTitle}>AURA AGRO — Plan de manejo integrado</Text>
        </View>

        <Text style={s.sectionTitle}>7. Acciones inmediatas (0–48 h)</Text>
        <BulletList items={report.managementPlan.immediate} />

        <Text style={s.sectionTitle}>8. Manejo a corto plazo (7–14 días)</Text>
        <BulletList items={report.managementPlan.shortTerm} />

        <Text style={s.sectionTitle}>9. Medidas preventivas</Text>
        <BulletList items={report.managementPlan.preventive} />

        <Text style={s.sectionTitle}>10. Monitoreo y seguimiento</Text>
        <BulletList items={report.managementPlan.monitoring} />

        <Text style={s.disclaimer}>{report.disclaimer}</Text>

        <View style={s.footerNote}>
          <Text style={s.paragraphSmall}>
            Responsable técnico: Plataforma {APP_NAME} — asistencia IA con validación agronómica
            recomendada. Fuentes: visión de campo, Copernicus CDSE, Open-Meteo.
          </Text>
        </View>

        <ReportFooter report={report} />
      </Page>
    </Document>
  );
}
