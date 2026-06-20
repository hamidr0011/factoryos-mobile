import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { Camera, Minus, Plus } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { productionService } from "../../services/production.service";
import { qualityService } from "../../services/quality.service";
import { useAppStore } from "../../store/appStore";
import type { DefectType, ProductionOrder } from "../../types";
import { colors, spacing, typography } from "../../utils/constants";
import { ChipRow, ProgressBar, ScreenContainer } from "../shared/ScreenScaffold";

const steps = ["Batch", "Results", "Evidence"];
const severityColors: Record<NonNullable<DefectType["severity"]>, string> = {
  minor: colors.production,
  major: colors.amber400,
  critical: colors.maintenance,
};

export const InspectionFormScreen = () => {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const showToast = useAppStore((state) => state.showToast);
  const [step, setStep] = useState(0);
  const [orderNumber, setOrderNumber] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [totalInspected, setTotalInspected] = useState("");
  const [passed, setPassed] = useState(0);
  const [failed, setFailed] = useState(0);
  const [selectedDefects, setSelectedDefects] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const { data: orders = [] } = useQuery({
    queryKey: ["production_orders"],
    queryFn: () => productionService.getOrders(),
  });
  const { data: defectData = [] } = useQuery({
    queryKey: ["defect_types"],
    queryFn: qualityService.getDefectTypes,
  });
  const typedOrders = orders as ProductionOrder[];
  const defectTypes = defectData as DefectType[];
  const selectedOrder = typedOrders.find((order) => order.order_number === orderNumber);

  useEffect(() => {
    if (!orderNumber && typedOrders[0]) {
      setOrderNumber(typedOrders[0].order_number);
    }
  }, [orderNumber, typedOrders]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const uploadedImages = image ? [await qualityService.uploadEvidence(image, batchNumber)] : [];
      return qualityService.submitCheck({
        orderId: selectedOrder!.id,
        batchNumber,
        totalInspected: Number(totalInspected),
        passed,
        failed,
        defectTypes: selectedDefects,
        notes: notes.trim() || undefined,
        images: uploadedImages,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["quality_checks"] });
      showToast("success", "Inspection submitted.");
      navigation.goBack();
    },
    onError: (error) => {
      showToast("error", error instanceof Error ? error.message : "Could not submit inspection.");
    },
  });

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.75 });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const submitInspection = () => {
    const total = Number(totalInspected);
    if (!selectedOrder) {
      showToast("warning", "Select a valid production order.");
      return;
    }
    if (!batchNumber.trim() || !Number.isFinite(total) || total <= 0) {
      showToast("warning", "Enter a batch number and total inspected quantity.");
      return;
    }
    if (passed + failed > total) {
      showToast("warning", "Passed plus failed cannot exceed total inspected.");
      return;
    }
    submitMutation.mutate();
  };

  return (
    <ScreenContainer title="New Inspection" subtitle="Three-step QC capture">
      <Card style={styles.progressCard}>
        <View style={styles.stepRow}>
          {steps.map((name, index) => (
            <Pressable key={name} onPress={() => setStep(index)} style={[styles.step, step === index && styles.stepActive]}>
              <Text style={[styles.stepText, step === index && styles.stepTextActive]}>{name}</Text>
            </Pressable>
          ))}
        </View>
        <ProgressBar value={((step + 1) / steps.length) * 100} color={colors.quality} />
      </Card>

      {step === 0 ? (
        <Card style={styles.form}>
          {typedOrders.length ? (
            <>
              <ChipRow items={typedOrders.map((order) => order.order_number)} active={orderNumber} onChange={setOrderNumber} />
              <Input label="Batch number" value={batchNumber} onChangeText={setBatchNumber} />
              <Input label="Total inspected" keyboardType="numeric" value={totalInspected} onChangeText={setTotalInspected} />
              <Button title="Continue" onPress={() => setStep(1)} />
            </>
          ) : (
            <EmptyState variant="quality" title="No production orders" subtitle="Create a production order before starting an inspection." />
          )}
        </Card>
      ) : null}

      {step === 1 ? (
        <Card style={styles.form}>
          <Text style={styles.sectionTitle}>Results</Text>
          <View style={styles.counterRow}>
            <Counter label="Passed" value={passed} color={colors.inventory} onMinus={() => setPassed(Math.max(0, passed - 1))} onPlus={() => setPassed(passed + 1)} />
            <Counter label="Failed" value={failed} color={colors.maintenance} onMinus={() => setFailed(Math.max(0, failed - 1))} onPlus={() => setFailed(failed + 1)} />
          </View>
          <Text style={styles.label}>Defect Types</Text>
          <View style={styles.defects}>
            {defectTypes.length ? defectTypes.map((defect) => {
              const value = defect.code || defect.name || defect.id;
              const label = defect.name || defect.code || "Unnamed defect";
              const severity = defect.severity || "minor";
              const selected = selectedDefects.includes(value);
              return (
                <Pressable
                  key={defect.id}
                  onPress={() => setSelectedDefects((items) => (selected ? items.filter((item) => item !== value) : [...items, value]))}
                >
                  <Badge label={`${label} · ${severity}`} color={severityColors[severity]} subtle={!selected} />
                </Pressable>
              );
            }) : (
              <Text style={styles.meta}>No defect types returned by the API.</Text>
            )}
          </View>
          <Input label="Notes" placeholder="Inspection notes" value={notes} onChangeText={setNotes} />
          <Button title="Continue" onPress={() => setStep(2)} />
        </Card>
      ) : null}

      {step === 2 ? (
        <Card style={styles.form}>
          <Text style={styles.sectionTitle}>Evidence</Text>
          <Pressable style={styles.photoBox} onPress={pickImage}>
            {image ? <Image source={{ uri: image }} style={styles.photo} /> : <Camera color={colors.amber400} size={48} />}
          </Pressable>
          <Text style={styles.meta}>Photos upload to the `quality-evidence` bucket when Supabase is active.</Text>
          <Button title="Submit Inspection" loading={submitMutation.isPending} onPress={submitInspection} />
        </Card>
      ) : null}
    </ScreenContainer>
  );
};

