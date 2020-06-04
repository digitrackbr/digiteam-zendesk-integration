export interface AddressModel {
  id: number;
  owner: number;
  lastmodifieddate: Date;
  address: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  cityId: number;
  city: string;
  poiId: number;
  street: string;
  complement: string;
  state: string;
  country: string;
}
