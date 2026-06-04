import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11 },
  title: { fontSize: 18, marginBottom: 12 },
  row: { marginBottom: 6 },
});

export function ReportPdfDocument(props: {
  orgName: string;
  fields: Array<{ name: string; crop: string; area: number; riskScore: number }>;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Informe Doctor Soya</Text>
        <Text style={styles.row}>Organización: {props.orgName}</Text>
        <Text style={styles.row}>Fuentes: Copernicus CDSE · Open-Meteo</Text>
        <Text style={styles.row}>
          Generado: {new Date().toLocaleString('es-AR')}
        </Text>
        <View style={{ marginTop: 16 }}>
          {props.fields.map((f) => (
            <Text key={f.name} style={styles.row}>
              {f.name} — {f.crop} — {f.area} ha — riesgo {f.riskScore}
            </Text>
          ))}
        </View>
      </Page>
    </Document>
  );
}
