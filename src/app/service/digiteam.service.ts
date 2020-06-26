import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {OrderDetailModel} from '../model/order-detail.model';
import {CancelOrderResponse} from '../model/cancel-order-response';
import {CreateOrderResponse} from '../model/create-order-response';
import {CreateOrderRequest} from '../model/create-order-request';
import {KeyValueModel} from '../model/key-value.model';
import {AuthenticationToken} from '../model/authentication-token';
import {Credential} from '../model/credential';
import { RefreshToken } from '../model/refresh-token';
import {OrderLogModel} from '../model/order-log.model';

@Injectable({
  providedIn: 'root'
})
export class DigiteamService {

  private tokenName = 'user_token';
  private tokenRefresh = 'token_refresh';

  private tenantUrlHash = 'tenant_url';

  constructor(private http: HttpClient) {
  }

  registerTenantUrl(url: string) {
    localStorage.setItem(this.tenantUrlHash, url);
  }

  get tenantUrl(): string {
    return localStorage.getItem(this.tenantUrlHash) || '';
  }

  public login(credential: Credential): Observable<AuthenticationToken> {
    return this.http.post<AuthenticationToken>(`${this.tenantUrl}/api-v1/auth`, credential);
  }

  public refresh(): Observable<RefreshToken> {
    const rToken = {
      refreshToken: this.refreshToken
    };
    return this.http.post<RefreshToken>(`${this.tenantUrl}/api-v1/auth/refreshToken`, rToken);
  }

  public saveAuthInfo(authToken: AuthenticationToken): void {
    localStorage.setItem(this.tokenName, authToken.token);
    localStorage.setItem(this.tokenRefresh, authToken.refreshToken);
  }

  public saveRefreshInfo(refreshToken: RefreshToken): void {
    localStorage.setItem(this.tokenName, refreshToken.accessToken);
    localStorage.setItem(this.tokenRefresh, refreshToken.refreshToken);
  }

  get token(): string  {
    return localStorage.getItem(this.tokenName)  || '';
  }

  get refreshToken(): string {
    return localStorage.getItem(this.tokenRefresh) || '';
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

  public getOrderLogs(orderId: number): Observable<OrderLogModel[]> {
    const url = this.tenantUrl + `/api-v1/angular/orderLogs/${orderId}`;
    return this.http.get<OrderLogModel[]>(url);
  }

  public getOrdersByCodes(codes: string[]): Observable<OrderDetailModel[]> {
    const url = this.tenantUrl + `/api-v1/angular/orders/codes`;
    let params = new HttpParams();
    if (codes) {
      params = params.set('codes', String(codes));
    }
    return this.http.get<OrderDetailModel[]>(url, {params});
  }
}
