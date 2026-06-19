import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator, CardStyleInterpolators } from "@react-navigation/stack";
import { View } from "react-native";
import { RoleGuard } from "../components/auth/RoleGuard";
import { CustomTabBar } from "../components/layout/TabBar";
import { usePermissions } from "../hooks/usePermissions";
import { DashboardScreen } from "../screens/dashboard/DashboardScreen";
import { ProductionListScreen } from "../screens/production/ProductionListScreen";
import { OrderDetailScreen } from "../screens/production/OrderDetailScreen";
import { MachineStatusScreen } from "../screens/production/MachineStatusScreen";
import { InventoryListScreen } from "../screens/inventory/InventoryListScreen";
import { ItemDetailScreen } from "../screens/inventory/ItemDetailScreen";
import { StockTransactionScreen } from "../screens/inventory/StockTransactionScreen";
import { HRDashboardScreen } from "../screens/hr/HRDashboardScreen";
import { AttendanceScreen } from "../screens/hr/AttendanceScreen";
import { LeaveScreen } from "../screens/hr/LeaveScreen";
import { EmployeeListScreen } from "../screens/hr/EmployeeListScreen";
import { CreateStaffAccountScreen } from "../screens/hr/CreateStaffAccountScreen";
import { colors } from "../utils/constants";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const screenOptions = {
  headerShown: false,
  cardStyle: { backgroundColor: colors.steel950 },
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
};

const EmptyMore = () => <View />;

export const ProductionStack = () => (
  <RoleGuard area="production">
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="ProductionList" component={ProductionListScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <Stack.Screen name="MachineStatus" component={MachineStatusScreen} />
    </Stack.Navigator>
  </RoleGuard>
);

export const InventoryStack = () => (
  <RoleGuard area="inventory">
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="InventoryList" component={InventoryListScreen} />
      <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
      <Stack.Screen name="StockTransaction" component={StockTransactionScreen} />
    </Stack.Navigator>
  </RoleGuard>
);

export const HRStack = () => (
  <RoleGuard area="hr">
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="HRDashboard" component={HRDashboardScreen} />
      <Stack.Screen name="Attendance" component={AttendanceScreen} />
      <Stack.Screen name="Leave" component={LeaveScreen} />
      <Stack.Screen name="EmployeeList" component={EmployeeListScreen} />
      <Stack.Screen name="CreateStaffAccount" component={CreateStaffAccountScreen} />
    </Stack.Navigator>
  </RoleGuard>
);

export const TabNavigator = () => {
  const { canAccessArea } = usePermissions();

  return (
    <Tab.Navigator tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.steel950 } }}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      {canAccessArea("production") ? <Tab.Screen name="Production" component={ProductionStack} /> : null}
      {canAccessArea("inventory") ? <Tab.Screen name="Inventory" component={InventoryStack} /> : null}
      {canAccessArea("hr") ? <Tab.Screen name="HR" component={HRStack} options={{ tabBarLabel: "HR" }} /> : null}
      <Tab.Screen name="More" component={EmptyMore} />
    </Tab.Navigator>
  );
};
