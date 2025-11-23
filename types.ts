export interface RadioStation {
  stationuuid: string;
  name: string;
  url: string;
  url_resolved: string;
  homepage: string;
  favicon: string;
  tags: string;
  country: string;
  countrycode: string;
  state: string;
  language: string;
  votes: number;
  codec: string;
  bitrate: number;
  geo_lat: number | null;
  geo_long: number | null;
}

export interface GeoLocation {
  lat: number;
  lng: number;
}

export interface StationFilter {
  country?: string;
  tag?: string;
  name?: string;
  limit?: number;
}

export enum ViewMode {
  GLOBE = 'GLOBE',
  LIST = 'LIST'
}

export interface AIMoodResponse {
  country?: string;
  tag?: string;
  explanation: string;
}