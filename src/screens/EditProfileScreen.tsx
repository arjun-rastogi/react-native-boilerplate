import { StatusBar } from 'expo-status-bar';
import React, {useState, useEffect, useRef} from 'react';
import { View, SafeAreaView, StyleSheet, TextInput, TouchableOpacity, ImageBackground, Alert } from 'react-native';
import { Avatar, Icon,  Text, Button  } from 'react-native-elements';
import { useAuthentication } from './../utils/hooks/useAuthentication';
import { StackScreenProps } from '@react-navigation/stack';
import { getAuth, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db, storage } from '../config/firebase';
import Animated, { log } from 'react-native-reanimated';
import BottomSheet from 'reanimated-bottom-sheet';
import * as ImagePicker from 'expo-image-picker';
import { ref,  uploadBytes, getDownloadURL } from "firebase/storage";

type Props = {}

const EditProfileScreen: React.FC<StackScreenProps<any>> = ({ navigation }) => {
    const [loading, setLoading] = useState(true);
    
    const [data, setData] = useState<null | any>(null);
    const [image, setImage] = useState<null | any>(null);

    const { user } = useAuthentication();
    const bs = useRef<BottomSheet>(null);
    const fall = new Animated.Value(1);
    
    const getUser = async() => {
      const document = doc(db, "users" ,`${user?.uid}`);
      await getDoc(document).then(docSnap => {
        if (docSnap.exists()) {
          
          setData(docSnap.data());
        } else {
          console.log("No such document!");
        }
      });    
    }

    const handleUpdate = () => {
    uploadImage(image);

    const document = doc(db, "users" ,`${user?.uid}`);
    getDoc(document).then(docSnap => {
      if(docSnap.exists()) {
        updateDoc(doc(db, 'users', `${user?.uid}`), {
          fullName: data.fullName,
          phoneNumber: data.phoneNumber,
          photoURL:  image,
        })
        console.log('User Updated!');
        Alert.alert(
          'Profile Updated!',
          'Your profile has been updated successfully.'
        );
      } else {
        Alert.alert(
          'There is an issue in updating your profile!',
        );
      }
    });

    }

    const uploadImage = async (image : any) => {
      const uploadUri = image;
      let filename = uploadUri.substring(uploadUri.lastIndexOf('/') + 1);
      const storageRef  = ref(storage, 'images/' + filename);
      const response = await fetch(image);
      const blob = await response.blob();
  
      uploadBytes(storageRef, blob)
        .then(() => {
          getDownloadURL(storageRef).then(url => {
            setImage(url)
            return url;
          })
        })
        .catch((error) => {
          console.log(`Upload failed: ${error}`);
        });
    };

    useEffect(() => {
      if(user) getUser();
      navigation.addListener("focus", () => setLoading(!loading));
    }, [navigation, loading, user]);


    const takePhotoFromCamera = async() => {
      let result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
  
 
      if (!result.canceled) {
        console.log("result camnera", result);
        setImage(result.assets[0].uri);
      }
    };
  
    const choosePhotoFromLibrary = async() => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        alert("Sorry, we need camera roll permissions to make this work!");
      }
      if (status === "granted") {
        let result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.All,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 1,
        });
    
        
        if (!result.canceled) {
          console.log("result gallery", result);
          setImage(result.assets[0].uri);
        }
      }
    };

    const renderInner = () => (
      <View className='p-5 bg-white pt-5'>
        <View className='items-center'>
        <Text className='text-2xl'>Upload Photo</Text>
          <Text className='text-sm text-gray-700 h-8 mb-3'>Choose Your Profile Picture</Text>
        </View>
        <TouchableOpacity className='p-3 rounded-xl bg-rose-700 items-center my-2' onPress={takePhotoFromCamera}>
          <Text className='p-3 font-bold text-white'>Take Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity className='p-3 rounded-xl bg-rose-700 items-center my-2' onPress={choosePhotoFromLibrary}>
          <Text className='p-3 font-bold text-white'>Choose From Library</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className='p-3 rounded-xl bg-rose-700 items-center my-2'
          onPress={(event) => { if (bs.current) { bs.current.snapTo(1);} }}
          >
          <Text className='p-3 font-bold text-white'>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  
    const renderHeader = () => (
      <View className='bg-white shadow-gray-500 pt-5 rounded-tl-3xl rounded-tr-3xl'>
        <View className='items-center'>
          <View className='w-10 h-2 rounded-md bg-black mb-3' />
        </View>
      </View>
    );

    console.log("user data", data);

    return (
    <>
    <SafeAreaView className='flex-1 bg-white'>


    <BottomSheet
        ref={bs}
        snapPoints={[330, 0]}
        renderContent={renderInner}
        renderHeader={renderHeader}
        initialSnap={1}
        callbackNode={fall}
        enabledGestureInteraction={true}
     />

     <Animated.View style={{margin: 20,
        opacity: Animated.add(0.1, Animated.multiply(fall, 1.0)),
    }}>
    
    <View className='items-center'>
      <TouchableOpacity 
      onPress={(event) => {
        if (bs.current) {
          bs.current.snapTo(0);
        }
      }}
      >
        <View className='h-24 w-24 rounded-2xl justify-center items-center'>
        <ImageBackground
                source={{
                  uri: image
                    ? image
                    : data
                    ? data.photoURL ||
                      'https://lh5.googleusercontent.com/-b0PKyNuQv5s/AAAAAAAAAAI/AAAAAAAAAAA/AMZuuclxAM4M1SCBGAO7Rp-QP6zgBEUkOQ/s96-c/photo.jpg'
                    : 'https://lh5.googleusercontent.com/-b0PKyNuQv5s/AAAAAAAAAAI/AAAAAAAAAAA/AMZuuclxAM4M1SCBGAO7Rp-QP6zgBEUkOQ/s96-c/photo.jpg',
                }}
                className="h-24 w-24 rounded-2xl"
                >

                <View className='flex-1 justify-center items-center'>
                  <Icon
                    name="camera"
                    size={35}
                    color="#777777"
                    className='opacity-70 items-center justify-center border-black rounded-2xl'
                  />
                </View>

         </ImageBackground>
        </View>
      </TouchableOpacity>
      <Text h4>{data ? data.fullName || 'Test' : 'Test'}</Text>
    </View>


      <View className='px-8'>
      <View className='flex-row mb-5'>
        <Icon name='user-o' type='font-awesome' color="#777777" size={20} className="pt-1" />
        <TextInput 
         placeholder="Full Name"
         placeholderTextColor="#666666"
         value={data ? data.fullName : ''}
         onChangeText={(txt) => setData({...data, fullName: txt})}
         autoCorrect={false}
         className="text-xl text-gray-800 ml-5"
         />

      </View>
      </View>

      <View className='px-8'>
      <View className='flex-row mb-5'>
        <Icon name='phone' type='font-awesome' color="#777777" size={20} className="pt-1" />
        <TextInput 
         placeholder="Phone Number"
         keyboardType="number-pad"
         value={data ? data.phoneNumber : ''}
         onChangeText={(txt) => setData({...data, phoneNumber: txt})}
         placeholderTextColor="#666666"
         autoCorrect={false}
         className="text-xl text-gray-800 ml-5"
         />

      </View>
      </View>


      <TouchableOpacity className='p-2 rounded-xl bg-cyan-800 items-center mt-3'  onPress={handleUpdate}>
          <Text className='text-white' h4>Submit</Text>
      </TouchableOpacity>
      </Animated.View>

    </SafeAreaView>

    </>
  )
}

export default EditProfileScreen