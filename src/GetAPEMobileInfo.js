/*---------------------- Get APE Mobile Info -------------------------
An assistant for getting data from APE Mobile sites, including:
* Users
* Projects
* Templates
* Org Lists
* Project List Types
* Drawings & Docs

By Andrew Greenhill.
-----------------------------------------------------------------------------*/
import { aGet, apeEntityType } from './APE_API_Helper.js';
const gami_version = '0.6.4, beta';

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

  //Info types offered to the user, plus names for reporting & filenaming, and EntityType for using it with API helper
  let endpointOptions = [];
  if (valueOfQueryStringParam('options') !== 'all') {
    endpointOptions = [
      { text: 'Users', name: 'user', filename: 'Users', et: apeEntityType.User },
      { text: 'Templates', name: 'template', filename: 'Templates', et: apeEntityType.Template },
      { text: 'Org Lists', name: 'Org List', filename: 'OrgLists', et: apeEntityType.OrgList },
      { text: 'Projects', name: 'project', filename: 'Projects', et: apeEntityType.Project },
      { text: 'Drawings/Documents', name: 'D&D', filename: 'DrawingsDocs', et: apeEntityType.Drawing },
    ];
  } else {
    endpointOptions = [
      { text: 'Users', name: 'user', filename: 'Users', et: apeEntityType.User },
      { text: 'Templates', name: 'template', filename: 'Templates', et: apeEntityType.Template },
      { text: 'Org Lists', name: 'Org List', filename: 'OrgLists', et: apeEntityType.OrgList },
      { text: 'Projects', name: 'project', filename: 'Projects', et: apeEntityType.Project },
      {
        text: 'Project List Types',
        name: 'Project List Type',
        filename: 'ProjectListTypes',
        et: apeEntityType.ProjectListType,
      },
      { text: 'Project Members', name: 'Project Member', filename: 'ProjMembers', et: apeEntityType.ProjMember },
      { text: 'Project Lists', name: 'Project List', filename: 'ProjLists', et: apeEntityType.ProjList },
      { text: 'Project WBS items', name: 'WBS item', filename: 'ProjWBSItems', et: apeEntityType.ProjWBSItem },
      { text: 'Actions', name: 'action', filename: 'Actions', et: apeEntityType.Action },
      { text: 'Forms', name: 'form', filename: 'Forms', et: apeEntityType.Form },
      { text: 'Memos', name: 'memo', filename: 'Memos', et: apeEntityType.Memo },
      { text: 'Punch Lists', name: 'punch list', filename: 'PunchLists', et: apeEntityType.PunchList },
      { text: 'Drawings/Documents', name: 'D&D', filename: 'DrawingsDocs', et: apeEntityType.Drawing },
      { text: 'Drawings/Docs Views', name: 'D&D view', filename: 'DDViews', et: apeEntityType.DrawingView },
      {
        text: 'Drawings/Docs Annotations',
        name: 'D&D annotation',
        filename: 'DDAnnotations',
        et: apeEntityType.Annotation,
      },
    ];
  }
  const rateLimitOption = { dontRLUserCheck: true };

  function valueOfQueryStringParam(paramName) {
    var url_string = window.location.href;
    var url = new URL(url_string);
    return url.searchParams.get(paramName);
  }

  initialise_web_page(); //Set things up in the web page HTML:
  function initialise_web_page() {
    setElementTextDisplay('versionDisplay', 'Version ' + String(gami_version), 'block');
    endpointOptions.forEach(optn => addOptionToSelectList('infoType', optn.text, optn.et));
    document.getElementById('butn_GI').onclick = getInfo;
    document.getElementById('butn_DF').onclick = downloadAction;
    document.getElementById('butn_pdf').onclick = display_a_PDF;
    document.getElementById('infoType').addEventListener('change', displayEndpointParams);
    if (window.location.hostname === 'pegasus') {
      document.getElementById('siteName').placeholder = 'apesandbox';
    }
    if (isApeMobileSite(window.location.hostname)) {
      document.getElementById('siteName').placeholder = window.location.hostname;
    } else {
      site1.proxy = 'https://cors-anywhere-ag.herokuapp.com/'; //This proxy prevents blocking by browser SOP
    }
  }

  //A simple function to help with turning an element's display on/off:
  function blockOrNone(x) {
    return x ? 'block' : 'none';
  }

  async function display_a_PDF() {
    let formID = -1; //Find the ID for the latest form that has status 1 or 4 (open or closed)
    for (var i = jsonResult.length - 1; i >= 0; i--) {
      if (jsonResult[i].status === 1 || jsonResult[i].status === 4) {
        formID = jsonResult[i].id;
        break;
      }
    }
    if (formID < 0) {
      setElementTextDisplay('giErrorText', 'None of those ' + String(jsonResult.length) + ' forms have PDFs!', 'block');
      return;
    } else {
      let pdfBlob = await aGet(site1, apeEntityType.Form, formID, '', { outputTo: 'pdf' });
      const obj_url = window.URL.createObjectURL(pdfBlob);
      const iframe = document.getElementById('viewer');
      iframe.setAttribute('src', obj_url);
      window.URL.revokeObjectURL(obj_url);
    }
  }

  function displayEndpointParams() {
    setElementTextDisplay('giErrorText', '', 'none');
    let endpoint = document.getElementById('infoType').value;
    document.getElementById('userOptions').style.display = blockOrNone(endpoint === apeEntityType.User);
    document.getElementById('projectOptions').style.display = blockOrNone(endpoint === apeEntityType.Project);
    document.getElementById('templateOptions').style.display = blockOrNone(endpoint === apeEntityType.Template);
    document.getElementById('formOptions').style.display = blockOrNone(endpoint === apeEntityType.Form);
    document.getElementById('orgListOptions').style.display = blockOrNone(endpoint === apeEntityType.OrgList);
    document.getElementById('projLTOptions').style.display = blockOrNone(endpoint === apeEntityType.ProjectListType);
    document.getElementById('actionOptions').style.display = blockOrNone(endpoint === apeEntityType.Action);
    document.getElementById('memoOptions').style.display = blockOrNone(endpoint === apeEntityType.Memo);
    document.getElementById('punchListsOptions').style.display = blockOrNone(endpoint === apeEntityType.PunchList);

    document.getElementById('projChildrenOptions').style.display = blockOrNone(
      endpoint === apeEntityType.ProjMember ||
        endpoint === apeEntityType.ProjList ||
        endpoint === apeEntityType.ProjWBSItem
    );

    document.getElementById('drawingOptions').style.display = blockOrNone(
      endpoint === apeEntityType.Drawing ||
        endpoint === apeEntityType.DrawingView ||
        endpoint === apeEntityType.Annotation
    );
  }

  function addOptionToSelectList(listID, text, value) {
    let sel = document.getElementById(listID); // get reference to select element
    let opt = document.createElement('option'); // create new option element
    opt.appendChild(document.createTextNode(text)); // create text node to add to option element (opt)
    opt.value = value; // set value property of opt
    sel.appendChild(opt); // add opt to end of select box (sel)
  }

  async function getInfo() {
    clearPageBelowGetInfo(); //First, clear the display of any content from previous times that GetInfo was used.

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
      let entityId = '';
      let endpointParams = {};
      switch (entityType) {
        case apeEntityType.User:
          endpointParams = {
            active: document.getElementById('usersActive').value,
          };
          break;
        case apeEntityType.Project:
          endpointParams = {
            active: document.getElementById('projectActive').value,
          };
          break;
        case apeEntityType.ProjMember:
        case apeEntityType.ProjList:
        case apeEntityType.ProjWBSItem:
          let selectedProj = document.getElementById('selectedProj').value;
          if (selectedProj > 0) {
            entityId = selectedProj;
          } else {
            setElementTextDisplay('giErrorText', 'Please enter a Project ID', 'block');
            return;
          }
          break;
        case apeEntityType.Template:
          endpointParams = {
            template_type: document.getElementById('templateType1').value,
            type: document.getElementById('templateType2').value,
            include_inactive: document.getElementById('include_inactive').checked,
          };
          if (endpointParams.template_type === 'All') {
            delete endpointParams.template_type;
          }
          break;
        case apeEntityType.Form:
          endpointParams = {
            status: document.getElementById('formStatus').value,
            project_id: document.getElementById('formProj').value,
            draft_template_id: document.getElementById('formDraftTemID').value,
            template_id: document.getElementById('formPublishTemID').value,
            limit: document.getElementById('formLimit').value,
          };
          //Remove any endpoint parameters that have no value:
          Object.keys(endpointParams).forEach(function(ky) {
            if (!endpointParams[ky]) {
              delete endpointParams[ky];
            }
          });
          break;
        case apeEntityType.Drawing:
        case apeEntityType.DrawingView:
        case apeEntityType.Annotation:
          endpointParams = {
            project_id: document.getElementById('drawingProj').value,
          };
          if (!endpointParams.project_id || endpointParams.project_id === 'All') {
            delete endpointParams.project_id;
          }
          break;
        default:
          break;
      }
      jsonResult = await aGet(site1, entityType, entityId, endpointParams, rateLimitOption);
    } catch (error) {
      setElementTextDisplay('giErrorText', error, 'block');
      return;
    }

    // Display summary info about what was obtained:
    let infoTypeName = endpointOptions.find(x => x.et === entityType).name;
    if (jsonResult.length > 1) {
      infoTypeName = infoTypeName + 's';
    }
    setElementTextDisplay('resultSummaryText', `Got ${jsonResult.length} ${infoTypeName}`, 'block');

    document.getElementById('pdfViewer').style.display = blockOrNone(
      document.getElementById('infoType').value === apeEntityType.Form && jsonResult.length > 0
    );

    // Convert jsonResult to CSV
    csv = '';
    let keysToConvert = [];
    switch (entityType) {
      case apeEntityType.Template:
        keysToConvert = [
          // For templates, use pre-set keys for the template output CSV headings
          'href',
          'id',
          'name',
          'type',
          'template_type',
          'version',
          'published_version',
          'active',
          'created_at',
          'updated_at',
          'draft_template_href',
          'draft_template_id',
        ];
        csv = json2csv4templates(jsonResult, keysToConvert);
        break;
      case apeEntityType.User:
        keysToConvert = keysOf1stRecord(jsonResult); // Use the 1st record to determine the column headings
        csv = json2csv4users(jsonResult, keysToConvert);
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
      endpointOptions.find(x => x.et === entityType).filename +
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
    const replacer = (key, value) => (value === null ? '' : value);
    let csvArray = jsonArray.map(row =>
      columnHeadings
        .map(fieldName => (row[fieldName] === undefined ? '' : JSON.stringify(row[fieldName], replacer)))
        .join(',')
    );
    csvArray.unshift(columnHeadings.join(','));
    return csvArray.join('\r\n');
  }

  function json2csv4users(jsonArray, columnHeadings) {
    const replacer = (key, value) => (value === null ? '' : value);
    let csvArray = jsonArray.map(row =>
      columnHeadings
        .map(function(fieldName) {
          if (fieldName !== 'user_type') {
            return row[fieldName] === undefined ? '' : JSON.stringify(row[fieldName], replacer);
          }
          switch (row.user_type) {
            case 'standard':
              return 'Super';
            case 'operator':
              return 'Standard';
            case 'external':
              return 'External';
            default:
              console.error('Unexpected user_type!');
              return 'Unexpected user_type!';
          }
        })
        .join(',')
    );
    csvArray.unshift(columnHeadings.join(',')); //Add the columnHeadings at the start
    return csvArray.join('\r\n'); //Return the array as a string.
  }

  function json2csv4templates(jsonArray, columnHeadings) {
    const replacer = (key, value) => (value === null ? '' : value);
    const template_types = ['General Memo', 'Issue Memo', 'RFI Memo', 'Action', 'Form'];
    let csvArray = jsonArray.map(row =>
      columnHeadings
        .map(function(fieldName) {
          switch (fieldName) {
            case 'draft_template_href':
              return row.draft_template === undefined ? '' : JSON.stringify(row.draft_template.href, replacer);
            case 'draft_template_id':
              return row.draft_template === undefined ? '' : JSON.stringify(row.draft_template.id, replacer);
            case 'template_type':
              return row.template_type === undefined ? '' : template_types[row.template_type - 1]; //numbers => words
            default:
              return row[fieldName] === undefined ? '' : JSON.stringify(row[fieldName], replacer);
          }
        })
        .join(',')
    );
    csvArray.unshift(columnHeadings.join(',')); //Add the columnHeadings at the start
    return csvArray.join('\r\n'); //Return the array as a string.
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
