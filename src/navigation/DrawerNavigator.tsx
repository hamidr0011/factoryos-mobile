import { createDrawerNavigator } from "@react-navigation/drawer";
import { createStackNavigator, CardStyleInterpolators } from "@react-navigation/stack";
import { RoleGuard } from "../components/auth/RoleGuard";
import { CustomDrawer } from "../components/layout/Drawer";
import { usePermissions } from "../hooks/usePermissions";
import { TabNavigator } from "./TabNavigator";
import { QualityCheckListScreen } from "../screens/quality/QualityCheckListScreen";
import { InspectionFormScreen } from "../screens/quality/InspectionFormScreen";
import { DefectReportScreen } from "../screens/quality/DefectReportScreen";
import { MaintenanceListScreen } from "../screens/maintenance/MaintenanceListScreen";
import { TaskDetailScreen } from "../screens/maintenance/TaskDetailScreen";
import { CreateTaskScreen } from "../screens/maintenance/CreateTaskScreen";
import { FinanceDashboardScreen } from "../screens/finance/FinanceDashboardScreen";
import { ExpenseListScreen } from "../screens/finance/ExpenseListScreen";
import { BudgetScreen } from "../screens/finance/BudgetScreen";
import { NotificationsScreen } from "../screens/notifications/NotificationsScreen";
import { ProfileScreen } from "../screens/settings/ProfileScreen";
import { SettingsScreen } from "../screens/settings/SettingsScreen";
import { colors } from "../utils/constants";

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

const screenOptions = {
  headerShown: false,
  cardStyle: { backgroundColor: colors.steel950 },
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
};

const QualityStack = () => (
  <RoleGuard area="quality">
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="QualityList" component={QualityCheckListScreen} />
      <Stack.Screen name="InspectionForm" component={InspectionFormScreen} />
      <Stack.Screen name="DefectReport" component={DefectReportScreen} />
    </Stack.Navigator>
  </RoleGuard>
);

const MaintenanceStack = () => (
  <RoleGuard area="maintenance">
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="MaintenanceList" component={MaintenanceListScreen} />
      <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
      <Stack.Screen name="CreateTask" component={CreateTaskScreen} />
    </Stack.Navigator>
  </RoleGuard>
);

const FinanceStack = () => (
  <RoleGuard area="finance">
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="FinanceDashboard" component={FinanceDashboardScreen} />
      <Stack.Screen name="ExpenseList" component={ExpenseListScreen} />
      <Stack.Screen name="Budget" component={BudgetScreen} />
    </Stack.Navigator>
  </RoleGuard>
);

export const DrawerNavigator = () => {
  const { canAccessArea } = usePermissions();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: { backgroundColor: colors.steel950, width: 310 },
        sceneStyle: { backgroundColor: colors.steel950 },
      }}
    >
      <Drawer.Screen name="MainTabs" component={TabNavigator} />
      {canAccessArea("quality") ? <Drawer.Screen name="Quality" component={QualityStack} /> : null}
      {canAccessArea("maintenance") ? <Drawer.Screen name="Maintenance" component={MaintenanceStack} /> : null}
      {canAccessArea("finance") ? <Drawer.Screen name="Finance" component={FinanceStack} /> : null}
      {canAccessArea("notifications") ? <Drawer.Screen name="Notifications" component={NotificationsScreen} /> : null}
      <Drawer.Screen name="Profile" component={ProfileScreen} />
      {canAccessArea("settings") ? <Drawer.Screen name="Settings" component={SettingsScreen} /> : null}
    </Drawer.Navigator>
  );
};
