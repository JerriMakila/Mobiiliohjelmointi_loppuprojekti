import React, {useState, useEffect} from 'react';
import { StyleSheet, Text, View, Alert, AsyncStorage, KeyboardAvoidingView } from 'react-native';
import {Header, Button, Icon, Overlay, Input} from 'react-native-elements';
import {Picker} from '@react-native-picker/picker';
import * as firebase from 'firebase';

export default function Settings(){
    const [uid, setUid] = useState('');
    const [sessions, setSessions] = useState([]);
    const [newSession, setNewSession] = useState('');
    const [importedSession, setImportedSession] = useState('');
    const [isNewVisible, setIsNewVisible] = useState(false);
    const [isImportVisible, setIsImportVisible] = useState(false);
    const [currentSession, setCurrentSession] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        getUserInfo();
    }, []);

    const getUserInfo = () => {
        getUid();
    }

    const getUid = async () => {
        try{
            const currentUser = await AsyncStorage.getItem('currentUser');
            getSessions(currentUser);

            if(currentUser !== uid){
                setUid(currentUser);
            }            
        }catch(error){
            Alert.alert(error.message);
        }

        try{
            const sessionId = await AsyncStorage.getItem('currentSession');
            
            if(sessionId !== currentSession){
                setCurrentSession(sessionId);
            }
        }catch(error){
            Alert.alert(error.message);
        }
    }

    const getSessions = (currentUser) => {
        try{
            firebase.database().ref(`users/${currentUser}/sessions/`).on('value', snapshot => {
                const data = snapshot.val();
    
                if(data){
                    const prods = Object.values(data);
                    setSessions(prods);
                }
            })
        }catch(error){
            Alert.alert(error.message);
        }
    }

    const toggleCreateOverlay = () => {
        setMessage('');
        setNewSession('');
        setIsNewVisible(!isNewVisible);
    }

    const toggleImportOverlay = () => {
        setMessage('');
        setImportedSession('');
        setIsImportVisible(!isImportVisible);
    }

    const createSession = async () => {
            const exists = await isAvailable(newSession);

            if(!exists){
                try{
                    firebase.database().ref(`sessions/${newSession}` ).set({
                        creator:{
                            'uid' : uid
                        }
                    });

                    firebase.database().ref(`users/${uid}/sessions`).push({
                            'sessionId' : newSession
                    })
                }catch(error){
                    Alert.alert(error.message);
                }

                storeCurrentSession(newSession);
                setMessage('');
                toggleCreateOverlay();
            } else {
                setMessage('Session with the given name already exists');
            }
    }

    const importSession = async () => {
        const exists = await isAvailable(importedSession);

        if(exists){
            try{
                firebase.database().ref(`users/${uid}/sessions`).push({
                    'sessionId' : importedSession
                });
            }catch(error){
                Alert.alert(error.message);
            }
            
            storeCurrentSession(importedSession);
            setMessage('');
            toggleImportOverlay();
        } else{
            setMessage('Session with the given name does not exist');
        }
    }

    const storeCurrentSession = async (sessionId) => {
        try{
            await AsyncStorage.setItem('currentSession', sessionId);
        } catch(error){
            Alert.alert(error.message);
        }

        setCurrentSession(sessionId);
    }

    const isAvailable = async (sessionid) => {
        let returnValue;

        await firebase.database().ref('sessions').once('value', snapshot =>{
            returnValue = snapshot.child(sessionid).exists();
        });

        return returnValue;
    }

    return(
        <View style={styles.container}>
            <View>
            <Header
                containerStyle={styles.header}
                centerComponent={{text: 'CREATE AND CHANGE SESSIONS', style:{color: 'white'}}} />
            </View>
            <View style={styles.sessionsContainer}>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={currentSession}
                        onValueChange={(itemValue, itemIndex) => storeCurrentSession(itemValue)}
                        itemStyle={{fontSize: 100}}>
                        <Picker.Item label='Choose session' value='' />
                        {sessions.map(pickerItem => (<Picker.Item label={pickerItem.sessionId} value={pickerItem.sessionId} key={pickerItem.sessionId} />))}
                    </Picker>
                </View>
                <View style={styles.buttonContainer}>
                    <View style={styles.button}>
                        <Button
                            title=' NEW SESSION'
                            onPress={toggleCreateOverlay}
                            icon={
                                <Icon 
                                    name='plus'
                                    type='font-awesome-5'
                                    color='white'
                                    size={13} />
                            } />
                    </View>
                    <View style={styles.button}>
                        <Button
                            title='IMPORT SESSION'
                            onPress={toggleImportOverlay} />
                    </View>
                </View>
                <KeyboardAvoidingView behavior='height' style={styles.overlayContainer}>
                    <Overlay isVisible={isNewVisible} onBackdropPress={toggleCreateOverlay} overlayStyle={{width: '100%'}}>
                        <View>
                            <View>
                                <Input 
                                    label='Name of the session'
                                    placeholder='Session'
                                    value={newSession}
                                    onChangeText={value => setNewSession(value)} />
                            </View>
                            <View>
                                <Button title='CREATE'
                                    onPress={createSession}
                                    disabled={!newSession} />
                            </View>
                        </View>
                        <Text style={{color: 'red', fontSize: 18}}>{message}</Text>
                    </Overlay>
                    <Overlay isVisible={isImportVisible} onBackdropPress={toggleImportOverlay} overlayStyle={{width: '100%'}}>
                        <View>
                            <View>
                                <Input
                                    label='Name of the session'
                                    placeholder='Session'
                                    value={importedSession}
                                    onChangeText={value => setImportedSession(value)} />
                            </View>
                            <View>
                                <Button title='IMPORT'
                                    onPress={importSession}
                                    disabled={!importedSession} />
                            </View>
                        </View>
                        <Text style={{color: 'red', fontSize: 18}}>{message}</Text>
                    </Overlay>
                </KeyboardAvoidingView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'flex-start',
    },

    sessionsContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },

    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        width: 200
    },

    button: {
        marginHorizontal: 5
    },

    header: {
        height: 50,
    },

    overlayContainer:{
        flex: 1
    },

    pickerContainer: {
        width: 200
    },

    picker: {
        fontSize: 50
    }
  });