import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { matrixTheme } from '@/data/matrix-theme';
import { useLifeOS } from '@/providers/lifeos-provider';

export default function AppTabsWeb() {
  const { appearance } = useLifeOS();
  const p = matrixTheme(appearance === 'dark' ? 'dark' : 'light');

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: p.bg },
        tabBarShowLabel: true,
        tabBarActiveTintColor: p.text,
        tabBarInactiveTintColor: p.muted,
        tabBarLabelStyle: styles.label,
        tabBarItemStyle: styles.item,
        tabBarStyle: [
          styles.bar,
          {
            backgroundColor: p.panel,
            borderColor: p.line,
            boxShadow: appearance === 'dark'
              ? '0 18px 42px rgba(0,0,0,0.42)'
              : '0 18px 42px rgba(38,52,77,0.18)',
          } as never,
        ],
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && { backgroundColor: p.selected }]}>
              <SymbolView
                name={{ ios: focused ? 'house.fill' : 'house', android: 'home', web: 'home' }}
                size={18}
                tintColor={focused ? p.accent : color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="timeline"
        options={{
          title: 'Timeline',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && { backgroundColor: p.selected }]}>
              <SymbolView
                name={{ ios: focused ? 'clock.fill' : 'clock', android: 'schedule', web: 'schedule' }}
                size={18}
                tintColor={focused ? p.accent : color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: '',
          tabBarItemStyle: styles.addItem,
          tabBarIcon: ({ focused }) => (
            <View
              style={[
                styles.addButton,
                {
                  backgroundColor: p.accent,
                  borderColor: p.bg,
                  boxShadow: appearance === 'dark'
                    ? '0 10px 28px rgba(33,136,255,0.34)'
                    : '0 10px 28px rgba(65,111,234,0.28)',
                } as never,
                focused && styles.addButtonFocused,
              ]}
            >
              <SymbolView
                name={{ ios: 'plus', android: 'add', web: 'add' }}
                size={23}
                tintColor={p.onAccent}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="matrix"
        options={{
          title: 'Matrix',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && { backgroundColor: p.selected }]}>
              <SymbolView
                name={{ ios: focused ? 'square.grid.2x2.fill' : 'square.grid.2x2', android: 'grid_view', web: 'grid_view' }}
                size={18}
                tintColor={focused ? p.accent : color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="people"
        options={{
          title: 'People',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && { backgroundColor: p.selected }]}>
              <SymbolView
                name={{ ios: focused ? 'person.2.fill' : 'person.2', android: 'group', web: 'group' }}
                size={18}
                tintColor={focused ? p.accent : color}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: '50%',
    bottom: 18,
    width: 'min(560px, calc(100vw - 28px))' as never,
    marginLeft: 'calc(-1 * min(560px, calc(100vw - 28px)) / 2)' as never,
    height: 68,
    borderRadius: 24,
    borderTopWidth: 0,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingTop: 7,
    paddingBottom: 7,
  },
  item: {
    borderRadius: 16,
    marginHorizontal: 2,
  },
  label: {
    fontSize: 9.5,
    lineHeight: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  iconWrap: {
    width: 34,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addItem: {
    top: -10,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonFocused: {
    transform: [{ scale: 1.06 }],
  },
});
