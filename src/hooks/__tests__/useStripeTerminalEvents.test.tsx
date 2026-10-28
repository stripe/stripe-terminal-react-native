import * as React from 'react';
import { act, renderHook } from '@testing-library/react-native';
import { StripeTerminalContext } from '../../components/StripeTerminalContext';
import {
  FINISH_INSTALLING_UPDATE,
  REPORT_UPDATE_PROGRESS,
  START_INSTALLING_UPDATE,
  UPDATE_REQUIREMENTS_AVAILABLE,
  useStripeTerminal,
} from '../useStripeTerminal';
import { useListener } from '../useListener';
import type { Reader, StripeError } from '../../types';

jest.mock('../useListener', () => ({
  useListener: jest.fn(),
}));

const setConnectedReader = jest.fn();

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <StripeTerminalContext.Provider
    value={{
      loading: false,
      isInitialized: false,
      getIsInitialized: () => false,
      discoveredReaders: [],
      connectedReader: null,
      setLoading: jest.fn(),
      setConnectedReader,
      setDiscoveredReaders: jest.fn(),
      log: jest.fn(),
    }}
  >
    {children}
  </StripeTerminalContext.Provider>
);

describe('useStripeTerminal events', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delivers Tap to Pay update requirements to the public callback', () => {
    const onDidUpdateRequirementsAvailable = jest.fn();
    const requirements: Reader.TapToPayUpdateRequirement[] = [
      { type: 'operatingSystem', apiLevel: 35, requiredAt: '123' },
      { type: 'securityPatch', version: '2026-09-01', requiredAt: '456' },
      { type: 'terminalSdk', version: '6.1.0', requiredAt: '789' },
    ];

    renderHook(
      () => useStripeTerminal({ onDidUpdateRequirementsAvailable }),
      { wrapper }
    );

    const listener = (useListener as jest.Mock).mock.calls.find(
      ([name]) => name === UPDATE_REQUIREMENTS_AVAILABLE
    )?.[1];

    expect(listener).toEqual(expect.any(Function));
    act(() => listener({ result: requirements }));
    expect(onDidUpdateRequirementsAvailable).toHaveBeenCalledWith(requirements);
  });

  it.each([true, false])(
    'delivers the update-start reader when supplied: %s, without marking it connected',
    (hasReader) => {
      const onDidStartInstallingUpdate = jest.fn();
      const update: Reader.SoftwareUpdate = {
        deviceSoftwareVersion: '1.2.4',
        estimatedUpdateTime: 'estimate1To2Minutes',
        requiredAt: '0',
        components: [],
        isTestUpdate: true,
      };
      const reader: Reader.Type = {
        serialNumber: 'TEST_READER',
        deviceSoftwareVersion: '1.2.3',
        deviceType: 'stripeM2',
        locationStatus: 'set',
        status: 'offline',
      };
      const { result } = renderHook(
        () => useStripeTerminal({ onDidStartInstallingUpdate }),
        { wrapper }
      );
      const listener = (useListener as jest.Mock).mock.calls.find(
        ([name]) => name === START_INSTALLING_UPDATE
      )?.[1];

      act(() => listener({ result: update, ...(hasReader ? { reader } : {}) }));

      expect(onDidStartInstallingUpdate).toHaveBeenCalledWith(
        update,
        hasReader ? reader : undefined
      );
      expect(result.current.connectedReader).toBeNull();
      expect(setConnectedReader).not.toHaveBeenCalled();
    }
  );

  it('delivers software update completion and progress values', () => {
    const onDidFinishInstallingUpdate = jest.fn();
    const onDidReportReaderSoftwareUpdateProgress = jest.fn();
    const update: Reader.SoftwareUpdate = {
      deviceSoftwareVersion: '1.2.3',
      estimatedUpdateTime: 'estimate1To2Minutes',
      requiredAt: '0',
      components: [],
      isTestUpdate: true,
    };
    const error = {} as StripeError;

    renderHook(
      () =>
        useStripeTerminal({
          onDidFinishInstallingUpdate,
          onDidReportReaderSoftwareUpdateProgress,
        }),
      { wrapper }
    );

    const finishListener = (useListener as jest.Mock).mock.calls.find(
      ([name]) => name === FINISH_INSTALLING_UPDATE
    )?.[1];
    const progressListener = (useListener as jest.Mock).mock.calls.find(
      ([name]) => name === REPORT_UPDATE_PROGRESS
    )?.[1];

    act(() => {
      finishListener({});
      finishListener({ result: update, error });
      progressListener({ result: { progress: 0.5 } });
    });

    expect(onDidFinishInstallingUpdate).toHaveBeenNthCalledWith(
      1,
      undefined,
      undefined
    );
    expect(onDidFinishInstallingUpdate).toHaveBeenNthCalledWith(
      2,
      update,
      error
    );
    expect(onDidReportReaderSoftwareUpdateProgress).toHaveBeenCalledWith(0.5);
  });
});
