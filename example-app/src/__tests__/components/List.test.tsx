import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import List from '../../components/List';

describe('List', () => {
  it('renders children', () => {
    const { getByText } = render(
      <List>
        <Text>Child Item</Text>
      </List>
    );
    expect(getByText('Child Item')).toBeTruthy();
  });

  it('renders title when provided', () => {
    const { getByText } = render(
      <List title="SECTION TITLE">
        <Text>Child</Text>
      </List>
    );
    expect(getByText('SECTION TITLE')).toBeTruthy();
  });

  it('does not render title when omitted', () => {
    const { queryByText } = render(
      <List>
        <Text>Child</Text>
      </List>
    );
    expect(queryByText('SECTION TITLE')).toBeNull();
  });

  it('renders description when provided', () => {
    const { getByText } = render(
      <List description="Some description">
        <Text>Child</Text>
      </List>
    );
    expect(getByText('Some description')).toBeTruthy();
  });

  it('renders ActivityIndicator when loading and no description', () => {
    const { UNSAFE_getByType } = render(
      <List loading>
        <Text>Child</Text>
      </List>
    );
    const { ActivityIndicator } = require('react-native');
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('does not render ActivityIndicator when description is provided with loading', () => {
    const { UNSAFE_queryByType } = render(
      <List loading description="loaded">
        <Text>Child</Text>
      </List>
    );
    const { ActivityIndicator } = require('react-native');
    expect(UNSAFE_queryByType(ActivityIndicator)).toBeNull();
  });

  it('renders multiple children', () => {
    const { getByText } = render(
      <List>
        <Text>First</Text>
        <Text>Second</Text>
      </List>
    );
    expect(getByText('First')).toBeTruthy();
    expect(getByText('Second')).toBeTruthy();
  });
});
