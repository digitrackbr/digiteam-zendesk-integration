import {AfterViewInit, Component, EventEmitter, OnInit, Output} from '@angular/core';
import {DigiteamService} from '../service/digiteam.service';
import {MessageService, SelectItem} from 'primeng';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';

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
  street: string;
  neighborhood: string;
  postalCode: string;
  city: string;
  state: string;
  country: string;
  ticketRequesterName: string;
  orderTypeList: SelectItem[];
  regionsList: SelectItem[];
  unitsList: SelectItem[];
  zoom = 12;
  latitude = -15.77972;
  longitude = -47.92972;
  phone: number;
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
    client.get(['ticket']).then((data) => {
      const ticket = data['ticket'];
      this.ticketId = ticket.id;
      this.ticketStatus = ticket.status;
      const requester = ticket.requester;
      this.ticketRequesterName = requester.name;
      requester.identities.forEach((c) => {
        if (c.type === 'phone_number') {
          this.phone = c.value;
          return;
        }
      });
    });
    this.getPosition();
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
      address: new FormControl('', Validators.required),
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

    geocoder.geocode({location: {lat: $event.coords.lat, lng: $event.coords.lng}}, (results, status) => {
      console.log('STATUS: ' + status);

      if (status === 'OK') {
        console.log(results);
        this.address = results[0].formatted_address;
        const place = results[0];

        place.address_components.forEach((component) => {
          if (component.types[0] === 'country') {
            this.country = component.short_name;
          } else if (component.types[0] === 'administrative_area_level_1') {
            this.state = component.short_name;
          } else if (component.types[0] === 'administrative_area_level_2') {
            this.city = component.short_name;
          } else if (component.types[2] === 'sublocality_level_3') {
            this.street = component.short_name;
          } else if (component.types[0] === 'postal_code') {
            this.postalCode = component.short_name;
          } else if (component.types[2] === 'sublocality_level_1') {
            this.neighborhood = component.short_name;
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
        street: this.street,
        neighborhood: this.neighborhood,
        postalCode: this.postalCode,
        city: this.city,
        state: this.state,
        country: this.country,
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
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Invalid. Campos obrigatórios'
      });
    }
  }

  mapDragEndMarker($event: any) {
    this.mapClicked($event);
  }

  onEnter($event: any) {
    const geocoder = new google.maps.Geocoder();
    this.points = [];
    geocoder.geocode({address: this.createForm.value.address}, (results, status) => {
      if (status === 'OK') {
        this.zoom = 15;
        const place = results[0];
        this.address = place.formatted_address;
        this.latitude = place.geometry.location.lat();
        this.longitude = place.geometry.location.lng();
        this.points.push({
          lat: this.latitude,
          lng: this.longitude
        });

        place.address_components.forEach((component) => {
          if (component.types[0] === 'country') {
            this.country = component.short_name;
          } else if (component.types[0] === 'administrative_area_level_1') {
            this.state = component.short_name;
          } else if (component.types[0] === 'administrative_area_level_2') {
            this.city = component.short_name;
          } else if (component.types[2] === 'sublocality_level_3') {
            this.street = component.short_name;
          } else if (component.types[0] === 'postal_code') {
            this.postalCode = component.short_name;
          } else if (component.types[2] === 'sublocality_level_1') {
            this.neighborhood = component.short_name;
          }
        });
      }
    });
  }

  getPosition(): Promise<any> {
    return new Promise((resolve, reject) => {

      navigator.geolocation.getCurrentPosition(resp => {
          this.latitude = resp.coords.latitude;
          this.longitude = resp.coords.longitude;
        },
        err => {
          reject(err);
        });
    });
  }
}
