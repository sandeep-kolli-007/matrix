import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { matrixTheme } from '@/data/matrix-theme';
import { isPreviewReviewMode } from '@/data/matrix-source';
import { useLifeOS } from '@/providers/lifeos-provider';

export default function AppTabs() {
  const { appearance } = useLifeOS();
  const { accent, muted, panel } = matrixTheme(isPreviewReviewMode ? 'dark' : appearance);

  return (
    <NativeTabs
      backgroundColor={panel}
      tintColor={accent}
      iconColor={{ default: muted, selected: accent }}
      labelStyle={{
        default: { color: muted, fontSize: 10 },
        selected: { color: accent, fontSize: 10, fontWeight: '600' },
      }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="timeline">
        <NativeTabs.Trigger.Label>Timeline</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="clock.fill" md="schedule" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="add">
        <NativeTabs.Trigger.Label>Add</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="plus.circle.fill" md="add_circle" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="matrix">
        <NativeTabs.Trigger.Label>Matrix</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="square.grid.2x2.fill" md="grid_view" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="people">
        <NativeTabs.Trigger.Label>People</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.2.fill" md="group" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
