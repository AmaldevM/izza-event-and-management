// App Navigator - Handles routing based on user authentication and role (Admin & Worker Only)

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from 'react-native-paper';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Admin Screens
import AdminDashboard from '../screens/admin/AdminDashboard';
import EventManagement from '../screens/admin/EventManagement';
import WorkerManagement from '../screens/admin/WorkerManagement';
import CalendarView from '../screens/admin/CalendarView';
import PaymentTracking from '../screens/admin/PaymentTracking';
import AdminEventDetailsScreen from '../screens/admin/EventDetailsScreen';
import AssignWorkersScreen from '../screens/admin/AssignWorkers';

// Worker Screens
import WorkerDashboard from '../screens/worker/WorkerDashboard';
import AvailableEvents from '../screens/worker/AvailableEvents';
import MyAssignments from '../screens/worker/MyAssignments';
import AttendanceScreen from '../screens/worker/AttendanceScreen';
import EarningsScreen from '../screens/worker/EarningsScreen';
import WorkerEventDetailsScreen from '../screens/worker/EventDetailsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Admin Tab Navigator
const AdminTabs = () => {
    const theme = useTheme();
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: any = 'home';
                    if (route.name === 'Dashboard') iconName = focused ? 'grid' : 'grid-outline';
                    else if (route.name === 'Events') iconName = focused ? 'calendar' : 'calendar-outline';
                    else if (route.name === 'Workers') iconName = focused ? 'people' : 'people-outline';
                    else if (route.name === 'Payments') iconName = focused ? 'wallet' : 'wallet-outline';
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
                tabBarStyle: {
                    backgroundColor: theme.colors.surface,
                    borderTopColor: theme.colors.outline,
                    paddingBottom: 4,
                    height: 60,
                },
                headerStyle: {
                    backgroundColor: theme.colors.surface,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.outline,
                },
                headerTintColor: theme.colors.onSurface,
            })}
        >
            <Tab.Screen name="Dashboard" component={AdminDashboard} />
            <Tab.Screen name="Events" component={EventManagement} />
            <Tab.Screen name="Workers" component={WorkerManagement} />
            <Tab.Screen name="Payments" component={PaymentTracking} />
        </Tab.Navigator>
    );
};

// Worker Tab Navigator
const WorkerTabs = () => {
    const theme = useTheme();
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: any = 'home';
                    if (route.name === 'Dashboard') iconName = focused ? 'home' : 'home-outline';
                    else if (route.name === 'Available') iconName = focused ? 'list' : 'list-outline';
                    else if (route.name === 'My Work') iconName = focused ? 'briefcase' : 'briefcase-outline';
                    else if (route.name === 'Earnings') iconName = focused ? 'cash' : 'cash-outline';
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
                tabBarStyle: {
                    backgroundColor: theme.colors.surface,
                    borderTopColor: theme.colors.outline,
                    paddingBottom: 4,
                    height: 60,
                },
                headerStyle: {
                    backgroundColor: theme.colors.surface,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.outline,
                },
                headerTintColor: theme.colors.onSurface,
            })}
        >
            <Tab.Screen name="Dashboard" component={WorkerDashboard} />
            <Tab.Screen name="Available" component={AvailableEvents} />
            <Tab.Screen name="My Work" component={MyAssignments} />
            <Tab.Screen name="Earnings" component={EarningsScreen} />
        </Tab.Navigator>
    );
};

// Role Stack Navigators
const AdminStack = createStackNavigator();
const AdminStackScreen = () => {
    const theme = useTheme();
    return (
        <AdminStack.Navigator
            screenOptions={{
                headerStyle: {
                    backgroundColor: theme.colors.surface,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.outline,
                },
                headerTintColor: theme.colors.onSurface,
            }}
        >
            <AdminStack.Screen name="AdminTabs" component={AdminTabs} options={{ headerShown: false }} />
            <AdminStack.Screen name="EventDetails" component={AdminEventDetailsScreen} options={{ title: 'Event Details' }} />
            <AdminStack.Screen name="AssignWorkers" component={AssignWorkersScreen} options={{ title: 'Assign Workers' }} />
            <AdminStack.Screen name="CalendarView" component={CalendarView} options={{ title: 'Operations Calendar' }} />
        </AdminStack.Navigator>
    );
};

const WorkerStack = createStackNavigator();
const WorkerStackScreen = () => {
    const theme = useTheme();
    return (
        <WorkerStack.Navigator
            screenOptions={{
                headerStyle: {
                    backgroundColor: theme.colors.surface,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.outline,
                },
                headerTintColor: theme.colors.onSurface,
            }}
        >
            <WorkerStack.Screen name="WorkerTabs" component={WorkerTabs} options={{ headerShown: false }} />
            <WorkerStack.Screen name="EventDetails" component={WorkerEventDetailsScreen} options={{ title: 'Event Details' }} />
            <WorkerStack.Screen name="AttendanceHistory" component={AttendanceScreen} options={{ title: 'Attendance Log' }} />
        </WorkerStack.Navigator>
    );
};

const AppNavigator = () => {
    const theme = useTheme();
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!user ? (
                // Auth Stack
                <>
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Register" component={RegisterScreen} />
                </>
            ) : (
                // Authenticated Stack - Role-based routing
                <>
                    {user.role === 'admin' && <Stack.Screen name="AdminApp" component={AdminStackScreen} />}
                    {user.role === 'worker' && <Stack.Screen name="WorkerApp" component={WorkerStackScreen} />}
                </>
            )}
        </Stack.Navigator>
    );
};

export default AppNavigator;
