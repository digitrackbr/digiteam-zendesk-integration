import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {DigiteamService} from './service/digiteam.service';
import {MessageService} from 'primeng';
import {OrderDetailModel} from './model/order-detail.model';

declare var ZAFClient: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'zendesk-integration';
  appStatus = 'loading';
  orderDetail: OrderDetailModel;
  origin: any;
  destination: any;
  statusColor: string;
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

  @Output() createdSuccess = new EventEmitter<any>();

  constructor(
    private digiteamService: DigiteamService,
    private messageService: MessageService) {
  }

  ngOnInit(): void {
    const client = ZAFClient.init();
    this.digiteamService.refresh()
      .subscribe(
        result => {
          this.digiteamService.saveRefreshInfo(result);
          client.metadata().then(metadata => {
            console.log(metadata.settings);
            this.digiteamService.registerTenantUrl(metadata.settings.digiteam_url);
            this.init();
          });
        },
        error => {
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
          error => {
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
    client.get('ticket.id').then((data) => {
      const ticketId = data['ticket.id'];
      this.digiteamService.getOrder(ticketId)
        .subscribe(
          result => {
            this.appStatus = 'detail';
            this.orderDetail = result;
            this.markerOptions.destination = {icon: this.orderDetail.marker};
            this.statusColor = this.orderDetail.statusColor;
            if (this.orderDetail.agentModel !== null) {
              this.origin = {lat: this.orderDetail.agentModel.latitude, lng: this.orderDetail.agentModel.longitude};
              this.markerOptions.origin = {icon: this.orderDetail.agentModel.markerUrl};
            }
            this.destination = {lat: this.orderDetail.whereis.latitude, lng: this.orderDetail.whereis.longitude};
            this.sleepOrderDetails().then(() => this.getOrderDetails());
          },
          () => {
            this.appStatus = 'create';
          }
        );
    });
  }

  onLoginSuccess($event: any) {
    this.getOrderDetails();
  }

  onCreatedSuccess($event: any) {
    this.onLoginSuccess($event);
  }

  logout($event: MouseEvent) {
    this.digiteamService.logout();
    this.appStatus = 'login';
    $event.preventDefault();
  }

  onCancelOrder($event: any) {
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
      || this.orderDetail.statusId === 11
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
}
