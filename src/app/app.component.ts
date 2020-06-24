import {Component, enableProdMode, EventEmitter, OnInit, Output} from '@angular/core';
import {DigiteamService} from './service/digiteam.service';
import {MenuItem, MessageService} from 'primeng';
import {OrderDetailModel} from './model/order-detail.model';
import {TranslateService} from '@ngx-translate/core';
import {OrderLogModel} from './model/order-log.model';

declare var ZAFClient: any;

enableProdMode();

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  appStatus = 'loading';
  orderDetail: OrderDetailModel = {};
  origin: any;
  destination: any;
  statusColor: string | undefined;
  distanceToPoint: any;
  durationToPoint: any;
  markerOptions = {
    origin: {},
    destination: {}
  };
  renderOptions = {
    suppressMarkers: true,
    polylineOptions: {strokeColor: '#000000'}
  };
  showHistory = false;
  logs: OrderLogModel[] | undefined;
  /*items: MenuItem[];*/

  @Output() createdSuccess = new EventEmitter<any>();

  constructor(
    private digiteamService: DigiteamService,
    private messageService: MessageService,
    translate: TranslateService) {
    translate.addLangs(['en', 'pt', 'es']);
    translate.setDefaultLang('pt');
    const browserLang = translate.getBrowserLang();
    translate.use(browserLang.match(/en|pt|es/) ? browserLang : 'pt');
    /*this.items = [
      {label: 'Update', icon: 'pi pi-refresh', command: () => {
          this.onCancelOrder();
        }},
      {label: 'Delete', icon: 'pi pi-times', command: () => {
          this.onCancelOrder();
        }},
      {label: 'Angular.io', icon: 'pi pi-info', url: 'http://angular.io'},
      {separator: true},
      {label: 'Setup', icon: 'pi pi-cog', routerLink: ['/setup']}
    ];*/
  }

  ngOnInit(): void {
    const client = ZAFClient.init();
    client.metadata().then((metadata: { settings: { digiteam_url: string; }; }) => {
      this.digiteamService.registerTenantUrl(metadata.settings.digiteam_url);
    });
    this.digiteamService.refresh()
      .subscribe(
        result => {
          this.digiteamService.saveRefreshInfo(result);
          this.init();
        },
        () => {
          this.digiteamService.logout();
          this.appStatus = 'login';
        }
      );
    client.invoke('resize', {width: '100%', height: '450px'});
  }

  init() {
    if (this.digiteamService.isLoggedIn()) {
      this.digiteamService.refresh()
        .subscribe(
          result => {
            this.digiteamService.saveRefreshInfo(result);
            this.getOrderDetails();
          },
          () => {
            this.digiteamService.logout();
            this.appStatus = 'login';
          }
        );
    } else {
      this.appStatus = 'login';
    }
  }

  private getOrderDetails() {
    const client = ZAFClient.init();
    client.get('ticket.id').then((data: { [x: string]: any; }) => {
      const ticketId = data['ticket.id'];
      this.digiteamService.getOrder(ticketId)
        .subscribe(
          result => {
            this.appStatus = 'detail';
            this.orderDetail = result;
            this.markerOptions.destination = {icon: this.orderDetail.marker};
            this.statusColor = this.orderDetail.statusColor;
            this.origin = {
              lat: this.orderDetail.agentModel ? this.orderDetail.agentModel.latitude : null,
              lng: this.orderDetail.agentModel ? this.orderDetail.agentModel.longitude : null
            };
            this.markerOptions.origin = {icon: this.orderDetail.agentModel ? this.orderDetail.agentModel.markerUrl : null};
            this.destination = {
              lat: this.orderDetail.whereis ? this.orderDetail.whereis.latitude : null,
              lng: this.orderDetail.whereis ? this.orderDetail.whereis.longitude : null
            };
            this.sleepOrderDetails().then(() => this.getOrderDetails());
          },
          () => {
            this.appStatus = 'create';
          }
        );
    });
  }

  onLoginSuccess($event: any) {
    console.log($event);
    this.getOrderDetails();
  }

  onCreatedSuccess($event: any) {
    console.log($event);
    this.getOrderDetails();
  }

  onCancelOrder() {
    if (this.orderDetail.code != null) {
      this.digiteamService.cancelOrder(this.orderDetail.code).subscribe(() => {
        this.getOrderDetails();
      }, () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error criando a OS.'
        });
      });
    }
  }

  onResponse(event: any) {
    if (event === undefined || event.routes == null || event.routes.length === 0) {
      return;
    }
    const legs = event.routes[0].legs;

    if (legs != null && legs.length > 0) {
      this.distanceToPoint = legs[0].distance;

      const duration = legs[0].duration;

      if (duration != null && duration.value != null) {
        const dt = new Date();
        dt.setSeconds(dt.getSeconds() + duration.value);
        duration.value = dt;
      }

      this.durationToPoint = duration;
    }
  }

  showAgentData(): boolean {
    return this.orderDetail.statusId === 8
      || this.orderDetail.statusId === 2
      || this.orderDetail.statusId === 7
      || this.orderDetail.statusId === 14;
  }

  private async sleepOrderDetails() {
    // Sleep thread for 30 seconds
    await this.delay(30000);
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  handleShowHistory() {
    this.showHistory = !this.showHistory;
    this.getOrderLogs();
  }

  getOrderLogs() {
    if (this.orderDetail.id != null) {
      this.digiteamService.getOrderLogs(this.orderDetail.id)
        .subscribe(
          result => {
            result.splice(0, 1);
            this.logs = result;
          },
          () => {
            this.appStatus = 'details';
          }
        );
    }
  }
}
