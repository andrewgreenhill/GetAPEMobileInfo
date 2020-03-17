/*---------------------- Get APE Mobile Info -------------------------
An assistant for getting data from APE Mobile sites, including:
* Users
* Projects
* Templates
* Org Lists
* Drawings & Docs
* Project List Types, etc

By Andrew Greenhill.
-----------------------------------------------------------------------------*/
import { aGet, apeEntityType, aResponseError } from './APE_API_Helper.js';
import { isApeMobileSite, ape_api_url_to_normal_url } from './AG_APEMobile_functions.js';
import { in_array_replace_A_with_B, in_array_after_A_insert_B } from './AG_array_functions.js';
import { removeStartOfString, removeEndOfString } from './AG_string_functions.js';
import { currentYYMMDD } from './AG_date_functions.js';
import { valueOfQueryStringParam } from './AG_web_page_functions.js';
const gami_version = '0.7.0, beta';

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
  const paramD = valueOfQueryStringParam('descr') || 'replace'; // Description
  const paramCh = valueOfQueryStringParam('convertHref') || 'true';
  const convertHref = paramCh.toLowerCase() !== 'false';
  const paramO = valueOfQueryStringParam('options');
  var specialParams = { dontRLUserCheck: true }; //By default, don't rate-limit user permissions checks
  var stopped = false; //State changed by use of the stop button

  function siteNameChanged() {
    specialParams.dontRLUserCheck = true; //Don't rate-limit user-permission checks following a site change
  }

  function siteRespondedOk() {
    specialParams.dontRLUserCheck = false; //Rate-limit user-permission checks after the site has responded Ok
  }

  //Info types offered to the user, plus names for reporting & filenaming, and EntityType for using it with API helper
  let endpointOptions = [];
  if (paramO !== 'all') {
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

  initialise_web_page(); //Set things up in the web page HTML:
  function initialise_web_page() {
    setElementTextDisplay('versionDisplay', 'Version ' + String(gami_version), 'block');
    endpointOptions.forEach(optn => addOptionToSelectList('infoType', optn.text, optn.et));
    document.getElementById('butn_stop').onclick = stopAction;
    document.getElementById('butn_GI').onclick = getInfoHandler;
    document.getElementById('butn_DF').onclick = downloadAction;
    document.getElementById('butn_pdf').onclick = display_a_PDF_Handler;
    document.getElementById('siteName').addEventListener('change', siteNameChanged);
    document.getElementById('infoType').addEventListener('change', displayEndpointParams);
    if (window.location.hostname === 'pegasus') {
      document.getElementById('siteName').placeholder = 'apesandbox';
      document.getElementById('siteName').required = false;
    }
    if (isApeMobileSite(window.location.hostname)) {
      document.getElementById('siteName').placeholder = window.location.hostname;
      document.getElementById('siteName').value = window.location.hostname;
    } else {
      site1.proxy = 'https://cors-anywhere-ag.herokuapp.com/'; //This proxy prevents blocking by browser SOP
    }
  }

  function stopAction() {
    stopped = true;
  }

  //A simple function to help with turning an element's display on/off:
  function blockOrNone(x) {
    return x ? 'block' : 'none';
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

    if (document.getElementById('pdfViewer').style.display === 'block' || document.getElementById('viewer').src) {
      document.getElementById('pdfViewer').style.display = blockOrNone(endpoint === apeEntityType.Form);
      document.getElementById('viewer').style.display = blockOrNone(
        endpoint === apeEntityType.Form && document.getElementById('viewer').src
      );
    }

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

  function adjustCols(cols, paramD, fieldA, fieldB) {
    // Based on paramD, add fieldB after fieldA, or replace fieldA, or make no change:
    if (paramD.toLowerCase() === 'none') {
      return cols; //Columns are unchanged
    } else if (paramD.toLowerCase() === 'replace') {
      return in_array_replace_A_with_B(cols, fieldA, fieldB);
    } // else add fieldB after fieldA:
    return in_array_after_A_insert_B(cols, fieldA, fieldB);
  }

  async function getInfoHandler() {
    // Disable button while getInfo() is running, then display any resultant error
    document.getElementById('butn_GI').disabled = true;
    let giResult = await getInfo();
    if (giResult !== true) {
      setElementTextDisplay('giErrorText', giResult, 'block');
    }
    document.getElementById('butn_GI').disabled = false;
  }

  async function getInfo() {
    clearPageBelowGetInfo(); //First, clear the display of any content from previous times that GetInfo was used.

    // Get the site name, and 'standardise' it (so that a variety of user input 'styles' can be accepted)
    site1.name = document.getElementById('siteName').value.trim() || document.getElementById('siteName').placeholder;
    site1.name = removeStartOfString(site1.name, '//');
    site1.name = removeEndOfString(site1.name, '/');
    if (!site1.name) {
      return 'Please enter a Site Name';
    }
    if (site1.name === site1.name.split('.')[0]) {
      site1.name = site1.name + '.apemobile.com';
    }
    if (!isApeMobileSite(site1.name)) {
      return 'Invalid APE Mobile Site Name!';
    }

    // Get the site key:
    site1.apiKey = document.getElementById('siteKey').value.trim();
    if (!site1.apiKey) {
      return 'Please enter a Site Key';
    }

    // Get the info type:
    let entityType = document.getElementById('infoType').value;
    if (!entityType) {
      return 'Please select an Info Type';
    }

    // Get the list of data in a JSON array:
    jsonResult = '';
    let projectsList = false;
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
            // Not yet complete functionality ~placeholder:
            // For the 3 project children endpoints, add ability to get data from all projects
            setElementTextDisplay('resultSummaryText', `Getting projects...`, 'block');
            projectsList = await aGet(site1, apeEntityType.Project, '', {}, specialParams);
            siteRespondedOk();
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
      if (!projectsList) {
        jsonResult = await aGet(site1, entityType, entityId, endpointParams, specialParams);
        siteRespondedOk();
      } else {
        //Get records from all projects in projectsList using a loop.
        //I'm using a traditional FOR loop because forEach doesn't wait for async/await.
        document.getElementById('butn_stop').style.display = 'block';
        jsonResult = [];
        for (let i = 0; i < projectsList.length && !stopped; i++) {
          setElementTextDisplay('resultSummaryText', `Getting data from project ${projectsList[i].id}`, 'block');
          jsonResult = jsonResult.concat(await aGet(site1, entityType, projectsList[i].id, endpointParams));
        }
        siteRespondedOk();
        stopped = false; //Reset this for possible re-use
        document.getElementById('butn_stop').style.display = 'none';
        setElementTextDisplay('resultSummaryText', '', 'none');
        // The forEach loop code that I had tried to get working is below:
        // projectsList.forEach(async function(x)
        //   console.log('project_id: ' + String(x.id));
        //   recordsForAProj = await aGet(site1, entityType, x.id, endpointParams, specialParams);
        //   console.log('recordsForAProj.length = ' + String(recordsForAProj.length));
        //   jsonResult = jsonResult.concat(recordsForAProj);
        // });
        // siteRespondedOk();
      }
    } catch (error) {
      return processError(error);
    }

    // Display summary info about what was obtained:
    let infoTypeName = endpointOptions.find(x => x.et === entityType).name;
    if (jsonResult.length !== 1) {
      infoTypeName = infoTypeName + 's';
    }
    setElementTextDisplay('resultSummaryText', `Got ${jsonResult.length} ${infoTypeName}`, 'block');

    document.getElementById('pdfViewer').style.display = blockOrNone(
      document.getElementById('infoType').value === apeEntityType.Form && jsonResult.length > 0
    );

    if (jsonResult.length > 1) {
      // Convert jsonResult to CSV:
      csv = '';
      let csvCols = []; // This will define the columns of the CSV file
      if (entityType === apeEntityType.Template) {
        // For templates (only), use pre-set keys for the template output CSV headings:
        csvCols = [
          'href',
          'id',
          'name',
          'type',
          'template_type',
          'version',
          'published_version',
          'template_file_name',
          'active',
          'created_at',
          'updated_at',
          'draft_template_href',
          'draft_template_id',
        ];
        csvCols = adjustCols(csvCols, paramD, 'template_type', 'template_type_desc');
        csv = json2csvWithfieldMapper(jsonResult, csvCols, fieldMapperForTemplates);
      } else {
        csvCols = keysOf1stRecord(jsonResult); // Use the 1st record to determine the column headings
        switch (entityType) {
          case apeEntityType.User:
            csv = json2csvWithfieldMapper(jsonResult, csvCols, fieldMapperForUsers);
            break;
          case apeEntityType.Project:
            //Keep <LF><CR> because project Description can be multi-line:
            csv = json2csvWithfieldMapper(jsonResult, csvCols, fieldMapperThatKeepsLFCR);
            break;
          case apeEntityType.ProjMember:
            csvCols = adjustCols(csvCols, paramD, 'permission_level', 'permission_desc');
            csv = json2csvWithfieldMapper(jsonResult, csvCols, fieldMapperForProjectMembers);
            break;
          case apeEntityType.Form:
          case apeEntityType.Memo:
            csvCols = adjustCols(csvCols, paramD, 'status', 'status_desc');
            csv = json2csvWithfieldMapper(jsonResult, csvCols, fieldMapperForFormsMemos);
            break;
          case apeEntityType.Action:
            csvCols = adjustCols(csvCols, paramD, 'status', 'status_desc');
            csv = json2csvWithfieldMapper(jsonResult, csvCols, fieldMapperForActions);
            break;
          case apeEntityType.PunchList:
            csvCols = adjustCols(csvCols, paramD, 'status', 'status_desc');
            csv = json2csvWithfieldMapper(jsonResult, csvCols, fieldMapperForPLs);
            break;
          case apeEntityType.DrawingView:
            csvCols = adjustCols(csvCols, paramD, 'event_type', 'event_type_desc');
            csv = json2csvWithfieldMapper(jsonResult, csvCols, fieldMapperForDVs);
            break;
          default:
            csv = json2csvWithfieldMapper(jsonResult, csvCols, fieldMapperBasic);
            break;
        }
      }

      // Create a default filename for the output file, and display it to the user:
      let defltFilename = defaultFilename(site1.name, entityType);
      document.getElementById('fileName').value = defltFilename;
      document.getElementById('fileName').placeholder = defltFilename;
      document.getElementById('fileName').style.display = 'initial';
      document.getElementById('butn_DF').style.display = 'initial';
    }
    return true;
  }

  //Create more-meaningful error messages to display to the user
  function processError(error) {
    let retVal = error;
    if (error.name === 'AbortError') {
      retVal = `Response from ${site1.name} timed out.`;
    } else if (error.name === 'TypeError' && site1.proxy) {
      retVal = `TypeError: Proxy may be down.`;
    } else {
      if (error instanceof aResponseError) {
        if (error.response.status === 404) {
          retVal = `Error: 404 "Not Found" for ${site1.name}. Is that site Name correct? Could you be trying to access a non-existant record?`;
        } else if (error.response.status === 401) {
          retVal = `Error: 401 "Unauthorised" from ${site1.name} . Check the Key for the site, and also that the site has "API enabled" setting turned on under Admin => Organisation.`;
        } else {
          retVal = `Error: '${error.message}'`;
        }
      }
    }
    return retVal;
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
    return true;
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

  function keysOf1stRecord(jsonArray) {
    return Object.keys(jsonArray[0]);
  }

  function json2csvWithfieldMapper(jsonArray, columnHeadings, fieldMapper) {
    // Convert a JSON array to CSV, using a fieldMapper fn to affect the output
    let csvArray = jsonArray.map(row => columnHeadings.map(fieldName => fieldMapper(fieldName, row)).join(','));
    csvArray.unshift(columnHeadings.join(','));
    return csvArray.join('\r\n');
  }

  const replacer = (key, value) => (value === null ? '' : value); //Used in fieldMapper functions

  function fieldMapperBasic(fieldname, row) {
    if (fieldname === 'href' && convertHref) {
      return row.href === undefined ? '' : JSON.stringify(ape_api_url_to_normal_url(row.href), replacer);
    }
    return row[fieldname] === undefined ? '' : JSON.stringify(row[fieldname], replacer);
  }

  function fieldMapperThatKeepsLFCR(fieldname, row) {
    // Keep LineFeed CarriageReturn pairs (and CR) instead of turning them into \r\n (or \n)
    return row[fieldname] === undefined
      ? ''
      : JSON.stringify(row[fieldname], replacer)
          .replace(/\\r\\n/gm, '\r\n') //Replace LF+CR pair
          .replace(/\\n/gm, '\n'); //Replace CR
  }

  function fieldMapperForUsers(fieldname, row) {
    if (fieldname !== 'user_type') {
      return fieldMapperBasic(fieldname, row);
    }
    //Re-map the user_type descriptions to newer terminology:
    switch (row.user_type) {
      case 'standard':
        return 'Super';
      case 'operator':
        return 'Standard';
      case 'external':
        return 'External';
      default:
        return 'Unexpected user_type!';
    }
  }

  function fieldMapperForProjectMembers(fieldname, row) {
    if (fieldname !== 'permission_desc') {
      return fieldMapperBasic(fieldname, row);
    }
    //Create a permission description from the permission_level:
    const permission_descs = ['Read only', 'Create records', '#2', 'Send records', 'Edit project', 'Unexpected level'];
    return row.permission_level === undefined ? '' : permission_descs[row.permission_level];
  }

  function fieldMapperForFormsMemos(fieldname, row) {
    if (fieldname !== 'status_desc') {
      return fieldMapperBasic(fieldname, row);
    }
    const f_and_m_Statuses = ['Draft', 'Open', '#2', 'Sent', 'Closed', 'Unexpected status'];
    return row.status === undefined ? '' : f_and_m_Statuses[row.status];
  }

  function fieldMapperForActions(fieldname, row) {
    if (fieldname !== 'status_desc') {
      return fieldMapperBasic(fieldname, row);
    }
    const actionStatuses = [
      'Draft',
      'Open',
      'Ready for inspection',
      'Disputed',
      'Deferred',
      'Completed',
      'Unexpected status',
    ];
    return row.status === undefined ? '' : actionStatuses[row.status];
  }

  function fieldMapperForPLs(fieldname, row) {
    if (fieldname !== 'status_desc') {
      return fieldMapperBasic(fieldname, row);
    }
    const plStatuses = ['Draft', 'Saved to project', 'Sent', 'Unknown status'];
    return row.status === undefined ? '' : plStatuses[row.status];
  }

  function fieldMapperForDVs(fieldname, row) {
    if (fieldname !== 'event_type_desc') {
      return fieldMapperBasic(fieldname, row);
    }
    const drawingViewTyps = ['Web', 'APE Mobile app', 'Different app', 'Unknown view type'];
    return row.event_type === undefined ? '' : drawingViewTyps[row.event_type];
  }

  function fieldMapperForTemplates(fieldname, row) {
    // Handle draft_template details differently because they're inside an object
    switch (fieldname) {
      case 'draft_template_href':
        if (convertHref) {
          return row.draft_template === undefined
            ? ''
            : JSON.stringify(ape_api_url_to_normal_url(row.draft_template.href), replacer);
        }
        return row.draft_template === undefined ? '' : JSON.stringify(row.draft_template.href, replacer);
      case 'draft_template_id':
        return row.draft_template === undefined ? '' : JSON.stringify(row.draft_template.id, replacer);
      case 'template_type_desc':
        const template_types = ['General Memo', 'Issue Memo', 'RFI Memo', 'Action', 'Form'];
        return row.template_type === undefined ? '' : template_types[row.template_type - 1]; //Convert type number to words
      default:
        return fieldMapperBasic(fieldname, row);
    }
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

  async function display_a_PDF_Handler() {
    // Disable button while display_a_PDF() is running, then display any resultant error
    document.getElementById('butn_pdf').disabled = true;
    let dapResult = await display_a_PDF();
    if (dapResult !== true) {
      setElementTextDisplay('giErrorText', dapResult, 'block');
    }
    document.getElementById('butn_pdf').disabled = false;
    document.getElementById('viewer').style.display = 'block';
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
      return 'None of those ' + String(jsonResult.length) + ' forms have PDFs!';
    } else {
      try {
        let pdfBlob = await aGet(site1, apeEntityType.Form, formID, '', { outputTo: 'pdf' });
        siteRespondedOk();
        // Should test whether pdfBlob is ok before proceeding
        const obj_url = window.URL.createObjectURL(pdfBlob);
        const iframe = document.getElementById('viewer');
        iframe.setAttribute('src', obj_url);
        window.URL.revokeObjectURL(obj_url);
      } catch (error) {
        if (error.response.status === 404) {
          return `Error: 404 "Not Found" occurred when trying to get a PDF for form ${formID}. That form appears to not have a PDF, its template might not have a DOCX file.`;
        } else {
          return processError(error);
        }
      }
    }
    return true;
  }
};
my_GAMI_NameSpace(); //End of my_GAMI_NameSpace function; now run it.
