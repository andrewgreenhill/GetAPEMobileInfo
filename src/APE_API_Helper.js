/* AG's v1 Helper for using APIs. Version 1.0 GAMI
There are thing I'm dissatisfied with about this code but it works well so I'll use it for now :-)
For usage details see the documentation. */

const aGsVerboseMode = false; //'apemobile'; //Set this to true or to a[n array of] tag[s] to enable verbose console logging from all or select parts

export class aResponseError extends Error {
  //This helps with handling not-OK responses from fetchWithTimeout
  constructor(response) {
    super(`${response.status} "${response.statusText}" for ${response.url}`);
    this.name = 'aResponseError';
    this.response = response;
  }
}

function fetchWithExtras(uri, options = {}, time = 20000) {
  //Placeholder: Keep audit log of request.
  //Throttling. Placeholder: Check data request intensity[+volume] and if-need-be pause to slow it down, then:
  let returnVal = fetchWithTimeout(uri, options, time);
  return returnVal;
}

function fetchWithTimeout(uri, options = {}, time = 20000) {
  //Request Timeouts With the Fetch API (AG modified code from https://www.lowmess.com/blog/fetch-with-timeout)
  // Lets set up our `AbortController`, and create a request options object
  // that includes the controller's `signal` to pass to `fetch`.
  const controller = new AbortController();
  const config = { ...options, signal: controller.signal };
  function promiseState(p) {
    //From https://stackoverflow.com/questions/30564053/how-can-i-synchronously-determine-a-javascript-promises-state
    const t = {};
    return Promise.race([p, t]).then(
      v => (v === t ? 'pending' : 'fulfilled'),
      () => 'rejected'
    );
  }

  // Set a timeout limit for the request using `setTimeout`. If the body of this
  // timeout is reached before the request is completed, it will be cancelled.
  // eslint-disable-next-line no-unused-vars
  const timeout = setTimeout(() => {
    promiseState(result).then(state => {
      if (state === 'pending') {
        controller.abort();
      } else {
        verboseConLog(`Fetch request state = ${state}.`, 'fetch');
      }
    });
  }, time);

  let result = fetch(uri, config).then(response => {
    // Because _any_ response is considered a success to `fetch`,
    // we need to manually check that the response is in the 200 range.
    // This is typically how I handle that.
    if (!response.ok) {
      //Placeholder: add to the audit log some indication about the response (at least that it failed).
      throw new aResponseError(response); //Throwing this as an HTTP error creates an option for the receiver to handle it differently
    }
    //Placeholder: add to the audit log some indication about the response (at least that it succeeded).
    return response;
  });
  //   .catch(error => {
  //     // When we abort our `fetch`, the controller conveniently throws a named
  //     // error, allowing us to handle them seperately from other errors.
  //     if (error.name === 'AbortError') {
  //       throw new Error('Response timed out'); //Placeholder/NOTE! Change this to use aResponseError .................
  //     }
  //     throw new Error(error.message);
  //   });
  return result;
}

//Constants for APE Mobile entity types
export const apeEntityType = {
  User: 'users',
  Project: 'projects',
  ProjectListType: 'project_list_types',
  ProjMember: 'project_members', //That is on top of projects/project_id/
  ProjList: 'project_lists', //That is on top of projects/project_id/
  ProjWBSItem: 'wbs_items', //That is on top of projects/project_id/
  OrgList: 'organisation_lists',
  Template: 'templates',
  Form: 'forms',
  Memo: 'memos',
  Action: 'actions',
  Drawing: 'drawings',
  DrawingView: 'drawing_views',
  Annotation: 'drawing_annotations',
  PunchList: 'punch_lists',
  Company: 'companies',
  Submission: 'submissions',
};

