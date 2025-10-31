import React from 'react';
import { TextInput, TextInputProps } from './TextInput';

export interface TextAreaProps extends Omit<TextInputProps, 'multiline'> {
  /** Number of visible text lines */
  numberOfLines?: number;
  /** Maximum character count */
  maxLength?: number;
  /** Show character counter */
  showCounter?: boolean;
  /** Minimum height for text area */
  minHeight?: number;
}

export function TextArea({
  numberOfLines = 4,
  maxLength,
  showCounter = false,
  minHeight = 100, // Default minimum height for consistency
  value,
  helperText,
  ...rest
}: TextAreaProps) {
  const charCount = value?.length || 0;
  const counterText = maxLength
    ? `${charCount}/${maxLength}`
    : `${charCount} characters`;

  const combinedHelperText = showCounter
    ? helperText
      ? `${helperText} • ${counterText}`
      : counterText
    : helperText;

  return (
    <TextInput
      {...rest}
      value={value}
      multiline
      numberOfLines={numberOfLines}
      textAlignVertical="top"
      maxLength={maxLength}
      helperText={combinedHelperText}
      inputStyle={{ minHeight }}
    />
  );
}
