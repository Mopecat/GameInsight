import { useFilterStore } from '../../store/filterStore';
import { channels, countries, platforms, versions } from '../../types/domain';

const countryLabels: Record<string, string> = {
  US: '美国',
  JP: '日本',
  KR: '韩国',
  BR: '巴西',
  DE: '德国',
  TH: '泰国'
};

const platformLabels: Record<string, string> = {
  ios: 'iOS',
  android: 'Android'
};

const channelLabels: Record<string, string> = {
  facebook: 'Facebook',
  google: 'Google',
  tiktok: 'TikTok',
  organic: '自然量'
};

export function GlobalFilters() {
  const filters = useFilterStore((state) => state.filters);
  const setFilter = useFilterStore((state) => state.setFilter);

  return (
    <form className="global-filters" aria-label="全局筛选">
      <label>
        <span>国家</span>
        <select
          aria-label="国家"
          value={filters.country}
          onChange={(event) => setFilter('country', event.target.value)}
        >
          <option value="all">全部</option>
          {countries.map((country) => (
            <option key={country} value={country}>
              {countryLabels[country]}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>平台</span>
        <select
          aria-label="平台"
          value={filters.platform}
          onChange={(event) => setFilter('platform', event.target.value)}
        >
          <option value="all">全部</option>
          {platforms.map((platform) => (
            <option key={platform} value={platform}>
              {platformLabels[platform]}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>渠道</span>
        <select
          aria-label="渠道"
          value={filters.channel}
          onChange={(event) => setFilter('channel', event.target.value)}
        >
          <option value="all">全部</option>
          {channels.map((channel) => (
            <option key={channel} value={channel}>
              {channelLabels[channel]}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>版本</span>
        <select
          aria-label="版本"
          value={filters.version}
          onChange={(event) => setFilter('version', event.target.value)}
        >
          <option value="all">全部</option>
          {versions.map((version) => (
            <option key={version} value={version}>
              {version}
            </option>
          ))}
        </select>
      </label>
    </form>
  );
}
