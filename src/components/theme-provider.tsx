import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as RNTheme,
} from "@react-navigation/native";
import { useColorScheme } from "react-native";
import * as AC from "@bacons/apple-colors";

// Custom theme for Pocket Monet with pure black/white backgrounds
const PocketMonetLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'white', // Pure white as specified in PRD
    card: AC.systemBackground,
    text: AC.label,
    border: AC.separator,
    primary: AC.systemBlue,
  },
};

const PocketMonetDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: 'black', // Pure black as specified in PRD
    card: AC.systemBackground,
    text: AC.label,
    border: AC.separator,
    primary: AC.systemBlue,
  },
};

export function ThemeProvider(props: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  return (
    <RNTheme value={colorScheme === "dark" ? PocketMonetDarkTheme : PocketMonetLightTheme}>
      {props.children}
    </RNTheme>
  );
}
