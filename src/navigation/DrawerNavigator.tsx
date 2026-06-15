import { createDrawerNavigator } from "@react-navigation/drawer";
import { createStackNavigator, CardStyleInterpolators } from "@react-navigation/stack";
import { CustomDrawer } from "../components/layout/Drawer";
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
  <Stack.Navigator screenOptions={screenOptions}>
    <Stack.Screen name="QualityList" component={QualityCheckListScreen} />
    <Stack.Screen name="InspectionForm" component={InspectionFormScreen} />
    <Stack.Screen name="DefectReport" component={DefectReportScreen} />
  </Stack.Navigator>
);

const MaintenanceStack = () => (
  <Stack.Navigator screenOptions={screenOptions}>
    <Stack.Screen name="MaintenanceList" component={MaintenanceListScreen} />
    <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
    <Stack.Screen name="CreateTask" component={CreateTaskScreen} />
  </Stack.Navigator>
);

const FinanceStack = () => (
  <Stack.Navigator screenOptions={screenOptions}>
    <Stack.Screen name="FinanceDashboard" component={FinanceDashboardScreen} />
    <Stack.Screen name="ExpenseList" component={ExpenseListScreen} />
    <Stack.Screen name="Budget" component={BudgetScreen} />
  </Stack.Navigator>
);

export const DrawerNavigator = () => (
  <Drawer.Navigator
    drawerContent={(props) => <CustomDrawer {...props} />}
    screenOptions={{
      headerShown: false,
      drawerStyle: { backgroundColor: colors.steel950, width: 310 },
      sceneStyle: { backgroundColor: colors.steel950 },
    }}
  >
    <Drawer.Screen name="MainTabs" component={TabNavigator} />
    <Drawer.Screen name="Quality" component={QualityStack} />
    <Drawer.Screen name="Maintenance" component={MaintenanceStack} />
    <Drawer.Screen name="Finance" component={FinanceStack} />
    <Drawer.Screen name="Notifications" component={NotificationsScreen} />
    <Drawer.Screen name="Profile" component={ProfileScreen} />
    <Drawer.Screen name="Settings" component={SettingsScreen} />
  </Drawer.Navigator>
);
