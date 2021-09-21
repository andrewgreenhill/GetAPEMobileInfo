export function isApeMobileSite(siteDomain) {
  const pattern1 = new RegExp('^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9][.]apemobile[.]com$');
  const pattern2 = new RegExp(
    '^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9][.]apemobile-[a-zA-Z0-9-]{0,176}[a-zA-Z0-9][.]com$'
  );
  const pattern3 = new RegExp('^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9][.][a-zA-Z]{2}[.]damstraforms[.]com$');
  const pattern4 = new RegExp(
    '^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9][.][a-zA-Z]{2}[.]damstraforms-[a-zA-Z0-9-]{0,173}[a-zA-Z0-9][.]com$'
  );
  return (
    pattern1.test(siteDomain) || pattern2.test(siteDomain) || pattern3.test(siteDomain) || pattern4.test(siteDomain)
  );
}

export function ape_api_url_to_normal_url(x) {
  //Remove 'public_api/v2/' from URL:
  return x.replace('public_api/v2/', '');
}
