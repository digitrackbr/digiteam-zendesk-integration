import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {DigiteamService} from '../service/digiteam.service';

declare var ZAFClient: any;

@Component({
  selector: 'app-order-user',
  templateUrl: './order-user.component.html',
  styleUrls: ['./order-user.component.css']
})
export class OrderUserComponent implements OnInit {

  @Output() createSuccess = new EventEmitter<any>();
  client = ZAFClient.init();

  constructor(private digiteamService: DigiteamService) {
  }

  ngOnInit() {

  }

  onCreate() {
    this.createSuccess.emit(null);
  }
}
