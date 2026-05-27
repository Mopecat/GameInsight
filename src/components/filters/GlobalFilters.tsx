import { useFilterStore } from '../../store/filterStore';
import { channels, countries, platforms, versions } from '../../types/domain';

export function GlobalFilters() {
  const filters = useFilterStore((state) => state.filters);
  const setFilter = useFilterStore((state) => state.setFilter);

  return (
    <form className="global-filters" aria-label="Global filters">
      <label>
        <span>Country</span>
        <select
          aria-label="Country"
          value={filters.country}
          onChange={(event) => setFilter('country', event.target.value)}
        >
          <option value="all">All</option>
          {countries.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>Platform</span>
        <select
          aria-label="Platform"
          value={filters.platform}
          onChange={(event) => setFilter('platform', event.target.value)}
        >
          <option value="all">All</option>
          {platforms.map((platform) => (
            <option key={platform} value={platform}>
              {platform}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>Channel</span>
        <select
          aria-label="Channel"
          value={filters.channel}
          onChange={(event) => setFilter('channel', event.target.value)}
        >
          <option value="all">All</option>
          {channels.map((channel) => (
            <option key={channel} value={channel}>
              {channel}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>Version</span>
        <select
          aria-label="Version"
          value={filters.version}
          onChange={(event) => setFilter('version', event.target.value)}
        >
          <option value="all">All</option>
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
