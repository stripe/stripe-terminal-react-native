import React from 'react';
import { useStripeTerminal } from '../index';

/**
 * Public SDK functions and state returned by {@link useStripeTerminal} and
 * injected by {@link withStripeTerminal}. Use inside {@link StripeTerminalProvider}.
 *
 * @interface
 */
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
 * @returns React.JSX.Element
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
