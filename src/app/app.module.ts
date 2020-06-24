import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppComponent} from './app.component';
import {
  ButtonModule, CardModule,
  DropdownModule,
  InputTextModule,
  MessageModule,
  MessageService,
  MessagesModule,
  PasswordModule,
  SplitButtonModule,
  ToastModule
} from 'primeng';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {HTTP_INTERCEPTORS, HttpClient, HttpClientModule} from '@angular/common/http';
import {AuthInterceptor} from './helper/auth.interceptor';
import {AgmCoreModule} from '@agm/core';
import {LoginComponent} from './login/login.component';
import {OrderCreateComponent} from './order-create/order-create.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {AgmDirectionModule} from 'agm-direction';
import {AgmOverlays} from 'agm-overlays';
import {TranslateLoader, TranslateModule} from '@ngx-translate/core';
import {TranslateHttpLoader} from '@ngx-translate/http-loader';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}

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
      apiKey: 'AIzaSyA497VsGGTer599ux6BHhADZF_jTwPdw4Q',
      libraries: ['places', 'drawing', 'geometry']
    }),
    AgmDirectionModule,
    CardModule,
    AgmOverlays,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      },
      defaultLanguage: 'pt'
    }),
    SplitButtonModule
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
export class AppModule {
}
