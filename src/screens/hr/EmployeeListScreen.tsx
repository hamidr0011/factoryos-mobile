import { useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import { hrService } from "../../services/hr.service";
import type { Profile } from "../../types";
import { colors, employees, spacing, typography } from "../../utils/constants";
import { ChipRow, ScreenContainer, SearchField, WorkCard } from "../shared/ScreenScaffold";

const departments = ["All", "Production", "Quality", "Maintenance", "Finance", "Factory Floor A"];

export const EmployeeListScreen = () => {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All");
  const { data = employees } = useQuery({ queryKey: ["employees"], queryFn: hrService.getEmployees });

  const filtered = useMemo(
    () =>
      (data as Profile[]).filter((employee) => {
        const matchesSearch = `${employee.full_name} ${employee.employee_id}`.toLowerCase().includes(search.toLowerCase());
        const matchesDepartment = department === "All" || employee.department === department;
        return matchesSearch && matchesDepartment;
      }),
    [data, department, search],
  );

  return (
    <ScreenContainer title="Employees" subtitle="Profiles and assignments" scroll={false}>
      <SearchField value={search} onChangeText={setSearch} placeholder="Search employee" />
      <ChipRow items={departments} active={department} onChange={setDepartment} />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState variant="hr" title="No employees found" subtitle="Add team members" cta="Add employee" />}
        renderItem={({ item }) => (
          <WorkCard title={item.full_name} eyebrow={item.employee_id} accentColor={colors.hr}>
            <View style={styles.row}>
              <Text style={styles.meta}>{item.department}</Text>
              <Badge label={item.role} color={colors.hr} />
            </View>
          </WorkCard>
        )}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
    paddingBottom: 180,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  meta: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 13,
  },
});
