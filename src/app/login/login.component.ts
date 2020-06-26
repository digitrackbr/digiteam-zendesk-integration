import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {DigiteamService} from '../service/digiteam.service';
import {MessageService} from 'primeng';
import {Credential} from '../model/credential';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  loginForm: FormGroup | undefined;
  @Output() loginSuccess = new EventEmitter<any>();

  constructor(
    private fb: FormBuilder,
    private digiteamService: DigiteamService,
    private messageService: MessageService
  ) {
    this.loginForm = undefined;
  }

  ngOnInit() {
    this.initLoginForm();
  }

  private initLoginForm() {
    this.loginForm = this.fb.group({
      username: new FormControl('', Validators.required),
      password: new FormControl('', Validators.required),
      checked: new FormControl(false)
    });
  }

  login() {
    if (this.loginForm && this.loginForm.valid) {

      this.digiteamService.login(this.credentials)
        .subscribe(
          result => {
            this.digiteamService.saveAuthInfo(result);
            this.loginSuccess.emit(null);
          },
          () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Verifique suas credenciais.'
            });
          }
        );
    }
  }

  private get credentials(): Credential {
    return this.loginForm ? this.loginForm.value : null;
  }
}
