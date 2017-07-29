angular.module('app').component('main', {
  templateUrl: './templates/main.html',
  controller: ($scope, $state, ngProgressFactory, MophService) => {
    var token = sessionStorage.getItem('token');

    $scope.fullname = null;
    $scope.birthDate = null;
    $scope.thName = null;
    $scope.engName = null;
    $scope.cid = null;
    $scope.issueDate = null;
    $scope.expiredDate = null;
    $scope.fullAddress = null;

    $scope.mophFullname = null;
    $scope.mophBirthDate = null;
    $scope.mophFullname = null;
    $scope.mophCid = null;
    $scope.mophId = null;
    $scope.mophSex = null;

    $scope.reading = false;

    $scope.progressbar = ngProgressFactory.createInstance();
    $scope.progressbar.setHeight('3px');

    $scope.readSmartCard = function () {
      $scope.reading = true;

      // alert('Hello');
      const smartcard = require('smartcard');
      const iconv = require('iconv-lite');
      const Devices = smartcard.Devices;
      const devices = new Devices();
      const Iso7816Application = smartcard.Iso7816Application;

      devices.on('device-activated', event => {
        const currentDevices = event.devices;
        let device = event.device;
        console.log(`Device '${device}' activated, devices: ${currentDevices}`);
        for (let prop in currentDevices) {
          console.log("Devices: " + currentDevices[prop]);
        }
      });


      devices.on('device-activated', event => {
        const currentDevices = event.devices;
        let device = event.device;
        console.log(`Device '${device}' activated, devices: ${currentDevices}`);
        for (let prop in currentDevices) {
          console.log("Devices: " + currentDevices[prop]);
        }

        device.on('card-inserted', event => {

          let card = event.card;
          console.log(`Card '${card.getAtr()}' inserted into '${event.device}'`);

          card.on('command-issued', event => {
            // console.log(`Command '${event.command}' issued to '${event.card}' `);
          });

          card.on('response-received', event => {
            // console.log(`Response '${event.response}' received from '${event.card}' in response to '${event.command}'`);
          });

          $scope.progressbar.start();

          let ResetCommand = '00a4040008a000000054480001';
          let RequestCommandCid1 = '80b0000402000d';
          let RequestCommandCid2 = '00c000000d'; // get data
          let RequestCommandText1 = '80b000110200d1';
          let RequestCommandText2 = '00c00000d1';
          //  RequestCommandText2 := '00c00001d1';
          let RequestCommand3 = '80b01579020064';
          let RequestCommand4 = '00c0000064'
          let RequestCommand5 = '80b00167020012';
          // let RequestCommand6 = '00c0000112';
          let RequestCommand6 = '00c0000012';

          let RequestImageCommand1 = '80b000040200de';
          let RequestImageCommand2 = '00c00000de';

          const application = new Iso7816Application(card);
          card
            .issueCommand(ResetCommand)
            .then((response) => {
              // console.log(`Response '${response.toString('hex')}`);
              return card.issueCommand(RequestCommandText1);
            })
            .then((response) => {
              // console.log(`Response '${response.toString('hex')}`);
              return card.issueCommand(RequestCommandText2);
              // return card.issueCommand(RequestCommandCid2);
            })
            .then((response) => {
              // console.log(response.toString());
              let result = response.toString();
              let strData = iconv.decode(response, 'tis-620');
              let _data = strData.split(' ');
              // console.log(_data);
              let person = [];
              _data.forEach(v => {
                if (v !== '') {
                  person.push(v);
                }
              });

              // console.log(person);

              // console.log(person);
              let thName = person[0].replace('#', '').replace('##', ' ');
              console.log('Your TH name: ', thName);
              $scope.thName = thName;

              let EngName = person[1].replace('#', '').replace('##', ' ');
              console.log('Your ENG name: ', EngName);
              $scope.engName = EngName;

              let birth = person[2];
              let y = birth.substring(0, 4);
              let m = birth.substring(4, 6);
              let d = birth.substring(6, 8);

              let sex = birth.substring(8, 9);
              $scope.sex = sex === '1' ? 'ชาย' : 'หญิง';

              $scope.birthDate = `${d}/${m}/${y}`;
              return card.issueCommand(RequestCommandCid1);
            })
            .then((response) => {
              return card.issueCommand(RequestCommandCid2);
            })
            .then((response) => {
              $scope.cid = response.toString().substring(0, 13);
              // console.log('CID: ', $scope.cid);
              return card.issueCommand(RequestCommand3);
            })
            .then((response) => {
              // console.log(response.toString());
              return card.issueCommand(RequestCommand4);
            })
            .then((response) => {
              // console.log(response.toString());
              let result = response.toString();
              let strData = iconv.decode(response, 'tis-620');
              let _data = strData.split(' ');
              let address = [];
              _data.forEach(v => {
                if (v !== '') {
                  address.push(v);
                }
              });
              let fullAddress = null;
              address.forEach(v => {
                if (v) {
                  var re = new RegExp('#', 'g');
                  fullAddress += ' ' + v.replace(re, ' ');
                }
              });
              var re = new RegExp(null, 'g');
              let myAddress = fullAddress.replace(re, '');
              $scope.fullAddress = myAddress.replace('�', '');
              return card.issueCommand(RequestCommand5);
            })
            .then((response) => {
              console.log(response.toString())
              return card.issueCommand(RequestCommand6);
            })
            .then((response) => {
              let issueExpDate = response.toString().replace('� ', '');
              console.log(issueExpDate);
              let issueDate = issueExpDate.substring(0, 8);
              let expiredDate = issueExpDate.substring(8, 16);
              $scope.issueDate = `${issueDate.substring(6, 8)}/${issueDate.substring(4, 6)}/${issueDate.substring(0, 4)}`;
              $scope.expiredDate = `${expiredDate.substring(6, 8)}/${expiredDate.substring(4, 6)}/${expiredDate.substring(0, 4)}`;
              // get person data

              return MophService.getPerson($scope.cid, token);

            })
            .then(resp => {
              $scope.mophFullname = null;
              $scope.mophBirthDate = null;
              $scope.mophCid = null;
              $scope.mophSex = null;
              $scope.mophId = null;
              $scope.mophABOgroup = null;
              $scope.mophFullname = `${resp.prename_moi}${resp.name} ${resp.lname}`;
              // "25230819"
              $scope.mophBirthDate = `${resp.birth_moi.substring(6, 8)}/${resp.birth_moi.substring(4, 6)}/${resp.birth_moi.substring(0, 4)}`;
              $scope.mophCid = resp.cid;
              $scope.mophSex = resp.sex === '1' ? 'ชาย' : 'หญิง';
              $scope.mophId = resp.moph_id;
              $scope.mophABOgroup = resp.abogroup;

              return MophService.getAddress($scope.cid, token);

            })
            .then(() => {
              $scope.progressbar.complete();
              $scope.$apply();
            })
            .catch((error) => {
              console.error(error);
              $scope.progressbar.complete();
            });
        });
        device.on('card-removed', event => {
          console.log(`Card removed from '${event.name}' `);
          $scope.mophFullname = null;
          $scope.mophBirthDate = null;
          $scope.mophCid = null;
          $scope.mophSex = null;
          $scope.mophId = null;
          $scope.mophABOgroup = null;

          $scope.fullname = null;
          $scope.birthDate = null;
          $scope.thName = null;
          $scope.engName = null;
          $scope.cid = null;
          $scope.issueDate = null;
          $scope.expiredDate = null;
          $scope.fullAddress = null;
          $scope.$apply();
          $scope.progressbar.complete();
        });

      });

      devices.on('device-deactivated', event => {
        console.log(`Device '${event.device}' deactivated, devices: [${event.devices}]`);
      });

    }

    $scope.logout = function () {
      $state.go('login');
    }

    $scope.getPerson = function (cid) {
      $scope.mophFullname = null;
      $scope.mophBirthDate = null;
      $scope.mophCid = null;
      $scope.mophSex = null;
      $scope.mophId = null;
      $scope.mophABOgroup = null;

      MophService.getPerson(cid)
        .then(resp => {
          console.log(resp);
          $scope.mophFullname = `${resp.prename_moi}${resp.name} ${resp.lname}`;
          // "25230819"
          $scope.mophBirthDate = `${resp.birth_moi.substring(6, 8)}/${resp.birth_moi.substring(4, 6)}/${resp.birth_moi.substring(0, 4)}`;
          $scope.mophCid = resp.cid;
          $scope.mophSex = resp.sex === '1' ? 'ชาย' : 'หญิง';
          $scope.mophId = resp.moph_id;
          $scope.mophABOgroup = resp.abogroup;
        })
        .catch(error => {
          console.log(error);
        })
    }

    $scope.getAddress = function (cid) {
      console.log(cid);
      MophService.getAddress(cid)
        .then(resp => {
          console.log(resp);
        })
        .catch(error => {
          console.log(error);
        })
    }

  }


});