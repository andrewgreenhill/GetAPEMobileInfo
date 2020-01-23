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
const gami_version = '0.5.4, beta';

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
    defaultTimeout: 20000,
  };

  //'infoTypes' offered to the user, plus names for reporting & filenaming, and EntityType for using it with the helper
  const infoTypeOptions = [
    { text: 'Users', name: 'user', filename: 'Users', et: apeEntityType.User },
    { text: 'Projects', name: 'project', filename: 'Projects', et: apeEntityType.Project },
    { text: 'Templates', name: 'template', filename: 'Templates', et: apeEntityType.Template },
    { text: 'Org Lists', name: 'Org List', filename: 'OrgLists', et: apeEntityType.OrgList },
    {
      text: 'Proj List Types',
      name: 'Project List Type',
      filename: 'ProjectListTypes',
      et: apeEntityType.ProjectListType,
    },
    // { text: 'Proj Members', name: 'Project Member', filename: 'ProjectMembers', et: apeEntityType.ProjMember },
    // { text: 'Proj WBS items', name: 'WBS item', filename: 'ProjectWBSItems', et: apeEntityType.ProjWBSItem },
    { text: 'Drawings & Docs', name: 'D&D', filename: 'DrawingsDocs', et: apeEntityType.Drawing },
  ];

  if (!isApeMobileSite(window.location.hostname)) {
    site1.proxy = 'https://cors-anywhere-ag.herokuapp.com/'; //This proxy prevents blocking by browser SOP
  }

  initialise_web_page(); //Set things up in the web page HTML:
  function initialise_web_page() {
    setElementTextDisplay('versionDisplay', 'Version ' + String(gami_version), 'block');
    infoTypeOptions.forEach(optn => addOptionToSelectList('infoType', optn.text, optn.et));
    document.getElementById('butn_GI').onclick = getInfo;
    document.getElementById('butn_DF').onclick = downloadAction;
  }

  function addOptionToSelectList(listID, text, value) {
    let sel = document.getElementById(listID); // get reference to select element
    let opt = document.createElement('option'); // create new option element
    opt.appendChild(document.createTextNode(text)); // create text node to add to option element (opt)
    opt.value = value; // set value property of opt
    sel.appendChild(opt); // add opt to end of select box (sel)
  }

  async function getInfo() {
    clearPageBelowGetInfo(); //First, clear any display from previous time that GetInfo was used.

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

    // Get the site key:
    site1.apiKey = document.getElementById('siteKey').value.trim();
    if (!site1.apiKey) {
      setElementTextDisplay('giErrorText', 'Please enter a Site Key', 'block');
      return;
    }

    // Get the info type:
    let entityType = document.getElementById('infoType').value;
    if (!entityType) {
      setElementTextDisplay('giErrorText', 'Please select an Info Type', 'block');
      return;
    }

    // Get the collection of data, in a JSON array:
    jsonResult = '';
    try {
      jsonResult = await aGet(site1, entityType, '', {}, { dontRLUserCheck: true });
    } catch (error) {
      setElementTextDisplay('giErrorText', error, 'block');
      return;
    }

    // Display summary info about what was obtained:
    let infoTypeName = infoTypeOptions.find(x => x.et === entityType).name;
    if (jsonResult.length > 1) {
      infoTypeName = infoTypeName + 's';
    }
    setElementTextDisplay('resultSummaryText', `Got ${jsonResult.length} ${infoTypeName}`, 'block');

    // Convert jsonResult to CSV
    csv = '';
    let keysToConvert = [];
    switch (entityType) {
      case apeEntityType.Template:
        keysToConvert = [
          // Use pre-set keys for the template output CSV headings
          'name',
          'type',
          'template_type',
          'version',
          'published_version',
          'active',
          'created_at',
          'updated_at',
        ];
        csv = json2csv(jsonResult, keysToConvert);
        break;
      default:
        keysToConvert = keysOf1stRecord(jsonResult); // Use the 1st record to determine the column headings
        csv = json2csv(jsonResult, keysToConvert);
        break;
    }

    // Create a default filename for the output file, and display it to the user:
    let defltFilename = defaultFilename(site1.name, entityType);
    document.getElementById('fileName').value = defltFilename;
    document.getElementById('fileName').placeholder = defltFilename;
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

  function defaultFilename(siteName, entityType) {
    return (
      removeEndOfString(siteName, '.') +
      '_' +
      infoTypeOptions.find(x => x.et === entityType).filename +
      '_' +
      currentYYMMDD() +
      '.csv'
    );
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
};
my_GAMI_NameSpace(); //End of my_GAMI_NameSpace function; now run that.
