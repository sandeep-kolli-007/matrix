import {
  unstable_createStandardRouterNavigator,
  TabRouter,
  type NavigatorContentProps,
} from 'expo-router';
import { Pressable, Text, View } from 'react-native';

// The first type argument is the options you can set per screen
type TabsContentProps = NavigatorContentProps<{ title?: string }>;

function TabsContent({ state, descriptors, actions }: TabsContentProps) {
  const focusedRoute = state.routes[state.index];

  return (
    <View style={{ flex: 1 }}>
      {/* Render the screen for the focused route. */}
      <View style={{ flex: 1 }}>{descriptors[focusedRoute.key].render()}</View>

      {/* A simple tab bar. */}
      <View style={{ flexDirection: 'row' }}>
        {state.routes.map(route => (
          <Pressable
            key={route.key}
            style={{ flex: 1, padding: 16 }}
            onPress={() => actions.navigate(route.name)}>
            <Text>{descriptors[route.key].options.title ?? route.name}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export const Tabs = unstable_createStandardRouterNavigator(TabsContent, TabRouter);
