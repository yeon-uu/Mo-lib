import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useEffect } from "react";
import { Image } from "react-native";

import { useAuthStore } from "../store/authStore";
import OnboardingScreen from "../screens/OnboardingScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import HomeScreen from "../screens/HomeScreen";
import MapScreen from "../screens/MapScreen";
import ArchiveScreen from "../screens/ArchiveScreen";

const AuthStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Onboarding" component={OnboardingScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function MainTab() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "홈",
          tabBarIcon: ({ size }) => (
            <Image
              source={require("../../assets/icon-home.png")}
              style={{ width: size, height: size }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          title: "여정",
          tabBarIcon: ({ size }) => (
            <Image
              source={require("../../assets/icon-journey.png")}
              style={{ width: size, height: size }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tab.Screen
        name="Archive"
        component={ArchiveScreen}
        options={{
          title: "아카이브",
          tabBarIcon: ({ size }) => (
            <Image
              source={require("../../assets/icon-archive.png")}
              style={{ width: size, height: size }}
              resizeMode="contain"
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { isLoggedIn, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, []);

  return (
    <NavigationContainer>
      {true ? <MainTab /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
