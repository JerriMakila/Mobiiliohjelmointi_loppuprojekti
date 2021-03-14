import React, {useState, useEffect} from 'react';
import { StyleSheet, Text, View, Alert, AsyncStorage, FlatList } from 'react-native';
import * as firebase from 'firebase';
import {Header, Button, Icon, Overlay, Input, ListItem} from 'react-native-elements';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function Home({navigation}){
    const [uid, setUid] = useState('');
    const [currentSession, setCurrentSession] = useState({
        id: '',
        creator: '',
    });

    const [instruction, setInstruction] = useState({
        hours: '',
        minutes: '',
        activity: ''
    })
    const [instructions, setInstructions] = useState([]);
    const [isVisible, setIsVisible] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        navigation.addListener('focus', () =>{
            getUserInfo();
        })
        getInstructions(currentSession.id);
    }, []);

    const getUserInfo = async () => {
        try{
            if(uid === ""){
                const currentUser = await AsyncStorage.getItem('currentUser');

                if(currentUser !== uid){
                    setUid(currentUser);
                }
            }
        }catch(error){
            Alert.alert(error.message);
        }

        try{
            const sessionId = await AsyncStorage.getItem('currentSession');

            if(sessionId !== currentSession.id){
                changeSession(sessionId);
            }
        }catch(error){
            Alert.alert(error.message);
        }
    }

    const changeSession = async (sessionId) => {
        try{
            await AsyncStorage.setItem('currentSession', sessionId);
        }catch(error){
            Alert.alert(error.message);
        }
        setCurrentSession(currentSession => ({...currentSession, id: sessionId}));

        try{
            firebase.database().ref(`sessions/${sessionId}/creator`).once('value', snapshot => {
                const data = snapshot.val();

                if(data !== null){
                    const prods = Object.values(data);
                    setCurrentSession(currentSession => ({...currentSession, creator: prods[0]}));
                }
            })
        }catch(error){
            Alert.alert(error.message);
        }

        getInstructions(sessionId);
    }

    const getInstructions = (sessionId) => {
        try{
            firebase.database().ref('sessions/' + sessionId + '/activities').on('value', snapshot => {
                const data = snapshot.val();

                if(data !== null){
                    const prods = Object.values(data);
                    const keys = Object.keys(data);
                    let prodArray = new Array();

                    if(prods.length > 0){
                        prods.map((item, index) => {
                            const key = keys[index];
                            const prod = {
                                time: item.time,
                                activity: item.activity,
                                key: keys[index]
                            }

                            prodArray.push(prod);
                        });

                        setInstructions(prodArray);
                    } else {
                        setInstructions(new Array());
                    }
                } else {
                    setInstructions(new Array());
                }
            })
        }catch(error){
            Alert.alert(error.message);
        }
    }

    const toggleOverlay = () => {
        setIsVisible(!isVisible);
        setInstruction({
            hours: '',
            minutes: '',
            activity: ''
        })
    }

    const toggleTimePicker = () =>{
        setShowTimePicker(true);
    }

    const changeTime = (event, selectedDate) => {
        if(!isNaN(Date.parse(selectedDate))){
            setShowTimePicker(false);
            setTime(selectedDate);
            let hours = selectedDate.getHours();

            if(hours < 10){
                hours = `0${hours}`;
            }

            setInstruction(instruction => ({...instruction, hours: hours}));
            let minutes = selectedDate.getMinutes();

            if(minutes < 10){
                minutes = `0${minutes}`;
            }

            setInstruction(instruction => ({...instruction, minutes: minutes}));
        } else {
            setShowTimePicker(false);
        }
        
    }

    const addActivity = () =>{
        try{
            firebase.database().ref(`sessions/${currentSession.id}/activities`).push({
                'time' : `${instruction.hours}:${instruction.minutes}`,
                'activity' : instruction.activity
            });
        }catch(error){
            Alert.alert(error.message);
        }

        toggleOverlay();
    }

    const deleteItem = (key) =>{
        try{
            firebase.database().ref(`sessions/${currentSession.id}/activities/${key}`).remove();
        }catch(error){
            Alert.alert(error.message);
        }
    
        if(instructions.length === 1){
            setInstructions([]);
        }
    }

    return(
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Header
                    containerStyle={styles.header}
                    centerComponent={{text: 'ACTIVITIES', style:{color: 'white'}}} />
            </View>
                {currentSession ? (
                    <View style={styles.homeContainer}>
                        {instructions.length > 0 &&
                            <FlatList
                                    contentContainerStyle={styles.list}
                                    data={instructions}
                                    keyExtractor={item => item.key}
                                    renderItem={({item}) =>
                                    <ListItem bottomDivider containerStyle={{width: 400, borderRadius: 20, marginVertical: 5}}>
                                        <ListItem.Content style={styles.listItemContent}>
                                            <View>
                                                <ListItem.Title style={{fontSize: 20}}>{item.time}</ListItem.Title>
                                                <ListItem.Subtitle style={{fontSize: 16}}>{item.activity}</ListItem.Subtitle>
                                            </View>
                                            <View style={{alignSelf:'center'}}>
                                                <Icon type='material' name='delete' color='red' onPress={() => deleteItem(item.key)}/>
                                            </View>
                                        </ListItem.Content>
                                    </ListItem>
                                    } />
                        }
                        {uid === currentSession.creator ? (
                            <View style={styles.actionContainer}>
                                <Icon
                                    reverse
                                    onPress={toggleOverlay}
                                    name='plus'
                                    type='font-awesome-5'
                                    color='blue'
                                    size={30} />
                                <View >
                                    <Overlay isVisible={isVisible} onBackdropPress={toggleOverlay} overlayStyle={{width: 410, height: 150}}>
                                        <View style={styles.overlayInputContainer}>
                                            <View style={styles.pickerContainer}>
                                                {instruction.hours ? (
                                                    <View style={styles.timeDisplay}>
                                                        <Text style={{fontSize: 25, alignSelf: 'center'}}>{instruction.hours}:{instruction.minutes}</Text>
                                                    </View>
                                                ) : (
                                                    <View style={styles.timeDisplay}>
                                                        <Text style={{fontSize: 16}}>No time selected</Text>
                                                    </View>
                                                )}
                                                <View style={styles.buttonContainer}>
                                                    <Button
                                                        title='CHANGE TIME'
                                                        onPress={toggleTimePicker} />
                                                </View>
                                                
                                            </View>
                                            <View style={{alignItems: 'center'}}>
                                                <View style={styles.overlayTextInputContainer}>
                                                    <Input
                                                        placeholder='Activity'
                                                        value={instruction.activity}
                                                        onChangeText={value => setInstruction(instruction => ({...instruction, activity: value}))} />
                                                </View>
                                                <View style={styles.buttonContainer}>
                                                    <Button
                                                        title='ADD ACTIVITY'
                                                        onPress={addActivity}
                                                        disabled={!instruction.activity} />
                                                </View>
                                            </View>
                                        </View>
                                    </Overlay>
                                </View>
                                {showTimePicker &&
                                    <DateTimePicker
                                        value={time}
                                        mode='time'
                                        is24Hour={true}
                                        display="default"
                                        onChange={changeTime} />}
                            </View>
                        ) : (null)}
                    </View>
                 ) : (null)}
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

    header: {
        height: 50,
        marginBottom: 5
    },

    homeContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: '100%'
    },

    instructionsContainer: {
        flex: 7,
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: 1000
    },

    list: {
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        width: 400
    },

    listItemContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 25,
    },

    actionContainer: {
        
    },

    overlayInputContainer: {
        flexDirection: 'row'
    },

    overlayTextInputContainer: {
        width: 250
    },

    pickerContainer: {

    },

    timeDisplay: {
        flex: 1,
        marginTop: 10,
        marginBottom: 50
    },

    buttonContainer: {
        width: 130
    }
});