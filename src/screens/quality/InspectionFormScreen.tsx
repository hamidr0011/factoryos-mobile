import * as ImagePicker from "expo-image-picker";
import { Camera, Minus, Plus } from "lucide-react-native";
import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { colors, productionOrders, spacing, typography } from "../../utils/constants";
import { ChipRow, ProgressBar, ScreenContainer } from "../shared/ScreenScaffold";

const steps = ["Batch", "Results", "Evidence"];
const defectTypes = [
  { label: "Burr", severity: "minor", color: colors.production },
  { label: "Surface", severity: "major", color: colors.amber400 },
  { label: "Dimension", severity: "critical", color: colors.maintenance },
];

export const InspectionFormScreen = () => {
  const [step, setStep] = useState(0);
  const [passed, setPassed] = useState(291);
  const [failed, setFailed] = useState(9);
  const [selectedDefects, setSelectedDefects] = useState<string[]>(["Burr"]);
  const [image, setImage] = useState<string | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.75 });
    if (!result.canceled) setImage(result.assets[0].uri);
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
          <ChipRow items={productionOrders.map((order) => order.order_number)} active={productionOrders[0].order_number} onChange={() => undefined} />
          <Input label="Batch number" defaultValue="B-4811" />
          <Input label="Total inspected" keyboardType="numeric" defaultValue="300" />
          <Button title="Continue" onPress={() => setStep(1)} />
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
            {defectTypes.map((defect) => {
              const selected = selectedDefects.includes(defect.label);
              return (
                <Pressable
                  key={defect.label}
                  onPress={() => setSelectedDefects((items) => (selected ? items.filter((item) => item !== defect.label) : [...items, defect.label]))}
                >
                  <Badge label={`${defect.label} · ${defect.severity}`} color={defect.color} subtle={!selected} />
                </Pressable>
              );
            })}
          </View>
          <Input label="Notes" placeholder="Inspection notes" />
          <Button title="Continue" onPress={() => setStep(2)} />
        </Card>
      ) : null}

      {step === 2 ? (
        <Card style={styles.form}>
          <Text style={styles.sectionTitle}>Evidence</Text>
          <Pressable style={styles.photoBox} onPress={pickImage}>
            {image ? <Image source={{ uri: image }} style={styles.photo} /> : <Camera color={colors.amber400} size={48} />}
          </Pressable>
          <Text style={styles.meta}>Photos are ready to upload to Supabase Storage bucket `quality-evidence` when configured.</Text>
          <Button title="Submit Inspection" />
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
