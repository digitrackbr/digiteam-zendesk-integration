import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import {
  ButtonModule,
  DropdownModule,
  InputTextModule,
  MessageModule,
  MessageService,
  MessagesModule,
  PasswordModule,
  ToastModule
} from 'primeng';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import {AuthInterceptor} from './helper/auth.interceptor';
import {AgmCoreModule} from '@agm/core';
import { LoginComponent } from './login/login.component';
import { OrderCreateComponent } from './order-create/order-create.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    OrderCreateComponent
  ],
  imports: [
    BrowserModule,
    ButtonModule,
    BrowserAnimationsModule,
    InputTextModule,
    HttpClientModule,
    PasswordModule,
    DropdownModule,
    FormsModule,
    ReactiveFormsModule,
    MessageModule,
    MessagesModule,
    ToastModule,
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyDOzcHIZsCXxtVLnJJOp7R0IxQU6PVff40',
      libraries: ['places', 'drawing', 'geometry']
    }),
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    MessageService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
