/*---------------------- Get APE Mobile Info -------------------------
An assistant for getting lists of data from APE Mobile sites, including:
* Users
* Projects
* Templates <= with extra details
* Org Lists
* Project List Types

By Andrew Greenhill.
-----------------------------------------------------------------------------*/
import { aGet, apeEntityType } from './APE_API_Helper.js';
const gami_version = '0.5, beta';

var my_GAMI_NameSpace = function() {
  //A function wrapper simply to create my own 'Get APE Mobile Info' name space

  var jsonResult = '';
  var csv = '';
  var site1 = {
    type: 'ape mobile',
    name: '',
    apiKey: '',
    userID: 1,
    proxy: '',
    defaultTimeout: 10000,
  };

  if (!isApeMobileSite(window.location.hostname)) {
    site1.proxy = 'https://cors-anywhere-ag.herokuapp.com/';
  }

  initialise_web_page(); //Set things up in the web page HTML:
  function initialise_web_page() {
    setElementTextDisplay('versionDisplay', 'Version ' + String(gami_version), 'block');
    document.getElementById('butn_GI').onclick = getInfo;
    document.getElementById('butn_DF').onclick = downloadAction;
  }

  async function getInfo() {
    clearPageBelowGetInfo();

    // Get the site name, and 'standardise' it (so that a variety of user input 'styles' can be accepted)
    site1.name = document.getElementById('siteName').value.trim() || document.getElementById('siteName').placeholder;
    site1.name = removeStartOfString(site1.name, '//');
    site1.name = removeEndOfString(site1.name, '/');
    if (!site1.name) {
      setElementTextDisplay('giErrorText', 'Please enter a Site Name', 'block');
      return;
    }
    if (site1.name === site1.name.split('.')[0]) {
      site1.name = site1.name + '.apemobile.com';
    }
    if (!isApeMobileSite(site1.name)) {
      setElementTextDisplay('giErrorText', 'Invalid APE Mobile Site Name!', 'block');
      return;
    }

    site1.apiKey = document.getElementById('siteKey').value.trim();
    if (!site1.apiKey) {
      setElementTextDisplay('giErrorText', 'Please enter a Site Key', 'block');
      return;
    }

    let infoType = document.getElementById('infoType').value;
    let entityType = map2APEMobileEntityType(infoType);
    if (!infoType || !entityType) {
      setElementTextDisplay('giErrorText', 'Please select an Info Type', 'block');
      return;
    }

    jsonResult = '';
    try {
      jsonResult = await aGet(site1, entityType, '', {}, { dontRLUserCheck: true });
    } catch (error) {
      setElementTextDisplay('giErrorText', error, 'block');
      return;
    }
    // console.log(jsonResult);

    setElementTextDisplay('resultSummaryText', `Got ${jsonResult.length} ${map2APEMobileEName(infoType)}s`, 'block');

    // Convert jsonResult to CSV, using the 1st record to determine the column headings
    csv = json2csv(jsonResult, keysOf1stRecord(jsonResult));

    document.getElementById('fileName').value = defaultFilename(site1.name, infoType);
    document.getElementById('fileName').placeholder = defaultFilename(site1.name, infoType);
    document.getElementById('fileName').style.display = 'initial';
    document.getElementById('butn_DF').style.display = 'initial';
  }

  function downloadAction() {
    let outputFilename = document.getElementById('fileName').value || document.getElementById('fileName').placeholder;
    let ofs = outputFilename.split('.');
    if (ofs[ofs.length - 1].toLowerCase() === 'json') {
      // If extension ends with .json then:
      downloadFile(JSON.stringify(jsonResult), outputFilename, 'text/plain');
    } else {
      if (ofs.length === 1) {
        outputFilename = outputFilename + '.csv'; //If there is no extension then add .csv
      }
      downloadFile(csv, outputFilename, 'text/plain');
    }
  }

  function setElementTextDisplay(elementID, text2Display, displayStyle) {
    document.getElementById(elementID).innerHTML = text2Display;
    document.getElementById(elementID).style.display = displayStyle;
  }

  function clearPageBelowGetInfo() {
    setElementTextDisplay('giErrorText', '', 'none');
    setElementTextDisplay('resultSummaryText', '', 'none');
    document.getElementById('fileName').style.display = 'none';
    document.getElementById('butn_DF').style.display = 'none';
  }

  function defaultFilename(siteName, infoType) {
    return removeEndOfString(siteName, '.') + '_' + infoType + 's_' + currentYYMMDD() + '.csv';
  }

  function isApeMobileSite(siteDomain) {
    const pattern1 = new RegExp('^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9].apemobile.com$');
    const pattern2 = new RegExp(
      '^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9].apemobile-[a-zA-Z0-9-]{0,176}[a-zA-Z0-9].com$'
    );
    return pattern1.test(siteDomain) || pattern2.test(siteDomain);
  }

  function removeStartOfString(str, marker) {
    return str.split(marker).pop();
  }

  function removeEndOfString(str, marker) {
    return str.split(marker)[0];
  }

  function currentYYMMDD() {
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var yy = today.getFullYear() - 2000; //Assuming between the years 2000 and 2099
    return yy + mm + dd;
  }

  function keysOf1stRecord(jsonArray) {
    return Object.keys(jsonArray[0]);
  }

  function json2csv(jsonArray, columnHeadings) {
    const replacer = (key, value) => (value === null ? '' : value); // Specify how you want to handle null values here
    let csv = jsonArray.map(row => columnHeadings.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','));
    csv.unshift(columnHeadings.join(','));
    return csv.join('\r\n');
  }

  function downloadFile(content, fileName, contentType) {
    var downloadLink = document.createElement('a');
    var blob = new Blob(['\ufeff', content], { type: contentType });
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = fileName;
    // document.body.appendChild(downloadLink);
    downloadLink.click();
    // document.body.removeChild(downloadLink);
  }

  function map2APEMobileEntityType(infoType) {
    switch (infoType) {
      case 'User':
        return apeEntityType.User;
      case 'Project':
        return apeEntityType.Project;
      case 'Template':
        return apeEntityType.Template;
      case 'OrgList':
        return apeEntityType.OrgList;
      case 'ProjectListType':
        return apeEntityType.ProjectListType;
      default:
        break;
    }
  }

  function map2APEMobileEName(infoType) {
    switch (infoType) {
      case 'User':
        return 'user';
      case 'Project':
        return 'project';
      case 'Template':
        return 'template';
      case 'OrgList':
        return 'Org List';
      case 'ProjectListType':
        return 'Project List Type';
      default:
        break;
    }
  }
};
my_GAMI_NameSpace(); //End of my_GAMI_NameSpace function; now run that.
