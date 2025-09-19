import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  Pressable,
  View,
  Platform,
} from 'react-native';

interface AlertButton {
  text?: string | undefined;
  onPress?: ((value?: string) => void) | undefined;
}

export default function AlertDialog({
  visible,
  title,
  message,
  buttons,
  onDismiss = () => { },
}: {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  onDismiss?: () => void;
}) {
  const androidDefaults = {
    container: {
      backgroundColor: '#FAFAFA',
    },
    title: {
      color: '#000000',
      fontFamily: 'initial',
      fontSize: 22,
      fontWeight: 'bold',
    },
    message: {
      color: '#000000',
      fontFamily: 'initial',
      fontSize: 15,
      fontWeight: 'normal',
    },
    button: {
      color: '#387ef5',
      fontFamily: 'initial',
      fontSize: 16,
      fontWeight: '500',
      textTransform: 'uppercase',
      backgroundColor: 'transparent',
    },
  };
  const iOSDefaults = {
    container: {
      backgroundColor: '#F8F8F8',
    },
    title: {
      color: '#000000',
      fontFamily: 'initial',
      fontSize: 17,
      fontWeight: '600',
    },
    message: {
      color: '#000000',
      fontFamily: 'initial',
      fontSize: 13,
      fontWeight: 'normal',
    },
    button: {
      color: '#387ef5',
      fontFamily: 'initial',
      fontSize: 17,
      fontWeight: '500',
      textTransform: 'none',
      backgroundColor: 'transparent',
    },
  };

  const AndroidButtonBox = () => {
    const [buttonLayoutHorizontal, setButtonLayoutHorizontal] = useState(1);

    return (
      <View
        style={[
          styles.androidButtonGroup,
          {
            flexDirection: buttonLayoutHorizontal === 1 ? 'row' : 'column',
          },
        ]}
        onLayout={(e) => {
          if (e.nativeEvent.layout.height > 60) setButtonLayoutHorizontal(0);
        }}
      >
        {buttons?.map((item, index) => {
          if (index > 2) return null;
          const alignSelfProperty =
            buttons.length > 2 && index === 0 && buttonLayoutHorizontal === 1
              ? 'flex-start'
              : 'flex-end';
          let defaultButtonText = 'OK';
          if (buttons.length > 2) {
            if (index === 0) defaultButtonText = 'ASK ME LATER';
            else if (index === 1) defaultButtonText = 'CANCEL';
          } else if (buttons.length === 2 && index === 0) {
            defaultButtonText = 'CANCEL';
          }
          return (
            <View
              key={index}
              style={[
                styles.androidButton,
                index === 0 && buttonLayoutHorizontal === 1 ? { flex: 1 } : {},
              ]}
            >
              <Pressable
                onPress={() => {
                  if (item.onPress) {
                    item.onPress();
                  }
                }}
                style={[
                  {
                    alignSelf: alignSelfProperty,
                  },
                ]}
              >
                <View
                  style={[
                    styles.androidButtonInner,
                    { backgroundColor: androidDefaults.button.backgroundColor },
                  ]}
                >
                  <Text
                    style={[
                      {
                        color: '#008577',
                        fontFamily: 'initial',
                        fontSize: 16,
                        fontWeight: '500',
                        textTransform: 'uppercase',
                        marginRight: 12,
                      },
                    ]}
                  >
                    {item.text || defaultButtonText}
                  </Text>
                </View>
              </Pressable>
            </View>
          );
        })}
      </View>
    );
  };
  const IOSButtonBox = () => {
    const [buttonLayoutHorizontal, setButtonLayoutHorizontal] = useState(
      buttons?.length === 2 ? 1 : 0
    );

    return (
      <View
        style={[
          styles.iOSButtonGroup,
          {
            flexDirection: buttonLayoutHorizontal === 1 ? 'row' : 'column',
          },
        ]}
        onLayout={(e) => {
          if (e.nativeEvent.layout.height > 60) setButtonLayoutHorizontal(0);
        }}
      >
        {buttons?.map((item, index) => {
          let defaultButtonText = 'OK';
          if (buttons.length > 2) {
            if (index === 0) defaultButtonText = 'ASK ME LATER';
            else if (index === 1) defaultButtonText = 'CANCEL';
          } else if (buttons.length === 2 && index === 0)
            defaultButtonText = 'CANCEL';
          let singleButtonWrapperStyle = {
            minWidth: '50%',
            borderStyle: 'solid',
            borderRightWidth: 0.55,
            borderRightColor: '#dbdbdf',
          };
          if (buttonLayoutHorizontal === 1) {
            singleButtonWrapperStyle.minWidth = '50%';
            if (index === 0) {
              singleButtonWrapperStyle.borderStyle = 'solid';
              singleButtonWrapperStyle.borderRightWidth = 0.55;
              singleButtonWrapperStyle.borderRightColor = '#dbdbdf';
            }
          }
          return (
            <View
              key={index}
              style={[
                styles.iOSButton,
                { minWidth: buttonLayoutHorizontal === 1 ? '50%' : 'auto' },
              ]}
            >
              <Pressable
                onPress={() => {
                  if (item.onPress) {
                    item.onPress();
                  }
                }}
              >
                <View
                  style={[
                    styles.iOSButtonInner,
                    { backgroundColor: iOSDefaults.button.backgroundColor },
                  ]}
                >
                  <Text
                    style={{
                      color: '#387ef5',
                      fontFamily: 'initial',
                      fontSize: 18,
                      fontWeight: '500',
                      textTransform: 'none',
                      textAlign: 'center',
                    }}
                  >
                    {item.text || defaultButtonText}
                  </Text>
                </View>
              </Pressable>
            </View>
          );
        })}
      </View>
    );
  };
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onDismiss}
    >
      <Pressable
        style={[
          Platform.OS === 'ios' ? styles.iOSBackdrop : styles.androidBackdrop,
          styles.backdrop,
        ]}
        onPress={onDismiss}
      />
      <View style={styles.alertBox}>
        {Platform.OS === 'ios' ? (
          <View style={styles.iOSAlertBox}>
            <Text style={styles.iOSTitle}>{title || 'Message'}</Text>
            <Text style={styles.iOSMessage}>{message || ''}</Text>
            <IOSButtonBox />
          </View>
        ) : (
          <View style={styles.androidAlertBox}>
            <Text style={styles.androidTitle}>{title || 'Message'}</Text>
            <Text style={styles.androidMessage}>{message || ''}</Text>
            <AndroidButtonBox />
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },

  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  buttonOpen: {
    backgroundColor: '#F194FF',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },

  iOSBackdrop: {
    backgroundColor: '#000000',
    opacity: 0.3,
  },
  androidBackdrop: {
    backgroundColor: '#232f34',
    opacity: 0.4,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  alertBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  androidAlertBox: {
    backgroundColor: '#FAFAFA',
    maxWidth: 310,
    width: '100%',
    margin: 48,
    elevation: 24,
    borderRadius: 2,
  },
  androidTitle: {
    color: '#000000',
    fontFamily: 'initial',
    fontSize: 22,
    fontWeight: '500',
    marginTop: 18,
    marginBottom: 10,
    marginLeft: 24,
    marginRight: 24,
  },
  androidMessage: {
    color: '#202020',
    fontFamily: 'initial',
    fontSize: 18,
    fontWeight: 'normal',
    marginLeft: 24,
    marginRight: 24,
    marginBottom: 8,
  },
  androidButtonGroup: {
    marginTop: 0,
    marginRight: 0,
    marginBottom: 8,
    marginLeft: 24,
  },
  androidButton: {
    color: '#387ef5',
    fontFamily: 'initial',
    fontSize: 16,
    fontWeight: '500',
    textTransform: 'uppercase',
    backgroundColor: 'transparent',
    marginTop: 12,
    marginRight: 8,
  },
  androidButtonInner: {
    padding: 10,
  },

  iOSAlertBox: {
    backgroundColor: '#F8F8F8',
    maxWidth: 270,
    width: '100%',
    zIndex: 10,
    borderRadius: 13,
  },
  iOSTitle: {
    color: '#000000',
    fontFamily: 'initial',
    fontSize: 18,
    fontWeight: '600',
    paddingTop: 12,
    paddingRight: 16,
    paddingBottom: 7,
    paddingLeft: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  iOSMessage: {
    color: '#000000',
    fontFamily: 'initial',
    fontSize: 14,
    fontWeight: 'normal',
    paddingTop: 0,
    paddingRight: 16,
    paddingBottom: 21,
    paddingLeft: 16,
    textAlign: 'center',
  },
  iOSButtonGroup: {
    marginRight: -0.55,
  },
  iOSButton: {
    color: '#387ef5',
    fontFamily: 'initial',
    fontSize: 18,
    fontWeight: '500',
    textTransform: 'none',
    backgroundColor: 'transparent',
    borderTopColor: '#dbdbdf',
    borderTopWidth: 0.55,
    borderStyle: 'solid',
  },
  iOSButtonInner: {
    minHeight: 44,
    justifyContent: 'center',
  },
});
