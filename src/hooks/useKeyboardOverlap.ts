import { useEffect, useRef, useState } from 'react';
import { Keyboard, LayoutAnimation, Platform, View } from 'react-native';

/**
 * Misst, wie weit die Bildschirmtastatur den Container am unteren Rand überdeckt.
 *
 * Das ref gehört an den Container, der bis zum unteren Bildschirmrand reicht. Der
 * zurückgegebene Wert wird als paddingBottom gesetzt. Weil der tatsächliche Abstand
 * zwischen Container-Unterkante und Tastatur gemessen wird, passt das auch dann,
 * wenn das System das Fenster schon selbst verkleinert (dann ist der Wert 0), und
 * unabhängig von Edge-to-Edge oder Tab-Leisten unter dem Container.
 */
export function useKeyboardOverlap() {
  const ref = useRef<View>(null);
  const [overlap, setOverlap] = useState(0);

  useEffect(() => {
    const isIos = Platform.OS === 'ios';

    const onShow = (event: { endCoordinates: { screenY: number }; duration?: number }) => {
      const view = ref.current;
      if (!view) return;

      view.measureInWindow((_x, y, _width, height) => {
        const next = Math.max(0, Math.round(y + height - event.endCoordinates.screenY));

        if (isIos && event.duration) {
          LayoutAnimation.configureNext(LayoutAnimation.create(event.duration, 'keyboard', 'opacity'));
        }

        setOverlap(next);
      });
    };

    const onHide = (event: { duration?: number }) => {
      if (isIos && event.duration) {
        LayoutAnimation.configureNext(LayoutAnimation.create(event.duration, 'keyboard', 'opacity'));
      }

      setOverlap(0);
    };

    const subscriptions = [
      Keyboard.addListener(isIos ? 'keyboardWillChangeFrame' : 'keyboardDidShow', onShow),
      Keyboard.addListener(isIos ? 'keyboardWillHide' : 'keyboardDidHide', onHide),
    ];

    return () => subscriptions.forEach((subscription) => subscription.remove());
  }, []);

  return { ref, overlap };
}
