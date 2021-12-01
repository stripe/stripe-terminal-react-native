import React from 'react';
import { useStripeTerminal } from '../index';

export type WithStripeTerminalProps = ReturnType<typeof useStripeTerminal>;

/**
 *  withStripeTerminal HoC Component
 *
 * @example
 * ```ts
 *  function YourScreenComponent(props: WithStripeTerminalProps) { }
 *
 *  export default withStripeTerminal(YourScreenComponent);
 * ```
 * @param __namedParameters WithStripeTerminalProps
 * @returns JSX.Element
 * @category ReactComponents
 */
export function withStripeTerminal<Props>(
  WrappedComponent: React.ComponentType<Props>
) {
  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const ComponentWithStripeTerminal = (props: Props) => {
    const terminalProps = useStripeTerminal();

    return <WrappedComponent {...terminalProps} {...props} />;
  };

  ComponentWithStripeTerminal.displayName = `withStripeTerminal(${displayName})`;

  return ComponentWithStripeTerminal;
}
