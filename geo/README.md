# GeoIP country database

`src/lib/geoip.ts` looks up the visitor's country here for currency
auto-detection (US→USD, GB→GBP, CN→CNY, Eurozone→EUR, else BDT).

## Setup (one time)

1. Create a free MaxMind account: https://www.maxmind.com/en/geolite2/signup
2. Generate a license key (My License Key page in the account portal).
3. Download the **GeoLite2 Country** database (`.mmdb` format), e.g.:
   `https://download.maxmind.com/app/geoip_download?edition_id=GeoLite2-Country&license_key=<KEY>&suffix=tar.gz`
4. Put the extracted file here as `geo/GeoLite2-Country.mmdb` and redeploy.

Until the file exists, detection fails closed to the default country
(BD → BDT) — the shop keeps working, just without auto-detection.

## Notes

- Override the location with the `GEOIP_DB_PATH` env var if needed.
- Refresh the file periodically (MaxMind updates it weekly) and redeploy;
  a restart is enough for the app to pick up a replaced file.
