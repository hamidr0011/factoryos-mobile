import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigation, useRoute } from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { ScanLine } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { inventoryService } from "../../services/inventory.service";
import { useAppStore } from "../../store/appStore";
import type { InventoryItem } from "../../types";
import { colors, inventoryItems, spacing, typography } from "../../utils/constants";
import { ChipRow, DetailRow, ScreenContainer } from "../shared/ScreenScaffold";

type TransactionType = "In" | "Out" | "Transfer" | "Adjustment";

const types: TransactionType[] = ["In", "Out", "Transfer", "Adjustment"];

export const StockTransactionScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const queryClient = useQueryClient();
  const showToast = useAppStore((state) => state.showToast);
  const initialItem = route.params?.item || inventoryItems[0];
  const initialType: TransactionType = route.params?.type || "In";
  const [permission, requestPermission] = useCameraPermissions();
  const [type, setType] = useState<TransactionType>(initialType);
  const [sku, setSku] = useState(initialItem.sku);
  const [quantity, setQuantity] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const { data: items = inventoryItems } = useQuery({ queryKey: ["inventory_items"], queryFn: inventoryService.getItems });
  const selected = (items as InventoryItem[]).find((item) => item.sku.toLowerCase() === sku.trim().toLowerCase());

  const transactionMutation = useMutation({
    mutationFn: () =>
      inventoryService.recordTransaction({
        itemId: selected!.id,
        type,
        quantity: Number(quantity),
        reference: reference.trim() || `${type} movement`,
        notes: notes.trim() || undefined,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["inventory_items"] }),
        queryClient.invalidateQueries({ queryKey: ["inventory_transactions"] }),
      ]);
      showToast("success", "Inventory transaction posted.");
      navigation.goBack();
    },
    onError: (error) => {
      showToast("error", error instanceof Error ? error.message : "Could not post inventory transaction.");
    },
  });

  const submitTransaction = () => {
    const parsed = Number(quantity);
    if (!selected) {
      showToast("warning", "Select a valid SKU before posting.");
      return;
    }
    if (!Number.isFinite(parsed) || parsed === 0 || (type !== "Adjustment" && parsed < 0)) {
      showToast("warning", type === "Adjustment" ? "Enter a non-zero adjustment quantity." : "Enter a positive movement quantity.");
      return;
    }
    transactionMutation.mutate();
  };

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
        <DetailRow label="Item" value={selected?.name || "SKU not found"} />
        <DetailRow label="Current stock" value={selected ? `${selected.quantity_on_hand} ${selected.unit}` : "Unavailable"} />
        <DetailRow label="Location" value={selected?.warehouse_location || "Unavailable"} />
      </Card>
      <ChipRow items={types} active={type} onChange={(next) => setType(next as TransactionType)} />
      <Input label="Quantity" keyboardType="numeric" placeholder="0" value={quantity} onChangeText={setQuantity} />
      <Input label="Reference" placeholder="PO, supplier invoice, transfer note" value={reference} onChangeText={setReference} />
      <Input label="Notes" placeholder="Optional movement notes" value={notes} onChangeText={setNotes} />
      <Button title="Submit Transaction" loading={transactionMutation.isPending} onPress={submitTransaction} />
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
