/**
 * Button Component - JSX version with interactive states
 *
 * A versatile button component with:
 * - Multiple variants (primary, secondary, success, danger, etc.)
 * - Size options (small, medium, large)
 * - Loading and disabled states
 * - Keyboard and mouse interaction
 * - Icon support
 *
 * @example
 * ```tsx
 * import { Button } from 'tuix/components/forms/button'
 *
 * function MyApp() {
 *   const loading = $state(false)
 *
 *   return (
 *     <vstack>
 *       <Button onClick={() => console.log('Clicked!')}>
 *         Click Me
 *       </Button>
 *
 *       <Button
 *         variant="primary"
 *         loading={loading.value}
 *         onClick={async () => {
 *           loading.value = true
 *           await doSomething()
 *           loading.value = false
 *         }}
 *       >
 *         Submit
 *       </Button>
 *     </vstack>
 *   )
 * }
 * ```
 */

import { $state, $derived } from '@tuix/reactive/runes/runes'
import { color, style } from '@tuix/ansi'
import type { View } from '@tuix/core/types'
import { Text, Flex, Box } from '@tuix/ui'
import type { JSX } from '@tuix/jsx'

// Types
export type ButtonVariant =
  | "primary"
  | "secondary"
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "ghost";
export type ButtonSize = "small" | "medium" | "large";

export interface ButtonProps {
  children: string | JSX.Element;
  variant?: ButtonVariant;
  size?: ButtonSize;
  onClick?: () => void | Promise<void>;
  onFocus?: () => void;
  onBlur?: () => void;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: string | JSX.Element;
  iconPosition?: "left" | "right";
  autoFocus?: boolean;
  className?: string;
  type?: "button" | "submit" | "cancel";
}

/**
 * Button Component
 */
export function Button(props: ButtonProps): JSX.Element {
  // Internal state
  const focused = $state(props.autoFocus || false);
  const pressed = $state(false);
  const hovering = $state(false);

  // Configuration
  const variant = props.variant || "secondary";
  const size = props.size || "medium";
  const disabled = props.disabled || props.loading;

  // Derived styles
  const buttonStyle = $derived(() => {
    const baseStyle = getVariantStyle(variant);
    const sizeStyle = getSizeStyle(size);
    const stateStyle = getStateStyle(
      focused.value,
      pressed.value,
      hovering.value,
      disabled
    );

    return style({
      ...baseStyle,
      ...sizeStyle,
      ...stateStyle,
      width: props.fullWidth ? "100%" : undefined,
      cursor: disabled ? "not-allowed" : "pointer",
    });
  });

  // Event handlers
  async function handleClick() {
    if (disabled) return;

    pressed.value = true;

    try {
      await props.onClick?.();
    } finally {
      pressed.value = false;
    }
  }

  function handleKeyPress(key: string) {
    if (disabled) return;

    if (key === "Enter" || key === " ") {
      handleClick();
    }
  }

  // Render content
  function renderContent(): JSX.Element {
    const content = props.loading ? <Spinner /> : props.children;

    if (!props.icon) {
      return typeof content === "string"
        ? <Text>{content}</Text>
        : content;
    }

    const icon =
      typeof props.icon === "string"
        ? <Text>{props.icon}</Text>
        : props.icon;

    const elements =
      props.iconPosition === "right" ? [content, icon] : [icon, content];

    return (
      <Flex direction="row" gap={1}>
        {elements}
      </Flex>
    );
  }

  function Spinner(): JSX.Element {
    return <Text>...</Text>;
  }

  // Main render
  return (
    <Box
      onKeyPress={handleKeyPress}
      onMouseEnter={() => {
        hovering.value = true;
      }}
      onMouseLeave={() => {
        hovering.value = false;
      }}
      onFocus={() => {
        focused.value = true;
        props.onFocus?.();
      }}
      onBlur={() => {
        focused.value = false;
        props.onBlur?.();
      }}
      onClick={handleClick}
      focusable={!disabled}
      className={props.className}
      style={buttonStyle.value}
    >
      {renderContent()}
    </Box>
  );
}

// Style helpers
function getVariantStyle(variant: ButtonVariant) {
  const variants = {
    primary: {
      background: colors.blue,
      color: colors.white,
      borderColor: colors.blue,
    },
    secondary: {
      background: colors.gray,
      color: colors.white,
      borderColor: colors.gray,
    },
    success: {
      background: colors.green,
      color: colors.white,
      borderColor: colors.green,
    },
    danger: {
      background: colors.red,
      color: colors.white,
      borderColor: colors.red,
    },
    warning: {
      background: colors.yellow,
      color: colors.black,
      borderColor: colors.yellow,
    },
    info: {
      background: colors.cyan,
      color: colors.white,
      borderColor: colors.cyan,
    },
    ghost: {
      background: "transparent",
      color: colors.white,
      borderColor: colors.gray,
    },
  };

  return variants[variant];
}

function getSizeStyle(size: ButtonSize) {
  const sizes = {
    small: {
      padding: { horizontal: 2, vertical: 0 },
      minHeight: 1,
    },
    medium: {
      padding: { horizontal: 3, vertical: 1 },
      minHeight: 3,
    },
    large: {
      padding: { horizontal: 4, vertical: 2 },
      minHeight: 5,
    },
  };

  return sizes[size];
}

function getStateStyle(
  focused: boolean,
  pressed: boolean,
  hovering: boolean,
  disabled: boolean
) {
  const stateStyle: any = {
    border: "single",
    opacity: disabled ? 0.5 : 1,
  };

  if (pressed) {
    stateStyle.transform = "scale(0.95)";
  }

  if (focused) {
    stateStyle.borderStyle = "double";
    stateStyle.borderColor = colors.white;
  }

  if (hovering && !disabled) {
    stateStyle.brightness = 1.2;
  }

  return stateStyle;
}

// Factory functions
export const button = (props: ButtonProps) => <Button {...props} />;
export const primaryButton = (props: ButtonProps) => (
  <Button {...props} variant="primary" />
);
export const secondaryButton = (props: ButtonProps) => (
  <Button {...props} variant="secondary" />
);
export const successButton = (props: ButtonProps) => (
  <Button {...props} variant="success" />
);
export const dangerButton = (props: ButtonProps) => (
  <Button {...props} variant="danger" />
);
export const warningButton = (props: ButtonProps) => (
  <Button {...props} variant="warning" />
);
export const infoButton = (props: ButtonProps) => (
  <Button {...props} variant="info" />
);
export const ghostButton = (props: ButtonProps) => (
  <Button {...props} variant="ghost" />
);

// Common button groups
export function ButtonGroup({
  children,
}: {
  children: JSX.Element[];
}): JSX.Element {
  return (
    <Flex direction="row" gap={2}>
      {children}
    </Flex>
  );
}

export function SubmitCancelButtons(props: {
  onSubmit: () => void;
  onCancel: () => void;
  submitText?: string;
  cancelText?: string;
  loading?: boolean;
}): JSX.Element {
  return (
    <ButtonGroup>
      <Button
        variant="primary"
        onClick={props.onSubmit}
        loading={props.loading}
      >
        {props.submitText || "Submit"}
      </Button>
      <Button
        variant="secondary"
        onClick={props.onCancel}
        disabled={props.loading}
      >
        {props.cancelText || "Cancel"}
      </Button>
    </ButtonGroup>
  );
}