export const paramsOfApeEntity = {
  User:
    "{'active': true,\n  'after': 1,\n  'limit': 1000,\n  'sort': '-updated_at',\n  'updated_from': '2018-12-31T13%3A50%3A00Z'}",
  Project:
    "{'active': true,\n  'after': 1,\n  'limit': 1000,\n  'sort': '-updated_at',\n  'updated_from': '2018-12-31T13%3A50%3A00Z'}",
  ProjectListType: "{'after': 1,\n  'limit': 1000,\n  'sort': '-updated_at'}",
  ProjMember: '{}',
  ProjList: '{}',
  ProjWBSItem: '{}',
  OrgList: "{'after': 1,\n  'limit': 1000,\n  'sort': '-updated_at'}",
  Template:
    "{'after': 1,\n  'include_inactive': true,\n  'limit': 1000,\n  'sort': '-updated_at',\n  'type': 'draft%7Carchived%7Cpublished',\n  'template_type': 4,\n  'updated_from': '2018-12-31T13%3A50%3A00Z'}",
  Form:
    "{'after': 1,\n  'draft_template_id': 1,\n  'limit': 1000,\n  'project_id': 101,\n  'sort': '-updated_at',\n  'raised_from': '2018-12-31',\n  'raised_to': '2019-12-31',\n  'status': 'closed',\n  'template_id': 101,\n  'updated_from': '2018-12-31T13%3A50%3A00Z'}",
  Memo:
    "{'after': 1,\n  'draft_template_id': 1,\n  'limit': 1000,\n  'project_id': 101,\n  'sort': '-updated_at',\n  'raised_from': '2018-12-31',\n  'raised_to': '2019-12-31',\n  'status': 'closed',\n  'template_id': 101,\n  'updated_from': '2018-12-31T13%3A50%3A00Z'}",
  Action:
    "{'after': 1,\n  'draft_template_id': 1,\n  'limit': 1000,\n  'project_id': 101,\n  'sort': '-updated_at',\n  'raised_from': '2018-12-31',\n  'raised_to': '2019-12-31',\n  'status': 'closed',\n  'template_id': 101,\n  'updated_from': '2018-12-31T13%3A50%3A00Z'}",
  Drawing:
    "{'after': 1,\n  'limit': 1000,\n  'project_id': 1,\n  'sort': '-updated_at',\n  'updated_from': '2018-12-31T13%3A50%3A00Z'}",
  DrawingView:
    "{'after': 1,\n  'limit': 1000,\n  'project_id': 1,\n  'sort': '-updated_at',\n  'updated_from': '2018-12-31T13%3A50%3A00Z'}",
  Annotation:
    "{'after': 1,\n  'limit': 1000,\n  'project_id': 1,\n  'sort': '-updated_at',\n  'updated_from': '2018-12-31T13%3A50%3A00Z'}",
  PunchList:
    "{'after': 1,\n  'limit': 1000,\n  'project_id': 101,\n  'sort': '-updated_at',\n  'status': 'closed',\n  'updated_from': '2018-12-31T13%3A50%3A00Z'}",
  Company: '{}',
  Submission: '{}',
};

//Constants for some other entity types; this is here to help me to design for having entities that aren't APE Mobile
export const gitHubType = {
  //Note: Requests that return multiple items will be paginated to 30 items by default.
  User: 'users',
  UserRepo: 'User_repos', //repos is on top of /users/username/
  UserOrgs: 'User_orgs', //orgs is on top of /users/username/
  Orgs: 'orgs', //organizations (collection) or orgs/orgname (instance)
};

export const otherEntityType = {
  Record: 'example other entity record', //This is ~placeholder.
};

