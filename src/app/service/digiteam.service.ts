import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {OrderDetailModel} from '../model/order-detail.model';
import {CancelOrderResponse} from '../model/cancel-order-response';
import {CreateOrderResponse} from '../model/create-order-response';
import {CreateOrderRequest} from '../model/create-order-request';
import {KeyValueModel} from '../model/key-value.model';
import {AuthenticationToken} from '../model/authentication-token';
import {Credential} from '../model/credential';
import { RefreshToken } from '../model/refresh-token';

@Injectable({
  providedIn: 'root'
})
export class DigiteamService {

  private tokenAuthentication = 'token_authentication';
  private tokenRefresh = 'token_refresh';
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

  public refresh(token: RefreshToken): Observable<AuthenticationToken> {
    return this.http.post<AuthenticationToken>(`${this.tenantUrl}/api-v1/auth/refreshToken`, token);
  }

  public saveAuthInfo(authToken: AuthenticationToken): void {
    localStorage.setItem(this.tokenAuthentication, authToken.token);
    localStorage.setItem(this.tokenRefresh, authToken.refreshToken);
  }

  get token(): string {
    return localStorage.getItem(this.tokenAuthentication);
  }

  get refreshToken(): string {
    return localStorage.getItem(this.tokenRefresh);
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
    const url = this.tenantUrl + `/api-v1/angular/orders/orderDetails/${code}`;
    return this.http.get<OrderDetailModel>(url);
  }

  public cancelOrder(code: string): Observable<CancelOrderResponse> {
    const url = this.tenantUrl + `/api-v1/angular/orders/${code}/cancel`;
    return this.http.post<CancelOrderResponse>(url, code);
  }

  public isLoggedIn() {
    return this.token !== null;
  }

  public logout() {
    localStorage.removeItem(this.token);
    localStorage.removeItem(this.refreshToken);
  }
}
