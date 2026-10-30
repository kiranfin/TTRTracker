import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { invalidateApiCache } from '@/src/api/client';
import { ttApi } from '@/src/api/tttracker';
import { useOnMyttConnected } from '@/src/features/mytt';
import { getMyttUnavailableReason, type MyttUnavailableReason } from '@/src/features/mytt/utils/errors';
import { useI18n } from '@/src/i18n/I18nProvider';
import type { PlayerCompareSide, PlayerComparisonData, SideId } from '../types';
import { buildRecentStats, getClubName, getPlayerName, unwrapComparisonResponse } from '../utils';

export function usePlayerCompare() {
  const params = useLocalSearchParams<Record<string, string>>();
  const { t } = useI18n();

  const [leftNuid, setLeftNuid] = useState(params.leftNuid ?? params.left ?? '');
  const [rightNuid, setRightNuid] = useState(params.rightNuid ?? params.right ?? '');
  const [comparison, setComparison] = useState<PlayerComparisonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerSide, setPickerSide] = useState<SideId | null>(null);
  const [unavailableReason, setUnavailableReason] = useState<MyttUnavailableReason | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reloadAfterConnect = useCallback(() => {
    invalidateApiCache('/api/players').catch(() => undefined);
    setReloadKey((current) => current + 1);
  }, []);
  useOnMyttConnected(reloadAfterConnect);

  useEffect(() => {
    let active = true;

    async function load() {
      setComparison(null);
      setError(null);
      setUnavailableReason(null);

      if (!leftNuid || !rightNuid) {
        setLoading(false);
        return;
      }

      if (leftNuid === rightNuid) {
        setLoading(false);
        setError(t('compare.samePlayer'));
        return;
      }

      setLoading(true);

      try {
        const response = await ttApi.comparePlayers(leftNuid, rightNuid);
        const data = unwrapComparisonResponse(response);

        if (!active) return;

        if (!data) {
          throw new Error(t('compare.parseError'));
        }

        setComparison(data);
      } catch (loadError) {
        if (!active) return;

        const reason = getMyttUnavailableReason(loadError);

        if (reason) {
          setUnavailableReason(reason);
        } else {
          setError(loadError instanceof Error ? loadError.message : t('compare.loadError'));
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load().catch(() => undefined);

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leftNuid, rightNuid, reloadKey]);

  const leftStats = useMemo(() => (comparison ? buildRecentStats(comparison.left) : null), [comparison]);
  const rightStats = useMemo(() => (comparison ? buildRecentStats(comparison.right) : null), [comparison]);

  function selectPlayer(side: SideId, nuid: string) {
    if (side === 'left') {
      setLeftNuid(nuid);
    } else {
      setRightNuid(nuid);
    }
  }

  function swapSides() {
    setLeftNuid(rightNuid);
    setRightNuid(leftNuid);
  }

  function openPlayer(player: PlayerCompareSide) {
    router.push({
      pathname: '/player/[nuid]',
      params: {
        nuid: player.nuid,
        title: getPlayerName(player, t),
        clubName: getClubName(player, t),
      },
    });
  }

  return {
    leftNuid,
    rightNuid,
    comparison,
    leftStats,
    rightStats,
    loading,
    error,
    unavailableReason,
    pickerSide,
    setPickerSide,
    selectPlayer,
    swapSides,
    openPlayer,
  };
}
