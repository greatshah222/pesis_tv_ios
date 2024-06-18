import { ActivityIndicator } from 'react-native';
import React, { useContext } from 'react';

import AuthNavigator from './AuthNavigator';
import DrawerNavigator from './DrawerNavigator';
import { GlobalContext } from '../context/reducers/Provider';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from './RootNavigator';

const AppNavContainer = () => {
  const {
    authState: { isLoggedIn },
    user,
    setUser,
  } = useContext(GlobalContext);
  const [isAuthenticated, setIsAuthenticated] = React.useState(isLoggedIn);
  const [authLoaded, setAuthLoaded] = React.useState(false);

  React.useEffect(() => {
    // get user from async storage
    const fetchUserFromCookie = async () => {
      try {
        // it is for
        const removeCookie = async () => {
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('userId');
        };
        // removeCookie();

        const token = await AsyncStorage.getItem('token');
        console.log('token', token);
        if (token) {
          const userOrgId = await AsyncStorage.getItem('userOrgId');
          const userId = await AsyncStorage.getItem('userId');
          setIsAuthenticated(true);
          setAuthLoaded(true);
          setUser({
            isLoggedIn: true,
            userOrganizationId: userOrgId,
            token,
            userId,
          });
        } else {
          setIsAuthenticated(false);
          setAuthLoaded(true);
        }
      } catch (error) {}
    };

    fetchUserFromCookie();
    /// whenver isLoggedIn value change we want to tun this function again cause logout will change only isLoggedIn value but not isAuthenticated
  }, [isLoggedIn]);
  console.log('isLoggedIn', isLoggedIn);

  return (
    <>
      {/* // we are passing navigation ref */}
      {/* // cause naviagtion is not able everwhere expecially in data files  */}
      {authLoaded ? (
        <NavigationContainer ref={navigationRef}>
          {isAuthenticated ? <DrawerNavigator /> : <AuthNavigator />}
        </NavigationContainer>
      ) : (
        <ActivityIndicator color={'black'} size='large' style={{ flex: 1 }} />
      )}
    </>
  );
};

export default AppNavContainer;
