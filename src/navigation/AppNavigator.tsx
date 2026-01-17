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

// User Screens
import UserDashboard from '../screens/user/UserDashboard';
import EventRequestScreen from '../screens/user/EventRequestScreen';
import MyEventsScreen from '../screens/user/MyEventsScreen';

// Admin Screens
import AdminDashboard from '../screens/admin/AdminDashboard';
import EventManagement from '../screens/admin/EventManagement';
import WorkerManagement from '../screens/admin/WorkerManagement';
import CalendarView from '../screens/admin/CalendarView';
import PaymentTracking from '../screens/admin/PaymentTracking';

// Worker Screens
import WorkerDashboard from '../screens/worker/WorkerDashboard';
import AvailableEvents from '../screens/worker/AvailableEvents';
import MyAssignments from '../screens/worker/MyAssignments';
import AttendanceScreen from '../screens/worker/AttendanceScreen';
import EarningsScreen from '../screens/worker/EarningsScreen';

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
                </>
            ) : (
                // Authenticated Stack - Role-based routing
                <>
                    {user.role === 'user' && <Stack.Screen name="UserApp" component={UserTabs} />}
                    {user.role === 'admin' && <Stack.Screen name="AdminApp" component={AdminTabs} />}
                    {user.role === 'worker' && <Stack.Screen name="WorkerApp" component={WorkerTabs} />}
                </>
            )}
        </Stack.Navigator>
    );
};

export default AppNavigator;
