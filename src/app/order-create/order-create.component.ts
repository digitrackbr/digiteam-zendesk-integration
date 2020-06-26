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
  @Output() createdSuccess = new EventEmitter<any>();
  client = ZAFClient.init();
  createForm: FormGroup | undefined;
  ticketStatus?: string;
  ticketId?: string;
  address?: string;
  street?: string;
  neighborhood?: string;
  postalCode?: string;
  city?: string;
  state?: string;
  country?: string;
  ticketRequesterName?: string;
  ticketRequesterAvatarUrl?: string;
  ticketRequesterEmail?: string;
  zoom = 12;
  latitude = -15.77972;
  longitude = -47.92972;
  phone?: number;
  description?: string;
  points?: any[] = [];

  orderTypeList?: SelectItem[];
  orderType?: OrderTypeModel;
  orderTypeName?: string;

  unitsList?: SelectItem[];
  unitName?: string;
  unit: { name: string | undefined; id: any } = {
    id: 0,
    name: undefined
  };

  priorityList?: SelectItem[] = [
    {label: 'Baixa', value: 1},
    {label: 'Normal', value: 2},
    {label: 'Alta', value: 3},
  ];
  priorityName?: string;
  priority: { name: string | undefined; id: any } = {
    id: 0,
    name: undefined
  };

  constructor(
    private messageService: MessageService,
    private fb: FormBuilder,
    private digiteamService: DigiteamService
  ) {
    this.createForm = undefined;
  }

  ngOnInit(): void {
    this.buildForm();

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
  }

  ngAfterViewInit(): void {
    this.client.context().then((context: { location: any; userId: any; }) => {
      const location = context.location;
      switch (location) {
        case 'user_sidebar':
          this.client.request(`/api/v2/users/${context.userId}.json`)
            .then((data: { user: { name: string; email: string; photo: { content_url: string; }; phone: number; }; }) => {
              if (data && data.user) {
                this.ticketRequesterName = data.user.name;
                this.ticketRequesterEmail = data.user.email;
                if (data.user.photo) {
                  this.ticketRequesterAvatarUrl = data.user.photo.content_url;
                }
                this.phone = data.user.phone;
              }
            });
          break;
        case 'ticket_sidebar':
          this.client.get(['ticket']).then((data: { ticket: any; }) => {
            const ticket = data.ticket;
            this.ticketId = ticket.id;
            this.ticketStatus = ticket.status;
            const requester = ticket.requester;
            this.ticketRequesterName = requester.name;
            this.ticketRequesterAvatarUrl = requester.avatarUrl;
            this.ticketRequesterEmail = requester.email;
            requester.identities.forEach((c: { type: string; value: number; }) => {
              if (c.type === 'phone_number') {
                this.phone = c.value;
                return;
              }
            });
            this.client.request('/api/v2/tickets/'
              + ticket.id
              + '.json?include=brands,permissions,users,groups,organizations,ticket_fields')
              .then((d: {
                ticket: {
                  custom_fields: {
                    forEach: (arg0: (cf: { id: number; value: string | number; }) => void) => void;
                  };
                };
              }) => {
                d.ticket.custom_fields.forEach((cf: { id: number; value: string | number; }) => {
                  if (cf.id === 360031892932) {
                    this.setOrderType(cf.value as number);
                  } else if (cf.id === 360031957771) {
                    this.setUnit(cf.value as number);
                  } else if (cf.id === 360032107572) {
                    this.setPriority(cf.value as number);
                  } else if (cf.id === 360031892872) {
                    this.address = cf.value as string;
                    if (this.createForm) {
                      this.createForm.value.address = cf.value;
                    }
                    this.handleGeocode();
                  }
                });
              });
          });
          break;
      }
    });
  }

  onCreate() {
    if (this.createForm && this.createForm.valid) {
      this.digiteamService.createOrder({
        requestCode: this.ticketId,
        orderTypeId: this.orderType === undefined ? undefined : this.orderType.id,
        regionId: undefined,
        applicantName: this.ticketRequesterName,
        applicantPhone: this.createForm ? this.createForm.value.phone : null,
        lat: this.points === undefined ? undefined : this.points[0].lat,
        lng: this.points === undefined ? undefined : this.points[0].lng,
        priority: this.priority === undefined ? undefined : this.priority.id,
        address: this.address,
        street: this.street,
        neighborhood: this.neighborhood,
        postalCode: this.postalCode,
        city: this.city,
        state: this.state,
        country: this.country,
        unitId: this.unit === undefined ? undefined : this.unit.id,
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

    geocoder.geocode({location: {lat: $event.coords.lat, lng: $event.coords.lng}}, (results: any[], status: string) => {
      console.log('STATUS: ' + status);

      if (status === 'OK') {
        console.log(results);
        this.address = results[0].formatted_address;
        const place = results[0];

        place.address_components.forEach((component: { types: string[]; short_name: string; }) => {
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
    geocoder.geocode({address: this.createForm ? this.createForm.value.address : null}, (results: any[], status: string) => {
      if (status === 'OK') {
        this.zoom = 15;
        const place = results[0];
        this.address = place.formatted_address;
        this.latitude = place.geometry.location.lat();
        this.longitude = place.geometry.location.lng();

        if (this.points !== null && this.points !== undefined) {
          this.points.push({
            lat: this.latitude,
            lng: this.longitude
          });
        }

        place.address_components.forEach((component: { types: string[]; short_name: string; }) => {
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
    this.orderType = undefined;
  }

  showOrderEdit() {
    return this.orderType !== undefined;
  }

  handleEditUnit() {
    this.unit = {
      id: 0,
      name: undefined
    };
  }

  showUnitEdit() {
    return this.unit !== undefined && this.unit.id > 0 && this.unit.name !== undefined;
  }

  handleEditPriority() {
    this.priority = {
      id: 0,
      name: undefined
    };
  }

  showPriorityEdit() {
    return this.priority !== undefined && this.priority.id > 0 && this.priority.name !== undefined;
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

  private setOrderType(id: number) {
    this.orderType = undefined;
    if (id === null || this.orderTypeList === null || this.orderTypeList === undefined) {
      return;
    }
    const a = this.orderTypeList.find(x => x.value === Number(id));
    if (a === null || a === undefined) {
      return;
    }
    if (this.createForm) {
      this.createForm.value.orderType = a.label;
    }
    this.orderTypeName = a.label;
    this.orderType = {id: a.value, name: a.label};
  }

  private setUnit(id: number) {
    this.unit = {
      id: 0,
      name: undefined
    };
    if (id === null || this.unitsList === null || this.unitsList === undefined) {
      return;
    }
    const a = this.unitsList.find(x => x.value === Number(id));
    if (a === null || a === undefined) {
      return;
    }
    if (this.createForm) {
      this.createForm.value.unit = a.label;
    }
    this.unitName = a.label;
    this.unit = {id: a.value, name: a.label};
  }

  private setPriority(id: number) {
    this.priority = {
      id: 0,
      name: undefined
    };
    if (id === null || this.priorityList === null || this.priorityList === undefined) {
      return;
    }
    const a = this.priorityList.find(x => x.value === Number(id));
    if (a === null || a === undefined) {
      return;
    }
    if (this.createForm) {
      this.createForm.value.priority = a.label;
    }
    this.priorityName = a.label;
    this.priority = {id: a.value, name: a.label};
  }
}
