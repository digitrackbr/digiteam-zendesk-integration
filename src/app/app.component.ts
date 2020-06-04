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
  public origin: any;
  public destination: any;

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

        this.digiteamService.getOrder(ticketId)
          .subscribe(
            result => {
              this.appStatus = 'detail';
              this.orderDetail = result;
              this.origin = { lat: this.orderDetail.agentModel.latitude, lng: this.orderDetail.agentModel.longitude };
              this.destination = { lat: this.orderDetail.whereis.latitude, lng: this.orderDetail.whereis.longitude };
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
            this.origin = { lat: this.orderDetail.agentModel.latitude, lng: this.orderDetail.agentModel.longitude };
            this.destination = { lat: this.orderDetail.whereis.latitude, lng: this.orderDetail.whereis.longitude };
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
}
