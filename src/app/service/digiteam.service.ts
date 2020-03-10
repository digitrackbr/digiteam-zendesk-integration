import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DigiteamService {

  private tokenName = 'user_token';
  urlBaseV0 = 'http://remohml.localhost:8080';

  private tenantUrlHash = 'tenant_url';

  constructor(private http: HttpClient) {
  }

  registerTenantUrl(url: string) {
    localStorage.setItem(this.tenantUrlHash, url);
  }

  get tenantUrl(): string {
    return localStorage.getItem(this.tenantUrlHash);
  }

  public login(credential: Credential): Observable<AuthenticationToken> {
    return this.http.post<AuthenticationToken>(`${this.tenantUrl}/api-v1/auth`, credential);
  }

  public saveAuthInfo(authToken: AuthenticationToken): void {
    localStorage.setItem(this.tokenName, authToken.token);
  }

  get token(): string {
    return localStorage.getItem(this.tokenName);
  }

  public getOrderTypes(): Observable<KeyValueModel[]> {
    const url = this.tenantUrl + '/api-v1/angular/orderTypes';
    return this.http.get<KeyValueModel[]>(url);
  }

  public getRegions(): Observable<KeyValueModel[]> {
    const url = this.tenantUrl + '/api-v1/angular/regions';

    return this.http.get<KeyValueModel[]>(url);
  }

  public getUnits(): Observable<KeyValueModel[]> {
    const url = this.tenantUrl + '/api-v1/angular/units';

    return this.http.get<KeyValueModel[]>(url);
  }

  public createOrder(request: CreateOrderRequest): Observable<CreateOrderResponse> {
    const url = this.tenantUrl + '/api-v1/angular/orders';
    return this.http.post<CreateOrderResponse>(url, request);
  }

  public getOrder(code: string): Observable<OrderDetailModel> {
    const url = this.tenantUrl + `/api-v1/angular/orderDetails/${code}`;
    return this.http.get<OrderDetailModel>(url);
  }

  public isLoggedIn() {
    return this.token !== null;
  }
}

export interface OrderDetailModel {

  id: number;
  code: string;
  syncConcluded: boolean;
  status: string;
  statusId: number;
  lastmodifieddate: Date;
  priority: number;
  estimatedDuration: number;
  regionName: string;
  createdOn: Date;
  openDate: Date;
  dueDate: Date;
  motive: string;
  reference: string;
  project: string;
  description: string;
  applicantName: string;
  applicantPhoneNumber: string;
  applicantCode: string;
  requestFormDataJson: any;

  notes: string;
  channelId: number;
  sla: number;
  whereis: AddressModel;
  marker: string;
  statusName: string;
  statusColor: string;
  pendingToSynchronize: boolean;
}

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


export interface CreateOrderRequest {
  orderTypeId: number;
  regionId: number;
  priority: number;
  unitId: number;
  address: string;
  city: string;
  state: string;
  country: string;
  requestCode: string;
  applicantName: string;
  applicantPhone: string;
  lat: number;
  lng: number;
}

export interface CreateOrderResponse {
  success: boolean;
  internalId: number;
}

export interface KeyValueModel {
  key: number;
  value: string;
}

export interface Credential {
  username: string;
  password: string;
}

export interface AuthenticationToken {
  token: string;
}
