import { useNavigation } from '@react-navigation/core';
import React, { useContext, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, PixelRatio } from 'react-native';
import Canvas from 'react-native-canvas';
import { useStripeTerminal } from '@stripe/stripe-terminal-react-native';
import { colors } from '../colors';
import { LogContext } from '../components/LogContext';
import { DevAppError } from '../errors/DevAppError';

import List from '../components/List';
import ListItem from '../components/ListItem';
import type { NavigationProp } from '@react-navigation/native';
import type { RouteParamList } from '../App';
import { launchImageLibrary } from 'react-native-image-picker';

export default function PrintContentScreen() {
  const canvasRef = useRef<Canvas>(null);
  const { addLogs, clearLogs } = useContext(LogContext);
  const navigation = useNavigation<NavigationProp<RouteParamList>>();
  const { print } = useStripeTerminal();

  useEffect(() => {
    if (canvasRef.current) {
      drawTestContent(canvasRef.current);
    }
  }, []);

  const _printImageFromLibrary = async () => {
    const result = await launchImageLibrary({
      includeBase64: true,
      mediaType: 'photo',
    });
    if (result.assets && result.assets[0].base64) {
      _print(result.assets[0].base64);
    }
  };

  const _printGeneratedTestImage = async () => {
    if (canvasRef.current) {
      const testImageUri = await canvasRef.current.toDataURL();
      _print(testImageUri.replace(/^"|"$/g, ''));
    }
  };

  const _print = async (contentUri: string) => {
    clearLogs();
    navigation.navigate('LogListScreen', {});

    addLogs({
      name: 'Print Content',
      events: [
        {
          name: 'Print Content',
          description: 'terminal.print',
        },
      ],
    });

    const { error } = await print(contentUri);

    if (error) {
      const devError = DevAppError.fromStripeError(error);
      addLogs({
        name: 'Print Content',
        events: [
          {
            name: 'Printing failed',
            description: 'terminal.print',
            metadata: devError.toJSON(),
          },
        ],
      });
    } else {
      addLogs({
        name: 'Print Content',
        events: [
          {
            name: 'Printing succeeded',
            description: 'terminal.print',
          },
        ],
      });
    }
  };

  return (
    <View style={styles.container}>
      <List bolded={false} topSpacing={false} title=" ">
        <ListItem
          color={colors.blue}
          title="Print image from library"
          onPress={_printImageFromLibrary}
        />
        <ListItem
          color={colors.blue}
          title="Print generated test image"
          onPress={_printGeneratedTestImage}
        />
      </List>
      <Text style={styles.previewText}>Generated Test Image Preview</Text>
      <Canvas ref={canvasRef} style={styles.canvas} />
    </View>
  );
}

function drawTestContent(canvas: Canvas) {
  const ctx = canvas.getContext('2d')!;
  // react-native-canvas auto scales image depending on the device's pixel ratio.
  // Scale the canvas to 1/pixelRatio of the original size to undo the auto scaling.
  const scaleFactor = 1 / PixelRatio.get();
  canvas.width = 384 * scaleFactor;
  canvas.height = 500 * scaleFactor;
  ctx.scale(scaleFactor, scaleFactor);

  // Clear canvas with white background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, 384, 500);

  // Draw a border
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, 364, 480);

  // Draw some geometric shapes
  ctx.fillStyle = 'black';

  // Rectangle
  ctx.fillRect(30, 30, 80, 60);

  // Circle
  ctx.beginPath();
  ctx.arc(200, 60, 30, 0, 2 * Math.PI);
  ctx.fill();

  // Triangle
  ctx.beginPath();
  ctx.moveTo(300, 30);
  ctx.lineTo(350, 90);
  ctx.lineTo(250, 90);
  ctx.closePath();
  ctx.fill();

  // Draw some lines
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i += 1) {
    ctx.beginPath();
    ctx.moveTo(30 + i * 20, 120);
    ctx.lineTo(30 + i * 20, 150);
    ctx.stroke();
  }

  // Draw a grid pattern
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;
  for (let x = 50; x < 334; x += 20) {
    ctx.beginPath();
    ctx.moveTo(x, 180);
    ctx.lineTo(x, 220);
    ctx.stroke();
  }
  for (let y = 180; y < 220; y += 10) {
    ctx.beginPath();
    ctx.moveTo(50, y);
    ctx.lineTo(330, y);
    ctx.stroke();
  }

  // Draw some dots
  ctx.fillStyle = 'black';
  for (let i = 0; i < 8; i += 1) {
    ctx.beginPath();
    ctx.arc(50 + i * 40, 250, 3, 0, 2 * Math.PI);
    ctx.fill();
  }

  // Add more content to fill the extra height
  // Draw a zigzag pattern
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(50, 300);
  for (let i = 0; i < 8; i += 1) {
    const x = 50 + i * 40;
    const y = 300 + (i % 2) * 30;
    ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Draw some circles in a pattern
  ctx.fillStyle = 'black';
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 6; col += 1) {
      ctx.beginPath();
      ctx.arc(60 + col * 50, 350 + row * 40, 8, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  // Add text at the bottom
  ctx.fillStyle = 'black';
  ctx.font = '26px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Generated with React Native', 192, 480);
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.light_gray,
    height: '100%',
  },
  previewText: {
    fontSize: 14,
    fontWeight: 'bold',
    margin: 10,
    textAlign: 'center',
  },
  canvas: {
    alignSelf: 'center',
  },
});
