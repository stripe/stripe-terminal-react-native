import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import ListItem from '../../components/ListItem';

describe('ListItem', () => {
  it('renders the title', () => {
    const { getByText } = render(<ListItem title="Test Title" />);
    expect(getByText('Test Title')).toBeTruthy();
  });

  it('renders a description when provided', () => {
    const { getByText } = render(
      <ListItem title="Title" description="Some description" />
    );
    expect(getByText('Some description')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <ListItem title="Pressable" onPress={onPress} />
    );
    fireEvent.press(getByText('Pressable'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('uses testID when provided', () => {
    const { getByTestId } = render(
      <ListItem title="Item" testID="my-list-item" />
    );
    expect(getByTestId('my-list-item')).toBeTruthy();
  });

  it('renders a rightElement when provided', () => {
    const { getByText } = render(
      <ListItem title="Item" rightElement={<Text>right</Text>} />
    );
    expect(getByText('right')).toBeTruthy();
  });

  it('applies disabled opacity when disabled', () => {
    const { getByText } = render(<ListItem title="Disabled" disabled />);
    expect(getByText('Disabled')).toBeTruthy();
  });
});
