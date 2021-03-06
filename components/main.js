const easysoap = require('easysoap');
const _ = require('lodash');
const { dialog } = require('electron').remote;

angular.module('app').component('main', {
  templateUrl: './templates/main.html',
  controller: ($scope, $state, $uibModal, ngProgressFactory, MophService) => {
    var token = sessionStorage.getItem('token');
    $scope.smartcards = [];
    $scope.nhso = {};
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

    $scope.showNhsoRight = false;

    $scope.reading = false;
    $scope.selectedSmartCard = null;
    $scope.currentDevices = [];

    $scope.progressbar = ngProgressFactory.createInstance();
    $scope.progressbar.setHeight('3px');

    const smartcard = require('smartcard');
    const iconv = require('iconv-lite');
    const Devices = smartcard.Devices;
    const devices = new Devices();
    const Iso7816Application = smartcard.Iso7816Application;

    devices.on('device-activated', event => {
      $scope.currentDevices = event.devices;
      let device = event.device;
      const idx = _.indexOf($scope.smartcards, device.name);
      if (idx === -1) {
        $scope.smartcards.push(device.name);
      }
      // console.log($scope.smartcards);
      // console.log(device);
      $scope.$apply();

      // console.log($scope.currentDevices);
    });

    devices.on('device-activated', event => {
      const currentDevices = event.devices;
      let device = event.device;

      device.on('card-inserted', event => {
        let card = event.card;
        // console.log(`Card '${card.getAtr()}' inserted into '${event.device}'`);
        if (event.device.name === $scope.selectedSmartCard) {
          $scope.startRead(card);
        }
      });

    });

    devices.on('device-deactivated', event => {
      console.log(`Device '${event.device}' deactivated, devices: [${event.devices}]`);
      const idx = _.indexOf($scope.smartcards, event.device.name);
      if (idx > -1) {
        $scope.smartcards.splice(idx, 1);
        $scope.$apply();
      }
    });

    $scope.startRead = function (card) {
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
        .then((callResponse) => {
          $scope.getNhso($scope.cid);
          $scope.progressbar.complete();
          $scope.$apply();
        })
        .catch((error) => {
          console.error(error);
          $scope.progressbar.complete();
        });

    }

    $scope.readSmartCard = function () {
      $scope.reading = true;
      console.log($scope.selectedSmartCard);
      // alert('Hello');


      // devices.on('device-activated', event => {
      //   const currentDevices = event.devices;
      //   let device = event.device;
      //   console.log(`Device '${device}' activated, devices: ${currentDevices}`);
      //   for (let prop in currentDevices) {
      //     console.log("Devices: " + currentDevices[prop]);
      //   }

      //   device.on('card-inserted', event => {

      //     let card = event.card;
      //     console.log(`Card '${card.getAtr()}' inserted into '${event.device}'`);

      //     card.on('command-issued', event => {
      //       // console.log(`Command '${event.command}' issued to '${event.card}' `);
      //     });

      //     card.on('response-received', event => {
      //       // console.log(`Response '${event.response}' received from '${event.card}' in response to '${event.command}'`);
      //     });

      //     $scope.progressbar.start();

      //     let ResetCommand = '00a4040008a000000054480001';
      //     let RequestCommandCid1 = '80b0000402000d';
      //     let RequestCommandCid2 = '00c000000d'; // get data
      //     let RequestCommandText1 = '80b000110200d1';
      //     let RequestCommandText2 = '00c00000d1';
      //     //  RequestCommandText2 := '00c00001d1';
      //     let RequestCommand3 = '80b01579020064';
      //     let RequestCommand4 = '00c0000064'
      //     let RequestCommand5 = '80b00167020012';
      //     // let RequestCommand6 = '00c0000112';
      //     let RequestCommand6 = '00c0000012';

      //     let RequestImageCommand1 = '80b000040200de';
      //     let RequestImageCommand2 = '00c00000de';

      //     const application = new Iso7816Application(card);
      //     card
      //       .issueCommand(ResetCommand)
      //       .then((response) => {
      //         // console.log(`Response '${response.toString('hex')}`);
      //         return card.issueCommand(RequestCommandText1);
      //       })
      //       .then((response) => {
      //         // console.log(`Response '${response.toString('hex')}`);
      //         return card.issueCommand(RequestCommandText2);
      //         // return card.issueCommand(RequestCommandCid2);
      //       })
      //       .then((response) => {
      //         // console.log(response.toString());
      //         let result = response.toString();
      //         let strData = iconv.decode(response, 'tis-620');
      //         let _data = strData.split(' ');
      //         // console.log(_data);
      //         let person = [];
      //         _data.forEach(v => {
      //           if (v !== '') {
      //             person.push(v);
      //           }
      //         });

      //         // console.log(person);

      //         // console.log(person);
      //         let thName = person[0].replace('#', '').replace('##', ' ');
      //         console.log('Your TH name: ', thName);
      //         $scope.thName = thName;

      //         let EngName = person[1].replace('#', '').replace('##', ' ');
      //         console.log('Your ENG name: ', EngName);
      //         $scope.engName = EngName;

      //         let birth = person[2];
      //         let y = birth.substring(0, 4);
      //         let m = birth.substring(4, 6);
      //         let d = birth.substring(6, 8);

      //         let sex = birth.substring(8, 9);
      //         $scope.sex = sex === '1' ? 'ชาย' : 'หญิง';

      //         $scope.birthDate = `${d}/${m}/${y}`;
      //         return card.issueCommand(RequestCommandCid1);
      //       })
      //       .then((response) => {
      //         return card.issueCommand(RequestCommandCid2);
      //       })
      //       .then((response) => {
      //         $scope.cid = response.toString().substring(0, 13);
      //         // console.log('CID: ', $scope.cid);
      //         return card.issueCommand(RequestCommand3);
      //       })
      //       .then((response) => {
      //         // console.log(response.toString());
      //         return card.issueCommand(RequestCommand4);
      //       })
      //       .then((response) => {
      //         // console.log(response.toString());
      //         let result = response.toString();
      //         let strData = iconv.decode(response, 'tis-620');
      //         let _data = strData.split(' ');
      //         let address = [];
      //         _data.forEach(v => {
      //           if (v !== '') {
      //             address.push(v);
      //           }
      //         });
      //         let fullAddress = null;
      //         address.forEach(v => {
      //           if (v) {
      //             var re = new RegExp('#', 'g');
      //             fullAddress += ' ' + v.replace(re, ' ');
      //           }
      //         });
      //         var re = new RegExp(null, 'g');
      //         let myAddress = fullAddress.replace(re, '');
      //         $scope.fullAddress = myAddress.replace('�', '');
      //         return card.issueCommand(RequestCommand5);
      //       })
      //       .then((response) => {
      //         console.log(response.toString())
      //         return card.issueCommand(RequestCommand6);
      //       })
      //       .then((response) => {
      //         let issueExpDate = response.toString().replace('� ', '');
      //         console.log(issueExpDate);
      //         let issueDate = issueExpDate.substring(0, 8);
      //         let expiredDate = issueExpDate.substring(8, 16);
      //         $scope.issueDate = `${issueDate.substring(6, 8)}/${issueDate.substring(4, 6)}/${issueDate.substring(0, 4)}`;
      //         $scope.expiredDate = `${expiredDate.substring(6, 8)}/${expiredDate.substring(4, 6)}/${expiredDate.substring(0, 4)}`;
      //         // get person data

      //         return MophService.getPerson($scope.cid, token);

      //       })
      //       .then(resp => {
      //         $scope.mophFullname = null;
      //         $scope.mophBirthDate = null;
      //         $scope.mophCid = null;
      //         $scope.mophSex = null;
      //         $scope.mophId = null;
      //         $scope.mophABOgroup = null;
      //         $scope.mophFullname = `${resp.prename_moi}${resp.name} ${resp.lname}`;
      //         // "25230819"
      //         $scope.mophBirthDate = `${resp.birth_moi.substring(6, 8)}/${resp.birth_moi.substring(4, 6)}/${resp.birth_moi.substring(0, 4)}`;
      //         $scope.mophCid = resp.cid;
      //         $scope.mophSex = resp.sex === '1' ? 'ชาย' : 'หญิง';
      //         $scope.mophId = resp.moph_id;
      //         $scope.mophABOgroup = resp.abogroup;

      //         return MophService.getAddress($scope.cid, token);
      //       })
      //       // .then(() => {
      //       //   return $scope.getNhso($scope.cid);
      //       // })
      //       .then((callResponse) => {
      //         $scope.getNhso($scope.cid);
      //         $scope.progressbar.complete();
      //         $scope.$apply();
      //       })
      //       .catch((error) => {
      //         console.error(error);
      //         $scope.progressbar.complete();
      //       });
      //   });
      //   device.on('card-removed', event => {
      //     console.log(`Card removed from '${event.name}' `);
      //     $scope.mophFullname = null;
      //     $scope.mophBirthDate = null;
      //     $scope.mophCid = null;
      //     $scope.mophSex = null;
      //     $scope.mophId = null;
      //     $scope.mophABOgroup = null;

      //     $scope.fullname = null;
      //     $scope.birthDate = null;
      //     $scope.thName = null;
      //     $scope.engName = null;
      //     $scope.cid = null;
      //     $scope.issueDate = null;
      //     $scope.expiredDate = null;
      //     $scope.fullAddress = null;
      //     $scope.$apply();
      //     $scope.progressbar.complete();
      //   });

      // });



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

    $scope.getNhso = function (cid) {
      const args = {
        user_person_id: '1440400087043',
        person_id: cid,
        smctoken: 'q6kjk62b2ib9h334'
      };

      const params = {
        host: 'http://ucws.nhso.go.th:80',
        path: '/ucwstokenp1/UCWSTokenP1',
        wsdl: '/ucwstokenp1/UCWSTokenP1?wsdl',
      };

      const soapClient = easysoap.createClient(params);

      return soapClient.call({
        method: 'searchCurrentByPID',
        params: args
      })
        .then((callResponse) => {
          // console.log(callResponse.data.searchCurrentByPIDResponse.return);
          const data = callResponse.data.searchCurrentByPIDResponse.return;

          data.forEach(v => {
            const keys = Object.keys(v);
            // console.log(keys);
            if (keys[0] === 'birthdate') $scope.nhso.birthdate = v['birthdate'];
            if (keys[0] === 'expdate') $scope.nhso.expdate = v['expdate'];
            if (keys[0] === 'fname') $scope.nhso.fname = v['fname'];
            if (keys[0] === 'lname') $scope.nhso.lname = v['lname'];
            if (keys[0] === 'hmain') $scope.nhso.hmain = v['hmain'];
            if (keys[0] === 'hmain_name') $scope.nhso.hmain_name = v['hmain_name'];
            if (keys[0] === 'maininscl') $scope.nhso.maininscl = v['maininscl'];
            if (keys[0] === 'maininscl_main') $scope.nhso.maininscl_main = v['maininscl_main'];
            if (keys[0] === 'maininscl_name') $scope.nhso.maininscl_name = v['maininscl_name'];
            if (keys[0] === 'nation') $scope.nhso.nation = v['nation'];
            if (keys[0] === 'person_id') $scope.nhso.person_id = v['person_id'];
            if (keys[0] === 'primary_amphur_name') $scope.nhso.primary_amphur_name = v['primary_amphur_name'];
            if (keys[0] === 'primary_moo') $scope.nhso.primary_moo = v['primary_moo'];
            if (keys[0] === 'primary_mooban_name') $scope.nhso.primary_mooban_name = v['primary_mooban_name'];
            if (keys[0] === 'primary_province_name') $scope.nhso.primary_province_name = v['primary_province_name'];
            if (keys[0] === 'primary_tumbon_name') $scope.nhso.primary_tumbon_name = v['primary_tumbon_name'];
            if (keys[0] === 'primaryprovince') $scope.nhso.primaryprovince = v['primaryprovince'];
            if (keys[0] === 'purchaseprovince') $scope.nhso.purchaseprovince = v['purchaseprovince'];
            if (keys[0] === 'purchaseprovince_name') $scope.nhso.purchaseprovince_name = v['purchaseprovince_name'];
            if (keys[0] === 'sex') $scope.nhso.sex = v['sex'] === '1' ? 'ชาย' : 'หญิง';
            if (keys[0] === 'startdate') $scope.nhso.startdate = v['startdate'];
            if (keys[0] === 'startdate_sss') $scope.nhso.startdate_sss = v['startdate_sss'];
            if (keys[0] === 'subinscl') $scope.nhso.subinscl = v['subinscl'];
            if (keys[0] === 'subinscl_name') $scope.nhso.subinscl_name = v['subinscl_name'];
            if (keys[0] === 'title') $scope.nhso.title = v['title'];
            if (keys[0] === 'title_name') $scope.nhso.title_name = v['title_name'];
            if (keys[0] === 'ws_data_source') $scope.nhso.ws_data_source = v['ws_data_source'];
            if (keys[0] === 'ws_date_request') $scope.nhso.ws_date_request = v['ws_date_request'];
            if (keys[0] === 'ws_status') $scope.nhso.ws_status = v['ws_status'];
            if (keys[0] === 'ws_status_desc') $scope.nhso.ws_status_desc = v['ws_status_desc'];
            if (keys[0] === 'wsid') $scope.nhso.wsid = v['wsid'];
            if (keys[0] === 'wsid_batch') $scope.nhso.wsid_batch = v['wsid_batch'];
          });
        })
        .catch((err) => {
          console.log(err);
          res.send({ ok: false, error: err });
        });

    }

    $scope.openSetting = function () {
      var modalInstance = $uibModal.open({
        ariaLabelledBy: 'modal-title',
        ariaDescribedBy: 'modal-body',
        templateUrl: 'myModalContent.html',
        controller: function ($scope, $uibModalInstance) {
          $scope.config = {
            hostname: localStorage.getItem('hostname'),
            port: +localStorage.getItem('port'),
            dbname: localStorage.getItem('dbname'),
            username: localStorage.getItem('username'),
            password: localStorage.getItem('password'),
            tokenFile: localStorage.getItem('tokenFile')
          };

          $scope.openTokenFile = function () {
            const files = dialog.showOpenDialog({
              title: 'เลือกไฟล์ nhso_token.txt',
              properties: ['openFile'],
              filters: [
                { name: 'Text file', extensions: ['txt'] }
              ]
            });

            if (files.length) {
              $scope.config.tokenFile = files[0];
            } else {
              // ไม่ได้ระบุไฟล์
            }
          }

          $scope.saveSetting = function () {
            $uibModalInstance.close($scope.config);
          }

          $scope.closeModal = function () {
            $uibModalInstance.dismiss('cancel');
          }
        },
        resolve: {
          items: function () {
            return true
          }
        }
      });

      modalInstance.result.then(function (config) {
        localStorage.setItem('hostname', config.hostname);
        localStorage.setItem('port', +config.port);
        localStorage.setItem('dbname', config.dbname);
        localStorage.setItem('username', config.username);
        localStorage.setItem('password', config.password);
        localStorage.setItem('tokenFile', config.tokenFile);
        dialog.showMessageBox({
          type: 'info',
          title: 'ผลการบันทึก',
          message: 'บันทึกข้อมูลเสร็จเรียบร้อยแล้ว'
        });
      }, function () {
        // close modal
      });
    }

    $scope.getConnection = function () {
      return require('knex')({
        client: 'mysql',
        connection: {
          host: localStorage.getItem('hostname'),
          port: +localStorage.getItem('port'),
          database: localStorage.getItem('dbname'),
          user: localStorage.getItem('username'),
          password: localStorage.getItem('password')
        },
        pool: {
          min: 0,
          max: 7,
          afterCreate: (conn, done) => {
            conn.query('SET NAMES utf8', (err) => {
              done(err, conn);
            });
          }
        },
        debug: true,
        acquireConnectionTimeout: 5000
      })
    }

    $scope.getMaxHn = async function () {
      const db = $scope.getConnection();
      try {
        const result = await db('hninsert').max('hn as hn')
        const lastHn = result[0].hn;
        const newHn = +lastHn + 1;
        console.log(lastHn);
        console.log(newHn);
        var str = "" + newHn;
        var pad = "0000000";
        var ans = pad.substring(0, pad.length - str.length) + str;

        console.log(ans);

      } catch (error) {
        console.error(error.message);
      }
    }

  }


});