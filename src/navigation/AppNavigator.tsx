// App Navigator - Handles routing based on user authentication and role

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import OtpVerificationScreen from '../screens/auth/OtpVerificationScreen';

// User Screens
import UserDashboard from '../screens/user/UserDashboard';
import EventRequestScreen from '../screens/user/EventRequestScreen';
import MyEventsScreen from '../screens/user/MyEventsScreen';
import UserEventDetailsScreen from '../screens/user/EventDetailsScreen';

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

// User Tab Navigator
const UserTabs = () => (
    <Tab.Navigator
        screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
                let iconName: any = 'home';
                if (route.name === 'Dashboard') iconName = focused ? 'home' : 'home-outline';
                else if (route.name === 'Request Event') iconName = focused ? 'add-circle' : 'add-circle-outline';
                else if (route.name === 'My Events') iconName = focused ? 'calendar' : 'calendar-outline';
                return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#6200ee',
            tabBarInactiveTintColor: 'gray',
        })}
    >
        <Tab.Screen name="Dashboard" component={UserDashboard} />
        <Tab.Screen name="Request Event" component={EventRequestScreen} />
        <Tab.Screen name="My Events" component={MyEventsScreen} />
    </Tab.Navigator>
);

// Admin Tab Navigator
const AdminTabs = () => (
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
            tabBarActiveTintColor: '#d32f2f',
            tabBarInactiveTintColor: 'gray',
        })}
    >
        <Tab.Screen name="Dashboard" component={AdminDashboard} />
        <Tab.Screen name="Events" component={EventManagement} />
        <Tab.Screen name="Workers" component={WorkerManagement} />
        <Tab.Screen name="Payments" component={PaymentTracking} />
    </Tab.Navigator>
);

// Worker Tab Navigator
const WorkerTabs = () => (
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
            tabBarActiveTintColor: '#388e3c',
            tabBarInactiveTintColor: 'gray',
        })}
    >
        <Tab.Screen name="Dashboard" component={WorkerDashboard} />
        <Tab.Screen name="Available" component={AvailableEvents} />
        <Tab.Screen name="My Work" component={MyAssignments} />
        <Tab.Screen name="Earnings" component={EarningsScreen} />
    </Tab.Navigator>
);

// Role Stack Navigators
const UserStack = createStackNavigator();
const UserStackScreen = () => (
    <UserStack.Navigator>
        <UserStack.Screen name="UserTabs" component={UserTabs} options={{ headerShown: false }} />
        <UserStack.Screen name="EventDetails" component={UserEventDetailsScreen} options={{ title: 'Event Details', headerTintColor: '#6200ee' }} />
    </UserStack.Navigator>
);

const AdminStack = createStackNavigator();
const AdminStackScreen = () => (
    <AdminStack.Navigator>
        <AdminStack.Screen name="AdminTabs" component={AdminTabs} options={{ headerShown: false }} />
        <AdminStack.Screen name="EventDetails" component={AdminEventDetailsScreen} options={{ title: 'Event Details', headerTintColor: '#d32f2f' }} />
        <AdminStack.Screen name="AssignWorkers" component={AssignWorkersScreen} options={{ title: 'Assign Workers', headerTintColor: '#d32f2f' }} />
        <AdminStack.Screen name="CalendarView" component={CalendarView} options={{ title: 'Operations Calendar', headerTintColor: '#d32f2f' }} />
    </AdminStack.Navigator>
);

const WorkerStack = createStackNavigator();
const WorkerStackScreen = () => (
    <WorkerStack.Navigator>
        <WorkerStack.Screen name="WorkerTabs" component={WorkerTabs} options={{ headerShown: false }} />
        <WorkerStack.Screen name="EventDetails" component={WorkerEventDetailsScreen} options={{ title: 'Event Details', headerTintColor: '#388e3c' }} />
        <WorkerStack.Screen name="AttendanceHistory" component={AttendanceScreen} options={{ title: 'Attendance Log', headerTintColor: '#388e3c' }} />
    </WorkerStack.Navigator>
);

const AppNavigator = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#6200ee" />
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
                    <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
                </>
            ) : (
                // Authenticated Stack - Role-based routing
                <>
                    {user.role === 'user' && <Stack.Screen name="UserApp" component={UserStackScreen} />}
                    {user.role === 'admin' && <Stack.Screen name="AdminApp" component={AdminStackScreen} />}
                    {user.role === 'worker' && <Stack.Screen name="WorkerApp" component={WorkerStackScreen} />}
                </>
            )}
        </Stack.Navigator>
    );
};

export default AppNavigator;
