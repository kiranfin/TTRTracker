import { Avatar } from '@/src/components/Avatar';
import { ListRow } from '@/src/components/ListRow';
import { StarButton } from '@/src/components/StarButton';
import { useI18n } from '@/src/i18n/I18nProvider';
import type { NormalizedClub } from '@/src/types/tttracker';

type ClubRowProps = {
  club: NormalizedClub;
  favorite: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
};

export function ClubRow({ club, favorite, onPress, onToggleFavorite }: ClubRowProps) {
  const { t } = useI18n();

  const subtitle =
      [club.organizationName ?? club.organization, club.state, club.clubNumber ? `#${club.clubNumber}` : undefined]
          .filter(Boolean)
          .join(' · ') || t('search.associationUnknown');

  return (
      <ListRow
          leading={<Avatar icon="home" shape="square" size={40} />}
          title={club.name}
          subtitle={subtitle}
          chevron={false}
          onPress={onPress}
          trailing={<StarButton active={favorite} onPress={onToggleFavorite} />}
      />
  );
}
