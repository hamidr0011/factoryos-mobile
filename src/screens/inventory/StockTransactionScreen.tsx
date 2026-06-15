import { useRoute } from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { ScanLine } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { colors, inventoryItems, spacing, typography } from "../../utils/constants";
import { ChipRow, DetailRow, ScreenContainer } from "../shared/ScreenScaffold";

const types = ["In", "Out", "Transfer", "Adjustment"];

export const StockTransactionScreen = () => {
  const route = useRoute<any>();
  const initialItem = route.params?.item || inventoryItems[0];
  const initialType = route.params?.type || "In";
  const [permission, requestPermission] = useCameraPermissions();
  const [type, setType] = useState(initialType);
  const [sku, setSku] = useState(initialItem.sku);
  const selected = inventoryItems.find((item) => item.sku === sku) || inventoryItems[0];

  return (
    <ScreenContainer title="Stock Transaction" subtitle="Scan, verify, and post movement">
      <Card style={styles.scanner}>
        {permission?.granted ? (
          <CameraView
            style={styles.camera}
            barcodeScannerSettings={{ barcodeTypes: ["qr", "ean13", "code128"] }}
            onBarcodeScanned={({ data }) => setSku(data)}
          />
        ) : (
          <View style={styles.permission}>
            <ScanLine color={colors.amber400} size={48} />
            <Text style={styles.permissionText}>Camera access enables SKU barcode scanning.</Text>
            <Button title="Enable Scanner" onPress={async () => { await requestPermission(); }} />
          </View>
        )}
      </Card>

      <Input label="SKU" value={sku} onChangeText={setSku} autoCapitalize="characters" />
      <Card style={styles.detail}>
        <DetailRow label="Item" value={selected.name} />
        <DetailRow label="Current stock" value={`${selected.quantity_on_hand} ${selected.unit}`} />
        <DetailRow label="Location" value={selected.warehouse_location} />
      </Card>
      <ChipRow items={types} active={type} onChange={setType} />
      <Input label="Quantity" keyboardType="numeric" placeholder="0" />
      <Input label="Reference" placeholder="PO, supplier invoice, transfer note" />
      <Input label="Notes" placeholder="Optional movement notes" />
      <Button title="Submit Transaction" />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scanner: {
    height: 220,
    overflow: "hidden",
    padding: 0,
  },
  camera: {
    flex: 1,
  },
  permission: {
    alignItems: "center",
    flex: 1,
    gap: spacing.md,
    justifyContent: "center",
    padding: spacing.lg,
  },
  permissionText: {
    color: colors.steel300,
    fontFamily: typography.body,
    fontSize: 13,
    textAlign: "center",
  },
  detail: {
    gap: spacing.xs,
  },
});
