export function valueOfQueryStringParam(paramName) {
  var url_string = window.location.href;
  var url = new URL(url_string);
  return url.searchParams.get(paramName);
}
