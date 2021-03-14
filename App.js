import { StatusBar } from 'expo-status-bar';
import React, {useEffect} from 'react';
import { StyleSheet, Alert, AsyncStorage } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as firebase from 'firebase';

import Home from './components/Home';
import Settings from './components/Settings';
import Photos from './components/Photos';

const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  databaseURL: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: ""
}

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const Tab = createBottomTabNavigator();

export default function App() {
  useEffect(() => {
    signIn();
    getUid();
  }, []);

  const signIn = async () => {
    try{
      await firebase.auth().signInAnonymously();
    }catch(error){
      Alert.alert(error.message);
    }
  }

  const getUid = () => {
    try{
      firebase.auth().onAuthStateChanged((user) => {
        if(user){
            setCurrentUser(user.uid);
        }
      });
    }catch(error){
      Alert.alert(error.message);
    }
  }

  const setCurrentUser = async (uid) => {
    try{
      await AsyncStorage.setItem('currentUser', uid);
    }catch(error){
      Alert.alert('Error saving data');
    }
  }

  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Home" component={Home} />
        <Tab.Screen name="Photos" component={Photos} />
        <Tab.Screen name="Settings" component={Settings} />
      </Tab.Navigator>
      <StatusBar hidden={true} />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
