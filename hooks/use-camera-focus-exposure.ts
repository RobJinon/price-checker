import * as Haptics from 'expo-haptics';
import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { PanResponder } from 'react-native';
import { CameraRef } from 'react-native-vision-camera';

export type FocusPoint = {
  x: number;
  y: number;
  key: number;
};

type UseCameraFocusExposureOptions = {
  cameraRef: RefObject<CameraRef | null>;
  minExposure: number;
  maxExposure: number;
};

export function useCameraFocusExposure({
  cameraRef,
  minExposure,
  maxExposure,
}: UseCameraFocusExposureOptions) {
  const [exposure, setExposure] = useState(0);
  const [appliedExposure, setAppliedExposure] = useState(0);
  const [isFocusLocked, setIsFocusLocked] = useState(false);
  const [focusPoint, setFocusPoint] = useState<FocusPoint | null>(null);

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exposureThrottleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingExposureRef = useRef(0);
  const exposureRef = useRef(exposure);
  const limitsRef = useRef({ minExposure, maxExposure });
  const didLongPressRef = useRef(false);
  const touchStartRef = useRef({
    x: 0,
    y: 0,
    time: 0,
    initialExposure: 0,
  });

  useEffect(() => {
    exposureRef.current = exposure;
  }, [exposure]);

  useEffect(() => {
    limitsRef.current = { minExposure, maxExposure };
  }, [minExposure, maxExposure]);

  const clearTimers = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (exposureThrottleTimerRef.current) {
      clearTimeout(exposureThrottleTimerRef.current);
      exposureThrottleTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const updateExposure = useCallback((newEv: number) => {
    setExposure(newEv);
    pendingExposureRef.current = newEv;

    if (!exposureThrottleTimerRef.current) {
      exposureThrottleTimerRef.current = setTimeout(() => {
        setAppliedExposure(pendingExposureRef.current);
        exposureThrottleTimerRef.current = null;
      }, 75);
    }
  }, []);

  const flushExposure = useCallback((finalEv?: number) => {
    if (exposureThrottleTimerRef.current) {
      clearTimeout(exposureThrottleTimerRef.current);
      exposureThrottleTimerRef.current = null;
    }
    const target = finalEv !== undefined ? finalEv : pendingExposureRef.current;
    pendingExposureRef.current = target;
    setExposure(target);
    setAppliedExposure(target);
  }, []);

  const triggerFocus = useCallback(
    async (x: number, y: number, lock: boolean) => {
      setFocusPoint({ x, y, key: Date.now() });
      setIsFocusLocked(lock);

      if (lock) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      try {
        await cameraRef.current?.focusTo(
          { x, y },
          {
            responsiveness: 'snappy',
            adaptiveness: lock ? 'locked' : 'continuous',
            autoResetAfter: lock ? null : 4,
          }
        );
      } catch {
        // Ignore focus cancellation if user taps rapidly
      }
    },
    [cameraRef]
  );

  const unlockFocus = useCallback(async () => {
    setIsFocusLocked(false);
    setFocusPoint(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await cameraRef.current?.resetFocus();
    } catch {
      // Ignore
    }
  }, [cameraRef]);

  const resetAll = useCallback(
    (resetEv = false) => {
      clearTimers();
      setIsFocusLocked(false);
      setFocusPoint(null);
      if (resetEv) flushExposure(0);
    },
    [clearTimers, flushExposure]
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 6 || Math.abs(gestureState.dy) > 6,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        touchStartRef.current = {
          x: locationX,
          y: locationY,
          time: Date.now(),
          initialExposure: exposureRef.current,
        };
        didLongPressRef.current = false;

        longPressTimerRef.current = setTimeout(() => {
          didLongPressRef.current = true;
          triggerFocus(locationX, locationY, true);
        }, 500);
      },
      onPanResponderMove: (_, gestureState) => {
        const dist = Math.hypot(gestureState.dx, gestureState.dy);
        if (dist > 8 && longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }

        if (Math.abs(gestureState.dy) > 10) {
          const { minExposure: minEv, maxExposure: maxEv } = limitsRef.current;
          const evRange = maxEv - minEv;
          const evDelta = (-gestureState.dy / 220) * (evRange / 2);
          const rawEv = touchStartRef.current.initialExposure + evDelta;
          const clamped =
            Math.round(Math.max(minEv, Math.min(maxEv, rawEv)) * 10) / 10;
          updateExposure(clamped);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }

        if (didLongPressRef.current) {
          didLongPressRef.current = false;
          return;
        }

        const dist = Math.hypot(gestureState.dx, gestureState.dy);
        const duration = Date.now() - touchStartRef.current.time;

        if (dist < 8 && duration < 500) {
          const { locationX, locationY } = evt.nativeEvent;
          triggerFocus(locationX, locationY, false);
          flushExposure(0);
          return;
        }

        flushExposure();
      },
      onPanResponderTerminate: () => {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
        flushExposure();
      },
    })
  ).current;

  return {
    exposure,
    appliedExposure,
    isFocusLocked,
    focusPoint,
    panHandlers: panResponder.panHandlers,
    updateExposure,
    flushExposure,
    unlockFocus,
    resetAll,
  };
}