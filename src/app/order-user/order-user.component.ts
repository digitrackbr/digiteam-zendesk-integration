import {Component, OnInit} from '@angular/core';
import {DigiteamService} from '../service/digiteam.service';
import {OrderDetailModel} from '../model/order-detail.model';
import {TranslateService} from "@ngx-translate/core";

declare var ZAFClient: any;

@Component({
  selector: 'app-order-user',
  templateUrl: './order-user.component.html',
  styleUrls: ['./order-user.component.css']
})
export class OrderUserComponent implements OnInit {

  client = ZAFClient.init();
  ordersDetail: OrderDetailModel[] = [];

  constructor(
    private digiteamService: DigiteamService,
    translate: TranslateService) {
    translate.addLangs(['en', 'pt', 'es']);
    translate.setDefaultLang('pt');
    this.client.request(`/api/v2/locales/current.json`).then((metadata: {
      locale: any;
      metadata: any;
    }) => {
      const locale = metadata.locale.locale.substring(0, 2);
      translate.use(locale.match(/en|pt|es/) ? locale : 'pt');
    });
  }

  ngOnInit() {
    this.client.context().then((context: { location: any; userId: any; }) => {
      const location = context.location;
      switch (location) {
        case 'user_sidebar':
          const codes: Array<string> = [];
          this.client.request(`/api/v2/users/${context.userId}/tickets/requested.json`)
            .then((data: { tickets: { forEach: (arg0: (t: any) => void) => void; }; }) => {
              if (data && data.tickets) {
                data.tickets.forEach((t: any) => {
                  codes.push(String(t.id));
                });

                this.digiteamService.getOrdersByCodes(codes).subscribe(
                  (result) => {
                    this.ordersDetail = result;
                  },
                  () => {
                  }
                );
              }
            });
          break;
      }
    });
  }
}
