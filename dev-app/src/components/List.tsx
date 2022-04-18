import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from '../colors';

type Props = {
  title?: string;
  description?: string;
  loading?: boolean;
  children: React.ReactElement | React.ReactElement[];
  topSpacing?: boolean;
  bolded?: boolean;
};

export default function List({
  title,
  children,
  description,
  loading,
  topSpacing = true,
  bolded = true,
}: Props) {
  return (
    <View style={[styles.container, topSpacing && styles.topSpacing]}>
      <View style={styles.titleContainer}>
        {title && (
          <Text style={[styles.title, bolded && styles.bolded]}>{title}</Text>
        )}
        {description ? (
          <Text style={styles.description}>{description}</Text>
        ) : (
          loading && (
            <View style={styles.description}>
              <ActivityIndicator />
            </View>
          )
        )}
      </View>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.dark_gray,
    paddingLeft: 16,
    marginVertical: 12,
  },
  bolded: {
    fontWeight: '600',
  },
  container: {
    marginBottom: 0,
  },
  description: {
    color: colors.dark_gray,
    paddingRight: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topSpacing: {
    marginTop: 22,
  },
});
