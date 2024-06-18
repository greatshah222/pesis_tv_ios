import {StyleSheet, Text, View, Pressable} from 'react-native';
import React from 'react';

const CustomPressable = ({children, style, onPress}) => {
  return (
    <Pressable
      onPress={onPress}
      style={({pressed}) => [pressed && styles.pressed, style]}>
      {children}
    </Pressable>
  );
};

export default CustomPressable;

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.5,
  },
});