function checkSiteAndEntityType(site, entityType) {
  //Initial generic site data check
  if (site === undefined || site === '' || entityType === undefined || entityType === '') {
    verboseConLog(`site and/or entityType is undefined!\nThe supplied arguments were "${site}", "${entityType}".`);
    throw new Error(`site and/or entityType is undefined!\nThe supplied arguments were "${site}", "${entityType}".`);
  }
  if (site.type !== 'ape mobile' && site.type !== 'github' && site.type !== 'other') {
    verboseConLog(`site.type "${site.type}" was not recognised during generic site check.`);
    throw new Error(`site.type "${site.type}" was not recognised during generic site check.`);
  }
  if (site.name === '' || site.name === undefined) {
    verboseConLog(`site.name "${site.name}" is not recognised`);
    throw new Error(`site.name "${site.name}" is not recognised`);
  }

  //Site data check for Ape Mobile site requirements
  function checkApeMobileSite(site) {
    let result = true;
    if (
      typeof site.name !== 'string' ||
      !site.name.includes('.') ||
      typeof site.apiKey !== 'string' ||
      typeof site.userID !== 'number' ||
      !(parseInt(site.userID) > 0)
    ) {
      result = `The parameters for APE Mobile site "${site.name}" have not been correctly supplied.`;
    }
    return result;
  }

  //Site data check for GitHub site requirements
  function checkGitHubSite(site) {
    let result = true;
    if (site.name !== 'api.github.com' || typeof site.userID !== 'string' || site.userID === '') {
      result = `The parameters for GitHub site "${site.name}" have not been correctly supplied.\nUse name: 'api.github.com' and set userID`;
    }
    return result;
  }

  //Site data check for 'other' site requirements
  function checkOtherSite(site) {
    let result = true;
    //Placeholder: check site details against otherEntityType requirements
    return result;
  }

  function checkIfETisRecognised(entityTypes) {
    for (let type in entityTypes) {
      if (entityType === entityTypes[type]) {
        return true;
      }
    }
    return false;
  }

  let siteType = site.type;
  let recognised = false;
  switch (
    siteType //Edit note: Change the below to be functional and respect DRY...
  ) {
    case 'ape mobile':
      if (checkApeMobileSite(site) !== true) {
        throw new Error(checkApeMobileSite(site));
      }
      recognised = checkIfETisRecognised(apeEntityType);
      break;
    case 'github':
      if (checkGitHubSite(site) !== true) {
        throw new Error(checkGitHubSite(site));
      }
      recognised = checkIfETisRecognised(gitHubType);
      break;
    case 'other':
      if (checkOtherSite(site) !== true) {
        throw new Error(checkOtherSite(site));
      }
      recognised = checkIfETisRecognised(otherEntityType);
      break;
    default:
      verboseConLog(`site.type "${site.type}" was not recognised during ET recognition.`);
      throw new Error(`site.type "${site.type}" was not recognised during ET recognition.`);
  }
  if (!recognised) {
    verboseConLog(`"${entityType}" is not a recognised "${site.type}" entity type.`);
    throw new Error(`"${entityType}" is not a recognised "${site.type}" entity type.`);
  } else {
    verboseConLog(`Entity type '${entityType}' was found in '${siteType}'.`, 'apemobile');
  }

  return siteType;
}

function error_ET_nyi(nameOfFunction, entityType) {
  //placeholder: it'd be interesting to record occurences of functionality that is desired but NYI, maybe also with a way to report it.
  throw new Error(`entityType "${entityType}" has not yet been implemented for ${nameOfFunction}.`);
}

export function convertObjectIntoParameterString(params) {
  if (typeof params === 'object') {
    let paramsString = Object.keys(params)
      .map(key => key + '=' + params[key])
      .join('&');
    if (paramsString.length > 0) {
      paramsString = '?' + paramsString;
    }
    return paramsString;
  } else {
    return '';
  }
}

function rateLimitFunctionCallsTo(aCheckFn, rLimit) {
  //Returns a fn for caching aCheckFn(x) so it isn't done more than every rLimit seconds

  let lastCheckedX = {}; //This will store the date-time stamp of the last time aCheckFn(x) was called
  let lastFnValueX = {}; //This will store the result of the last time aCheckFn(x) was called
  let rateLimit = 1000 * parseInt(rLimit);
  return function(x) {
    let currentDateTime = new Date();
    if (!(currentDateTime - lastCheckedX[x] < rateLimit)) {
      lastFnValueX[x] = aCheckFn(x);
      lastCheckedX[x] = currentDateTime;
    }
    return lastFnValueX[x];
  };
}

