import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    // <NativeTabs
    //   backgroundColor={colors.background}
    //   indicatorColor={colors.backgroundElement}
    //   labelStyle={{ selected: { color: colors.text } }}>
    //   <NativeTabs.Trigger name="index">
    //     <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
    //     <NativeTabs.Trigger.Icon
    //       src={require('@/assets/images/tabIcons/home.png')}
    //       renderingMode="template"
    //     />
    //   </NativeTabs.Trigger>

    //   <NativeTabs.Trigger name="explore">
    //     <NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label>
    //     <NativeTabs.Trigger.Icon
    //       src={require('@/assets/images/tabIcons/explore.png')}
    //       renderingMode="template"
    //     />
    //   </NativeTabs.Trigger>
    // </NativeTabs>
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Icon sf="safari.fill" md="explore" />
        <NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
          <NativeTabs.Trigger name="add">
        <NativeTabs.Trigger.Icon sf="plus.app.fill" md="add_circle" />
        <NativeTabs.Trigger.Label>Quick Add</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
     
      <NativeTabs.Trigger name="insights">
        <NativeTabs.Trigger.Icon sf="chart.bar.fill" md="bar_chart" />
        <NativeTabs.Trigger.Label>Insights</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Icon sf="person.fill" md="person" />
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );        
}