const Counter = ({ label, value, color, onMinus, onPlus }: { label: string; value: number; color: string; onMinus: () => void; onPlus: () => void }) => (
  <View style={[styles.counter, { borderColor: `${color}55` }]}>
    <Text style={[styles.counterValue, { color }]}>{value}</Text>
    <Text style={styles.counterLabel}>{label}</Text>
    <View style={styles.counterActions}>
      <Pressable onPress={onMinus} style={styles.counterButton}><Minus color={colors.steel100} size={18} /></Pressable>
      <Pressable onPress={onPlus} style={styles.counterButton}><Plus color={colors.steel100} size={18} /></Pressable>
    </View>
  </View>
);

const styles = StyleSheet.create({
  progressCard: {
    gap: spacing.md,
  },
  stepRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  step: {
    borderColor: colors.steel700,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 38,
    justifyContent: "center",
  },
  stepActive: {
    borderColor: colors.quality,
    backgroundColor: `${colors.quality}22`,
  },
  stepText: {
    color: colors.steel500,
    fontFamily: typography.bodyMedium,
    fontSize: 12,
    textAlign: "center",
  },
  stepTextActive: {
    color: colors.quality,
  },
  form: {
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 18,
  },
  counterRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  counter: {
    backgroundColor: colors.steel800,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    padding: spacing.md,
  },
  counterValue: {
    fontFamily: typography.display,
    fontSize: 34,
  },
  counterLabel: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 12,
  },
  counterActions: {
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  counterButton: {
    alignItems: "center",
    backgroundColor: colors.steel700,
    borderRadius: 8,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  label: {
    color: colors.steel300,
    fontFamily: typography.bodyMedium,
    fontSize: 13,
  },
  defects: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  photoBox: {
    alignItems: "center",
    backgroundColor: colors.steel800,
    borderColor: colors.steel700,
    borderRadius: 8,
    borderWidth: 1,
    height: 220,
    justifyContent: "center",
    overflow: "hidden",
  },
  photo: {
    height: "100%",
    width: "100%",
  },
  meta: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 12,
  },
});