async function checkPermissions(site, entityType, entityId, specialParams) {
  verboseConLog(`Checking permissions for '${entityType}'${entityId} on ${site.name}`);
  switch (site.type) {
    case 'ape mobile':
      if (specialParams.dontRLUserCheck) {
        if (!(await checkApeUserPermissions(site))) {
          verboseConLog(`Insufficient permission to access '${site.name}'!`, 'apemobile');
          throw new Error(`Insufficient permission to access '${site.name}'!`);
        }
      } else {
        if (!(await rlcheckApeUserPermissions(site))) {
          verboseConLog(`Insufficient permission to access '${site.name}'!`, 'apemobile');
          throw new Error(`Insufficient permission to access '${site.name}'!`);
        }
      }
      //Only APE-Support login should be able to access the record for user 1:
      if (entityType === apeEntityType.User && parseInt(entityId) === 1 && parseInt(site.userID) !== 1) {
        return false;
      } else {
        return true; //Placeholder
      }
    case 'github':
      return true; //Placeholder
    //break;
    case 'other':
      return true; //Placeholder
    //break;
    default:
      throw new Error(`site.type "${site.type}" was unexpectedly not recognised during cp!`);
  }
}

var rlcheckApeUserPermissions = rateLimitFunctionCallsTo(checkApeUserPermissions, 60);
async function checkApeUserPermissions(site) {
  //Check that the user is Active and a Super type user
  verboseConLog('* Checking Ape User Permissions *', 'apemobile');
  let timeLimit = 20000;
  const apeBaseURL = '/public_api/v2/';
  let requestURL =
    (typeof site.proxy === 'string' ? site.proxy : '') + 'https://' + site.name + apeBaseURL + apeEntityType.User;

  let pEntityId = parseInt(site.userID);
  if (pEntityId >= 0) {
    requestURL += '/' + pEntityId.toString();
  } else {
    return false;
  }

  let fetchParams = {
    method: 'get',
    headers: {
      Authorization: 'Token token="' + site.apiKey + '"',
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  };

  let response = await fetchWithTimeout(requestURL, fetchParams, timeLimit);
  let userJson = await response.json();
  return userJson.active && userJson.type === 0;
}

export async function aGet(
  site,
  entityType,
  entityId = '',
  entityParamsA = {},
  specialParamsA = {},
  fetchParamsA = {}
) {
  let entityParams = cloneObject(entityParamsA); //Making copies of the object Arguments to avoid creating side effects
  let specialParams = cloneObject(specialParamsA);
  let fetchParams = cloneObject(fetchParamsA);
  if (!(await checkPermissions(site, entityType, entityId, specialParams))) {
    verboseConLog(`Don't have permission for '${entityType}' '${entityId}' on ${site.name}`);
    throw new Error(`Don't have permission for '${entityType}' '${entityId}' on ${site.name}`);
  }
  let siteType = checkSiteAndEntityType(site, entityType);
  let timeLimit = 20000; //Default-default timeout
  if (specialParams.timeout) {
    //Timeout can be set via specialParams for an individual request
    timeLimit = specialParams.timeout;
  } else if (parseInt(site.defaultTimeout) > 0) {
    //Timeout can be set via the site's defaultTimeout
    timeLimit = parseInt(site.defaultTimeout);
  }
  if (typeof fetchParams !== 'object') {
    fetchParams = {};
  }
  fetchParams.method = 'get'; //Force this fetch parameter; the other parameters may vary
  let requestURL = typeof site.proxy === 'string' ? site.proxy : ''; //If site sets a proxy then put that at the start of the URL
  let useUrlParams = false;
  let urlParams = '';
  let pEntityId = ''; //for the Parsed Entity ID
  let fetchType = 'json'; //Generally we fetch JSON (hence setting this default) but there are other possibilites
  switch (siteType) {
    case 'ape mobile':
      const apeBaseURL = '/public_api/v2/';
      let chunkSize = 1000;
      function determineChunkMode() {
        if (
          (entityParams.limit === undefined ||
            parseInt(entityParams.limit) < 1 ||
            parseInt(entityParams.limit) > 1000) &&
          specialParams.useChunksToReachLimit !== false
        ) {
          specialParams.useChunksToReachLimit = true;
        }
        if (specialParams.useChunksToReachLimit) {
          var epCS = parseInt(specialParams.chunkSize);
          if (epCS >= 1 && epCS < 1000) {
            chunkSize = epCS; //Override default chunk size of 1000
          }
        }
      }
      requestURL += 'https://' + site.name + apeBaseURL;
      if (!fetchParams.headers) {
        fetchParams.headers = {
          Authorization: 'Token token="' + site.apiKey + '"',
          'Content-Type': 'application/json',
          Accept: 'application/json',
        };
      }
      if (entityId && specialParams.outputTo) {
        //If instance (not collection) and there is a directive to OutputTo then...
        let specifiedType = String(specialParams.outputTo).toLowerCase();
        if (specifiedType === 'pdf') {
          fetchType = 'blob';
          fetchParams.headers.Accept = 'application/pdf';
          fetchParams.headers['Content-Type'] = 'application/pdf';
          // fetchParams.headers['Content-Disposition'] = 'attachment: filename="'+String(specialParams.pdfName)+'"'; <= unnecessary?!
          verboseConLog(fetchParams);
        } else {
          throw new Error(`Unexpected outputTo type '${specialParams.outputTo}'!`);
        }
      }
      verboseConLog(`Process APE Mobile '${entityType}'...`, 'apemobile');
      switch (entityType) {
        //Entity types that are collection-only and may have parameters
        case apeEntityType.DrawingView:
        case apeEntityType.Annotation:
          requestURL += entityType;
          useUrlParams = true;
          determineChunkMode();
          break;
        //Entity types that are instance-only and hence don't take parameters
        case apeEntityType.Submission:
        case apeEntityType.Company:
          specialParams.useChunksToReachLimit = false;
          pEntityId = parseInt(entityId);
          if (!pEntityId) {
            verboseConLog(
              `Cannot check Submission or Company with id "${entityId}" because that is not a positive number.`
            );
            throw new Error(
              `Cannot check Submission or Company with id "${entityId}" because that is not a positive number.`
            );
          } else {
            requestURL += entityType + '/' + pEntityId.toString();
          }
          break;
        //Entity types that may be instance or collection, and if collection then may have other parameters including LIMIT
        case apeEntityType.ProjectListType:
        case apeEntityType.OrgList:
        case apeEntityType.Template:
        case apeEntityType.User:
        case apeEntityType.Project:
        case apeEntityType.Form:
        case apeEntityType.Memo:
        case apeEntityType.Action:
        case apeEntityType.PunchList:
        case apeEntityType.Drawing:
          requestURL += entityType;
          pEntityId = parseInt(entityId);
          if (pEntityId > 0) {
            requestURL += '/' + pEntityId.toString();
            specialParams.useChunksToReachLimit = false;
          } else if (entityParams !== {}) {
            useUrlParams = true;
            determineChunkMode();
          }
          break;
        //Entity types that belong to PROJECTS, which have NO other params, and may be instance or collection.
        /*  These entity types have no documented request parameters except an optional List, Member or Item ID
                    but I've allowed for passing them through anyway, for collections. Examples of usage flexibility:
                      aGet(site1,apeEntityType.ProjWBSItem,'14')
                      aGet(site1,apeEntityType.ProjWBSItem,14,6)
                      aGet(site1,apeEntityType.ProjWBSItem,14,someParameters)
                      aGet(site1,apeEntityType.ProjWBSItem,[14,6],'') //No point having params for getting an instance, hence only ''
                      aGet(site1,apeEntityType.ProjWBSItem,[14,''],someParameters)
                    Always specify the project ID, then (if desired) specify an entity Id *OR* parameters - but not both. */
        case apeEntityType.ProjList:
        case apeEntityType.ProjMember:
        case apeEntityType.ProjWBSItem:
          specialParams.useChunksToReachLimit = false;
          let project_id = '';
          if (typeof entityId === 'string' || typeof entityId === 'number') {
            project_id = parseInt(entityId);
            if (typeof entityParams === 'string' || typeof entityParams === 'number') {
              pEntityId = parseInt(entityParams);
              entityParams = {};
            }
          } else if (Array.isArray(entityId) && entityId.length > 0) {
            project_id = parseInt(entityId[0]);
            if (entityId.length > 1) {
              pEntityId = parseInt(entityId[1]);
            }
          }
          if (!project_id) {
            throw new Error(`Cannot check in project "${entityId}" because that is not a positive number.`);
          }
          requestURL += 'projects/' + project_id.toString() + '/' + entityType;
          if (typeof pEntityId === 'number' && pEntityId >= 0) {
            requestURL += '/' + pEntityId.toString();
          } else if (entityParams !== {} && typeof entityParams === 'object') {
            useUrlParams = true;
          }
          break;
        default:
          error_ET_nyi('aGet', entityType);
      }
      //Get APE Mobile records:
      let response = '';
      let retVal = {}; //The value that will be returned (typically JSON data)
      if (!specialParams.useChunksToReachLimit) {
        if (useUrlParams) {
          urlParams = convertObjectIntoParameterString(entityParams);
        }
        verboseConLog(`Fetch: ${requestURL + urlParams}`, 'apemobile');
        response = await fetchWithExtras(requestURL + urlParams, fetchParams, timeLimit);
        if (fetchType === 'json') {
          retVal = await response.json();
        } else if (fetchType === 'blob') {
          retVal = await response.blob();
        } else {
          throw new Error(`Unexpected fetchType '${fetchType}'!`);
        }
      } else {
        //Get records in chunks:
        //Overcome the 1000 record limit by getting data in chunks and combining them together until limit records
        //are reached (if a limit was specified) or (if otherwise then) until all records are obtained.
        var recordLimit = entityParams.limit;
        if (recordLimit === undefined || recordLimit === null || recordLimit < 1) {
          recordLimit = 10000000; //If no sensible limit is found then default to 10 million, practically ~unlimited.
        }
        if (entityParams.sort && entityParams.sort !== 'id') {
          conLog(
            `NOTE/WARNING: Sort ordering '${entityParams.sort}' will be disregarded because chunk mode currently doesn't work with sort.`
          );
          delete entityParams.sort;
          //Note, to support sorting I'd need to look at using 'updated_from' date and maybe 'updated_to' date (instead of using 'after' id).
        }
        let numRecordsInLastChunk = 0;
        let recordsObtained = [];
        let numRecordsCumulative = recordsObtained.length;
        let numChunksRequired = Math.ceil(recordLimit / Math.max(1, chunkSize));
        let numChunksDone = 0;
        let finishNow = false;
        let chunkParams = {};
        if (useUrlParams) {
          chunkParams = entityParams;
        }
        chunkParams.limit = chunkSize;
        let chunkFrom = 0;
        if (entityParams.after) {
          chunkFrom = entityParams.after;
        }

        while (numRecordsCumulative < recordLimit && numChunksDone < numChunksRequired && !finishNow) {
          if (recordLimit - numRecordsCumulative < chunkSize) {
            //If less than 1 full chunk is required then
            chunkSize = recordLimit - numRecordsCumulative; //make chuckSize equal to the number of records sought
            chunkParams.limit = chunkSize;
          }
          chunkParams.after = chunkFrom;
          urlParams = convertObjectIntoParameterString(chunkParams);
          verboseConLog(`chunkSize=${chunkSize}, recordLimit=${recordLimit}, chunkFrom=${chunkFrom}`, 'apemobile');
          verboseConLog(`Fetch: ${requestURL + urlParams}`, 'apemobile');
          response = await fetchWithExtras(requestURL + urlParams, fetchParams, timeLimit);
          retVal = await response.json();
          numChunksDone++;
          numRecordsInLastChunk = retVal.length;
          if (numRecordsInLastChunk < chunkSize) {
            finishNow = true;
          } //If we got less records then that must be all of them.
          chunkFrom = retVal[numRecordsInLastChunk - 1].id;
          recordsObtained = recordsObtained.concat(retVal);
          numRecordsCumulative = recordsObtained.length;
          verboseConLog(
            `numRecordsInLastChunk=${numRecordsInLastChunk}, numRecordsCumulative=${numRecordsCumulative}`,
            'apemobile'
          );
        }
        retVal = recordsObtained;
      }
      return retVal;
    case 'github':
      verboseConLog(`Process GitHub '${entityType}'...`, 'github');
      requestURL += 'https://' + site.name + '/';
      if (!fetchParams.headers) {
        fetchParams.headers = {
          'Content-Type': 'application/json',
          Accept: 'application/vnd.github.v3+json', //See https://developer.github.com/v3/
          'User-Agent': site.userID, //Github requests must include a valid User-Agent header, like GitHub username or the name of your app
        };
      }
      switch (entityType) {
        case gitHubType.Orgs: //Examples: https://api.github.com/organizations and https://api.github.com/orgs/APExperience
          pEntityId = entityId.toString();
          if (pEntityId) {
            //Instance
            requestURL += entityType + '/' + pEntityId;
          } else {
            requestURL += 'organizations'; //Collection
            useUrlParams = true;
          }
          break;
        case gitHubType.User: //Example: https://api.github.com/users/Quoll42
          requestURL += entityType;
          pEntityId = entityId.toString();
          if (pEntityId) {
            //Instance (so I assume no extra URL parameters)
            requestURL += '/' + pEntityId;
          } else {
            useUrlParams = true; //Collection (and thus possibly parameters)
          }
          break;
        case gitHubType.UserRepo: //Example: https://api.github.com/users/Quoll42/repos
        case gitHubType.UserOrgs: //Example: https://api.github.com/users/Quoll42/orgs
          pEntityId = entityId.toString();
          requestURL += 'users/' + pEntityId + '/' + entityType.substring(5); //I'm using .substring(5) to strip off the "User_" prefix
          useUrlParams = true;
          break;
        default:
          error_ET_nyi('aGet', entityType);
      }
      if (useUrlParams) {
        urlParams = convertObjectIntoParameterString(entityParams);
      }
      verboseConLog(`Fetch: ${requestURL + urlParams}`, 'github');
      let responseGH = await fetchWithExtras(requestURL + urlParams, fetchParams, timeLimit);
      let retValGH = await responseGH.json();
      return retValGH;
    case 'other':
      conLog(`Process entity type '${entityType}' that isn't APE Mobile...`); //This is just a placeholder
      conLog(`timeLimit: ${timeLimit}`);
      conLog(`requestURL: ${requestURL}`);
      conLog(`fetchParams:`);
      conLog(fetchParams);
      switch (entityType) {
        case otherEntityType.Record:
          error_ET_nyi('aGet', entityType);
          break;
        default:
          error_ET_nyi('aGet', entityType);
      }
      break;
    default:
      throw new Error(`site.type "${site.type}" was unexpectedly not recognised during aGet parsing!`);
  }
}

export function conLog(x) {
  console.log(x);
}

function verboseConLog(x, tag = '') {
  //Log if aGsVerboseMode is true, or it isn't false and tag is '*' or tag is found in aGsVerboseMode
  if (
    aGsVerboseMode === true ||
    (aGsVerboseMode !== false && (tag === '*' || aGsVerboseMode === tag || aGsVerboseMode.includes(tag)))
  ) {
    conLog(x);
  }
}

export function conErr(x) {
  console.error(x);
}

function cloneObject(obj) {
  //From https://stackoverflow.com/questions/728360/how-do-i-correctly-clone-a-javascript-object

  if (obj === null || 'object' !== typeof obj) return obj;
  var copy = obj.constructor();
  for (var attr in obj) {
    if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
  }
  return copy;
}

export var saveBlob = (function() {
  //Usage saveBlob(blobData, filename); From https://gist.github.com/philipstanislaus/c7de1f43b52531001412

  var a = document.createElement('a');
  document.body.appendChild(a);
  a.style = 'display: none';
  return function(blob, fileName) {
    var url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
  };
})();
