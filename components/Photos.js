import React, {useState, useEffect} from 'react';
import { StyleSheet, Text, View, Alert, FlatList, AsyncStorage } from 'react-native';
import {Image, Header, Icon, Overlay, Input, Button} from 'react-native-elements'
import * as ImagePicker from 'expo-image-picker';
import * as firebase from 'firebase';

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

const storageRef = firebase.storage().ref();

export default function Photos({navigation}){
    const [uid, setUid] = useState('');
    const [currentSession, setCurrentSession] = useState({
        id: '',
        creator: '',
    });

    const [hasPermission, setHasPermission] = useState(false);
    const [images, setImages] = useState([]);
    const [imageName, setImageName] = useState('');
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        getUid();
        getMediaPermission();
        

        navigation.addListener('focus', () =>{
            getCurrentSession();
        })
    }, []);

    const getUid = async () => {
        try{
            const userId = await AsyncStorage.getItem('currentUser');

            if(userId !== uid && userId !== null){
                setUid(userId);
            }
        }catch(error){
            Alert.alert(error.message);
        }
    }

    const getMediaPermission = async () => {
        const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if(status === 'granted'){
            setHasPermission(true);
        }
    }

    const getCurrentSession = async () => {
        try{
            const sessionId = await AsyncStorage.getItem('currentSession');

            if(sessionId !== currentSession.id){
                setCurrentSession(currentSession => ({...currentSession, id: sessionId}));
    
                firebase.database().ref(`sessions/${sessionId}/creator`).once('value', snapshot => {
                    const data = snapshot.val();
        
                    if(data !== null){
                        const prods = Object.values(data);
                        setCurrentSession(currentSession => ({...currentSession, creator: prods[0]}));
                    }
                })
                updateImageList(sessionId);
            }
        }catch(error){
            Alert.alert(error.message);
        }
    }

    const toggleOverlay = () => {
        setIsVisible(!isVisible);
        setImageName('');
    }

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images
        });

        if (!result.cancelled) {
            uploadPhoto(result.uri);
        }
    }

    const takePicture = async () => {
        let result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
            base64: true
        })

        if(!result.cancelled){
            uploadPhoto(result.uri);
        }
    }

    const uploadPhoto = async (uri) => {
        const storagePath = storageRef.child(`sessions/${currentSession.id}/${imageName}.jpg`);

        try{
            const response = await fetch(uri);
            const blob = await response.blob();
            await storagePath.put(blob);
            const downloadURL = await storagePath.getDownloadURL();

            await firebase.database().ref(`sessions/${currentSession.id}/images`).push({
                'downloadURL' : downloadURL,
                'name' : imageName
            })
        }catch(error){
            Alert.alert(error.message);
        }
        

        toggleOverlay();
        updateImageList(currentSession.id);
    }

    const promptDelete = (name, key) => {
        Alert.alert(
            `Delete image ${name}?`, '',
            [
                {
                    text: "Cancel",
                    onPress: () => null,
                    style: "cancel"
                },
                { text: "OK", onPress: () =>
                    deleteImage(name, key)    
                }
            ],
            { cancelable: false }
          );
    }

    const deleteImage = (name, key) => {
        firebase.database().ref(`sessions/${currentSession.id}/images/${key}`).remove();
        storageRef.child(`sessions/${currentSession.id}/${name}.jpg`).delete();
        updateImageList(currentSession.id);
    }

    const updateImageList = (sessionId) => {
        try{
            firebase.database().ref(`sessions/${sessionId}/images`).once('value', snapshot => {
                const data = snapshot.val();
    
                if(data !== null){
                    const prods = Object.values(data);
                    const keys = Object.keys(data);
                    let prodArray = new Array();
    
                    if(prods.length > 0){
                        prods.map((item, index) => {
                            const prod = {
                                name: item.name,
                                downloadURL: item.downloadURL,
                                key: keys[index]
                            }
    
                            prodArray.push(prod);
                        });
                    }
    
                        setImages(prodArray);
                } else{
                    setImages(new Array());
                }
            })
        }catch(error){
            Alert.alert(error.message);
        }
    }

    return(
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Header
                    containerStyle={styles.header}
                    centerComponent={{text: 'IMAGES', style:{color: 'white', fontSize: 20}}} />
            </View>
            <View style={styles.photoContainer}>
                <View style={styles.listContainer}>
                    <FlatList
                        contentContainerStyle={styles.list}
                        data={images}
                        keyExtractor={item => item.key}
                        renderItem={({item}) =>
                            <View style={styles.listItem} key={item.key}>
                                <View style={styles.listHeader}>
                                    <Text style={{fontSize: 20, color: 'white'}}>{item.name.toUpperCase()}</Text>
                                </View>
                                <View>
                                    <Image source={{uri: item.downloadURL}} onLongPress={() => promptDelete(item.name, item.key)} style={{ height: 300, width: 300 }} />
                                </View>
                            </View>
                        } />
                </View>
            </View>
            {uid === currentSession.creator ? (
                    <View style={styles.actionContainer}>
                        <Icon
                            reverse
                            onPress={toggleOverlay}
                            name='plus'
                            type='font-awesome-5'
                            color='blue'
                            size={30}
                            disabled={!hasPermission} />
                    </View>
                ) : (null)
            }
            <View>
                <Overlay isVisible={isVisible} onBackdropPress={toggleOverlay} overlayStyle={{width: 300, height: 150}}>
                    <View>
                        <Input
                            placeholder='Name of the image'
                            value={imageName}
                            onChangeText={value => {setImageName(value)}} />
                    </View>
                    <View style={{flexDirection: 'row', justifyContent: 'space-around'}}>
                        <Button
                            title=' CAMERA'
                            onPress={takePicture}
                            disabled={!imageName}
                            icon={
                                <Icon
                                    name='camera'
                                    type='font-awesome-5'
                                    color='white'
                                    size={20} />
                            } />
                        <Button
                            title=' GALLERY'
                            onPress={pickImage}
                            disabled={!imageName}
                            icon={
                                <Icon
                                    name='image'
                                    type='font-awesome-5'
                                    color='white'
                                    size={20} />
                            } />
                    </View>
                </Overlay>
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

    header: {
        height: 50,
        marginBottom: 5
    },

    photoContainer: {
        flex: 100
    },

    listContainer: {
    },

    actionContainer: {
        flexGrow: 1
    },

    listItem: {
        alignItems: 'center',
        marginVertical: 10
    },

    listHeader: {
        alignItems: 'center',
        backgroundColor: '#3D6DCC',
        height: 40,
        justifyContent: 'center',
        marginBottom: 10,
        width: 400
    }
  });