import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator, CardStyleInterpolators } from "@react-navigation/stack";
import { View } from "react-native";
import { CustomTabBar } from "../components/layout/TabBar";
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
  <Stack.Navigator screenOptions={screenOptions}>
    <Stack.Screen name="ProductionList" component={ProductionListScreen} />
    <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
    <Stack.Screen name="MachineStatus" component={MachineStatusScreen} />
  </Stack.Navigator>
);

export const InventoryStack = () => (
  <Stack.Navigator screenOptions={screenOptions}>
    <Stack.Screen name="InventoryList" component={InventoryListScreen} />
    <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
    <Stack.Screen name="StockTransaction" component={StockTransactionScreen} />
  </Stack.Navigator>
);

export const HRStack = () => (
  <Stack.Navigator screenOptions={screenOptions}>
    <Stack.Screen name="HRDashboard" component={HRDashboardScreen} />
    <Stack.Screen name="Attendance" component={AttendanceScreen} />
    <Stack.Screen name="Leave" component={LeaveScreen} />
    <Stack.Screen name="EmployeeList" component={EmployeeListScreen} />
  </Stack.Navigator>
);

export const TabNavigator = () => (
  <Tab.Navigator tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.steel950 } }}>
    <Tab.Screen name="Dashboard" component={DashboardScreen} />
    <Tab.Screen name="Production" component={ProductionStack} />
    <Tab.Screen name="Inventory" component={InventoryStack} />
    <Tab.Screen name="HR" component={HRStack} options={{ tabBarLabel: "HR" }} />
    <Tab.Screen name="More" component={EmptyMore} />
  </Tab.Navigator>
);
