import {AfterViewInit, Component, EventEmitter, OnInit, Output} from '@angular/core';
import {DigiteamService} from '../service/digiteam.service';
import {MessageService, SelectItem} from 'primeng';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {OrderTypeModel} from '../model/order-type.model';

declare var ZAFClient: any;
declare var google: any;

@Component({
  selector: 'app-order-create',
  templateUrl: './order-create.component.html',
  styleUrls: ['./order-create.component.css']
})
export class OrderCreateComponent implements AfterViewInit, OnInit {
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
  zoom = 12;
  latitude = -15.77972;
  longitude = -47.92972;
  phone: number;
  description: string;
  points: any[] = [];

  orderTypeList: SelectItem[];
  orderType: OrderTypeModel;
  orderTypeName: string;

  unitsList: SelectItem[];
  unitName: string;
  unit = {
    id: null,
    name: null
  };

  priorityList: SelectItem[] = [
    {label: 'Baixa', value: 1},
    {label: 'Normal', value: 2},
    {label: 'Alta', value: 3},
  ];
  priorityName: string;
  priority = {
    id: null,
    name: null
  };
  @Output() createdSuccess = new EventEmitter<any>();

  constructor(
    private messageService: MessageService,
    private fb: FormBuilder,
    private digiteamService: DigiteamService
  ) {
  }

  ngOnInit(): void {
    this.digiteamService.getOrderTypes().subscribe(
      (result) => {
        this.orderTypeList = result.map(r => {
          return {label: r.value, value: r.key};
        });
      },
      () => {
      }
    );

    this.digiteamService.getUnits().subscribe(
      result => {
        this.unitsList = result.map(r => {
          return {label: r.value, value: r.key};
        });
      },
      () => {
      }
    );

    this.buildForm();
  }

  ngAfterViewInit(): void {
    console.log('ngAfterViewInit');
    const client = ZAFClient.init();
    client.get(['ticket']).then((data) => {
      const ticket = data.ticket;
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
      client.request('/api/v2/tickets/'
        + ticket.id
        + '.json?include=brands,permissions,users,groups,organizations,ticket_fields')
        .then(d => {
          d.ticket.custom_fields.forEach((cf) => {
            if (cf.id === 360031892932) {
              this.setOrderType(cf.value);
            } else if (cf.id === 360031957771) {
              this.setUnit(cf.value);
            } else if (cf.id === 360032107572) {
              this.setPriority(cf.value);
            } else if (cf.id === 360031892872) {
              this.address = cf.value;
              this.createForm.value.address = cf.value;
              this.handleGeocode();
            }
          });
        });
    });
  }

  onCreate() {
    if (this.createForm.valid) {
      this.digiteamService.createOrder({
        requestCode: this.ticketId,
        orderTypeId: this.orderType.id,
        regionId: null,
        applicantName: this.ticketRequesterName,
        applicantPhone: this.createForm.value.phone,
        lat: this.points[0].lat,
        lng: this.points[0].lng,
        priority: this.priority.id,
        address: this.address,
        street: this.street,
        neighborhood: this.neighborhood,
        postalCode: this.postalCode,
        city: this.city,
        state: this.state,
        country: this.country,
        unitId: this.unit.id,
        description: this.description
      }).subscribe(
        () => {
          this.createdSuccess.emit(null);
        },
        () => {
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

  onChangeOrderType($event: any) {
    this.setOrderType($event.value);
  }

  onChangeUnit($event: any) {
    this.setUnit($event.value);
  }

  onChangePriority($event: any) {
    this.setPriority($event.value);
  }

  onMapClicked($event: any) {
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

  onMapDragEndMarker($event: any) {
    this.onMapClicked($event);
  }

  handleGeocode() {
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

  handleEditOrderType() {
    this.orderType = null;
  }

  handleEditUnit() {
    this.unit = null;
  }

  handleEditPriority() {
    this.priority = null;
  }

  private buildForm() {
    this.createForm = this.fb.group({
      unit: new FormControl('', Validators.required),
      orderType: new FormControl('', Validators.required),
      phone: new FormControl('', Validators.required),
      address: new FormControl('', Validators.required),
      priority: new FormControl('', Validators.required)
    });
  }

  private setOrderType(id) {
    this.orderType = null;
    if (id === null) {
      return;
    }
    const a = this.orderTypeList.find(x => x.value === Number(id));
    if (a === null || a === undefined) {
      return;
    }
    this.createForm.value.orderType = a.label;
    this.orderTypeName = a.label;
    this.orderType = {id: a.value, name: a.label};
  }

  private setUnit(id) {
    this.unit = null;
    if (id === null) {
      return;
    }
    const a = this.unitsList.find(x => x.value === Number(id));
    if (a === null || a === undefined) {
      return;
    }
    this.createForm.value.unit = a.label;
    this.unitName = a.label;
    this.unit = {id: a.value, name: a.label};
  }

  private setPriority(id) {
    this.priority = null;
    if (id === null) {
      return;
    }
    const a = this.priorityList.find(x => x.value === Number(id));
    if (a === null || a === undefined) {
      return;
    }
    this.createForm.value.priority = a.label;
    this.priorityName = a.label;
    this.priority = {id: a.value, name: a.label};
  }
}
