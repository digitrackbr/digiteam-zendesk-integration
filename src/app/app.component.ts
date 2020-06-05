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
    client.metadata().then(metadata => {
      console.log(metadata.settings);
      this.digiteamService.registerTenantUrl(metadata.settings.digiteam_url);
      this.init();
    });

    client.invoke('resize', {width: '100%', height: '500px'});
  }

  init() {
    if (this.digiteamService.isLoggedIn()) {
      const client = ZAFClient.init();
      client.get('ticket.id').then(data => {

        const ticketId = data['ticket.id'];

        // get ticket information with side loading
        client.request('/api/v2/tickets/'
          + ticketId
          + '.json?include=brands,permissions,users,groups,organizations,ticket_fields').then(d => {
          // console.log(JSON.stringify(d));
          // dados = d;
          // passa os dados para o modal
          // localStorage.setItem('ticket', JSON.stringify(d));
        });

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
            },
            error => {
              this.appStatus = 'create';
            }
          );
      });
    } else {
      this.appStatus = 'login';
    }
  }

  onLoginSuccess($event: any) {

    const client = ZAFClient.init();

    client.get('ticket.id').then((data) => {
      const ticketId = data['ticket.id'];

      this.digiteamService.getOrder(ticketId)
        .subscribe(
          result => {
            this.appStatus = 'detail';
            this.orderDetail = result;
            this.statusColor = this.orderDetail.statusColor;
            if (this.orderDetail.agentModel !== null) {
              this.origin = {lat: this.orderDetail.agentModel.latitude, lng: this.orderDetail.agentModel.longitude};
            }
            this.destination = {lat: this.orderDetail.whereis.latitude, lng: this.orderDetail.whereis.longitude};
          },
          error => {
            this.appStatus = 'create';
          }
        );
    });
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
    this.digiteamService.cancelOrder(this.orderDetail.code).subscribe(result => {
      this.digiteamService.getOrder(this.orderDetail.code)
        .subscribe(
          r => {
            this.appStatus = 'detail';
            this.orderDetail = r;
          },
          error => {
            this.appStatus = 'cancel';
          }
        );
    }, error => {
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
}
