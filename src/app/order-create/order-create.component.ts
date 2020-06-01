import {AfterViewInit, Component, EventEmitter, OnInit, Output} from '@angular/core';
import {DigiteamService} from '../service/digiteam.service';
import {MessageService, SelectItem} from 'primeng';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {Router} from '@angular/router';


declare var ZAFClient: any;

declare var google: any;

@Component({
  selector: 'app-order-create',
  templateUrl: './order-create.component.html',
  styleUrls: ['./order-create.component.css']
})
export class OrderCreateComponent implements AfterViewInit, OnInit {
  title = 'zendesk-integration';

  createForm: FormGroup;

  ticketStatus: string;
  ticketId: string;
  address: string;
  city: string;
  state: string;
  ticketRequesterName: string;

  orderTypeList: SelectItem[];
  regionsList: SelectItem[];
  unitsList: SelectItem[];
  @Output() createdSuccess = new EventEmitter<any>();

  priorityList: SelectItem[] = [
    {label: 'Baixa', value: 1},
    {label: 'Normal', value: 2},
    {label: 'Alta', value: 3},
  ];

  points: any[] = [];

  constructor(
    private messageService: MessageService,
    private fb: FormBuilder,
    private digiteamService: DigiteamService
  ) {
  }

  ngAfterViewInit(): void {
    console.log('ngAfterViewInit');

    const client = ZAFClient.init();
    client.get(['ticket.status', 'ticket.id', 'ticket.requester.name']).then((data) => {
      this.ticketId = data['ticket.id'];
      this.ticketStatus = data['ticket.status'];
      this.ticketRequesterName = data['ticket.requester.name'];
    });


  }

  ngOnInit(): void {

    this.digiteamService.getOrderTypes().subscribe(
      (result) => {
        this.orderTypeList = result.map(r => {
          return {label: r.value, value: r.key};
        });
      },
      error => {

      }
    );

    this.digiteamService.getRegions().subscribe(
      result => {
        this.regionsList = result.map(r => {
          return {label: r.value, value: r.key};
        });
      },
      error => {

      }
    );
    this.digiteamService.getUnits().subscribe(
      result => {
        this.unitsList = result.map(r => {
          return {label: r.value, value: r.key};
        });
      },
      error => {

      }
    );

    this.buildForm();
  }

  private buildForm() {
    this.createForm = this.fb.group({
      region: new FormControl('', Validators.required),
      unit: new FormControl('', Validators.required),
      orderType: new FormControl('', Validators.required),
      phone: new FormControl('', Validators.required),
      priority: new FormControl('', Validators.required)
    });
  }

  mapClicked($event: any) {
    console.log($event);
    this.points = [];
    this.points.push({
      lat: $event.coords.lat,
      lng: $event.coords.lng
    });

    const geocoder = new google.maps.Geocoder();

    geocoder.geocode({'location': {lat: $event.coords.lat, lng: $event.coords.lng}}, (results, status) => {
      console.log('STATUS: ' + status);

      if (status === 'OK') {
        console.log(results);
        this.address = results[0].formatted_address;

        const place = results[0];

        place.address_components.forEach((component) => {
          if (component.types[0] === 'administrative_area_level_1') {
            this.state = component.short_name;
            console.log(this.state);

          } else if (component.types[0] === 'administrative_area_level_2') {

            this.city = component.short_name;
            console.log(this.city);
          }
        });
      }
    });
    console.log(this.points);
  }

  onCreateFormSubmit() {
    if (this.createForm.valid) {


      this.digiteamService.createOrder({
        requestCode: this.ticketId,
        orderTypeId: this.createForm.value.orderType,
        regionId: this.createForm.value.region,
        applicantName: this.ticketRequesterName,
        applicantPhone: this.createForm.value.phone,
        lat: this.points[0].lat,
        lng: this.points[0].lng,
        priority: this.createForm.value.priority,
        address: this.address,
        city: this.city,
        state: this.state,
        country: 'Brasil',
        unitId: this.createForm.value.unit
      }).subscribe(
        result => {
          this.createdSuccess.emit(null);
        },
        error => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error criando a OS.'
          });
        }
      );
    }
  }
}
