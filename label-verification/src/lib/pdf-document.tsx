import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

export type ReportScan = {
  palletIndex: number;
  pnOrig: string;
  pnNew: string;
  result: string;
  createdAt: string;
  userEmail: string;
};

export type ReportData = {
  shipmentNumber: number;
  totalPallets: number;
  scannedPallets: number;
  scans: ReportScan[];
};

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
  title: { fontSize: 18, marginBottom: 8, fontWeight: "bold" },
  subtitle: { fontSize: 12, marginBottom: 20 },
  row: { flexDirection: "row", borderBottom: "1px solid #ccc", paddingVertical: 6 },
  header: { flexDirection: "row", borderBottom: "2px solid #333", paddingBottom: 6, marginBottom: 4, fontWeight: "bold" },
  col1: { width: "8%" },
  col2: { width: "18%" },
  col3: { width: "18%" },
  col4: { width: "36%" },
  col5: { width: "20%" },
});

export function VerificationReportDocument({ data }: { data: ReportData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Tesla Scan Verification</Text>
        <Text style={styles.subtitle}>
          Shipment {data.shipmentNumber} — {data.scannedPallets}/{data.totalPallets} pallets
        </Text>
        <View style={styles.header}>
          <Text style={styles.col1}>#</Text>
          <Text style={styles.col2}>PN Orig</Text>
          <Text style={styles.col3}>PN New</Text>
          <Text style={styles.col4}>Result</Text>
          <Text style={styles.col5}>Operator</Text>
        </View>
        {data.scans.map((scan) => (
          <View key={scan.palletIndex} style={styles.row}>
            <Text style={styles.col1}>{scan.palletIndex}</Text>
            <Text style={styles.col2}>{scan.pnOrig}</Text>
            <Text style={styles.col3}>{scan.pnNew}</Text>
            <Text style={styles.col4}>{scan.result}</Text>
            <Text style={styles.col5}>{scan.userEmail}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}
