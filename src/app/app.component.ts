import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../environments/environment'
import { getMaxListeners } from 'process';
declare const paysafe: any;
declare var $;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'ROIIM-paysafe';
  email: string = "paysafe_demo@gmail.com";
  validEmail: boolean = true;
  amount: number = 100;
  validAmount: boolean = true;

  merchantRefNumber: string;
  customerId: string;
  newUser: string;
  singleUseCustomerToken: string;

  constructor(private http: HttpClient) {
  }

  ngOnInit() {
    this.merchantRefNumber = Math.random().toString(36).slice(2);
  }

  paysafecheckout() {
    this.showLoader();
    console.log(this.amount);
    console.log(this.merchantRefNumber);
    this.http.post(environment.AWS_URL + "singleusecustomertokens/",
      {
        "merchantRefNum": this.merchantRefNumber,
        "email": this.email
      }).subscribe(x => {
        console.log(x);
        this.singleUseCustomerToken = x["singleUseCustomerToken"];
        this.customerId = x["customerId"];
        console.log("Opening iframe");
        this.hideLoader();
        paysafe.checkout.setup(environment.API_KEY,
          {
            currency: "USD",
            amount: this.amount * 100,
            singleUseCustomerToken: this.singleUseCustomerToken,
            locale: "en_US",
            customer: {
              "firstName": "John",
              "lastName": "Dee",
              "email": "johndee@paysafe.com",
              "dateOfBirth": {
                "day": 1,
                "month": 7,
                "year": 1990
              }
            },
            billingAddress: {
              "nickName": "John Dee",
              "street": "20735 Stevens Creek Blvd",
              "street2": "Montessori",
              "city": "Cupertino",
              "zip": "95014",
              "country": "US",
              "state": "CA"
            },
            environment: "TEST",
            merchantRefNum: "newcustomer11a",
            canEditAmount: false,
            displayPaymentMethods: ["card"],
            paymentMethodDetails: {}
          }, (instance, error, result) => {
            if (result && result.paymentHandleToken) {
              try {
                console.log(JSON.stringify(result));
                console.log(result.paymentHandleToken);
                this.http.post(environment.AWS_URL + "payment/",
                  {
                    "merchantRefNum": this.merchantRefNumber,
                    "amount": this.amount * 100,
                    "paymentHandleToken": result.paymentHandleToken,
                    "customerId": this.customerId
                  }).subscribe(x => {
                    console.log(x);
                    if (x["status"] == "COMPLETED") {
                      instance.showSuccessScreen(`Payment ID: ${x["id"]}`);
                    }
                    else {
                      instance.showFailureScreen("Payment Failed! Please Try Again.");
                    }
                  })
              }
              catch (err) {
                instance.showFailureScreen("Payment Failed! Please Try Again.");
              }
              setTimeout(function () { window.location.replace(window.location.href); }, 5000);
            }
            else {
              console.error(error);
              alert(error.detailedMessage);
              // Handle the error
            }
          }, (stage, expired) => {
            if (expired) {
              alert("Session Expired");
              setTimeout(function () { window.location.replace(window.location.href); }, 2000);
            }
            switch (stage) {
              case "PAYMENT_HANDLE_NOT_CREATED": // Handle the scenario
              case "PAYMENT_HANDLE_CREATED": // Handle the scenario
              case "PAYMENT_HANDLE_REDIRECT": // Handle the scenario
              case "PAYMENT_HANDLE_PAYABLE": // Handle the scenario
              default:
                window.location.reload();
            }
          });
      })
    console.log("Completed");
  }

  validateEmail() {
    const regularExpression = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    this.validEmail = regularExpression.test(String(this.email).toLowerCase());
    console.log(this.email);
    console.log(this.validEmail);
  }
  validateAmount() {
    if (this.amount <= 0) {
      this.validAmount = false;
    }
    else {
      this.validAmount = true;
    }
  }

  showLoader() {
    $("#loadMe").modal({
      backdrop: "static", //remove ability to close modal with click
      keyboard: false, //remove option to close with keyboard
      show: true //Display loader!
    });
    $("html").css("cursor", "wait");
    $("html").css('pointer-events', 'none');
  }

  hideLoader() {
    $("html").css("cursor", "auto");
    $("html").css('pointer-events', 'auto');
    $("#loadMe").modal("hide");
  }
}
