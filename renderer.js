// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const smartcard = require('smartcard');
var iconv = require('iconv-lite');
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

  device.on('card-inserted', event => {
    let card = event.card;
    console.log(`Card '${card.getAtr()}' inserted into '${event.device}'`);

    card.on('command-issued', event => {
      // console.log(`Command '${event.command}' issued to '${event.card}' `);
    });

    card.on('response-received', event => {
      // console.log(`Response '${event.response}' received from '${event.card}' in response to '${event.command}'`);
    });

    // SELECT = [0x00, 0xA4, 0x04, 0x00, 0x08]
    // THAI_ID_CARD = [0xA0, 0x00, 0x00, 0x00, 0x54, 0x48, 0x00, 0x01]
    // REQ_CID = [0x80, 0xb0, 0x00, 0x04, 0x02, 0x00, 0x0d]
    // REQ_THAI_NAME = [0x80, 0xb0, 0x00, 0x11, 0x02, 0x00, 0x64]
    // REQ_ENG_NAME = [0x80, 0xb0, 0x00, 0x75, 0x02, 0x00, 0x64]
    // REQ_GENDER = [0x80, 0xb0, 0x00, 0xE1, 0x02, 0x00, 0x01]
    // REQ_DOB = [0x80, 0xb0, 0x00, 0xD9, 0x02, 0x00, 0x08]
    // REQ_ADDRESS = [0x80, 0xb0, 0x15, 0x79, 0x02, 0x00, 0x64]
    // REQ_ISSUE_EXPIRE = [0x80, 0xb0, 0x01, 0x67, 0x02, 0x00, 0x12]

    // DATA = [REQ_CID,REQ_THAI_NAME,REQ_ENG_NAME,REQ_GENDER,REQ_DOB,REQ_ADDRESS, REQ_ISSUE_EXPIRE]

    let ResetCommand = '00a4040008a000000054480001';
    let RequestCommandCid1 = '80b0000402000d';
    let RequestCommandCid2 = '00c000000d'; // get data
    let RequestCommandText1 = '80b000110200d1';
    let RequestCommandText2 = '00c00000d1';
    let RequestCommand3 = '80b01579020064';

    let RequestCommand5 = '80b00167020012';

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
        let result = response.toString();
        let strData = iconv.decode(response, 'tis-620');
        let _data = strData.split(' ');
        let person = [];
        _data.forEach(v => {
          if (v !== '') {
            person.push(v);
          }
        });

        // console.log(person);
        let thName = person[0].replace('#', '').replace('##', ' ');
        console.log('Your TH name: ', thName);

        let EngName = person[1].replace('#', '').replace('##', ' ');
        console.log('Your ENG name: ', EngName);

        let birth = person[2];
        let y = birth.substring(0, 4);
        let m = birth.substring(4, 6);
        let d = birth.substring(6, 8);
        console.log('Birth day: ', d, '/', m, '/', y)
        return card.issueCommand(RequestCommandCid1);
      })
      .then((response) => {
        return card.issueCommand(RequestCommandCid2);
      })
      .then((response) => {
        console.log('CID: ', response.toString().substring(0, 13));
      })
      .catch((error) => {
        console.error(error);
      });

  });
  device.on('card-removed', event => {
    console.log(`Card removed from '${event.name}' `);
  });

});

devices.on('device-deactivated', event => {
  console.log(`Device '${event.device}' deactivated, devices: [${event.devices}]`);
});