import _ from 'lodash';
import { useMemo } from 'react';
import { ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { useUserTheme } from '../context/ThemeContext'; // we'll define this

type AnyStyle = ViewStyle & TextStyle & ImageStyle;

export type NamedStyles<T> = { [K in keyof T]: AnyStyle };
export type PartialNamedStyles<T> = { [K in keyof T]?: Partial<AnyStyle> };

export const createPartialStyle =
  <T>() =>
  <U extends PartialNamedStyles<T> & Record<Exclude<keyof U, keyof T>, never>>(
    style: U,
  ): U => style;

export const useThemedStyles = <T extends NamedStyles<T>>(
  light: T,
  dark: PartialNamedStyles<T>,
): { [K in keyof T]: T[K] | [T[K], Partial<AnyStyle>] } => {
  const theme = useUserTheme(); // returns 'light' or 'dark'

  return useMemo(() => {
    if (theme !== 'dark') return light;
    return _.mapValues(light, (lightStyle, key) => {
      const darkStyle = dark[key as keyof T];
      return darkStyle ? [lightStyle, darkStyle] : lightStyle;
    }) as { [K in keyof T]: T[K] | [T[K], Partial<AnyStyle>] };
  }, [theme, light, dark]);
};
