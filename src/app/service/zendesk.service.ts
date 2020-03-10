import {Injectable} from '@angular/core';

declare var ZAFClient: any;

@Injectable({
  providedIn: 'root'
})
export class ZendeskService {

  client: any;

  public resize() {
    this.zafClient.invoke('resize', {width: '100%', height: '500px'});
    console.log('resize');
  }

  get zafClient() {
    if (!this.client) {
      this.client = ZAFClient.init();
    }
    return this.client;
  }
}
