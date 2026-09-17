# MATRIX native verification

## 2026-09-09 — iPhone 17 Pro Max, iOS 26.5

Observed through the running Simulator UI, not inferred from unit tests:

- Home rendered in both light and dark appearance after a development reload.
- Home Urgent filter selected and showed the correct empty-state message for the empty data source.
- Home Log Task opened the create form.
- Task/Habit switch changed the form to Habit and displayed frequency, reminder time, and linked goal fields.
- Three-step onboarding advanced through privacy and appearance introductions to Home.
- Created `QA - Weekly habit verification` in the native Habit form with Monday and Friday selected and Stay only on this device enabled.
- Save opened the Habit detail screen displaying `Mon, Fri` and `On this device only`.
- Reopened Edit: the title, Monday/Friday checked states, frequency text, and device-only switch were preserved.
- Returned from Edit to the saved detail without changing the record.

The QA habit remains in local storage for inspection. It was not uploaded or deleted.

These checks do not prove notification delivery, app-restart persistence, Android acceptance, all 72 entity workflows, populated Home fidelity, or completion of the 79 exported screens. Those remain separate gates.

Development connectivity: the old LAN URL 192.168.0.2 became unreachable after the Mac moved to 192.168.0.3. Metro was confirmed healthy on loopback. A subsequent server restart and app reload restored rendering; a permanent loopback configuration was not confirmed.
